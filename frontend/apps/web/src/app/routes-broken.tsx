import { Suspense, useEffect } from 'react';
import { Navigate, Outlet, Routes, Route, useLocation } from 'react-router-dom';

import { AppShell } from './layouts/AppShell';
import { RoleLayout } from './layouts/RoleLayout';
import { StudentLayout } from './pages/student/StudentLayout';
import { TeacherLayout } from './pages/teacher/TeacherLayout';
import { ParentLayout } from './pages/parent/ParentLayout';
import { AdminLayout } from './pages/admin/AdminLayout';
import { Skeleton } from '../components/ui/Skeleton';

// 临时禁用懒加载以排查问题
import StudentHomePage from './pages/student/HomePage';
import StudentLevelsPage from './pages/student/LevelsPage';
import StudentLevelDetailPage from './pages/student/LevelDetailPage';
import StudentPlayPage from './pages/student/PlayPage';
import StudentResultPage from './pages/student/ResultPage';
import StudentAchievementsPage from './pages/student/AchievementsPage';
import StudentSettingsPage from './pages/student/SettingsPage';

import TeacherOverviewPage from './pages/teacher/OverviewPage';
import TeacherClassesPage from './pages/teacher/ClassesPage';
import TeacherClassDetailPage from './pages/teacher/ClassDetailPage';
import TeacherAssignmentsPage from './pages/teacher/AssignmentsPage';
import TeacherContentPage from './pages/teacher/ContentPage';
import TeacherAnalyticsPage from './pages/teacher/AnalyticsPage';

import ParentHomePage from './pages/parent/HomePage';
import ParentProgressPage from './pages/parent/ProgressPage';
import ParentSettingsPage from './pages/parent/SettingsPage';

import AdminOverviewPage from './pages/admin/OverviewPage';
import AdminUsersPage from './pages/admin/UsersPage';
import AdminCurriculumPage from './pages/admin/CurriculumPage';
import AdminOpsPage from './pages/admin/OpsPage';
import AdminSettingsPage from './pages/admin/SettingsPage';

import AuthPlaceholder from './pages/shared/AuthPage';

const LoadingFallback = () => (
  <div style={{ padding: '2rem' }}>
    <Skeleton height={200} />
    <div style={{ marginTop: '1rem' }}>
      <Skeleton height={150} />
    </div>
  </div>
);

const NotFoundPage = () => (
  <div role="alert" style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>404 - 未找到页面</h1>
    <p>请检查链接或返回主页。</p>
  </div>
);

// 学生端路由包装器
const StudentRouteWrapper = () => {
  const location = useLocation();
  
  useEffect(() => {
    console.log('[StudentRouteWrapper] 路由变化:', location.pathname);
  }, [location]);
  
  return (
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
};

// 教师端路由包装器
const TeacherRouteWrapper = () => (
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
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </TeacherLayout>
  </RoleLayout>
);

// 家长端路由包装器
const ParentRouteWrapper = () => (
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
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </ParentLayout>
  </RoleLayout>
);

// 管理端路由包装器
const AdminRouteWrapper = () => (
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
      <Suspense fallback={<LoadingFallback />}>
        <Outlet />
      </Suspense>
    </AdminLayout>
  </RoleLayout>
);

export const AppRoutes = () => {
  const location = useLocation();
  
  console.log('[AppRoutes] 路由组件渲染');
  
  useEffect(() => {
    console.log('[AppRoutes] 路由变化:', location.pathname);
  }, [location]);
  
  return (
    <Routes>
      <Route path="/" element={<AppShell><Outlet /></AppShell>}>
        <Route index element={<Navigate to="/student" replace />} />
        
        <Route path="auth/*" element={<AuthPlaceholder />} />
        
        {/* 学生端路由 */}
        <Route path="student" element={<StudentRouteWrapper />}>
          <Route index element={<StudentHomePage />} />
          <Route path="levels" element={<StudentLevelsPage />} />
          <Route path="levels/:levelId" element={<StudentLevelDetailPage />} />
          <Route path="play/:levelId" element={<StudentPlayPage />} />
          <Route path="result" element={<StudentResultPage />} />
          <Route path="achievements" element={<StudentAchievementsPage />} />
          <Route path="settings" element={<StudentSettingsPage />} />
        </Route>
        
        {/* 教师端路由 */}
        <Route path="teacher" element={<TeacherRouteWrapper />}>
          <Route index element={<TeacherOverviewPage />} />
          <Route path="classes" element={<TeacherClassesPage />} />
          <Route path="classes/:classId" element={<TeacherClassDetailPage />} />
          <Route path="assignments" element={<TeacherAssignmentsPage />} />
          <Route path="content" element={<TeacherContentPage />} />
          <Route path="analytics" element={<TeacherAnalyticsPage />} />
        </Route>
        
        {/* 家长端路由 */}
        <Route path="parent" element={<ParentRouteWrapper />}>
          <Route index element={<ParentHomePage />} />
          <Route path="progress" element={<ParentProgressPage />} />
          <Route path="progress/:childId" element={<ParentProgressPage />} />
          <Route path="settings" element={<ParentSettingsPage />} />
        </Route>
        
        {/* 管理端路由 */}
        <Route path="admin" element={<AdminRouteWrapper />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="curriculum" element={<AdminCurriculumPage />} />
          <Route path="ops" element={<AdminOpsPage />} />
          <Route path="settings" element={<AdminSettingsPage />} />
        </Route>
        
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};

export default AppRoutes;
