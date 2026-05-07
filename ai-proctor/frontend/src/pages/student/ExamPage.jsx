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
  const [criticalViolations, setCriticalViolations] = useState(0);

  const handleViolation = useCallback((type) => {
    const criticalTypes = ['cell_phone_detected', 'multiple_faces', 'tab_switch', 'browser_dev_tools', 'speech_detected', 'fullscreen_exit'];
    if (criticalTypes.includes(type)) {
      setCriticalViolations((prev) => prev + 1);
    }
  }, []);

  // Keep a ref to the latest handleSubmit so effects never call a stale closure
  const submitRef = useRef(null);
  useEffect(() => {
    submitRef.current = handleSubmit;
  });

  useEffect(() => {
    if (criticalViolations >= 3 && !submitting) {
      submitRef.current?.(true);
    }
  }, [criticalViolations, submitting]);

  useEffect(() => {
    fetchExamData();
  }, [id]);

  useEffect(() => {
    if (!exam) return;
    const timer = setInterval(() => {
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
  }, [exam]);

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

  const handleSubmit = async (isTerminated = false) => {
    if (submitting) return;
    setSubmitting(true);

    const answersArray = questions.map((q) => ({
      question: q._id,
      selectedOption: answers[q._id] !== undefined ? answers[q._id] : null,
    }));

    try {
      const response = await axios.post('/results', {
        examId: id,
        answers: answersArray,
        terminated: isTerminated === true,
      });
      navigate('/student/result', { 
        state: { 
          result: response.data,
          terminated: isTerminated === true
        } 
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit exam');
      setSubmitting(false);
    }
  };

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;
  if (!questions || questions.length === 0) return <Spinner />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-gray-50">
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
          <div className="flex items-center gap-8">
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
          </div>
        </div>
      </nav>

      <ProctoringEngine examId={id} onViolation={handleViolation} />

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
                  onClick={handleSubmit}
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
    </div>
  );
};

export default ExamPage;
