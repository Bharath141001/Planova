import { Routes, Route, Navigate } from 'react-router-dom';
import { useInitAuth } from '@/hooks/useAuth';
import { ProtectedRoute } from './ProtectedRoute';
import { AppLayout } from '@/components/layout/AppLayout';

import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { ForgotPasswordPage } from '@/pages/auth/ForgotPasswordPage';
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { ProjectListPage } from '@/pages/projects/ProjectListPage';
import { ProjectCreatePage } from '@/pages/projects/ProjectCreatePage';
import { BoardPage } from '@/pages/board/BoardPage';
import { BacklogPage } from '@/pages/backlog/BacklogPage';
import { RoadmapPage } from '@/pages/roadmap/RoadmapPage';
import { ReportsPage } from '@/pages/reports/ReportsPage';
import { IssueDetailPage } from '@/pages/issue/IssueDetailPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';
import { ProjectSettingsPage } from '@/pages/admin/ProjectSettingsPage';
import { CalendarPage } from '@/pages/calendar/CalendarPage';

export function AppRouter() {
  useInitAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<DashboardPage />} />
        <Route path="/projects" element={<ProjectListPage />} />
        <Route path="/projects/new" element={<ProjectCreatePage />} />
        <Route path="/projects/:projectKey/board" element={<BoardPage />} />
        <Route path="/projects/:projectKey/backlog" element={<BacklogPage />} />
        <Route path="/projects/:projectKey/roadmap" element={<RoadmapPage />} />
        <Route path="/projects/:projectKey/calendar" element={<CalendarPage />} />
        <Route path="/projects/:projectKey/reports" element={<ReportsPage />} />
        <Route path="/projects/:projectKey/settings" element={<ProjectSettingsPage />} />
        <Route path="/issues/:issueKey" element={<IssueDetailPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
