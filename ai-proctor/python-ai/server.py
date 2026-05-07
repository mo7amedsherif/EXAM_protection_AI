# pyrefly: ignore [missing-import]
import cv2
import time
import base64
# pyrefly: ignore [missing-import]
import numpy as np
import json
import asyncio
import uvicorn
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from modules.face_detection import FaceDetector
from modules.head_pose import HeadPoseEstimator
from modules.head_pose_logic import HeadPoseLogic
from modules.speech_detection import SpeechDetector
from modules.speech_logic import SpeechLogic
from modules.object_detection import ObjectDetector
from config import settings

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ObjectDetector stays global — YOLO model is stateless and expensive to load
object_detector  = ObjectDetector()

# Map Python warning strings to your MongoDB cheatingLog enum types
WARNING_TO_TYPE = {
    "No Person Detected":        "no_face_detected",
    "Multiple People Detected":  "multiple_faces",
    "Phone Detected":            "cell_phone_detected",
    "Cheating: Looking Away":    "suspicious_movement",
    "Speech Detection":          "speech_detected",
}

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    print("WebSocket Connection Accepted")

    # Per-session instances — no shared state between concurrent students
    face_detector    = FaceDetector(settings.FACE_CONFIDENCE)
    pose_estimator   = HeadPoseEstimator()
    pose_logic       = HeadPoseLogic()
    speech_detector  = SpeechDetector()
    speech_logic     = SpeechLogic()

    audio_buffer = bytearray()
    exam_id = None

    try:
        while True:
            try:
                message = await websocket.receive()

                # Binary = audio chunk for speech detection
                if "bytes" in message:
                    audio_buffer.extend(message["bytes"])
                    CHUNK_SIZE = 960
                    print(f"Received audio bytes. Buffer size: {len(audio_buffer)}")
                    while len(audio_buffer) >= CHUNK_SIZE:
                        chunk = bytes(audio_buffer[:CHUNK_SIZE])
                        audio_buffer = audio_buffer[CHUNK_SIZE:]
                        is_speaking = speech_detector.process_audio_chunk(chunk)
                        speech_logic.update(is_speaking)
                    if speech_logic.cheating:
                        await websocket.send_text(json.dumps({
                            "warning": "Speech Detection",
                            "warnings": ["Speech Detection"],
                            "violation_type": "speech_detected",
                            "exam_id": exam_id,
                            "image": None
                        }))
                    continue

                if "text" not in message or message["text"] is None:
                    continue

                data = message["text"]

                # First message can be JSON with examId
                if data.startswith("{"):
                    try:
                        meta = json.loads(data)
                        if "examId" in meta:
                            exam_id = meta["examId"]
                            print(f"Exam ID set: {exam_id}")
                    except:
                        pass
                    continue

                # Image frame
                if data.startswith("data:image"):
                    data = data.split(",")[1]
                else:
                    continue

                missing_padding = len(data) % 4
                if missing_padding:
                    data += "=" * (4 - missing_padding)

                img_bytes = base64.b64decode(data)
                nparr = np.frombuffer(img_bytes, np.uint8)
                frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

                if frame is None:
                    continue

                # Face detection
                faces = face_detector.detect_faces(frame)
                for (x, y, w, h) in faces:
                    cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)

                # Head pose
                direction, angle = pose_estimator.get_pose(frame)
                cheating = pose_logic.update(direction)


                # Speech (state managed by binary audio above)
                speech_cheating = speech_logic.cheating

                # YOLO object detection
                detections = object_detector.detect(frame)
                phone_detected = False
                person_count = 0

                for det in detections:
                    label = det["label"]
                    conf  = det["confidence"]
                    x1, y1, x2, y2 = det["box"]

                    if label == "person" and conf > 0.80:
                        person_count += 1
                        cv2.rectangle(frame, (x1,y1),(x2,y2),(255,0,0),2)
                    elif label == "person":
                        continue
                    elif label == "cell phone":
                        phone_detected = True
                        cv2.rectangle(frame, (x1,y1),(x2,y2),(0,0,255),2)
                        cv2.putText(frame, f"{label} {conf:.2f}",
                                    (x1, y1-10), cv2.FONT_HERSHEY_SIMPLEX,
                                    0.5, (0,0,255), 2)

                # Build warnings list
                warnings = []
                if len(faces) == 0:
                    warnings.append("No Person Detected")
                if len(faces) > settings.MAX_FACES_ALLOWED:
                    warnings.append("Multiple People Detected")
                if phone_detected:
                    warnings.append("Phone Detected")
                if person_count > 1 and "Multiple People Detected" not in warnings:
                    warnings.append("Multiple People Detected")
                if cheating:
                    warnings.append("Cheating: Looking Away")
                if speech_cheating:
                    warnings.append("Speech Detection")
                if not warnings:
                    warnings.append("Normal")

                warning = warnings[0]

                # Draw overlay on frame
                if warning != "Normal":
                    cv2.putText(frame, f"WARNING: {warning}", (20, 40),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0,0,255), 2)

                if direction in ["Calibrating..."]:
                    h_f, w_f, _ = frame.shape
                    cv2.putText(frame,
                        "Calibrating... Please sit still (3s)",
                        (20, 80), cv2.FONT_HERSHEY_SIMPLEX,
                        0.6, (0,255,255), 2)
                    cv2.rectangle(frame,
                        (int(w_f/2-100), int(h_f/2-150)),
                        (int(w_f/2+100), int(h_f/2+150)),
                        (0,255,255), 2)

                # Encode frame back to base64
                _, buffer = cv2.imencode(".jpg", frame)
                encoded_img = base64.b64encode(buffer).decode("utf-8")

                # Map to violation type for React to log
                violation_type = WARNING_TO_TYPE.get(warning, None)

                response = {
                    "warning":        warning,
                    "warnings":       warnings,
                    "violation_type": violation_type,
                    "exam_id":        exam_id,
                    "image":          f"data:image/jpeg;base64,{encoded_img}"
                }

                await websocket.send_text(json.dumps(response))

            except WebSocketDisconnect:
                print("WebSocket Disconnected")
                break

            except Exception as e:
                if "disconnect" in str(e).lower():
                    print("WebSocket Disconnected (cleanup)")
                    break
                import traceback
                with open("error_log.txt", "a") as f:
                    f.write(traceback.format_exc() + "\n")
                print(f"Frame error (ignored): {e}")
                await asyncio.sleep(0.05)

    except Exception as fatal_e:
        print(f"Fatal error: {fatal_e}")

if __name__ == "__main__":
   
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True, reload_excludes=["venv/*", "__pycache__/*"])
