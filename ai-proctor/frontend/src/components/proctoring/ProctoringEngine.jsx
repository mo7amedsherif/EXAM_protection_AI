import { useEffect, useRef, useCallback, useState } from 'react';
import Webcam from 'react-webcam';
import axios from '../../api/axios';

const DEBOUNCE_MS = 10000;
const FRAME_INTERVAL_MS = 500;
const WS_URL = 'ws://localhost:8000/ws';
const GRACE_PERIOD_MS = 8000;
const FULLSCREEN_GRACE_MS = 12000;

// ── Audio warning beep generator ────────────────────────────────────
function playWarningBeep(level = 1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    // Higher pitch and volume for higher warning levels
    const frequencies = [520, 680, 880]; // level 1, 2, 3
    const volumes = [0.3, 0.5, 0.7];
    const durations = [0.4, 0.5, 0.6];
    
    const idx = Math.min(level - 1, 2);
    oscillator.frequency.value = frequencies[idx];
    oscillator.type = 'sine';
    gainNode.gain.value = volumes[idx];
    
    // Envelope: fade in then fade out
    const now = ctx.currentTime;
    const duration = durations[idx];
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volumes[idx], now + 0.05);
    gainNode.gain.linearRampToValueAtTime(0, now + duration);
    
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
    
    // For levels 2 and 3, play a double beep
    if (level >= 2) {
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.frequency.value = frequencies[idx];
      osc2.type = 'sine';
      const start2 = now + duration + 0.1;
      gain2.gain.setValueAtTime(0, start2);
      gain2.gain.linearRampToValueAtTime(volumes[idx], start2 + 0.05);
      gain2.gain.linearRampToValueAtTime(0, start2 + duration);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(start2);
      osc2.stop(start2 + duration);
    }
    
    // Cleanup
    setTimeout(() => ctx.close(), 3000);
  } catch (e) {
    console.warn('Could not play warning beep:', e);
  }
}

const ProctoringEngine = ({ examId, onViolation, isSubmittingRef, proctoringOptions }) => {
  const webcamRef        = useRef(null);
  const wsRef            = useRef(null);
  const intervalRef      = useRef(null);
  const audioCtxRef      = useRef(null);
  const processorRef     = useRef(null);
  const streamRef        = useRef(null);
  const violationRef     = useRef({});
  const violationCountRef = useRef(0);
  const previewImgRef    = useRef(null);
  const examStartTime    = useRef(Date.now());
  // Always holds the latest proctoringOptions without causing WS reconnect
  const proctoringOptionsRef = useRef(proctoringOptions);

  // ── Head pose warning state ───────────────────────────────
  const [headWarning, setHeadWarning] = useState(null);
  const lastWarningLevelRef = useRef(0);

  // ── Debounced violation logger ─────────────────────────────
  const logViolation = useCallback((type, description, confidence = null) => {
    const now = Date.now();
    if (violationRef.current[type] &&
        now - violationRef.current[type] < DEBOUNCE_MS) return;
    violationRef.current[type] = now;

    const isInGracePeriod =
      type === 'fullscreen_exit'
        ? (Date.now() - examStartTime.current) < FULLSCREEN_GRACE_MS
        : (Date.now() - examStartTime.current) < GRACE_PERIOD_MS;

    if (!isInGracePeriod) {
      violationCountRef.current += 1;
      const count = violationCountRef.current;

      if (onViolation) {
        onViolation({
          type,
          description,
          count,
          level: count === 1 ? 'warning' : count === 2 ? 'final' : 'terminate',
        });
      }

      // Only persist to DB once the grace period has passed
      axios.post('/cheating-logs', {
        examId,
        type,
        confidence,
        description,
      }).catch(err => console.error('Log error:', err.message));
    }
  }, [examId, onViolation]);

  // ── Browser event violations ───────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden && proctoringOptions?.tabSwitchDetection !== false)
        logViolation('tab_switch', 'Student switched browser tab');
    };
    const onFullscreen = () => {
      const fsElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      if (!fsElement && !(isSubmittingRef?.current))
        logViolation('fullscreen_exit', 'Student exited fullscreen');
    };
    const onCopy  = () => logViolation('copy_paste_attempt', 'Copy attempt');
    const onCut   = () => logViolation('copy_paste_attempt', 'Cut attempt');
    const onRClick = (e) => {
      e.preventDefault();
      logViolation('right_click_attempt', 'Right-click attempt');
    };
    const onKey = (e) => {
      if (e.key === 'F12' ||
          (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key)) ||
          (e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        logViolation('browser_dev_tools', `DevTools shortcut: ${e.key}`);
      } else if (e.ctrlKey && ['c','v','x'].includes(e.key.toLowerCase())) {
        e.preventDefault();
        logViolation('copy_paste_attempt', `Ctrl+${e.key.toUpperCase()}`);
      }
    };
    const onBlur = () => {
      if (proctoringOptions?.tabSwitchDetection !== false)
        logViolation('tab_switch', 'Window lost focus');
    };

    const checkDevTools = setInterval(() => {
      if (window.outerWidth - window.innerWidth > 160 ||
          window.outerHeight - window.innerHeight > 160) {
        logViolation('browser_dev_tools', 'DevTools appear open');
      }
    }, 5000);

    document.addEventListener('visibilitychange', onVisibility);
    document.addEventListener('fullscreenchange', onFullscreen);
    document.addEventListener('copy', onCopy);
    document.addEventListener('cut', onCut);
    document.addEventListener('contextmenu', onRClick);
    document.addEventListener('keydown', onKey);
    window.addEventListener('blur', onBlur);

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onRClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      clearInterval(checkDevTools);
      // Don't exit fullscreen here — ExamPage handles it during submit
    };
  }, [logViolation]);

  // Keep logViolation in a ref so the WebSocket effect never re-runs due to callback changes
  const logViolationRef = useRef(logViolation);
  useEffect(() => { logViolationRef.current = logViolation; }, [logViolation]);

  // ── WebSocket + webcam + audio ─────────────────────────────
  useEffect(() => {
    // Open WebSocket
    const ws = new WebSocket(WS_URL);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Python AI proctoring connected');
      // Send examId and whatever proctoringOptions we have right now.
      // If exam data hasn't loaded yet, proctoringOptionsRef.current may be
      // undefined — a second send is dispatched by the effect below once it loads.
      ws.send(JSON.stringify({
        examId,
        proctoringOptions: proctoringOptionsRef.current ?? null,
      }));
      // Start sending frames
      intervalRef.current = setInterval(() => {
        if (ws.readyState !== WebSocket.OPEN) return;
        const video = webcamRef.current?.video;
        if (!video || video.readyState !== 4) return;
        const canvas = document.createElement('canvas');
        canvas.width  = 320;
        canvas.height = 240;
        canvas.getContext('2d').drawImage(video, 0, 0, 320, 240);
        const frame = canvas.toDataURL('image/jpeg', 0.7);
        ws.send(frame);
      }, FRAME_INTERVAL_MS);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Update preview image with annotated frame from Python
        if (data.image && previewImgRef.current) {
          previewImgRef.current.src = data.image;
        }

        // ── Handle head pose warnings ─────────────────────────
        if (data.head_warning) {
          const hw = data.head_warning;
          
          if (hw.reset) {
            // Student returned to forward — dismiss all warnings
            setHeadWarning(null);
            lastWarningLevelRef.current = 0;
          } else if (hw.warning_active && hw.warning_level > 0) {
            // New or continued warning
            setHeadWarning({
              level: hw.warning_level,
              direction: hw.direction,
            });
            
            // Play audio beep when warning level increases
            if (hw.warning_level > lastWarningLevelRef.current) {
              lastWarningLevelRef.current = hw.warning_level;
              playWarningBeep(hw.warning_level);
            }
          } else if (!hw.warning_active && hw.warning_level === 0) {
            setHeadWarning(null);
            lastWarningLevelRef.current = 0;
          }
        }

        // Log violations coming from Python AI
        if (data.violation_type && data.warning !== 'Normal') {
          logViolationRef.current(data.violation_type, data.warning, null);
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    ws.onerror = (e) => console.error('WS error:', e);
    ws.onclose = () => {
      console.log('Python AI proctoring disconnected');
      clearInterval(intervalRef.current);
    };

    // ── Microphone audio streaming (skip if voice detection is disabled) ──
    if (proctoringOptions?.voiceDetection !== false) {
      navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(stream => {
          streamRef.current = stream;
          const audioCtx = new AudioContext({ sampleRate: 16000 });
          audioCtxRef.current = audioCtx;
          const source = audioCtx.createMediaStreamSource(stream);
          const processor = audioCtx.createScriptProcessor(4096, 1, 1);
          processorRef.current = processor;
          processor.onaudioprocess = (e) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            const input = e.inputBuffer.getChannelData(0);
            const pcm = new Int16Array(input.length);
            for (let i = 0; i < input.length; i++) {
              pcm[i] = Math.max(-32768, Math.min(32767, input[i] * 32768));
            }
            ws.send(pcm.buffer);
          };
          source.connect(processor);
          processor.connect(audioCtx.destination);
        })
        .catch(err => {
          console.warn('Mic access denied:', err.message);
          logViolationRef.current('microphone_muted', 'Microphone access denied');
        });
    }

    return () => {
      clearInterval(intervalRef.current);
      ws.close();
      processorRef.current?.disconnect();
      audioCtxRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [examId]); // examId is stable; proctoringOptions is handled by the effect below

  // ── Re-send proctoringOptions whenever exam data loads/changes ────
  useEffect(() => {
    proctoringOptionsRef.current = proctoringOptions;
    const ws = wsRef.current;
    if (!ws || ws.readyState !== WebSocket.OPEN || !proctoringOptions) return;
    // Exam data just became available — push the real settings to Python
    ws.send(JSON.stringify({ examId, proctoringOptions }));
  }, [proctoringOptions, examId]);

  // ── Warning banner styles ─────────────────────────────────
  const bannerColors = {
    1: { bg: '#FEF3C7', border: '#F59E0B', text: '#92400E', icon: '⚠️' },
    2: { bg: '#FED7AA', border: '#F97316', text: '#9A3412', icon: '🔶' },
    3: { bg: '#FEE2E2', border: '#EF4444', text: '#991B1B', icon: '🔴' },
  };

  return (
    <>
      {/* ── Head pose warning banner ───────────────────────────── */}
      {headWarning && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10001,
          background: bannerColors[headWarning.level]?.bg || '#FEF3C7',
          borderBottom: `3px solid ${bannerColors[headWarning.level]?.border || '#F59E0B'}`,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          animation: 'slideDown 0.3s ease',
          boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        }}>
          <span style={{ fontSize: 24 }}>
            {bannerColors[headWarning.level]?.icon}
          </span>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              margin: 0,
              fontWeight: 700,
              fontSize: 15,
              color: bannerColors[headWarning.level]?.text,
            }}>
              Warning {headWarning.level}/3 — Please look at the screen!
            </p>
            <p style={{
              margin: '2px 0 0',
              fontSize: 13,
              color: bannerColors[headWarning.level]?.text,
              opacity: 0.8,
            }}>
              You are looking {headWarning.direction?.toLowerCase() || 'away'}. Return your gaze to avoid a violation.
            </p>
          </div>
          <div style={{
            display: 'flex',
            gap: 4,
          }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: i <= headWarning.level
                  ? bannerColors[headWarning.level]?.border
                  : '#D1D5DB',
                transition: 'all 0.3s ease',
              }} />
            ))}
          </div>
        </div>
      )}

      {/* ── Camera + AI preview ─────────────────────────────────── */}
      <div style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
      }}>
        {/* Hidden webcam — only used to capture frames */}
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{ width: 320, height: 240, facingMode: 'user' }}
        />
        {/* Annotated frame coming back from Python */}
        <img
          ref={previewImgRef}
          alt="AI Proctoring Feed"
          style={{
            width: 200,
            height: 150,
            borderRadius: 8,
            border: '2px solid #4f46e5',
            objectFit: 'cover',
            background: '#000',
          }}
        />
        <span style={{
          fontSize: 11,
          fontWeight: 600,
          color: '#4f46e5',
          letterSpacing: '0.05em',
        }}>
          🔴 AI Proctoring Active
        </span>
      </div>

      <style>{`
        @keyframes slideDown {
          from { transform: translateY(-100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </>
  );
};

export default ProctoringEngine;
