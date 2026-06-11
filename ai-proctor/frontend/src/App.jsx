// ── Imports ──────────────────────────────────────────────────────────
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import useAuthStore from './store/authStore';

// ── Page Imports: Auth ──────────────────────────────────────────────
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// ── Page Imports: Teacher ───────────────────────────────────────────
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExamPage from './pages/teacher/CreateExamPage';
import ExamDetailPage from './pages/teacher/ExamDetailPage';
import ExamResultsPage from './pages/teacher/ExamResultsPage';
import CheatLogPage from './pages/teacher/CheatLogPage';
import TeacherMaterialsPage from './pages/teacher/TeacherMaterialsPage';
import QuestionWarehousePage from './pages/teacher/QuestionWarehousePage';

// ── Page Imports: Student ───────────────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';
import PreExamPage from './pages/student/PreExamPage';
import ResultPage from './pages/student/ResultPage';
import MyResultsPage from './pages/student/MyResultsPage';
import StudentMaterialsPage from './pages/student/StudentMaterialsPage';

// ── Layout wrapper that conditionally renders sidebar ────────────────
function AppLayout() {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  // Hide sidebar on auth pages and the exam-taking page
  const isAuthPage = ['/login', '/register'].includes(location.pathname);
  const isExamPage = /^\/student\/exam\/[^/]+$/.test(location.pathname)
    && !location.pathname.endsWith('/pre');
  const showSidebar = user && !isAuthPage && !isExamPage;

  // Read collapse state for CSS class (synced with Navbar's localStorage)
  const isCollapsed = (() => {
    try { return JSON.parse(localStorage.getItem('sidebar-collapsed')) || false; }
    catch { return false; }
  })();

  return (
    <div className={showSidebar ? `app-layout ${isCollapsed ? 'sidebar-is-collapsed' : ''}` : ''}>
      {showSidebar && <Navbar />}
      <main className={showSidebar ? 'app-main' : ''}>
        <Routes>
          {/* ── Auth Routes (public) ──────────────────────────────── */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* ── Teacher Routes (protected) ────────────────────────── */}
          <Route
            path="/teacher/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <TeacherDashboard />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/create-exam"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <CreateExamPage />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exam/:id"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <ExamDetailPage />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exam/:id/results"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <ExamResultsPage />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/exam/:id/cheating"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <CheatLogPage />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/materials"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <TeacherMaterialsPage />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/teacher/question-bank"
            element={
              <ProtectedRoute>
                {user?.role === 'teacher' ? (
                  <QuestionWarehousePage />
                ) : (
                  <Navigate to="/student/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          {/* ── Student Routes (protected) ────────────────────────── */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute>
                {user?.role === 'student' ? (
                  <StudentDashboard />
                ) : (
                  <Navigate to="/teacher/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id/pre"
            element={
              <ProtectedRoute>
                {user?.role === 'student' ? (
                  <PreExamPage />
                ) : (
                  <Navigate to="/teacher/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/exam/:id"
            element={
              <ProtectedRoute>
                {user?.role === 'student' ? (
                  <ExamPage />
                ) : (
                  <Navigate to="/teacher/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/result"
            element={
              <ProtectedRoute>
                {user?.role === 'student' ? (
                  <ResultPage />
                ) : (
                  <Navigate to="/teacher/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/my-results"
            element={
              <ProtectedRoute>
                {user?.role === 'student' ? (
                  <MyResultsPage />
                ) : (
                  <Navigate to="/teacher/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/materials"
            element={
              <ProtectedRoute>
                {user?.role === 'student' ? (
                  <StudentMaterialsPage />
                ) : (
                  <Navigate to="/teacher/dashboard" />
                )}
              </ProtectedRoute>
            }
          />
          
          {/* ── Catch-all: redirect to login ──────────────────────── */}
          <Route path="/" element={<Navigate to="/login" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppLayout />
    </Router>
  );
}

export default App;
