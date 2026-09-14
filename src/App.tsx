import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { seedInitialDatabase } from './services/seedService';

// Pages
import { Login } from './pages/Login';
import { EmployeeHome } from './pages/EmployeeHome';
import { AdminDashboard } from './pages/AdminDashboard';
import { Directory } from './pages/Directory';
import { Profile360 } from './pages/Profile360';
import { AttendancePage } from './pages/AttendancePage';
import { LeavePage } from './pages/LeavePage';
import { ProjectsPage } from './pages/ProjectsPage';
import { RecognitionPage } from './pages/RecognitionPage';
import { AnnouncementsPage } from './pages/AnnouncementsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { WorkforceAnalyticsPage } from './pages/WorkforceAnalyticsPage';
import { DomainAnalyticsPage } from './pages/DomainAnalyticsPage';
import { ProjectAnalyticsPage } from './pages/ProjectAnalyticsPage';
import { ActivityPage } from './pages/ActivityPage';
import { SecurityAuditPage } from './pages/SecurityAuditPage';
import { SettingsPage } from './pages/SettingsPage';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4ED]">
        <div className="w-8 h-8 rounded-full border-2 border-[#174A4A] border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

// Admin Route Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAdmin, role } = useAuth();

  if (!isAdmin) {
    return (
      <div className="p-8 max-w-xl mx-auto my-12 bg-[#FAF0EE] border border-[#C97867]/60 rounded-3xl text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-[#C97867]/20 text-[#B85C50] flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>

        <h2 className="text-xl font-bold text-[#B85C50] font-display">
          403 Forbidden: Administrator Access Required
        </h2>

        <p className="text-xs text-[#73716B] leading-relaxed">
          Your current session role (
          <code className="font-bold text-[#30302D]">{role}</code>)
          does not possess executive privileges to inspect this administrative console.
        </p>

        <div className="pt-2">
          <a
            href="/home"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#174A4A] text-[#F7F4ED] hover:bg-[#123B3B] transition-colors"
          >
            <ArrowLeft size={14} />
            <span>Return to Employee Home</span>
          </a>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Root Redirect
const RootRedirect: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={isAdmin ? "/dashboard" : "/home"} replace />;
};

export default function App() {
  // Seed Firestore only if the database is empty
  useEffect(() => {
    seedInitialDatabase()
      .then((result) => console.log(result.message))
      .catch((err) => console.error("Database seed failed:", err));
  }, []);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public Login */}
          <Route path="/login" element={<Login />} />

          {/* Protected App */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<RootRedirect />} />

            {/* Employee */}
            <Route path="home" element={<EmployeeHome />} />
            <Route path="employees" element={<Directory />} />
            <Route path="profile" element={<Profile360 />} />
            <Route path="profile/:employeeId" element={<Profile360 />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave" element={<LeavePage />} />
            <Route path="projects" element={<ProjectsPage />} />
            <Route path="recognition" element={<RecognitionPage />} />
            <Route path="announcements" element={<AnnouncementsPage />} />
            <Route path="notifications" element={<NotificationsPage />} />

            {/* Admin */}
            <Route
              path="dashboard"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            <Route
              path="analytics/workforce"
              element={
                <AdminRoute>
                  <WorkforceAnalyticsPage />
                </AdminRoute>
              }
            />

            <Route
              path="analytics/domains"
              element={
                <AdminRoute>
                  <DomainAnalyticsPage />
                </AdminRoute>
              }
            />

            <Route
              path="analytics/projects"
              element={
                <AdminRoute>
                  <ProjectAnalyticsPage />
                </AdminRoute>
              }
            />

            <Route
              path="activity"
              element={
                <AdminRoute>
                  <ActivityPage />
                </AdminRoute>
              }
            />

            {/* Security */}
            <Route path="security-audit" element={<SecurityAuditPage />} />
            <Route path="settings" element={<SettingsPage />} />

            {/* Fallback */}
            <Route path="*" element={<RootRedirect />} />
          </Route>

        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}