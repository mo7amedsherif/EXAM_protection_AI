import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const TeacherDashboard = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchExams();
  }, []);

  const fetchExams = async () => {
    try {
      const response = await axios.get('/exams');
      setExams(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exams');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (examId) => {
    if (!window.confirm('Are you sure you want to delete this exam?')) return;

    try {
      await axios.delete(`/exams/${examId}`);
      setExams(exams.filter((exam) => exam._id !== examId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete exam');
    }
  };

  const handleToggleActive = async (examId, currentStatus) => {
    try {
      await axios.put(`/exams/${examId}`, { isActive: !currentStatus });
      setExams(
        exams.map((exam) =>
          exam._id === examId ? { ...exam, isActive: !currentStatus } : exam
        )
      );
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update exam');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  const activeExams = exams.filter(e => e.isActive).length;
  const totalStudents = exams.reduce((acc, exam) => acc + (exam.totalStudents || 0), 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
              <p className="text-gray-600 mt-2 text-lg">Manage exams and monitor student performance</p>
            </div>
            <Button 
              onClick={() => navigate('/teacher/create-exam')}
              className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-6 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create New Exam
            </Button>
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
        <div className="grid grid-cols-4 gap-8 mb-12">
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Total Exams</p>
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
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Total Students</p>
                <p className="text-4xl font-bold text-gray-900">{totalStudents}</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border border-gray-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-2">Pass Rate</p>
                <p className="text-4xl font-bold text-gray-900">--%</p>
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/30 group-hover:scale-110 transition-transform duration-300">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* Exam Management */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Exam Management</h2>
          <div className="grid grid-cols-2 gap-8">
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
                </div>
                <div className="flex gap-3">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/teacher/exam/${exam._id}`)}
                    className="flex-1 rounded-xl py-3 hover:bg-blue-50 hover:border-blue-300 hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Questions
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => navigate(`/teacher/exam/${exam._id}/results`)}
                    className="flex-1 rounded-xl py-3 hover:bg-green-50 hover:border-green-300 hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Results
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleToggleActive(exam._id, exam.isActive)}
                    title={exam.isActive ? 'Disable exam' : 'Enable exam'}
                    className={`rounded-xl py-3 px-3 hover:scale-105 transition-all duration-200 ${
                      exam.isActive
                        ? 'text-green-600 hover:bg-red-50 hover:border-red-300 hover:text-red-600'
                        : 'text-gray-400 hover:bg-green-50 hover:border-green-300 hover:text-green-600'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleDelete(exam._id)}
                    title="Delete exam"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 rounded-xl py-3 px-3 hover:scale-105 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {exams.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No exams found. Create your first exam!
          </div>
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;
