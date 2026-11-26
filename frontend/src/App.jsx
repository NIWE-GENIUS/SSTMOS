// src/App.jsx
import { ThemeProvider } from './context/ThemeContext';

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth, homeForRole } from './context/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute';
import RoleRoute from './routes/RoleRoute';
import AppLayout from './layouts/AppLayout';

// Public
import LandingPage from './pages/LandingPage';
import ContactPage from './pages/ContactPage';
import LegalPage from './pages/LegalPage';
import LoginPage from './pages/auth/LoginPage';

import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SignUpPage from './pages/auth/SignUpPage';
// Platform admin
import PlatformDashboard from './pages/platform/PlatformDashboard';
import SchoolsListPage from './pages/platform/SchoolsListPage';
import SchoolDetailPage from './pages/platform/SchoolDetailPage';
import AgreementsPage from './pages/platform/AgreementsPage';
import ActivityPage from './pages/platform/ActivityPage';
import ContactMessagesPage from './pages/platform/ContactMessagesPage';

import SchoolRegistrationsPage from './pages/platform/SchoolRegistrationsPage';

// DOS
import DosDashboard from './pages/dos/DosDashboard';
import AcademicPage from './pages/dos/AcademicPage';
import TimetableConfigPage from './pages/dos/TimetableConfigPage';
import RoomsPage from './pages/dos/RoomsPage';
import TrainersPage from './pages/dos/TrainersPage';
import ClassTeacherPage from './pages/dos/ClassTeacherPage';
import ModulesPage from './pages/dos/ModulesPage';
import GeneratePage from './pages/dos/GeneratePage';
import TimetablePage from './pages/dos/TimetablePage';
import ReportsPage from './pages/dos/ReportsPage';
import UsersPage from './pages/dos/UsersPage';

// Head teacher / deputy
import HtDashboard from './pages/ht/HtDashboard';
import HtTimetablePage from './pages/ht/HtTimetablePage';
import HtReportsPage from './pages/ht/HtReportsPage';

// Trainer
import TrainerDashboard from './pages/trainer/TrainerDashboard';
import TrainerTimetablePage from './pages/trainer/TrainerTimetablePage';

// Student
import StudentDashboard from './pages/student/StudentDashboard';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return null;
  return <Navigate to={user ? homeForRole(user.roles) : '/login'} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* ===== Public ===== */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/go" element={<RootRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
<Route path="/reset-password" element={<ResetPasswordPage />} />
<Route path="/signup" element={<SignUpPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/privacy" element={<LegalPage type="privacy" />} />
      <Route path="/terms" element={<LegalPage type="terms" />} />
      <Route path="/data-protection" element={<LegalPage type="data-protection" />} />

      {/* ===== Authenticated shell ===== */}
      <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
        {/* Platform Admin */}
        <Route path="/platform" element={<RoleRoute roles={['platform_admin']}><PlatformDashboard /></RoleRoute>} />
        <Route path="/platform/schools" element={<RoleRoute roles={['platform_admin']}><SchoolsListPage /></RoleRoute>} />
        <Route path="/platform/schools/:id" element={<RoleRoute roles={['platform_admin']}><SchoolDetailPage /></RoleRoute>} />
        <Route path="/platform/agreements" element={<RoleRoute roles={['platform_admin']}><AgreementsPage /></RoleRoute>} />
        <Route path="/platform/activity" element={<RoleRoute roles={['platform_admin']}><ActivityPage /></RoleRoute>} />
        <Route path="/platform/contact" element={<RoleRoute roles={['platform_admin']}><ContactMessagesPage /></RoleRoute>} />
        <Route path="/platform/registrations" element={<RoleRoute roles={['platform_admin']}><SchoolRegistrationsPage /></RoleRoute>} />

        {/* DOS */}
        <Route path="/dos" element={<RoleRoute roles={['dos']}><DosDashboard /></RoleRoute>} />
        <Route path="/dos/academic" element={<RoleRoute roles={['dos']}><AcademicPage /></RoleRoute>} />
        <Route path="/dos/timetable-config" element={<RoleRoute roles={['dos']}><TimetableConfigPage /></RoleRoute>} />
        <Route path="/dos/rooms" element={<RoleRoute roles={['dos']}><RoomsPage /></RoleRoute>} />
        <Route path="/dos/trainers" element={<RoleRoute roles={['dos']}><TrainersPage /></RoleRoute>} />
        <Route path="/dos/class-teachers" element={<RoleRoute roles={['dos']}><ClassTeacherPage /></RoleRoute>} />
        <Route path="/dos/modules" element={<RoleRoute roles={['dos']}><ModulesPage /></RoleRoute>} />
        <Route path="/dos/generate" element={<RoleRoute roles={['dos']}><GeneratePage /></RoleRoute>} />
        <Route path="/dos/timetable" element={<RoleRoute roles={['dos']}><TimetablePage /></RoleRoute>} />
        <Route path="/dos/reports" element={<RoleRoute roles={['dos']}><ReportsPage /></RoleRoute>} />
        <Route path="/dos/users" element={<RoleRoute roles={['dos']}><UsersPage /></RoleRoute>} />

        {/* Head Teacher + Deputy */}
        <Route path="/ht" element={<RoleRoute roles={['head_teacher', 'deputy_head_teacher']}><HtDashboard /></RoleRoute>} />
        <Route path="/ht/timetable" element={<RoleRoute roles={['head_teacher', 'deputy_head_teacher']}><HtTimetablePage /></RoleRoute>} />
        <Route path="/ht/reports" element={<RoleRoute roles={['head_teacher', 'deputy_head_teacher']}><HtReportsPage /></RoleRoute>} />

        {/* Trainer */}
        <Route path="/trainer" element={<RoleRoute roles={['trainer']}><TrainerDashboard /></RoleRoute>} />
        <Route path="/trainer/timetable" element={<RoleRoute roles={['trainer']}><TrainerTimetablePage /></RoleRoute>} />

        {/* Student */}
        <Route path="/student" element={<RoleRoute roles={['student']}><StudentDashboard /></RoleRoute>} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}