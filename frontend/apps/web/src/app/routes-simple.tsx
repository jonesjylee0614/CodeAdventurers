/**
 * 简化版路由配置 - 确保导航功能正常工作
 * 移除所有复杂的嵌套，使用最简单直接的结构
 */

import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

import { AppShell } from './layouts/AppShell';
import { Skeleton } from '../components/ui/Skeleton';

// 学生端页面 - 使用懒加载
const StudentHomePage = lazy(() => import('./pages/student/HomePage'));
const StudentLevelsPage = lazy(() => import('./pages/student/LevelsPage'));
const StudentLevelDetailPage = lazy(() => import('./pages/student/LevelDetailPage'));
const StudentPlayPage = lazy(() => import('./pages/student/PlayPage'));
const StudentResultPage = lazy(() => import('./pages/student/ResultPage'));
const StudentAchievementsPage = lazy(() => import('./pages/student/AchievementsPage'));
const StudentSettingsPage = lazy(() => import('./pages/student/SettingsPage'));

// 教师端页面
const TeacherOverviewPage = lazy(() => import('./pages/teacher/OverviewPage'));
const TeacherClassesPage = lazy(() => import('./pages/teacher/ClassesPage'));
const TeacherClassDetailPage = lazy(() => import('./pages/teacher/ClassDetailPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/teacher/AssignmentsPage'));
const TeacherContentPage = lazy(() => import('./pages/teacher/ContentPage'));
const TeacherAnalyticsPage = lazy(() => import('./pages/teacher/AnalyticsPage'));

// 家长端页面
const ParentHomePage = lazy(() => import('./pages/parent/HomePage'));
const ParentProgressPage = lazy(() => import('./pages/parent/ProgressPage'));
const ParentSettingsPage = lazy(() => import('./pages/parent/SettingsPage'));

// 管理端页面
const AdminOverviewPage = lazy(() => import('./pages/admin/OverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminCurriculumPage = lazy(() => import('./pages/admin/CurriculumPage'));
const AdminOpsPage = lazy(() => import('./pages/admin/OpsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

// Auth页面
const AuthPlaceholder = lazy(() => import('./pages/shared/AuthPage'));

// Loading组件
const PageLoader = () => (
  <div style={{ padding: '2rem' }}>
    <Skeleton height={200} />
    <div style={{ marginTop: '1rem' }}>
      <Skeleton height={150} />
    </div>
  </div>
);

// 404页面
const NotFound = () => (
  <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>404 - 页面未找到</h1>
    <p>请检查链接或返回主页</p>
  </div>
);

/**
 * 主路由组件
 * 使用最简单的Routes和Route结构，避免复杂嵌套
 */
export const AppRoutes = () => {
  console.log('[AppRoutes-Simple] 渲染');
  
  return (
    <AppShell>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* 根路径重定向到学生端 */}
          <Route path="/" element={<Navigate to="/student" replace />} />
          
          {/* Auth路由 */}
          <Route path="/auth/*" element={<AuthPlaceholder />} />
          
          {/* 学生端路由 - 平铺结构，不嵌套 */}
          <Route path="/student" element={<StudentHomePage />} />
          <Route path="/student/levels" element={<StudentLevelsPage />} />
          <Route path="/student/levels/:levelId" element={<StudentLevelDetailPage />} />
          <Route path="/student/play/:levelId" element={<StudentPlayPage />} />
          <Route path="/student/result" element={<StudentResultPage />} />
          <Route path="/student/achievements" element={<StudentAchievementsPage />} />
          <Route path="/student/settings" element={<StudentSettingsPage />} />
          
          {/* 教师端路由 */}
          <Route path="/teacher" element={<TeacherOverviewPage />} />
          <Route path="/teacher/classes" element={<TeacherClassesPage />} />
          <Route path="/teacher/classes/:classId" element={<TeacherClassDetailPage />} />
          <Route path="/teacher/assignments" element={<TeacherAssignmentsPage />} />
          <Route path="/teacher/content" element={<TeacherContentPage />} />
          <Route path="/teacher/analytics" element={<TeacherAnalyticsPage />} />
          
          {/* 家长端路由 */}
          <Route path="/parent" element={<ParentHomePage />} />
          <Route path="/parent/progress" element={<ParentProgressPage />} />
          <Route path="/parent/progress/:childId" element={<ParentProgressPage />} />
          <Route path="/parent/settings" element={<ParentSettingsPage />} />
          
          {/* 管理端路由 */}
          <Route path="/admin" element={<AdminOverviewPage />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/curriculum" element={<AdminCurriculumPage />} />
          <Route path="/admin/ops" element={<AdminOpsPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />
          
          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

export default AppRoutes;
