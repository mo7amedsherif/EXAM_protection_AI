import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import ProctoringEngine from '../../components/proctoring/ProctoringEngine';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import useAuthStore from '../../store/authStore';
import Spinner from '../../components/Spinner';

const ExamPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showCamera, setShowCamera] = useState(true);
  const [warningModal, setWarningModal] = useState(null);
  const [systemReady, setSystemReady] = useState(false);
  const [countdown, setCountdown] = useState(8);

  // Keep a ref to the latest handleSubmit so effects never call a stale closure
  const submitRef = useRef(null);
  const isSubmittingRef = useRef(false);
  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  useEffect(() => {
    fetchExamData();
  }, [id]);

  // Grace period countdown (no auto-start — student must click Begin Exam)
  const [countdownDone, setCountdownDone] = useState(false);

  useEffect(() => {
    if (countdownDone) return;
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          setCountdownDone(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [countdownDone]);

  // Exam timer — paused during grace period
  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
      if (!systemReady) return;
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          submitRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [exam, systemReady]);

  const fetchExamData = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        axios.get(`/exams/${id}`),
        axios.get(`/exams/${id}/questions`),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
      setTimeLeft(examRes.data.duration * 60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers({ ...answers, [questionId]: optionIndex });
  };

  const handleSubmit = useCallback(async (terminated = false) => {
    if (submitting) return;
    setSubmitting(true);

    // Mark as submitting so fullscreen exit is NOT logged as a violation
    isSubmittingRef.current = true;

    // Exit fullscreen as part of the submit flow
    try {
      const fsElement = document.fullscreenElement || document.webkitFullscreenElement || document.msFullscreenElement;
      if (fsElement) {
        await document.exitFullscreen?.();
      }
    } catch {
      // Ignore if already exited
    }

    const answersArray = questions.map((q) => ({
      question: q._id,
      selectedOption: answers[q._id] !== undefined ? answers[q._id] : null,
    }));

    try {
      const response = await axios.post('/results', {
        examId: id,
        answers: answersArray,
        terminated,
      });
      navigate('/student/result', {
        state: {
          result: response.data,
          terminated,
        },
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [submitting, questions, answers, id, navigate]);

  const handleViolation = useCallback(({ type, description, count, level }) => {
    setWarningModal({ level, type, description, count });
    if (level === 'terminate') {
      // Use submitRef so we always call the latest handleSubmit (avoids stale closure)
      submitRef.current(true);
    }
  }, []); // no deps needed — submitRef is always current

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!questions || questions.length === 0) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">📋</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Questions Yet</h2>
        <p className="text-gray-600 mb-6">This exam has no questions added yet. Please check back later.</p>
        <button
          onClick={() => navigate('/student/dashboard')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-semibold transition-all"
        >
          Back to Dashboard
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
      {/* Grace period initialization overlay */}
      {!systemReady && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center',
          justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            padding: '40px 48px', maxWidth: 400,
            width: '90%', textAlign: 'center',
          }}>
            {!countdownDone ? (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: '#EFF6FF', border: '3px solid #3B82F6',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px',
                  fontSize: 28, fontWeight: 700, color: '#1D4ED8',
                }}>
                  {countdown}
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 700,
                  color: '#111827', marginBottom: 8,
                }}>
                  Setting up AI Proctoring…
                </h3>
                <p style={{
                  fontSize: 14, color: '#6B7280', marginBottom: 20,
                  lineHeight: 1.6,
                }}>
                  Please look directly at the camera and stay still.
                  The exam will begin in {countdown} second{countdown !== 1 ? 's' : ''}.
                </p>
                <div style={{
                  background: '#F3F4F6', borderRadius: 8,
                  padding: '10px 16px', fontSize: 13, color: '#6B7280',
                }}>
                  📷 Camera initializing &nbsp;·&nbsp; 🔊 Mic active &nbsp;·&nbsp; 🤖 AI loading
                </div>
              </>
            ) : (
              <>
                <div style={{
                  width: 72, height: 72, borderRadius: '50%',
                  background: '#ECFDF5', border: '3px solid #10B981',
                  display: 'flex', alignItems: 'center',
                  justifyContent: 'center', margin: '0 auto 20px',
                  fontSize: 32,
                }}>
                  ✅
                </div>
                <h3 style={{
                  fontSize: 18, fontWeight: 700,
                  color: '#111827', marginBottom: 8,
                }}>
                  AI Proctoring Ready
                </h3>
                <p style={{
                  fontSize: 14, color: '#6B7280', marginBottom: 24,
                  lineHeight: 1.6,
                }}>
                  Everything is set up. Click below to enter fullscreen and begin your exam.
                </p>
                <button
                  onClick={async () => {
                    try {
                      const el = document.documentElement;
                      if (el.requestFullscreen) {
                        await el.requestFullscreen();
                      } else if (el.webkitRequestFullscreen) {
                        await el.webkitRequestFullscreen();
                      } else if (el.msRequestFullscreen) {
                        await el.msRequestFullscreen();
                      }
                    } catch {
                      // Fullscreen denied — continue anyway
                    }
                    setSystemReady(true);
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#fff', border: 'none', borderRadius: 12,
                    padding: '14px 40px', fontSize: 16, fontWeight: 700,
                    cursor: 'pointer', width: '100%',
                  }}
                >
                  Begin Exam
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 px-8 py-4 sticky top-0 z-50 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <h1 className="font-semibold text-gray-900 text-lg">AI Proctor</h1>
              <p className="text-sm text-gray-600">{exam?.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Student</p>
              <p className="font-semibold text-gray-900">{user?.name}</p>
            </div>
            <div className={`px-6 py-3 rounded-xl transition-all duration-300 ${
              timeLeft < 60
                ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30 animate-pulse'
                : timeLeft < 300
                ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20'
                : 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/20'
            }`}>
              <p className="text-xs uppercase tracking-wider opacity-90 mb-1">Time Remaining</p>
              <p className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Are you sure you want to exit? Your progress will be lost and the exam will NOT be submitted.')) {
                  navigate('/student/dashboard');
                }
              }}
              className="border border-red-400 text-red-500 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors duration-200"
            >
              Exit Exam
            </button>
          </div>
        </div>
      </nav>

      <ProctoringEngine examId={id} onViolation={handleViolation} isSubmittingRef={isSubmittingRef} proctoringOptions={exam?.proctoringOptions} />

      {/* Main Content */}
      <div className="max-w-4xl mx-auto py-16 px-8">
        <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-10 hover:shadow-2xl transition-all duration-300">
          {/* Progress Indicator */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-gray-700">
                Question {currentQuestion + 1} of {questions.length}
              </p>
              <div className="flex gap-2">
                {questions.map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      idx === currentQuestion
                        ? "w-12 bg-blue-600"
                        : answers[questions[idx]?._id] !== undefined
                        ? "w-8 bg-green-600"
                        : "w-8 bg-gray-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
              {error}
            </div>
          )}

          {/* Question Card */}
          {questions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-semibold text-gray-900 mb-10 leading-relaxed">
                {questions[currentQuestion].text}
              </h2>

              <div className="space-y-4">
                {questions[currentQuestion].options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswerChange(questions[currentQuestion]._id, index)}
                    className={`w-full text-left p-5 rounded-xl border-2 transition-all duration-200 ${
                      answers[questions[currentQuestion]._id] === index
                        ? "border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-md scale-[1.01]"
                        : "border-gray-200 bg-white hover:border-blue-300 hover:bg-gray-50 hover:scale-[1.01] hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                          answers[questions[currentQuestion]._id] === index
                            ? "border-blue-600 bg-blue-600 shadow-lg shadow-blue-600/30"
                            : "border-gray-300"
                        }`}
                      >
                        {answers[questions[currentQuestion]._id] === index && (
                          <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        )}
                      </div>
                      <span className="text-gray-800 font-medium">{option}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200">
            <Button
              onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
              disabled={currentQuestion === 0}
              variant="outline"
              className="px-8 py-6 rounded-xl font-semibold hover:scale-105 hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100"
            >
              Previous
            </Button>
            <div className="flex gap-4">
              {currentQuestion === questions.length - 1 ? (
                <Button 
                  onClick={() => handleSubmit()}
                  disabled={submitting}
                  className="px-10 py-6 rounded-xl font-semibold bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg shadow-green-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  {submitting ? 'Submitting...' : 'Submit Exam'}
                </Button>
              ) : (
                <Button 
                  onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                  className="px-10 py-6 rounded-xl font-semibold bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
                >
                  Next Question
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Question Navigator */}
        <Card className="mt-8 bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8">
          <h3 className="font-semibold text-gray-900 mb-6 text-lg">Question Navigator</h3>
          <div className="grid grid-cols-10 gap-3">
            {questions.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentQuestion(idx)}
                className={`w-12 h-12 rounded-xl border-2 transition-all duration-200 font-semibold ${
                  idx === currentQuestion
                    ? "border-blue-600 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 scale-110"
                    : answers[questions[idx]?._id] !== undefined
                    ? "border-green-600 bg-green-50 text-green-700 hover:scale-105 hover:shadow-md"
                    : "border-gray-300 bg-white text-gray-700 hover:border-blue-300 hover:scale-105 hover:shadow-md"
                }`}
              >
                {idx + 1}
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* WARNING 1 — yellow */}
      {warningModal?.level === 'warning' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.55)',
        }}>
          <div style={{
            background: '#FEF3C7', border: '2px solid #F59E0B',
            borderRadius: 16, padding: 32, maxWidth: 460, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>⚠️</div>
            <h2 style={{ color: '#92400E', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Warning {warningModal.count} of 3
            </h2>
            <p style={{ color: '#78350F', fontSize: 15, marginBottom: 8 }}>
              <strong>Detected:</strong> {warningModal.description}
            </p>
            <p style={{ color: '#78350F', fontSize: 14, marginBottom: 24 }}>
              You have <strong>{3 - warningModal.count} warning(s) remaining</strong> before
              your exam is automatically terminated.
            </p>
            <button
              onClick={() => setWarningModal(null)}
              style={{
                background: '#F59E0B', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 28px',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              I Understand — Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* WARNING 2 — orange/red */}
      {warningModal?.level === 'final' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.65)',
        }}>
          <div style={{
            background: '#FEE2E2', border: '2px solid #EF4444',
            borderRadius: 16, padding: 32, maxWidth: 460, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>🚨</div>
            <h2 style={{ color: '#7F1D1D', fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
              Final Warning — 2 of 3
            </h2>
            <p style={{ color: '#991B1B', fontSize: 15, marginBottom: 8 }}>
              <strong>Detected:</strong> {warningModal.description}
            </p>
            <p style={{ color: '#991B1B', fontSize: 14, marginBottom: 24 }}>
              ⛔ <strong>One more violation will immediately terminate your exam.</strong><br/>
              Your answers will be submitted as-is.
            </p>
            <button
              onClick={() => setWarningModal(null)}
              style={{
                background: '#EF4444', color: '#fff', border: 'none',
                borderRadius: 8, padding: '10px 28px',
                fontSize: 15, fontWeight: 600, cursor: 'pointer',
              }}
            >
              I Understand — This Is My Last Warning
            </button>
          </div>
        </div>
      )}

      {/* WARNING 3 — terminated, cannot be dismissed */}
      {warningModal?.level === 'terminate' && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 10000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(127,29,29,0.96)',
        }}>
          <div style={{
            background: '#fff', borderRadius: 16,
            padding: 40, maxWidth: 460, width: '90%',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>🛑</div>
            <h2 style={{ color: '#7F1D1D', fontSize: 24, fontWeight: 700, marginBottom: 8 }}>
              Exam Terminated
            </h2>
            <p style={{ color: '#991B1B', fontSize: 15, marginBottom: 8 }}>
              <strong>Reason:</strong> {warningModal.description}
            </p>
            <p style={{ color: '#6B7280', fontSize: 14, marginBottom: 20 }}>
              You received 3 violations. Your exam has been submitted
              and your teacher has been notified.
            </p>
            <p style={{ color: '#9CA3AF', fontSize: 13 }}>
              Redirecting to dashboard…
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamPage;
