// ── Imports ──────────────────────────────────────────────────────────
import { Link, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Button } from './ui/button';

// ── Component ────────────────────────────────────────────────────────
const Navbar = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // ── Logout handler ─────────────────────────────────────────────────
  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // ── Active route helper ────────────────────────────────────────────
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200/50 shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center gap-12">
            <Link to="/" className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <span className="font-bold text-gray-900 text-lg">AI Proctor Platform</span>
            </Link>

            {/* ── Navigation Links ─────────────────────────────────── */}
            <div className="flex gap-2">
              {user?.role === 'student' && (
                <>
                  <Link to="/student/dashboard">
                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive('/student/dashboard')
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      My Exams
                    </button>
                  </Link>
                  <Link to="/student/my-results">
                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive('/student/my-results')
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      My Results
                    </button>
                  </Link>
                  <Link to="/student/materials">
                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive('/student/materials')
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      Materials
                    </button>
                  </Link>
                </>
              )}

              {user?.role === 'teacher' && (
                <>
                  <Link to="/teacher/dashboard">
                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive('/teacher/dashboard')
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      Dashboard
                    </button>
                  </Link>
                  <Link to="/teacher/create-exam">
                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive('/teacher/create-exam')
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      Create Exam
                    </button>
                  </Link>
                  <Link to="/teacher/materials">
                    <button className={`px-6 py-3 rounded-xl font-semibold transition-all duration-300 ${
                      isActive('/teacher/materials')
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/30'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}>
                      Materials
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>

          {/* ── User Info & Logout ─────────────────────────────────── */}
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1 capitalize">{user?.role}</p>
              <p className="font-bold text-gray-900">{user?.name}</p>
            </div>
            <Button
              onClick={handleLogout}
              variant="outline"
              size="sm"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 hover:border-red-300 rounded-xl px-5 py-3 font-semibold hover:scale-105 transition-all duration-200"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
