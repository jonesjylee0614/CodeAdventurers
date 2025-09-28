import { useEffect, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient, TeacherCourse } from '../../../services/api/client';

const ContentPage = () => {
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [selectedCourse, setSelectedCourse] = useState<TeacherCourse | null>(null);

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
        const response = await apiClient.getTeacherCourses();
        setCourses(response.data?.courses ?? []);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载内容库失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, auth.isOpen, openAuthModal]);

  if (!canLoad) {
    return <EmptyState title="请登录教师账号" description="登录后可查看内容库" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在获取课程内容" />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  return (
    <Card title="内容库" subtitle="课程、章节与关卡预览">
      <Table columns={['课程名称', '章节数', '关卡数量', '操作']} emptyState={<EmptyState title="暂无课程" />}>
        {courses.length ? (
          courses.map((course) => {
            const levelCount = course.chapters.reduce((sum, chapter) => sum + chapter.levels.length, 0);
            return (
              <tr key={course.id}>
                <td>{course.name}</td>
                <td>{course.chapters.length}</td>
                <td>{levelCount}</td>
                <td>
                  <Button variant="ghost" onClick={() => setSelectedCourse(course)}>
                    查看详情
                  </Button>
                </td>
              </tr>
            );
          })
        ) : (
          <tr>
            <td colSpan={4}>
              <EmptyState title="暂无课程" />
            </td>
          </tr>
        )}
      </Table>

      <Drawer
        title={selectedCourse ? `${selectedCourse.name} · ${selectedCourse.chapters.length} 个章节` : '课程详情'}
        open={Boolean(selectedCourse)}
        onClose={() => setSelectedCourse(null)}
      >
        {selectedCourse ? (
          <div style={{ display: 'grid', gap: '16px' }}>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>{selectedCourse.description || '暂无描述'}</p>
            {selectedCourse.chapters.map((chapter) => (
              <section key={chapter.id} style={{ background: '#f8fafc', borderRadius: '12px', padding: '16px' }}>
                <h4 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>{chapter.title}</h4>
                <Table columns={['关卡名称', '最佳步数', '奖励']}>
                  {chapter.levels.map((level) => (
                    <tr key={level.id}>
                      <td>{level.name}</td>
                      <td>{level.bestSteps}</td>
                      <td>{level.rewards?.outfit ? `解锁 ${level.rewards.outfit}` : `${level.rewards?.stars ?? 0} 星`}</td>
                    </tr>
                  ))}
                </Table>
              </section>
            ))}
          </div>
        ) : (
          <EmptyState title="未选择课程" />
        )}
      </Drawer>
    </Card>
  );
};

export default ContentPage;
