# Python AI Proctoring Server

FastAPI WebSocket server running YOLOv8, MediaPipe,
and WebRTC VAD for real-time exam proctoring.

## Requirements
- Python 3.10+
- Webcam connected
- Microphone connected

## Setup
It is highly recommended to use a virtual environment.

```bash
cd python-ai

# 1. Create a virtual environment
python -m venv venv

# 2. Activate it
# On Windows:
.\venv\Scripts\activate
# On Mac/Linux:
# source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

## Run server (used by React frontend)
```bash
uvicorn server:app --host 0.0.0.0 --port 8000 --reload
```

## Run standalone (local camera test, no frontend needed)
```bash
python main.py
```
Press Q to quit the standalone window.

## Detection capabilities
- Face presence (no face / multiple faces) — MediaPipe
- Head pose — looking left/right/up/down — MediaPipe FaceMesh
- Eye tracking — gaze direction — MediaPipe iris landmarks
- Phone / laptop detection — YOLOv8
- Speech / voice detection — WebRTC VAD + RMS filter

## WebSocket protocol
- Connect to: ws://localhost:8000/ws
- First message: JSON { "examId": "<id>" }
- Then send: base64 JPEG frames as text
- Also send: PCM audio as binary (16kHz, 16-bit mono, 960-byte chunks)
- Receive: JSON { warning, warnings[], violation_type, exam_id, image }
