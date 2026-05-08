// ── Imports ──────────────────────────────────────────────────────────
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
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

// ── Page Imports: Student ───────────────────────────────────────────
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';
import PreExamPage from './pages/student/PreExamPage';
import ResultPage from './pages/student/ResultPage';
import MyResultsPage from './pages/student/MyResultsPage';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
        
        {/* ── Catch-all: redirect to login ──────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
