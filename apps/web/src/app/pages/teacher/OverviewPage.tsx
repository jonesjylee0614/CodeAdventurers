import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient, TeacherClassSummary, TeacherCourse } from '../../../services/api/client';

const OverviewPage = () => {
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [pendingWorks, setPendingWorks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  const canLoad = isLoggedIn && user?.role === 'teacher';

  useEffect(() => {
    if (!canLoad) {
      if (!auth.isOpen) {
        openAuthModal('teacher');
      }
      setLoading(false);
      return;
    }

    const loadTeacherData = async () => {
      setLoading(true);
      try {
        const [classesResponse, analyticsResponse, coursesResponse, pendingResponse] = await Promise.all([
          apiClient.getTeacherClasses(),
          apiClient.getTeacherAnalytics(),
          apiClient.getTeacherCourses(),
          apiClient.getTeacherPendingWorks()
        ]);

        setClasses(classesResponse.data?.classes ?? []);
        setAnalytics(analyticsResponse.data ?? null);
        setCourses(coursesResponse.data?.courses ?? []);
        setPendingWorks(pendingResponse.data?.works ?? []);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载教师数据失败');
      } finally {
        setLoading(false);
      }
    };

    loadTeacherData();
  }, [canLoad, auth.isOpen, openAuthModal]);

  const totalStudents = useMemo(
    () => classes.reduce((sum, item) => sum + item.studentCount, 0),
    [classes]
  );
  const averageProgress = useMemo(() => {
    if (!classes.length) return 0;
    const total = classes.reduce((sum, item) => sum + item.averageProgress, 0);
    return Math.round(total / classes.length);
  }, [classes]);
  const activeStudents = useMemo(
    () => classes.reduce((sum, item) => sum + item.activeStudents, 0),
    [classes]
  );

  const strugglingStudents = useMemo(() => {
    const items = analytics?.classes ?? [];
    return items
      .flatMap((entry: any) =>
        entry.students.map((student: any) => ({
          ...student,
          className: entry.className
        }))
      )
      .filter((student: any) => student.completed <= 1)
      .slice(0, 5);
  }, [analytics]);

  if (!canLoad) {
    return (
      <Card title="教师登录" subtitle="请先登录后查看教学概览">
        <EmptyState title="未登录" description="请通过页面右上角的登录入口选择教师账号。" />
      </Card>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Skeleton height={200} />
        <Skeleton height={150} />
        <Skeleton height={200} />
      </div>
    );
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card
        title={`👨‍🏫 欢迎，${user?.name || '教师'}！`}
        subtitle="教学管理控制台 - 实时监控学生学习状况"
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ fontSize: '3rem' }}>📊</div>
          <div>
            <div style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '4px' }}>
              管理 {classes.length} 个班级，{totalStudents} 名学生
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              本周学生累计活跃 {activeStudents} 人次，平均进度 {averageProgress}%
            </div>
          </div>
        </div>
      </Card>

      <Card title="📊 教学概览" subtitle="班级活跃情况与学习成效">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px'
        }}>
          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: '#f0fdf4',
            borderRadius: '12px',
            border: '2px solid #16a34a'
          }}>
            <div style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '8px' }}>📚</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>
              {classes.length}
            </div>
            <div style={{ fontSize: '14px', color: '#15803d', marginBottom: '4px' }}>活跃班级</div>
            <div style={{ fontSize: '12px', color: '#16a34a' }}>实时同步</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: '#dbeafe',
            borderRadius: '12px',
            border: '2px solid #2563eb'
          }}>
            <div style={{ fontSize: '3rem', color: '#2563eb', marginBottom: '8px' }}>👥</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
              {totalStudents}
            </div>
            <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>总学生数</div>
            <div style={{ fontSize: '12px', color: '#2563eb' }}>覆盖全班</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: '#fef3c7',
            borderRadius: '12px',
            border: '2px solid #f59e0b'
          }}>
            <div style={{ fontSize: '3rem', color: '#f59e0b', marginBottom: '8px' }}>🎯</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
              {classes.reduce((sum, item) => sum + item.levelCount, 0)}
            </div>
            <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>关卡覆盖数</div>
            <div style={{ fontSize: '12px', color: '#f59e0b' }}>包含课程章节</div>
          </div>

          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: '#fee2e2',
            borderRadius: '12px',
            border: '2px solid #ef4444'
          }}>
            <div style={{ fontSize: '3rem', color: '#ef4444', marginBottom: '8px' }}>📌</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#991b1b' }}>
              {pendingWorks.length}
            </div>
            <div style={{ fontSize: '14px', color: '#991b1b', marginBottom: '4px' }}>待审核作品</div>
            <div style={{ fontSize: '12px', color: '#ef4444' }}>需教师处理</div>
          </div>
        </div>
      </Card>

      <Card title="🏫 班级活跃度" subtitle="掌握每个班级的实时进度">
        {classes.length === 0 ? (
          <EmptyState title="暂无班级数据" description="创建班级后可在此查看活跃度。" />
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr) auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '16px',
                  background: '#f8fafc',
                  borderRadius: '12px'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{classItem.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>
                    {classItem.studentCount} 名学生 · 邀请码 {classItem.inviteCode}
                  </div>
                </div>
                <Progress value={classItem.averageProgress} label="平均完成度" />
                <Badge tone={classItem.completionRate >= 70 ? 'success' : classItem.completionRate >= 40 ? 'warning' : 'danger'}>
                  活跃 {classItem.activeStudents} 人
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="⚠️ 学习预警" subtitle="优先关注进度落后的学生">
        {strugglingStudents.length === 0 ? (
          <EmptyState title="暂无需要关注的学生" description="所有学生的进度均稳定。" />
        ) : (
          <div style={{ display: 'grid', gap: '12px' }}>
            {strugglingStudents.map((student: any) => (
              <div
                key={student.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #fee2e2',
                  background: '#fef2f2'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#b91c1c' }}>{student.name}</div>
                  <div style={{ fontSize: '13px', color: '#7f1d1d' }}>
                    班级：{student.className} · 已完成 {student.completed} 个关卡
                  </div>
                </div>
                <Badge tone="danger">待辅导</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="📝 待处理事项" subtitle="来自系统的即时提醒">
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '12px' }}>
          <li
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>待审核作品</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>当前有 {pendingWorks.length} 个作品等待审核</div>
            </div>
            <Button variant="secondary">前往作品库</Button>
          </li>
          <li
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '16px',
              background: '#f8fafc',
              borderRadius: '12px'
            }}
          >
            <div>
              <div style={{ fontWeight: 'bold', color: '#0f172a' }}>课程内容</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>已上线 {courses.length} 套课程，保持定期更新</div>
            </div>
            <Button variant="secondary">查看内容库</Button>
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default OverviewPage;
