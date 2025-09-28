import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Table } from '../../../components/ui/Table';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient, TeacherClassDetail } from '../../../services/api/client';

const ClassDetailPage = () => {
  const { classId } = useParams();
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));
  const [detail, setDetail] = useState<TeacherClassDetail | null>(null);
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
    if (!classId) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.getTeacherClassDetail(classId);
        setDetail(response.data ?? null);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载班级详情失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, classId, auth.isOpen, openAuthModal]);

  if (!canLoad) {
    return <EmptyState title="请登录教师账号" description="登录后可查看班级详情" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在获取班级详情" />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  if (!detail) {
    return <EmptyState title="未找到班级" description="请返回班级列表重试" />;
  }

  const assignedCourseIds = new Set(detail.courses.map((course) => course.id));

  return (
    <Card title={detail.class.name} subtitle={`邀请码 ${detail.class.inviteCode} · 学生 ${detail.class.studentCount} 名`}>
      <div style={{ display: 'flex', gap: '12px', marginBottom: '16px', alignItems: 'center' }}>
        <Progress value={detail.class.averageProgress} label="平均完成度" />
        <Badge tone="info">完成率 {detail.class.completionRate}%</Badge>
        <Badge tone="success">关卡 {detail.class.levelCount}</Badge>
      </div>
      <Tabs>
        <TabItem id="members" title="成员">
          <Table columns={['姓名', '完成进度', '累计星星', '最近活跃']}>
            {detail.students.length ? (
              detail.students.map((student) => (
                <tr key={student.id}>
                  <td>{student.name}</td>
                  <td>
                    <Progress
                      value={student.totalLevels ? Math.round((student.completedLevels / student.totalLevels) * 100) : 0}
                      label={`${student.completedLevels}/${student.totalLevels}`}
                    />
                  </td>
                  <td>{student.stars}</td>
                  <td>
                    {student.lastActiveAt
                      ? new Date(student.lastActiveAt).toLocaleString()
                      : '暂无记录'}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4}>
                  <EmptyState title="暂无学生" />
                </td>
              </tr>
            )}
          </Table>
        </TabItem>
        <TabItem id="courses" title="课程与章节">
          {detail.courses.length ? (
            <div style={{ display: 'grid', gap: '16px' }}>
              {detail.courses.map((course) => (
                <section key={course.id} style={{ padding: '16px', background: '#f8fafc', borderRadius: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{course.name}</h4>
                  <p style={{ margin: '0 0 12px 0', color: '#64748b', fontSize: '13px' }}>{course.description}</p>
                  <Table columns={['章节', '关卡数量']}>
                    {course.chapters.map((chapter) => (
                      <tr key={chapter.id}>
                        <td>{chapter.title}</td>
                        <td>{chapter.levels.length}</td>
                      </tr>
                    ))}
                  </Table>
                </section>
              ))}
            </div>
          ) : (
            <EmptyState title="暂无分配课程" description="可在班级列表中为该班级分配课程" />
          )}
        </TabItem>
        <TabItem id="activities" title="活动与作品">
          <section style={{ marginBottom: '16px' }}>
            <h4 style={{ margin: '0 0 8px 0' }}>最近学习活动</h4>
            {detail.recentActivities.length ? (
              <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
                {detail.recentActivities.map((activity) => (
                  <li key={`${activity.studentId}-${activity.completedAt}`}>
                    {new Date(activity.completedAt).toLocaleString()} · {activity.studentName} 完成关卡 {activity.levelId}，获得 {activity.stars} 星
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState title="暂无学习记录" />
            )}
          </section>
          <section>
            <h4 style={{ margin: '0 0 8px 0' }}>待审核作品</h4>
            {detail.pendingWorks.length ? (
              <Table columns={['作品名称', '作者', '状态', '提交时间']}>
                {detail.pendingWorks.map((work) => (
                  <tr key={work.id}>
                    <td>{work.title}</td>
                    <td>{work.ownerId}</td>
                    <td>{work.status === 'pending' ? '待审核' : work.status}</td>
                    <td>{new Date(work.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </Table>
            ) : (
              <EmptyState title="暂无待审核作品" />
            )}
          </section>
        </TabItem>
      </Tabs>
      <footer style={{ marginTop: '16px', fontSize: '12px', color: '#94a3b8' }}>
        已分配课程：{assignedCourseIds.size || '暂无'} · 班级提示次数上限：{detail.class.hintLimit}
      </footer>
    </Card>
  );
};

export default ClassDetailPage;
