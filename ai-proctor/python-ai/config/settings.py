import os
from dotenv import load_dotenv

load_dotenv()

# =========================
# GENERAL SETTINGS
# =========================

CAMERA_INDEX = int(os.environ.get("CAMERA_INDEX", 0))
FRAME_WIDTH = int(os.environ.get("FRAME_WIDTH", 640))
FRAME_HEIGHT = int(os.environ.get("FRAME_HEIGHT", 480))

# =========================
# FACE DETECTION
# =========================

FACE_CONFIDENCE = float(os.environ.get("FACE_CONFIDENCE", 0.70))
MAX_FACES_ALLOWED = int(os.environ.get("MAX_FACES_ALLOWED", 1))

# =========================
# HEAD POSE (LOOKING)
# =========================

LOOK_LEFT_THRESHOLD = float(os.environ.get("LOOK_LEFT_THRESHOLD", -20))
LOOK_RIGHT_THRESHOLD = float(os.environ.get("LOOK_RIGHT_THRESHOLD", 20))
LOOK_UP_THRESHOLD = float(os.environ.get("LOOK_UP_THRESHOLD", 20))
LOOK_DOWN_THRESHOLD = float(os.environ.get("LOOK_DOWN_THRESHOLD", -20))

MAX_LOOK_AWAY_TIME = float(os.environ.get("MAX_LOOK_AWAY_TIME", 0.5))


# =========================
# SPEECH DETECTION
# =========================

SPEECH_TIME_LIMIT = float(os.environ.get("SPEECH_TIME_LIMIT", 2.0))
SPEECH_CONFIDENCE_THRESHOLD = float(os.environ.get("SPEECH_CONFIDENCE_THRESHOLD", 0.5))

# =========================
# OBJECT DETECTION
# =========================

DETECT_PHONE = os.environ.get("DETECT_PHONE", "true").lower() == "true"
DETECT_PERSON = os.environ.get("DETECT_PERSON", "true").lower() == "true"

PHONE_CLASS_NAME = os.environ.get("PHONE_CLASS_NAME", "cell phone")
PERSON_CLASS_NAME = os.environ.get("PERSON_CLASS_NAME", "person")

# =========================
# ALERT SYSTEM
# =========================

ENABLE_ALERTS = os.environ.get("ENABLE_ALERTS", "true").lower() == "true"
SHOW_WARNINGS = os.environ.get("SHOW_WARNINGS", "true").lower() == "true"

# =========================
# TIMERS
# =========================

NO_FACE_TIME_LIMIT = int(os.environ.get("NO_FACE_TIME_LIMIT", 5))
MULTIPLE_FACES_TIME_LIMIT = int(os.environ.get("MULTIPLE_FACES_TIME_LIMIT", 3))
