// ── Imports ──────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

// ── Component ────────────────────────────────────────────────────────
const StudentDashboard = () => {
  // ── State ──────────────────────────────────────────────────────────
  const [exams, setExams] = useState([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  // ── Fetch exams + student's completed count on mount ──────────────
  const fetchExams = async () => {
    try {
      const [examsRes, resultsRes] = await Promise.all([
        axios.get('/exams'),
        axios.get('/results/my'),
      ]);
      setExams(examsRes.data);
      setCompletedCount(resultsRes.data.length);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  // ── Navigate to pre-exam setup page ───────────────────────────────
  const handleStartExam = (examId) => {
    navigate(`/student/exam/${examId}/pre`);
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  // ── Derived data ──────────────────────────────────────────────────
  const activeExams = exams.filter(e => e.isActive).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Student Dashboard</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-8 mb-12">
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Available Exams</p>
                <p className="text-4xl font-bold text-gray-900">{exams.length}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Active Exams</p>
                <p className="text-4xl font-bold text-gray-900">{activeExams}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Completed</p>
                <p className="text-4xl font-bold text-gray-900">{completedCount}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* ── Exam Cards Grid ──────────────────────────────────────── */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Exams</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {exams.map((exam) => (
              <Card key={exam._id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <h3 className="text-xl font-bold text-gray-900">{exam.title}</h3>
                      <Badge
                        className={`px-4 py-1.5 rounded-full font-semibold ${
                          exam.isActive
                            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/30'
                            : 'bg-gray-200 text-gray-700'
                        }`}
                      >
                        {exam.isActive ? 'active' : 'inactive'}
                      </Badge>
                    </div>
                    <p className="text-gray-600 leading-relaxed">{exam.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8 mb-6 text-sm text-gray-700">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-medium">{exam.duration} min</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="font-medium">{exam.teacher?.name || 'Teacher'}</span>
                  </div>
                </div>
                <Button
                  onClick={() => handleStartExam(exam._id)}
                  disabled={!exam.isActive}
                  className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {exam.isActive ? 'Start Exam' : 'Not Available'}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* ── Empty State ────────────────────────────────────────── */}
        {exams.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No available exams at the moment.
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentDashboard;
