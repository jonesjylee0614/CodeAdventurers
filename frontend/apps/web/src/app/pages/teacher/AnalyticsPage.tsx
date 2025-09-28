import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Table } from '../../../components/ui/Table';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient } from '../../../services/api/client';

interface AnalyticsClassEntry {
  classId: string;
  className: string;
  students: Array<{ id: string; name: string; completed: number }>;
}

interface HeatmapEntry {
  studentId: string;
  entries: Array<{ levelId: string; stars: number; duration: number }>;
}

const AnalyticsPage = () => {
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [analytics, setAnalytics] = useState<AnalyticsClassEntry[]>([]);
  const [heatmap, setHeatmap] = useState<HeatmapEntry[]>([]);
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

    const load = async () => {
      setLoading(true);
      try {
        const [analyticsResponse, heatmapResponse] = await Promise.all([
          apiClient.getTeacherAnalytics(),
          apiClient.getTeacherHeatmap()
        ]);
        setAnalytics(analyticsResponse.data?.classes ?? []);
        setHeatmap(heatmapResponse.data?.heatmap ?? []);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载分析数据失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, auth.isOpen, openAuthModal]);

  const classRanking = useMemo(() => {
    return analytics
      .map((entry) => ({
        classId: entry.classId,
        className: entry.className,
        completions: entry.students.reduce((sum, student) => sum + student.completed, 0),
        studentCount: entry.students.length
      }))
      .sort((a, b) => b.completions - a.completions)
      .slice(0, 5);
  }, [analytics]);

  const topStudents = useMemo(() => {
    return analytics
      .flatMap((entry) =>
        entry.students.map((student) => ({
          ...student,
          className: entry.className
        }))
      )
      .sort((a, b) => b.completed - a.completed)
      .slice(0, 8);
  }, [analytics]);

  if (!canLoad) {
    return <EmptyState title="请登录教师账号" description="登录后可查看教学分析" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在汇总学习数据" />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card title="班级完成度排行榜" subtitle="按完成关卡总数排序">
        {classRanking.length ? (
          <Table columns={['班级', '学生数', '完成总数', '平均完成度']}>
            {classRanking.map((item) => (
              <tr key={item.classId}>
                <td>{item.className}</td>
                <td>{item.studentCount}</td>
                <td>{item.completions}</td>
                <td>
                  <Progress
                    value={item.studentCount ? Math.round((item.completions / item.studentCount) * 10) : 0}
                    label="关卡/人"
                  />
                </td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="暂无班级数据" />
        )}
      </Card>

      <Card title="学生表现" subtitle="按完成关卡数排序的前 8 名">
        {topStudents.length ? (
          <Table columns={['学生', '所属班级', '已完成关卡']}>
            {topStudents.map((student) => (
              <tr key={student.id}>
                <td>{student.name}</td>
                <td>{student.className}</td>
                <td>{student.completed}</td>
              </tr>
            ))}
          </Table>
        ) : (
          <EmptyState title="暂无学生数据" />
        )}
      </Card>

      <Card title="学习热力图" subtitle="展示每位学生的关卡完成情况">
        {heatmap.length ? (
          <div style={{ overflowX: 'auto' }}>
            <Table columns={['学生', '关卡数', '平均用时', '平均星级']}>
              {heatmap.map((entry) => {
                const total = entry.entries.length || 1;
                const totalDuration = entry.entries.reduce((sum, item) => sum + item.duration, 0);
                const totalStars = entry.entries.reduce((sum, item) => sum + item.stars, 0);
                return (
                  <tr key={entry.studentId}>
                    <td>{entry.studentId}</td>
                    <td>{entry.entries.length}</td>
                    <td>{Math.round(totalDuration / total)} 秒</td>
                    <td>
                      <Badge tone={totalStars / total >= 2 ? 'success' : 'warning'}>
                        平均 {Math.round((totalStars / total) * 10) / 10} 星
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </Table>
          </div>
        ) : (
          <EmptyState title="暂无热力图数据" />
        )}
      </Card>
    </div>
  );
};

export default AnalyticsPage;
