import { useLocation, useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';

const ResultPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const result = location.state?.result;
  const terminated = location.state?.terminated || false;

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50/10 to-gray-50">
        <div className="max-w-2xl mx-auto py-16 px-8">
          <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-red-200/50 p-10">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              No result data found. Please submit an exam first.
            </div>
            <Button
              onClick={() => navigate('/student/dashboard')}
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
            >
              Back to Dashboard
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  const getPassStatus = () => {
    if (result.percentage >= 70) {
      return { 
        text: 'Passed', 
        color: 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-400 shadow-lg shadow-green-500/30',
        icon: '✓'
      };
    } else if (result.percentage >= 50) {
      return { 
        text: 'Average', 
        color: 'bg-gradient-to-br from-yellow-500 to-yellow-600 text-white border-yellow-400 shadow-lg shadow-yellow-500/30',
        icon: '~'
      };
    } else {
      return { 
        text: 'Failed', 
        color: 'bg-gradient-to-br from-red-500 to-red-600 text-white border-red-400 shadow-lg shadow-red-500/30',
        icon: '✗'
      };
    }
  };

  const status = getPassStatus();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/10 to-gray-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Exam Result</h1>
            <p className="text-gray-600 mt-2 text-lg">Your exam submission has been graded</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-16 px-8">
        <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-12 hover:shadow-3xl transition-all duration-300">
          {terminated && (
            <div style={{
              background: '#FEE2E2', border: '1px solid #EF4444',
              borderRadius: 8, padding: '10px 16px',
              marginBottom: 20, textAlign: 'center',
            }}>
              <p style={{ color: '#7F1D1D', fontWeight: 600, margin: 0, fontSize: 14 }}>
                🛑 This exam was terminated due to repeated violations.
                Your teacher has been notified.
              </p>
            </div>
          )}
          {/* Score Display */}
          <div className="text-center mb-12">
            <div className="relative inline-block">
              <div className={`w-48 h-48 rounded-full flex items-center justify-center ${
                result.percentage >= 70
                  ? 'bg-gradient-to-br from-green-400 to-green-500 shadow-2xl shadow-green-500/30'
                  : result.percentage >= 50
                  ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 shadow-2xl shadow-yellow-500/30'
                  : 'bg-gradient-to-br from-red-400 to-red-500 shadow-2xl shadow-red-500/30'
              }`}>
                <div className="bg-white rounded-full w-40 h-40 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-gray-900">{result.percentage}%</div>
                    <div className="text-sm text-gray-600 mt-1">Score</div>
                  </div>
                </div>
              </div>
            </div>
            <Badge className={`mt-8 px-8 py-3 rounded-full text-xl font-bold uppercase tracking-wide border-2 ${status.color}`}>
              {status.text}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-blue-200 hover:shadow-xl transition-all duration-300">
              <p className="text-sm font-semibold text-blue-700 uppercase tracking-wide mb-3">Score</p>
              <p className="text-4xl font-bold text-gray-900">{result.score}</p>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 backdrop-blur-xl p-8 rounded-2xl shadow-lg border-2 border-purple-200 hover:shadow-xl transition-all duration-300">
              <p className="text-sm font-semibold text-purple-700 uppercase tracking-wide mb-3">Total Marks</p>
              <p className="text-4xl font-bold text-gray-900">{result.totalMarks}</p>
            </Card>
          </div>

          {/* Submission Info */}
          <div className="text-center text-gray-600 mb-10 pb-8 border-b border-gray-200">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">Submitted at</p>
            <p className="text-lg font-semibold text-gray-900">{new Date(result.submittedAt).toLocaleString()}</p>
          </div>

          {/* Back Button */}
          <Button
            onClick={() => navigate('/student/dashboard')}
            className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
          >
            Back to Dashboard
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default ResultPage;
