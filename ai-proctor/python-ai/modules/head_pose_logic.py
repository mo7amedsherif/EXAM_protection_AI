import time
from config import settings

class HeadPoseLogic:
    def __init__(self):
        self.look_start_time = None
        self.cheating = False
        self.warning_count = 0          # 0 = no warning, 1-3 = warning levels
        self.last_warning_time = None
        self.WARNING_INTERVAL = 3.0     # seconds between each warning
        self.MAX_LOOK_AWAY_TIME = getattr(settings, 'MAX_LOOK_AWAY_TIME', 3.0)

    def reset(self):
        self.look_start_time = None
        self.cheating = False
        self.warning_count = 0
        self.last_warning_time = None

    def update(self, direction):
        if direction in ["Calibrating...", "Forward", "No Face"]:
            # Student returned to forward — reset everything
            if self.warning_count > 0 or self.cheating:
                self.warning_count = 0
                self.cheating = False
                self.last_warning_time = None
            self.look_start_time = None
            return {
                "cheating": False,
                "warning_level": 0,
                "warning_active": False,
                "direction": direction,
                "reset": True  # signal to frontend to dismiss warnings
            }
        else:
            # Student is looking away
            now = time.time()

            if self.look_start_time is None:
                self.look_start_time = now

            elapsed_since_start = now - self.look_start_time

            # First: wait for initial look-away threshold
            if elapsed_since_start < self.MAX_LOOK_AWAY_TIME:
                return {
                    "cheating": False,
                    "warning_level": self.warning_count,
                    "warning_active": False,
                    "direction": direction,
                    "reset": False
                }

            # After initial threshold, start issuing warnings
            if self.warning_count == 0:
                # Issue first warning
                self.warning_count = 1
                self.last_warning_time = now
                return {
                    "cheating": False,
                    "warning_level": 1,
                    "warning_active": True,
                    "direction": direction,
                    "reset": False
                }

            # Check if it's time for the next warning
            if self.last_warning_time and (now - self.last_warning_time) >= self.WARNING_INTERVAL:
                if self.warning_count < 3:
                    self.warning_count += 1
                    self.last_warning_time = now
                    return {
                        "cheating": False,
                        "warning_level": self.warning_count,
                        "warning_active": True,
                        "direction": direction,
                        "reset": False
                    }
                else:
                    # All 3 warnings exhausted — log violation
                    self.cheating = True
                    # Reset for next cycle
                    self.warning_count = 0
                    self.look_start_time = None
                    self.last_warning_time = None
                    return {
                        "cheating": True,
                        "warning_level": 3,
                        "warning_active": False,
                        "direction": direction,
                        "reset": False
                    }

            # Between warnings — keep current warning active
            return {
                "cheating": False,
                "warning_level": self.warning_count,
                "warning_active": True,
                "direction": direction,
                "reset": False
            }
