import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AppLayout } from './layouts/AppLayout';
import { seedInitialDatabase } from './services/seedService';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

// Lazy-loaded Pages for instant bundle splitting & fast navigation
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const EmployeeHome = lazy(() => import('./pages/EmployeeHome').then(m => ({ default: m.EmployeeHome })));
const AdminDashboard = lazy(() => import('./pages/AdminDashboard').then(m => ({ default: m.AdminDashboard })));
const Directory = lazy(() => import('./pages/Directory').then(m => ({ default: m.Directory })));
const Profile360 = lazy(() => import('./pages/Profile360').then(m => ({ default: m.Profile360 })));
const AttendancePage = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const LeavePage = lazy(() => import('./pages/LeavePage').then(m => ({ default: m.LeavePage })));
const ProjectsPage = lazy(() => import('./pages/ProjectsPage').then(m => ({ default: m.ProjectsPage })));
const RecognitionPage = lazy(() => import('./pages/RecognitionPage').then(m => ({ default: m.RecognitionPage })));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const WorkforceAnalyticsPage = lazy(() => import('./pages/WorkforceAnalyticsPage').then(m => ({ default: m.WorkforceAnalyticsPage })));
const DomainAnalyticsPage = lazy(() => import('./pages/DomainAnalyticsPage').then(m => ({ default: m.DomainAnalyticsPage })));
const ProjectAnalyticsPage = lazy(() => import('./pages/ProjectAnalyticsPage').then(m => ({ default: m.ProjectAnalyticsPage })));
const ActivityPage = lazy(() => import('./pages/ActivityPage').then(m => ({ default: m.ActivityPage })));
const SecurityAuditPage = lazy(() => import('./pages/SecurityAuditPage').then(m => ({ default: m.SecurityAuditPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })));

// Protected Route Guard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
        <div className="w-8 h-8 rounded-full border-2 border-[#047857] border-t-transparent animate-spin" />
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
      <div className="p-8 max-w-xl mx-auto my-12 bg-white border border-[#E7E3D8] rounded-3xl text-center space-y-4 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA] flex items-center justify-center mx-auto">
          <ShieldAlert size={28} />
        </div>

        <h2 className="text-xl font-bold text-[#0B2E2E] font-display">
          403 Forbidden: Administrator Access Required
        </h2>

        <p className="text-xs text-[#656966] leading-relaxed">
          Your current session role (
          <code className="font-bold text-[#222525]">{role}</code>)
          does not possess executive privileges to inspect this administrative console.
        </p>

        <div className="pt-2">
          <a
            href="/home"
            className="inline-flex items-center space-x-2 px-4 py-2 text-xs font-bold rounded-xl bg-[#047857] text-white hover:bg-[#065F46] transition-colors shadow-xs"
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
          <Route
            path="/login"
            element={
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-[#F8F6F1]">
                    <div className="w-8 h-8 rounded-full border-2 border-[#047857] border-t-transparent animate-spin" />
                  </div>
                }
              >
                <Login />
              </Suspense>
            }
          />

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