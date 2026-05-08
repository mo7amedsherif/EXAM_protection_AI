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

  const getPercentageColor = (percentage) => {
    if (percentage >= 70) {
      return "bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400 shadow-md shadow-green-500/30";
    } else if (percentage >= 50) {
      return "bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-400 shadow-md shadow-yellow-500/30";
    } else {
      return "bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400 shadow-md shadow-red-500/30";
    }
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
                <TableHead className="py-5 font-bold text-gray-900">Total Marks</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Percentage</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Status</TableHead>
                <TableHead className="py-5 font-bold text-gray-900">Submitted At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {results.map((result) => (
                <TableRow key={result._id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors duration-200">
                  <TableCell className="py-5 font-semibold text-gray-900">{result.student?.name}</TableCell>
                  <TableCell className="py-5 text-gray-600">{result.student?.email}</TableCell>
                  <TableCell className="py-5 font-bold text-gray-900">{result.score}</TableCell>
                  <TableCell className="py-5 text-gray-700">{result.totalMarks}</TableCell>
                  <TableCell className="py-5">
                    <Badge className={`border-2 px-4 py-1.5 rounded-xl font-bold uppercase tracking-wide ${getPercentageColor(result.percentage)}`}>
                      {result.percentage}%
                    </Badge>
                  </TableCell>
                  <TableCell className="py-5">
                    {result.terminated ? (
                      <span style={{
                        background: '#FEE2E2', color: '#7F1D1D',
                        padding: '2px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        🛑 Terminated
                      </span>
                    ) : (
                      <span style={{
                        background: '#D1FAE5', color: '#065F46',
                        padding: '2px 10px', borderRadius: 20,
                        fontSize: 12, fontWeight: 600,
                      }}>
                        ✓ Completed
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="py-5 text-sm text-gray-600 font-mono">
                    {new Date(result.submittedAt).toLocaleString()}
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
    </div>
  );
};

export default ExamResultsPage;
