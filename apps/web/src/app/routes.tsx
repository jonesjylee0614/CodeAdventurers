import { lazy } from 'react';
import { Navigate, Outlet, useRoutes } from 'react-router-dom';

import { AppShell } from './layouts/AppShell';
import { RoleLayout } from './layouts/RoleLayout';
import { StudentLayout } from './pages/student/StudentLayout';
import { TeacherLayout } from './pages/teacher/TeacherLayout';
import { ParentLayout } from './pages/parent/ParentLayout';
import { AdminLayout } from './pages/admin/AdminLayout';

const StudentHomePage = lazy(() => import('./pages/student/HomePage'));
const StudentLevelsPage = lazy(() => import('./pages/student/LevelsPage'));
const StudentLevelDetailPage = lazy(() => import('./pages/student/LevelDetailPage'));
const StudentPlayPage = lazy(() => import('./pages/student/PlayPage'));
const StudentResultPage = lazy(() => import('./pages/student/ResultPage'));
const StudentAchievementsPage = lazy(() => import('./pages/student/AchievementsPage'));
const StudentSettingsPage = lazy(() => import('./pages/student/SettingsPage'));

const TeacherOverviewPage = lazy(() => import('./pages/teacher/OverviewPage'));
const TeacherClassesPage = lazy(() => import('./pages/teacher/ClassesPage'));
const TeacherClassDetailPage = lazy(() => import('./pages/teacher/ClassDetailPage'));
const TeacherAssignmentsPage = lazy(() => import('./pages/teacher/AssignmentsPage'));
const TeacherContentPage = lazy(() => import('./pages/teacher/ContentPage'));
const TeacherAnalyticsPage = lazy(() => import('./pages/teacher/AnalyticsPage'));

const ParentHomePage = lazy(() => import('./pages/parent/HomePage'));
const ParentProgressPage = lazy(() => import('./pages/parent/ProgressPage'));
const ParentSettingsPage = lazy(() => import('./pages/parent/SettingsPage'));

const AdminOverviewPage = lazy(() => import('./pages/admin/OverviewPage'));
const AdminUsersPage = lazy(() => import('./pages/admin/UsersPage'));
const AdminCurriculumPage = lazy(() => import('./pages/admin/CurriculumPage'));
const AdminOpsPage = lazy(() => import('./pages/admin/OpsPage'));
const AdminSettingsPage = lazy(() => import('./pages/admin/SettingsPage'));

const AuthPlaceholder = lazy(() => import('./pages/shared/AuthPage'));

const NotFoundPage = () => (
  <div role="alert">
    <h1>未找到页面</h1>
    <p>请检查链接或返回主页。</p>
  </div>
);

const StudentRoutes = () => (
  <RoleLayout
    title="学生冒险"
    description="从地图到挑战再到成就收集的一站式体验"
    routes={[
      { to: '/student', label: '首页' },
      { to: '/student/levels', label: '章节地图' },
      { to: '/student/achievements', label: '成就' },
      { to: '/student/settings', label: '设置' },
    ]}
  >
    <StudentLayout>
      <Outlet />
    </StudentLayout>
  </RoleLayout>
);

const TeacherRoutes = () => (
  <RoleLayout
    title="教师指挥台"
    description="班级、作业、内容库与教学分析一体化"
    routes={[
      { to: '/teacher', label: '概览' },
      { to: '/teacher/classes', label: '班级列表' },
      { to: '/teacher/assignments', label: '作业布置' },
      { to: '/teacher/content', label: '内容库' },
      { to: '/teacher/analytics', label: '教学分析' },
    ]}
  >
    <TeacherLayout>
      <Outlet />
    </TeacherLayout>
  </RoleLayout>
);

const ParentRoutes = () => (
  <RoleLayout
    title="家长关怀"
    description="掌握孩子进度、练习记录与家庭设置"
    routes={[
      { to: '/parent', label: '首页' },
      { to: '/parent/progress', label: '进度详情' },
      { to: '/parent/settings', label: '家长设置' },
    ]}
  >
    <ParentLayout>
      <Outlet />
    </ParentLayout>
  </RoleLayout>
);

const AdminRoutes = () => (
  <RoleLayout
    title="管理控制台"
    description="站点治理、课程编排与运营配置"
    routes={[
      { to: '/admin', label: '概览' },
      { to: '/admin/users', label: '用户与角色' },
      { to: '/admin/curriculum', label: '课程大纲' },
      { to: '/admin/ops', label: '运营位' },
      { to: '/admin/settings', label: '站点设置' },
    ]}
  >
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  </RoleLayout>
);

export const AppRoutes = () =>
  useRoutes([
    {
      path: '/',
      element: <AppShell />,
      children: [
        { index: true, element: <Navigate to="/student" replace /> },
        { path: 'auth/*', element: <AuthPlaceholder /> },
        {
          path: 'student',
          element: <StudentRoutes />,
          children: [
            { index: true, element: <StudentHomePage /> },
            { path: 'levels', element: <StudentLevelsPage /> },
            { path: 'levels/:levelId', element: <StudentLevelDetailPage /> },
            { path: 'play/:levelId', element: <StudentPlayPage /> },
            { path: 'result', element: <StudentResultPage /> },
            { path: 'achievements', element: <StudentAchievementsPage /> },
            { path: 'settings', element: <StudentSettingsPage /> },
          ],
        },
        {
          path: 'teacher',
          element: <TeacherRoutes />,
          children: [
            { index: true, element: <TeacherOverviewPage /> },
            { path: 'classes', element: <TeacherClassesPage /> },
            { path: 'classes/:classId', element: <TeacherClassDetailPage /> },
            { path: 'assignments', element: <TeacherAssignmentsPage /> },
            { path: 'content', element: <TeacherContentPage /> },
            { path: 'analytics', element: <TeacherAnalyticsPage /> },
          ],
        },
        {
          path: 'parent',
          element: <ParentRoutes />,
          children: [
            { index: true, element: <ParentHomePage /> },
            { path: 'progress', element: <ParentProgressPage /> },
            { path: 'progress/:childId', element: <ParentProgressPage /> },
            { path: 'settings', element: <ParentSettingsPage /> },
          ],
        },
        {
          path: 'admin',
          element: <AdminRoutes />,
          children: [
            { index: true, element: <AdminOverviewPage /> },
            { path: 'users', element: <AdminUsersPage /> },
            { path: 'curriculum', element: <AdminCurriculumPage /> },
            { path: 'ops', element: <AdminOpsPage /> },
            { path: 'settings', element: <AdminSettingsPage /> },
          ],
        },
      ],
    },
    { path: '*', element: <NotFoundPage /> },
  ]);
