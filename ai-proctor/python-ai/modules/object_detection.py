# modules/object_detection.py

from ultralytics import YOLO

class ObjectDetector:
    def __init__(self):
        try:
            self.model = YOLO("yolov8s.pt")
        except Exception as e:
            raise RuntimeError(
                f"Failed to load YOLO model 'yolov8s.pt'. "
                f"Ensure the model file exists or you have internet to download it. Error: {e}"
            )

    def detect(self, frame):
        # 0: person, 67: cell phone
        # iou=0.4 → aggressive NMS to avoid counting the same person twice
        results = self.model(frame, conf=0.25, classes=[0, 67], iou=0.4, verbose=False)

        detections = []

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                label = self.model.names[cls_id]
                conf = float(box.conf[0])

                if label == "person" and conf < 0.45:
                    continue
                if label == "cell phone" and conf < 0.45:
                    continue

                x1, y1, x2, y2 = map(int, box.xyxy[0])

                detections.append({
                    "label": label,
                    "confidence": conf,
                    "box": (x1, y1, x2, y2)
                })

        return detections
