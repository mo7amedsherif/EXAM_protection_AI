import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import useAuthStore from '../store/authStore';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/users/register', formData);
      const { token, ...user } = response.data;
      login({ user, token });
      
      if (response.data.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-8">
      <Card className="w-full max-w-md bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200/50 p-10">
        {/* Logo & Header */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-blue-600/30 hover:scale-110 transition-transform duration-300">
            <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">AI Proctor Platform</h1>
          <p className="text-gray-600 text-lg">Create a new account</p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex gap-3 mb-8 bg-gray-100 p-2 rounded-2xl">
          <Link to="/login" className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 bg-transparent text-gray-600 hover:text-gray-900 text-center">
            Login
          </Link>
          <button className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 scale-105">
            Register
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-gray-900 mb-2 block">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="John Doe"
              value={formData.name}
              onChange={handleChange}
              className="rounded-xl py-6 px-5 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-gray-900 mb-2 block">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@university.edu"
              value={formData.email}
              onChange={handleChange}
              className="rounded-xl py-6 px-5 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="password" className="text-gray-900 mb-2 block">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              className="rounded-xl py-6 px-5 border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
              required
            />
          </div>

          <div>
            <Label htmlFor="role" className="text-gray-900 mb-3 block">Select Role</Label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'student' })}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                  formData.role === 'student'
                    ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:scale-105'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <svg className={`w-8 h-8 ${formData.role === 'student' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <span className={`font-semibold ${formData.role === 'student' ? 'text-blue-600' : 'text-gray-600'}`}>
                    Student
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'teacher' })}
                className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                  formData.role === 'teacher'
                    ? 'border-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/50 shadow-lg scale-105'
                    : 'border-gray-200 bg-white hover:border-blue-300 hover:scale-105'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <svg className={`w-8 h-8 ${formData.role === 'teacher' ? 'text-blue-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className={`font-semibold ${formData.role === 'teacher' ? 'text-blue-600' : 'text-gray-600'}`}>
                    Teacher
                  </span>
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200 mt-8">
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link to="/login" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200">
            Already have an account? Login
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default RegisterPage;
