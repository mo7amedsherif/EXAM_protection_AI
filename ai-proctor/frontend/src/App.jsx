import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import TeacherDashboard from './pages/teacher/TeacherDashboard';
import CreateExamPage from './pages/teacher/CreateExamPage';
import ExamDetailPage from './pages/teacher/ExamDetailPage';
import ExamResultsPage from './pages/teacher/ExamResultsPage';
import CheatLogPage from './pages/teacher/CheatLogPage';
import StudentDashboard from './pages/student/StudentDashboard';
import ExamPage from './pages/student/ExamPage';
import ResultPage from './pages/student/ResultPage';
import useAuthStore from './store/authStore';

function App() {
  const user = useAuthStore((state) => state.user);

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        
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
        
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
