import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from '../api/axios';
import useAuthStore from '../store/authStore';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

const LoginPage = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
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
      const response = await axios.post('/users/login', formData);
      const { token, ...user } = response.data;
      login({ user, token });
      
      if (response.data.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
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
          <p className="text-gray-600 text-lg">Sign in to your account</p>
        </div>

        {/* Toggle Login/Register */}
        <div className="flex gap-3 mb-8 bg-gray-100 p-2 rounded-2xl">
          <button className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30 scale-105">
            Login
          </button>
          <Link to="/register" className="flex-1 py-3 px-6 rounded-xl font-semibold transition-all duration-300 bg-transparent text-gray-600 hover:text-gray-900 text-center">
            Register
          </Link>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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

          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 py-6 rounded-xl font-bold text-lg shadow-lg shadow-blue-600/30 hover:scale-105 hover:shadow-xl transition-all duration-200 mt-8">
            {loading ? 'Signing in...' : 'Sign In'}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center">
          <Link to="/register" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all duration-200">
            Don't have an account? Register
          </Link>
        </div>

        {/* Demo Credentials */}
        <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl border border-gray-200">
          <p className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Demo Credentials:</p>
          <div className="space-y-2 text-sm text-gray-800">
            <p><span className="font-bold">Student:</span> student@demo.edu / password</p>
            <p><span className="font-bold">Teacher:</span> teacher@demo.edu / password</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default LoginPage;
