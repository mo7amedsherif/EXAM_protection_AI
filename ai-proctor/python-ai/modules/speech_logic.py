import time
from config import settings

class SpeechLogic:
    def __init__(self):
        self.speech_start_time = None
        self.cheating = False
        # Use 3.0 seconds to filter out short sounds like coughs, sneezes
        self.SPEECH_TIME_LIMIT = max(getattr(settings, 'SPEECH_TIME_LIMIT', 3.0), 3.0)

    def reset(self):
        self.speech_start_time = None
        self.cheating = False

    def update(self, is_speaking):
        if is_speaking:
            if self.speech_start_time is None:
                self.speech_start_time = time.time()
                
            elapsed = time.time() - self.speech_start_time
            if elapsed >= self.SPEECH_TIME_LIMIT:
                self.cheating = True
        else:
            self.speech_start_time = None
            self.cheating = False
            
        return self.cheating
