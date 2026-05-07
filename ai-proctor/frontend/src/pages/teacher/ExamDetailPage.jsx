import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';

const ExamDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [exam, setExam] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState({
    text: '',
    options: ['', '', '', ''],
    correctOption: 0,
    marks: 1,
  });

  useEffect(() => {
    fetchExamData();
  }, [id]);

  const fetchExamData = async () => {
    try {
      const [examRes, questionsRes] = await Promise.all([
        axios.get(`/exams/${id}`),
        axios.get(`/exams/${id}/questions`),
      ]);
      setExam(examRes.data);
      setQuestions(questionsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch exam data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/exams/${id}/questions`, newQuestion);
      setQuestions([...questions, response.data]);
      setNewQuestion({
        text: '',
        options: ['', '', '', ''],
        correctOption: 0,
        marks: 1,
      });
      setShowAddForm(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add question');
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!window.confirm('Are you sure you want to delete this question?')) return;

    try {
      await axios.delete(`/exams/${id}/questions/${questionId}`);
      setQuestions(questions.filter((q) => q._id !== questionId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete question');
    }
  };

  if (loading) return <div className="text-center mt-10">Loading...</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{exam?.title}</h1>
            <p className="text-gray-600 mt-2 text-lg">{exam?.description}</p>
            <div className="flex items-center gap-4 mt-4">
              <Badge className="bg-gradient-to-br from-blue-500 to-blue-600 text-white px-4 py-1.5 rounded-xl font-semibold shadow-md shadow-blue-500/30">
                {exam?.duration} min
              </Badge>
              <Badge className={`px-4 py-1.5 rounded-xl font-semibold ${
                exam?.isActive
                  ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-md shadow-green-500/30'
                  : 'bg-gray-200 text-gray-700'
              }`}>
                {exam?.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto py-10 px-8">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
            {error}
          </div>
        )}

        <div className="mb-8">
          <Button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 px-8 py-6 rounded-xl font-semibold shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
          >
            {showAddForm ? 'Cancel' : 'Add Question'}
          </Button>
        </div>

        {showAddForm && (
          <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add New Question</h3>
            <form onSubmit={handleAddQuestion} className="space-y-6">
              <div>
                <label className="block text-gray-900 mb-2 font-semibold">Question Text</label>
                <textarea
                  value={newQuestion.text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, text: e.target.value })}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 resize-none"
                  rows="3"
                  required
                />
              </div>
              <div>
                <label className="block text-gray-900 mb-3 font-semibold">Options</label>
                {newQuestion.options.map((option, index) => (
                  <input
                    key={index}
                    type="text"
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...newQuestion.options];
                      newOptions[index] = e.target.value;
                      setNewQuestion({ ...newQuestion, options: newOptions });
                    }}
                    className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 mb-3"
                    placeholder={`Option ${index + 1}`}
                    required
                  />
                ))}
              </div>
              <div>
                <label className="block text-gray-900 mb-2 font-semibold">Correct Option</label>
                <select
                  value={newQuestion.correctOption}
                  onChange={(e) => setNewQuestion({ ...newQuestion, correctOption: parseInt(e.target.value) })}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                >
                  <option value={0}>Option 1</option>
                  <option value={1}>Option 2</option>
                  <option value={2}>Option 3</option>
                  <option value={3}>Option 4</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-900 mb-2 font-semibold">Marks</label>
                <input
                  type="number"
                  value={newQuestion.marks}
                  onChange={(e) => setNewQuestion({ ...newQuestion, marks: parseInt(e.target.value) })}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200"
                  min="1"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-br from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-green-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200"
              >
                Add Question
              </Button>
            </form>
          </Card>
        )}

        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Questions ({questions.length})</h2>
          <div className="space-y-6">
            {questions.map((question, index) => (
              <Card key={question._id} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-lg border border-gray-200/50 p-8 hover:shadow-2xl transition-all duration-300">
                <div className="flex justify-between items-start mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Q{index + 1}: {question.text}
                  </h3>
                  <Button
                    onClick={() => handleDeleteQuestion(question._id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-2 rounded-xl font-semibold hover:scale-105 transition-all duration-200"
                  >
                    Delete
                  </Button>
                </div>
                <div className="space-y-3">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 ${
                        optIndex === question.correctOption
                          ? 'border-green-500 bg-gradient-to-br from-green-50 to-green-100/50 shadow-md'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {optIndex === question.correctOption && (
                          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-md shadow-green-500/30">
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                        <span className="font-medium text-gray-800">{option}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <p className="text-sm font-semibold text-gray-600">Marks: {question.marks}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {questions.length === 0 && (
          <div className="text-center text-gray-500 mt-10">
            No questions yet. Add your first question!
          </div>
        )}
      </div>
    </div>
  );
};

export default ExamDetailPage;
