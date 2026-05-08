// ── Imports ──────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Navbar from '../../components/Navbar';

// ── Constants ────────────────────────────────────────────────────────
const WS_URL = 'ws://localhost:8000/ws';

// ── Exam rules shown to student before starting ─────────────────────
const EXAM_RULES = [
  'Your webcam and microphone will be active throughout the exam.',
  'Do not look away from the screen for extended periods.',
  'Only one person should be visible on camera at all times.',
  'Do not use your phone or any other device.',
  'Do not switch browser tabs or minimize the window.',
  'Copy, paste, and right-click are disabled during the exam.',
  'Developer tools are not permitted.',
  'The exam will auto-submit when the timer reaches zero.',
  'Three violations will result in immediate exam termination.',
  'Ensure you are in a quiet, well-lit environment before starting.',
];

// ── Sub-component: single check row (loading/done/error) ────────────
const CheckRow = ({ status, label }) => (
  <div className="flex items-center gap-3 py-2">
    {status === 'loading' && (
      <svg className="w-5 h-5 text-blue-500 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    )}
    {status === 'done' && (
      <span className="text-green-600 font-bold text-lg">✓</span>
    )}
    {status === 'error' && (
      <span className="text-red-500 font-bold text-lg">✗</span>
    )}
    <span className="text-gray-700 font-medium text-sm">{label}</span>
  </div>
);

// ── Component ────────────────────────────────────────────────────────
const PreExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  // ── State ──────────────────────────────────────────────────────────
  const [exam, setExam] = useState(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [aiStatus, setAiStatus] = useState('loading'); // 'loading' | 'ready' | 'unavailable'
  const [mediaStatus, setMediaStatus] = useState('loading'); // 'loading' | 'done' | 'error'
  const [eligibilityStatus, setEligibilityStatus] = useState('loading');
  const [examLoadStatus, setExamLoadStatus] = useState('loading');
  const [pageReady, setPageReady] = useState(false);
  const [agreed, setAgreed] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────
  const wsRef = useRef(null);
  const timeoutRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // ── Pre-exam checks (runs on mount) ───────────────────────────────
  useEffect(() => {
    let cancelled = false;

    const runChecks = async () => {
      // STEP 1 — Check if already completed
      try {
        const res = await axios.get('/results/my');
        const taken = res.data.some(
          (r) => r.exam === id || r.exam?._id === id
        );
        if (!cancelled) {
          setAlreadyCompleted(taken);
          setEligibilityStatus('done');
        }
      } catch {
        if (!cancelled) setEligibilityStatus('done');
      }

      // STEP 2 — Load exam info
      try {
        const res = await axios.get(`/exams/${id}`);
        if (!cancelled) {
          setExam(res.data);
          setExamLoadStatus('done');
        }
      } catch {
        if (!cancelled) setExamLoadStatus('error');
      }

      // STEP 3 — AI system check
      try {
        await new Promise((resolve) => {
          const ws = new WebSocket(WS_URL);
          wsRef.current = ws;

          timeoutRef.current = setTimeout(() => {
            if (!cancelled) setAiStatus('unavailable');
            ws.close();
            resolve();
          }, 3000);

          ws.onopen = () => {
            ws.send(JSON.stringify({ examId: id, check: true }));
            clearTimeout(timeoutRef.current);
            if (!cancelled) setAiStatus('ready');
            ws.close();
            resolve();
          };

          ws.onerror = () => {
            clearTimeout(timeoutRef.current);
            if (!cancelled) setAiStatus('unavailable');
            resolve();
          };
        });
      } catch {
        if (!cancelled) setAiStatus('unavailable');
      }

      // STEP 4 — Request camera + mic permissions
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        mediaStreamRef.current = stream;
        // Stop tracks immediately — we just needed the permission grant
        stream.getTracks().forEach(t => t.stop());
        if (!cancelled) setMediaStatus('done');
      } catch {
        if (!cancelled) setMediaStatus('error');
      }

      if (!cancelled) setPageReady(true);
    };

    runChecks();

    return () => {
      cancelled = true;
      clearTimeout(timeoutRef.current);
      wsRef.current?.close();
      mediaStreamRef.current?.getTracks().forEach(t => t.stop());
    };
  }, [id]);

  // ── STATE B: Already completed ──────────────────────────────
  if (pageReady && alreadyCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto py-20 px-6">
          <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-10 text-center">
            <div className="text-6xl mb-4">🎓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              You have already completed this exam
            </h2>
            <p className="text-gray-600 mb-8">
              Each exam can only be taken once. Your result has been saved.
            </p>
            <Button
              onClick={() => navigate('/student/my-results')}
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-5 rounded-xl font-semibold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              View My Results
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── STATE A: Loading ────────────────────────────────────────
  if (!pageReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
        <Navbar />
        <div className="max-w-lg mx-auto py-20 px-6">
          <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-10">
            <div className="flex flex-col items-center mb-8">
              <svg className="w-12 h-12 text-blue-500 animate-spin mb-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <h2 className="text-xl font-bold text-gray-900">Preparing your exam environment…</h2>
            </div>
            <div className="space-y-1">
              <CheckRow status={eligibilityStatus} label="Checking exam eligibility" />
              <CheckRow status={examLoadStatus} label="Loading exam details" />
              <CheckRow
                status={aiStatus === 'loading' ? 'loading' : aiStatus === 'ready' ? 'done' : 'error'}
                label="Connecting to AI proctoring system"
              />
              <CheckRow status={mediaStatus} label="Requesting camera & microphone access" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── STATE C / D: Ready or AI unavailable ────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />
      <div className="max-w-2xl mx-auto py-12 px-6">
        <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">{exam?.title}</h1>
            {exam?.description && (
              <p className="text-gray-600 mb-4">{exam.description}</p>
            )}
            <span className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 border border-blue-200 px-4 py-2 rounded-full text-sm font-semibold">
              ⏱ {exam?.duration} minutes
            </span>
          </div>

          {/* AI status banner */}
          {aiStatus === 'ready' ? (
            <div className="bg-green-50 border border-green-300 rounded-xl px-5 py-3 mb-8 text-center">
              <p className="text-green-800 font-semibold text-sm">✓ AI Proctoring System Ready</p>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 rounded-xl px-5 py-3 mb-8 text-center">
              <p className="text-yellow-800 font-semibold text-sm">
                ⚠ AI Proctoring System Unavailable — contact your teacher before proceeding.
              </p>
            </div>
          )}

          {/* Instructions */}
          <div className="mb-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Exam Rules & Instructions</h2>
            <ol className="space-y-2.5">
              {EXAM_RULES.map((rule, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{rule}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Acknowledgement checkbox */}
          <label className="flex items-start gap-3 mb-8 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-800 font-medium">
              I have read and agree to follow all exam rules.
            </span>
          </label>

          {/* Start button */}
          <Button
            onClick={() => navigate(`/student/exam/${id}`)}
            disabled={!agreed}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-5 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            Start Exam →
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default PreExamPage;
