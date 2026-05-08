import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';

const ExamResultsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [violationModal, setViolationModal] = useState(null); // { studentName, logs, loading }

  useEffect(() => {
    fetchResults();
  }, [id]);

  const fetchResults = async () => {
    try {
      const response = await axios.get(`/results/exam/${id}`);
      setResults(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch results');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (resultId) => {
    try {
      const res = await axios.put(`/results/${resultId}/visibility`);
      setResults(results.map(r =>
        r._id === resultId ? { ...r, visibleToStudent: res.data.visibleToStudent } : r
      ));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to toggle visibility');
    }
  };

  const handleDeleteResult = async (resultId, studentName) => {
    if (!window.confirm(`Delete result for ${studentName}? This cannot be undone.`)) return;
    try {
      await axios.delete(`/results/${resultId}`);
      setResults(results.filter(r => r._id !== resultId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete result');
    }
  };

  const handleShowViolations = async (studentId, studentName) => {
    setViolationModal({ studentName, logs: [], loading: true });
    try {
      const res = await axios.get(`/cheating-logs/exam/${id}/student/${studentId}`);
      setViolationModal({ studentName, logs: res.data, loading: false });
    } catch {
      setViolationModal({ studentName, logs: [], loading: false });
    }
  };

  const getPercentageColor = (percentage) => {
    if (percentage >= 70) {
      return "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400 shadow-md shadow-green-500/30";
    } else if (percentage >= 50) {
      return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-400 shadow-md shadow-yellow-500/30";
    } else {
      return "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400 shadow-md shadow-red-500/30";
    }
  };

  const getViolationIcon = (type) => {
    const icons = {
      tab_switch: '🔄',
      fullscreen_exit: '⛶',
      copy_paste_attempt: '📋',
      right_click_attempt: '🖱️',
      browser_dev_tools: '🔧',
      no_face_detected: '👤',
      multiple_faces: '👥',
      looking_away: '👀',
      phone_detected: '📱',
      microphone_muted: '🔇',
    };
    return icons[type] || '⚠️';
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  const avgScore = results.length > 0 
    ? Math.round(results.reduce((acc, r) => acc + r.percentage, 0) / results.length) 
    : 0;
  const passed = results.filter(r => r.percentage >= 50).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/10 to-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Exam Results</h1>
              <p className="text-gray-600 mt-2 text-lg">Exam ID: {id}</p>
            </div>
            <Button 
              onClick={() => navigate('/teacher/dashboard')}
              variant="outline"
              className="px-6 py-6 rounded-xl font-semibold hover:scale-105 hover:shadow-lg transition-all duration-200"
            >
              Back to Dashboard
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
        <div className="grid grid-cols-3 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">Total Students</p>
            <p className="text-5xl font-bold text-gray-900">{results.length}</p>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-green-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-green-800 uppercase tracking-wide mb-3">Passed</p>
            <p className="text-5xl font-bold text-green-700">{passed}</p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-blue-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-blue-800 uppercase tracking-wide mb-3">Avg Score</p>
            <p className="text-5xl font-bold text-blue-700">{avgScore}%</p>
          </Card>
        </div>

        {/* Results Table */}
        <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                <TableHead className="py-5 font-bold text-gray-900">Student Name</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Email</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Score</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Percentage</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Status</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Violations</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Submitted At</TableHead>
                <TableHead className="py-5 font-bold text-gray-900 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <TableCell className="py-5 font-semibold text-gray-900">{result.student?.name}</TableCell>
                  <TableCell className="py-5 text-gray-600">{result.student?.email}</TableCell>
                  <TableCell className="py-5 font-bold text-gray-900">{result.score} / {result.totalMarks}</TableCell>
                  <TableCell className="py-5">
                    <Badge className={`border-2 px-4 py-1.5 rounded-xl font-bold uppercase tracking-wide ${getPercentageColor(result.percentage)}`}>
                      {result.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    {result.terminated ? (
                      <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-semibold">
                        🛑 Terminated
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        ✓ Completed
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-5">
                    <button
                      onClick={() => handleShowViolations(result.student?._id, result.student?.name)}
                      className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-200 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-orange-100 hover:border-orange-300 transition-all duration-200"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      View
                    </button>
                  </TableCell>
                  <TableCell className="py-5 text-sm text-gray-600 font-mono">
                    {new Date(result.submittedAt).toLocaleString()}
                  </TableCell>
                  <TableCell className="py-5">
                    <div className="flex items-center justify-center gap-2">
                      {/* Toggle visibility */}
                      <button
                        onClick={() => handleToggleVisibility(result._id)}
                        title={result.visibleToStudent !== false ? 'Hide result from student' : 'Show result to student'}
                        className={`p-2 rounded-lg transition-all duration-200 hover:scale-110 ${
                          result.visibleToStudent !== false
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-100'
                        }`}
                      >
                        {result.visibleToStudent !== false ? (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        ) : (
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                          </svg>
                        )}
                      </button>
                      {/* Delete result */}
                      <button
                        onClick={() => handleDeleteResult(result._id, result.student?.name)}
                        title="Delete result"
                        className="p-2 rounded-lg text-red-500 hover:bg-red-50 hover:text-red-700 transition-all duration-200 hover:scale-110"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>

        {results.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No results found yet.
          </div>
        )}
      </div>

      {/* Violations Modal */}
      {violationModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setViolationModal(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff', borderRadius: 16,
              padding: '32px', maxWidth: 560, width: '90%',
              maxHeight: '80vh', display: 'flex', flexDirection: 'column',
            }}
          >
            {/* Modal header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#111827', margin: 0 }}>
                  Violation Log
                </h3>
                <p style={{ fontSize: 14, color: '#6B7280', margin: '4px 0 0' }}>
                  {violationModal.studentName}
                </p>
              </div>
              <button
                onClick={() => setViolationModal(null)}
                style={{
                  background: '#F3F4F6', border: 'none', borderRadius: 8,
                  width: 36, height: 36, cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', fontSize: 18,
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {violationModal.loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#6B7280' }}>
                  Loading violations…
                </div>
              ) : violationModal.logs.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                  <p style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>No violations detected</p>
                  <p style={{ fontSize: 14, color: '#6B7280' }}>This student had a clean exam session.</p>
                </div>
              ) : (
                <>
                  {/* Summary badges */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                    {Object.entries(
                      violationModal.logs.reduce((acc, log) => {
                        const t = log.type || 'unknown';
                        acc[t] = (acc[t] || 0) + 1;
                        return acc;
                      }, {})
                    ).map(([type, count]) => (
                      <span
                        key={type}
                        style={{
                          background: '#FEF3C7', color: '#92400E',
                          padding: '4px 12px', borderRadius: 20,
                          fontSize: 12, fontWeight: 600,
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                        }}
                      >
                        {getViolationIcon(type)} {type.replace(/_/g, ' ')} × {count}
                      </span>
                    ))}
                  </div>

                  {/* Log list */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {violationModal.logs.map((log, i) => (
                      <div
                        key={log._id || i}
                        style={{
                          background: '#F9FAFB', borderRadius: 10,
                          padding: '12px 16px', border: '1px solid #E5E7EB',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: '#111827' }}>
                            {getViolationIcon(log.type)} {(log.type || 'unknown').replace(/_/g, ' ')}
                          </span>
                          <span style={{ fontSize: 11, color: '#9CA3AF', fontFamily: 'monospace' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : ''}
                          </span>
                        </div>
                        {log.description && (
                          <p style={{ fontSize: 12, color: '#6B7280', margin: 0 }}>{log.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExamResultsPage;
