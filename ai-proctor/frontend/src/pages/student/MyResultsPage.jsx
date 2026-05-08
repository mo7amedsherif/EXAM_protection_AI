// ── Imports ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

// ── Component ────────────────────────────────────────────────────────
const MyResultsPage = () => {
  // ── State ────────────────────────────────────────────────────────
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // ── Fetch student's visible results on mount ─────────────────────
  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await axios.get('/results/my');
        setResults(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch results');
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, []);

  // ── Helper: colour classes based on score percentage ──────────────
  const getPercentageColor = (pct) => {
    if (pct >= 70) return 'from-green-500 to-green-600 text-white shadow-green-500/30';
    if (pct >= 50) return 'from-yellow-500 to-yellow-600 text-white shadow-yellow-500/30';
    return 'from-red-500 to-red-600 text-white shadow-red-500/30';
  };

  // ── Loading state ────────────────────────────────────────────────
  if (loading) return <div className="text-center mt-10">Loading...</div>;

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />

      {/* ── Page Header ─────────────────────────────────────────── */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <h1 className="text-3xl font-bold text-gray-900">My Results</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* ── Error Banner ────────────────────────────────────────── */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {results.length === 0 ? (
          /* ── Empty State ─────────────────────────────────────────── */
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📝</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Results Yet</h2>
            <p className="text-gray-600 mb-6">You haven't taken any exams yet.</p>
            <button
              onClick={() => navigate('/student/dashboard')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 transition-all duration-200"
            >
              Browse Exams
            </button>
          </div>
        ) : (
          /* ── Results Grid ────────────────────────────────────────── */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {results.map((result) => (
              <Card
                key={result._id}
                className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* ── Card Header: Exam title + submission date ────── */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-gray-900 mb-1">
                      {result.exam?.title || 'Exam'}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {new Date(result.submittedAt).toLocaleDateString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </p>
                  </div>
                  {/* ── Terminated badge (if exam was force-ended) ──── */}
                  {result.terminated && (
                    <span className="bg-red-100 text-red-800 text-xs font-semibold px-3 py-1 rounded-full">
                      🛑 Terminated
                    </span>
                  )}
                </div>

                {/* ── Score Circle: visual percentage indicator ─────── */}
                <div className="flex items-center justify-center my-6">
                  <div className={`w-28 h-28 rounded-full bg-gradient-to-br ${getPercentageColor(result.percentage)} shadow-lg flex items-center justify-center`}>
                    <div className="text-center">
                      <p className="text-3xl font-bold">{result.percentage}%</p>
                    </div>
                  </div>
                </div>

                {/* ── Details: score breakdown, duration, pass/fail ── */}
                <div className="space-y-3 border-t border-gray-100 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Score</span>
                    <span className="font-bold text-gray-900">{result.score} / {result.totalMarks}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Duration</span>
                    <span className="font-bold text-gray-900">{result.exam?.duration || '--'} min</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Status</span>
                    <Badge className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      result.percentage >= 50
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {result.percentage >= 50 ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyResultsPage;
