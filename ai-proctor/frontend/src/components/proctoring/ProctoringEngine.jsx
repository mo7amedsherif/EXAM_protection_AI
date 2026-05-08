import { useEffect, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import axios from '../../api/axios';

const DEBOUNCE_MS = 10000;
const FRAME_INTERVAL_MS = 500;
const WS_URL = 'ws://localhost:8000/ws';

const ProctoringEngine = ({ examId, onViolation }) => {
  const webcamRef        = useRef(null);
  const wsRef            = useRef(null);
  const intervalRef      = useRef(null);
  const audioCtxRef      = useRef(null);
  const processorRef     = useRef(null);
  const streamRef        = useRef(null);
  const violationRef     = useRef({});
  const violationCountRef = useRef(0);
  const previewImgRef    = useRef(null);

  // ── Debounced violation logger ─────────────────────────────
  const logViolation = useCallback((type, description, confidence = null) => {
    const now = Date.now();
    if (violationRef.current[type] &&
        now - violationRef.current[type] < DEBOUNCE_MS) return;
    violationRef.current[type] = now;

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

    axios.post('/cheating-logs', {
      examId,
      type,
      confidence,
      description,
    }).catch(err => console.error('Log error:', err.message));
  }, [examId, onViolation]);

  // ── Browser event violations ───────────────────────────────
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden)
        logViolation('tab_switch', 'Student switched browser tab');
    };
    const onFullscreen = () => {
      if (!document.fullscreenElement)
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
    const onBlur = () =>
      logViolation('tab_switch', 'Window lost focus');

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

    // Request fullscreen
    document.documentElement.requestFullscreen?.().catch(() => {
      logViolation('fullscreen_exit', 'Student denied fullscreen');
    });

    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      document.removeEventListener('fullscreenchange', onFullscreen);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('cut', onCut);
      document.removeEventListener('contextmenu', onRClick);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('blur', onBlur);
      clearInterval(checkDevTools);
      if (document.fullscreenElement) document.exitFullscreen?.();
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
      // Send examId first
      ws.send(JSON.stringify({ examId }));
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

        // Log violations coming from Python AI
        if (data.violation_type && data.warning !== 'Normal') {
          logViolationRef.current(
            data.violation_type,
            data.warning,
            null
          );
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

    // ── Microphone audio streaming ───────────────────────────
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then(stream => {
        streamRef.current = stream;
        const audioCtx = new AudioContext({ sampleRate: 16000 });
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        // ScriptProcessor for PCM streaming (compatible)
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;
        processor.onaudioprocess = (e) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input = e.inputBuffer.getChannelData(0);
          // Convert Float32 to Int16 PCM
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

    return () => {
      clearInterval(intervalRef.current);
      ws.close();
      processorRef.current?.disconnect();
      audioCtxRef.current?.close();
      streamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [examId]);

  return (
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
        // style={{ display: 'none' }}
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
  );
};

export default ProctoringEngine;
