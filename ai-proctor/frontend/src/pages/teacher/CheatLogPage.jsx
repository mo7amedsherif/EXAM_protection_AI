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

const CheatLogPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentLogs, setStudentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('');

  useEffect(() => {
    fetchSummary();
  }, [id]);

  const fetchSummary = async () => {
    try {
      const response = await axios.get(`/cheating-logs/exam/${id}/summary`);
      setSummary(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cheating summary');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentLogs = async (studentId) => {
    try {
      const response = await axios.get(`/cheating-logs/exam/${id}/student/${studentId}`);
      setStudentLogs(response.data);
      setSelectedStudent(studentId);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch student logs');
    }
  };

  const fetchFilteredLogs = async () => {
    try {
      const params = new URLSearchParams();
      if (filterType) params.append('type', filterType);
      if (filterSeverity) params.append('severity', filterSeverity);
      
      const response = await axios.get(`/cheating-logs/exam/${id}?${params}`);
      setStudentLogs(response.data);
      setSelectedStudent(null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch filtered logs');
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return "bg-red-100 text-red-700 border-red-300";
      case 'high':
        return "bg-orange-100 text-orange-700 border-orange-300";
      case 'medium':
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case 'low':
        return "bg-gray-100 text-gray-700 border-gray-300";
      default:
        return "bg-gray-100 text-gray-700 border-gray-300";
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 90) return "text-red-700";
    if (confidence >= 75) return "text-orange-700";
    return "text-yellow-700";
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  const totalViolations = summary.reduce((acc, item) => acc + item.total, 0);
  const totalCritical = summary.reduce((acc, item) => acc + item.critical, 0);
  const totalHigh = summary.reduce((acc, item) => acc + item.high, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/10 to-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">AI Cheating Detection Log</h1>
                <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-xl">
                  <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-sm font-bold text-red-700 uppercase tracking-wide">Live</span>
                </div>
              </div>
              <p className="text-gray-600 text-lg">Exam ID: {id} - Real-time Monitoring</p>
            </div>
            <div className="flex gap-4">
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
      </div>

      <div className="max-w-7xl mx-auto px-8 py-10">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4">
            {error}
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-6 mb-12">
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">Total Violations</p>
            <p className="text-5xl font-bold text-gray-900">{totalViolations}</p>
          </Card>
          <Card className="bg-gradient-to-br from-red-50 to-red-100/50 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-red-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-red-800 uppercase tracking-wide mb-3">Critical</p>
            <p className="text-5xl font-bold text-red-700">{totalCritical}</p>
          </Card>
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-orange-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-orange-800 uppercase tracking-wide mb-3">High</p>
            <p className="text-5xl font-bold text-orange-700">{totalHigh}</p>
          </Card>
          <Card className="bg-white/80 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-gray-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
            <p className="text-sm font-medium text-gray-600 uppercase tracking-wide mb-3">Students</p>
            <p className="text-5xl font-bold text-gray-900">{summary.length}</p>
          </Card>
        </div>

        {/* Filter Controls */}
        <div className="mb-8 flex gap-4">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="">All Types</option>
            <option value="tab_switch">Tab Switch</option>
            <option value="fullscreen_exit">Fullscreen Exit</option>
            <option value="camera_obstruction">Camera Obstruction</option>
            <option value="multiple_faces">Multiple Faces</option>
            <option value="no_face_detected">No Face Detected</option>
            <option value="cell_phone_detected">Phone Detected</option>
            <option value="keyboard_shortcut">Keyboard Shortcut</option>
            <option value="copy_paste_attempt">Copy/Paste Attempt</option>
          </select>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
          >
            <option value="">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <Button
            onClick={fetchFilteredLogs}
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-6 py-3 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 transition-all duration-200"
          >
            Filter
          </Button>
          <Button
            onClick={() => {
              setFilterType('');
              setFilterSeverity('');
              setSelectedStudent(null);
              setStudentLogs([]);
            }}
            variant="outline"
            className="px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200"
          >
            Clear
          </Button>
        </div>

        {!selectedStudent && studentLogs.length === 0 && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Student-wise Violation Summary</h2>
            <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <TableHead className="py-5 font-bold text-gray-900">Student Name</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Email</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Total Violations</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Critical</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">High</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Violation Types</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary.map((item) => (
                    <TableRow 
                      key={item.student._id} 
                      className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                      onClick={() => fetchStudentLogs(item.student._id)}
                    >
                      <TableCell className="py-5 font-semibold text-gray-900">{item.student.name}</TableCell>
                      <TableCell className="py-5 text-gray-600">{item.student.email}</TableCell>
                      <TableCell className="py-5">
                        <Badge className="bg-gradient-to-br from-red-500 to-red-600 text-white px-4 py-1.5 rounded-xl font-bold shadow-md shadow-red-500/30">
                          {item.total}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge className="bg-gradient-to-br from-red-500 to-red-600 text-white px-4 py-1.5 rounded-xl font-bold shadow-md shadow-red-500/30">
                          {item.critical}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge className="bg-gradient-to-br from-orange-500 to-orange-600 text-white px-4 py-1.5 rounded-xl font-bold shadow-md shadow-orange-500/30">
                          {item.high}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-sm text-gray-700">
                        {item.types.join(', ')}
                      </TableCell>
                      <TableCell className="py-5">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded-xl font-semibold px-4 py-2 hover:scale-105 transition-all duration-200"
                        >
                          View Details
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {selectedStudent && (
          <div>
            <Button
              onClick={() => setSelectedStudent(null)}
              variant="outline"
              className="mb-6 px-6 py-3 rounded-xl font-semibold hover:scale-105 transition-all duration-200"
            >
              Back to Summary
            </Button>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Violation Timeline</h2>
            <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gradient-to-r from-gray-50 to-gray-100/50 border-b border-gray-200">
                    <TableHead className="py-5 font-bold text-gray-900">Timestamp</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Violation Type</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Description</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Severity</TableHead>
                    <TableHead className="py-5 font-bold text-gray-900">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {studentLogs.map((log) => (
                    <TableRow key={log._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                      <TableCell className="py-5 font-mono text-sm text-gray-700 font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="py-5">
                        <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-xl font-semibold shadow-md shadow-blue-500/30">
                          {log.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5 text-gray-700 max-w-xs">{log.description}</TableCell>
                      <TableCell className="py-5">
                        <Badge className={`border-2 px-4 py-1.5 rounded-xl font-bold uppercase tracking-wide ${getSeverityColor(log.severity)}`}>
                          {log.severity}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-5">
                        {log.confidence != null ? (
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                log.confidence >= 90
                                  ? "bg-gradient-to-r from-red-500 to-red-600"
                                  : log.confidence >= 75
                                  ? "bg-gradient-to-r from-orange-500 to-orange-600"
                                  : "bg-gradient-to-r from-yellow-500 to-yellow-600"
                              }`}
                              style={{ width: `${log.confidence}%` }}
                            />
                          </div>
                          <span className={`font-bold text-sm ${getConfidenceColor(log.confidence)}`}>
                            {log.confidence}%
                          </span>
                        </div>
                        ) : (
                          <span className="text-gray-400 text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </div>
        )}

        {summary.length === 0 && !selectedStudent && (
          <div className="text-center text-gray-500 mt-10">
            No cheating violations recorded.
          </div>
        )}
      </div>
    </div>
  );
};

export default CheatLogPage;
