import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import KioskPage from './pages/KioskPage';
import PreRegister from './pages/register/PreRegister';
import EmergencyAppointment from './pages/register/EmergencyAppointment';
import VisitorDashboard from './pages/visitor/VisitorDashboard';
import VisitQrDetails from './pages/visitor/VisitQrDetails';
import AboutCompany from './pages/visitor/AboutCompany';
import HostDashboard from './pages/host/HostDashboard';
import HostAvailability from './pages/host/HostAvailability';
import SmartToolPage from './pages/host/SmartToolPage';
import GuardScan from './pages/guard/GuardScan';
import EmployeeDashboard from './pages/employee/EmployeeDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminFeedback from './pages/admin/AdminFeedback';
import OccupancyDashboard from './pages/admin/OccupancyDashboard';
import AdminEvacuation from './pages/admin/AdminEvacuation';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminReports from './pages/admin/AdminReports';
import AdminSettings from './pages/admin/AdminSettings';
import FeedbackForm from './pages/FeedbackForm';
import ProfilePage from './pages/ProfilePage';
import { useEffect } from 'react';
const SessionTimeout = ({ children }) => {
  const { user, logout } = useAuth();
  useEffect(() => {
    if (!user) return;
    let timeoutId;
    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        window.location.href = '/login?timeout=true';
      }, 30 * 60 * 1000);
    };
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(e => document.addEventListener(e, resetTimer));
    resetTimer();
    return () => {
      clearTimeout(timeoutId);
      events.forEach(e => document.removeEventListener(e, resetTimer));
    };
  }, [user, logout]);
  return children;
};
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, userProfile, loading } = useAuth();
  if (loading) return (
    <div className="loading-overlay">
      <div className="spinner" />
      <p style={{ color: 'var(--text-secondary)' }}>Just a moment while we get everything ready for you...</p>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(userProfile?.role)) return <Navigate to="/" replace />;
  return children;
};
const AppRoutes = () => {
  const { userProfile } = useAuth();
  const roleHome = () => {
    if (!userProfile) return '/login';
    const map = { visitor: '/visitor/dashboard', student: '/visitor/dashboard', host: '/host/dashboard', guard: '/guard/scan', admin: '/admin/dashboard', employee: '/employee/dashboard' };
    return map[userProfile.role] || '/';
  };
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/pre-register" element={<PreRegister />} />
      <Route path="/emergency-appointment" element={
        <ProtectedRoute allowedRoles={['visitor', 'student']}><EmergencyAppointment /></ProtectedRoute>
      } />
      <Route path="/kiosk" element={<KioskPage />} />
      <Route path="/feedback/:visitId" element={<FeedbackForm />} />
      <Route path="/visit/qr/:visitId" element={<VisitQrDetails />} />
      {/* Profile for all authenticated users */}
      <Route path="/profile" element={
        <ProtectedRoute allowedRoles={['admin', 'guard', 'host', 'visitor', 'student', 'employee']}><ProfilePage /></ProtectedRoute>
      } />
      {/* Visitor / Student */}
      <Route path="/visitor/dashboard" element={
        <ProtectedRoute allowedRoles={['visitor', 'student']}><VisitorDashboard /></ProtectedRoute>
      } />
      <Route path="/student/dashboard" element={
        <ProtectedRoute allowedRoles={['visitor', 'student']}><Navigate to="/visitor/dashboard" replace /></ProtectedRoute>
      } />
      <Route path="/visitor/about-company" element={
        <ProtectedRoute allowedRoles={['visitor']}><AboutCompany /></ProtectedRoute>
      } />
      {/* Host */}
      <Route path="/host/dashboard" element={
        <ProtectedRoute allowedRoles={['host']}><HostDashboard /></ProtectedRoute>
      } />
      <Route path="/host/availability" element={
        <ProtectedRoute allowedRoles={['host']}><HostAvailability /></ProtectedRoute>
      } />
      <Route path="/host/tool/:toolId" element={
        <ProtectedRoute allowedRoles={['host']}><SmartToolPage /></ProtectedRoute>
      } />

      {/* Guard */}
      <Route path="/guard/scan" element={
        <ProtectedRoute allowedRoles={['guard']}><GuardScan /></ProtectedRoute>
      } />

      {/* Employee */}
      <Route path="/employee/dashboard" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/visitors" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/meetings" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/notifications" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/invite" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/requests" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/history" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/passes" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/training" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/tasks" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/safety" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      <Route path="/employee/guidelines" element={
        <ProtectedRoute allowedRoles={['employee']}><EmployeeDashboard /></ProtectedRoute>
      } />
      {/* Admin */}
      <Route path="/admin/dashboard" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/analytics" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminAnalytics /></ProtectedRoute>
      } />
      <Route path="/admin/feedback" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminFeedback /></ProtectedRoute>
      } />
      <Route path="/admin/occupancy" element={
        <ProtectedRoute allowedRoles={['admin']}><OccupancyDashboard /></ProtectedRoute>
      } />
      <Route path="/admin/evacuation" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminEvacuation /></ProtectedRoute>
      } />
      <Route path="/admin/audit-logs" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminAuditLogs /></ProtectedRoute>
      } />
      <Route path="/admin/reports" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminReports /></ProtectedRoute>
      } />
      <Route path="/admin/settings" element={
        <ProtectedRoute allowedRoles={['admin']}><AdminSettings /></ProtectedRoute>
      } />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <SessionTimeout>
            <AppRoutes />
          </SessionTimeout>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
