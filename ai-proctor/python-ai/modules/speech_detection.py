import webrtcvad
import time
import struct
import math
from config import settings

def get_rms(chunk):
    count = len(chunk) // 2
    if count == 0: return 0
    fmt = f"<{count}h"
    samples = struct.unpack(fmt, chunk)
    sum_squares = sum((s ** 2) for s in samples)
    return math.sqrt(sum_squares / count)

class SpeechDetector:
    def __init__(self):
        self.vad = webrtcvad.Vad(3)  # Mode 3: most aggressive filtering
        self.RATE = 16000
        self.is_human_speaking = False
        self.last_speech_time = 0

        # ── Ambient baseline calibration ──────────────────────────
        self.calibrated = False
        self.calibration_samples = []
        self.CALIBRATION_CHUNKS = 50  # ~3 seconds of audio
        self.baseline_rms = 300       # fallback minimum
        self.ambient_mean = 0
        self.ambient_std = 0

        # ── Consecutive speech debounce ───────────────────────────
        self.consecutive_speech_count = 0
        self.CONSECUTIVE_THRESHOLD = 3  # require 3 consecutive speech chunks

    def reset(self):
        self.is_human_speaking = False
        self.last_speech_time = 0
        self.calibrated = False
        self.calibration_samples = []
        self.baseline_rms = 300
        self.ambient_mean = 0
        self.ambient_std = 0
        self.consecutive_speech_count = 0

    def _calibrate(self, rms):
        """Collect ambient noise samples during calibration phase."""
        self.calibration_samples.append(rms)
        if len(self.calibration_samples) >= self.CALIBRATION_CHUNKS:
            if self.calibration_samples:
                n = len(self.calibration_samples)
                self.ambient_mean = sum(self.calibration_samples) / n
                variance = sum((x - self.ambient_mean) ** 2 for x in self.calibration_samples) / n
                self.ambient_std = math.sqrt(variance)
                # Baseline = mean + 2*std, with a minimum floor
                self.baseline_rms = max(
                    self.ambient_mean + 2 * self.ambient_std,
                    300  # absolute minimum
                )
            self.calibrated = True
            print(f"[Audio] Calibration complete. Ambient mean: {self.ambient_mean:.1f}, "
                  f"std: {self.ambient_std:.1f}, baseline threshold: {self.baseline_rms:.1f}")

    def process_audio_chunk(self, audio_bytes):
        try:
            # Webrtcvad expects frames of 10, 20, or 30 ms.
            # At 16000 Hz, 30 ms is 480 samples = 960 bytes (16-bit PCM).
            chunk_size = 960
            
            speech_detected = False
            for i in range(0, len(audio_bytes), chunk_size):
                chunk = audio_bytes[i:i+chunk_size]
                if len(chunk) == chunk_size:
                    rms = get_rms(chunk)

                    # During calibration, just collect ambient samples
                    if not self.calibrated:
                        self._calibrate(rms)
                        continue

                    # After calibration: require BOTH VAD and RMS above baseline
                    if self.vad.is_speech(chunk, self.RATE):
                        # RMS must be significantly above ambient baseline
                        if rms > self.baseline_rms * 2.5:
                            speech_detected = True
                            break

            if not self.calibrated:
                # Still calibrating — never flag as speech
                self.is_human_speaking = False
                self.consecutive_speech_count = 0
                return self.is_human_speaking

            if speech_detected:
                self.consecutive_speech_count += 1
                # Only flag as speaking after consecutive chunks confirm it
                if self.consecutive_speech_count >= self.CONSECUTIVE_THRESHOLD:
                    self.last_speech_time = time.time()
            else:
                self.consecutive_speech_count = 0
                
            # 1.0s decay for continuous speech
            self.is_human_speaking = (time.time() - self.last_speech_time) < 1.0
            
            return self.is_human_speaking
        except Exception as e:
            print(f"Error processing audio chunk: {e}")
            return self.is_human_speaking

    def get_speech_status(self):
        self.is_human_speaking = (time.time() - self.last_speech_time) < 1.0
        return self.is_human_speaking
