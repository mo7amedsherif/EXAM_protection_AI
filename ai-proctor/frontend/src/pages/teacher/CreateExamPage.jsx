import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axios';
import Navbar from '../../components/Navbar';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';

const CreateExamPage = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/exams', {
        ...formData,
        duration: parseInt(formData.duration),
      });
      navigate(`/teacher/exam/${response.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/20 to-gray-50">
      <Navbar />
      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-7xl mx-auto px-8 py-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Exam</h1>
            <p className="text-gray-600 mt-2 text-lg">Set up a new exam for students</p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto py-16 px-8">
        <Card className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-10 hover:shadow-2xl transition-all duration-300">
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="title" className="text-gray-900 mb-2 block">Exam Title</Label>
              <Input
                id="title"
                name="title"
                type="text"
                placeholder="e.g., Computer Science Final Exam"
                value={formData.title}
                onChange={handleChange}
                className="rounded-xl py-6 px-5 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                required
              />
            </div>

            <div>
              <Label htmlFor="description" className="text-gray-900 mb-2 block">Description</Label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Provide a brief description of the exam..."
                className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 transition-all duration-200 resize-none"
                rows="4"
              />
            </div>

            <div>
              <Label htmlFor="duration" className="text-gray-900 mb-2 block">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                placeholder="e.g., 60"
                value={formData.duration}
                onChange={handleChange}
                className="rounded-xl py-6 px-5 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
                required
                min="1"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200 mt-8"
            >
              {loading ? 'Creating...' : 'Create Exam'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default CreateExamPage;
