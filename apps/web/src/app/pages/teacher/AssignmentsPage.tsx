import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import {
  apiClient,
  TeacherClassSummary,
  TeacherCourse
} from '../../../services/api/client';

interface AssignmentRow {
  classId: string;
  className: string;
  courseId: string;
  courseName: string;
  chapterCount: number;
  hintLimit: number;
}

const AssignmentsPage = () => {
  const navigate = useNavigate();
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [showPlanModal, setShowPlanModal] = useState(false);

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
        const [classesResponse, coursesResponse] = await Promise.all([
          apiClient.getTeacherClasses(),
          apiClient.getTeacherCourses()
        ]);
        setClasses(classesResponse.data?.classes ?? []);
        setCourses(coursesResponse.data?.courses ?? []);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载作业数据失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, auth.isOpen, openAuthModal]);

  const assignments = useMemo<AssignmentRow[]>(() => {
    return classes.flatMap((classSummary) =>
      classSummary.courses.map((course) => ({
        classId: classSummary.id,
        className: classSummary.name,
        courseId: course.id,
        courseName: course.name,
        chapterCount: course.chapterCount,
        hintLimit: classSummary.hintLimit
      }))
    );
  }, [classes]);

  const assignedCourseIds = useMemo(() => new Set(assignments.map((item) => item.courseId)), [assignments]);
  const unassignedCourses = useMemo(
    () => courses.filter((course) => !assignedCourseIds.has(course.id)),
    [courses, assignedCourseIds]
  );

  if (!canLoad) {
    return <EmptyState title="请登录教师账号" description="登录后可管理作业布置" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在获取作业信息" />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  return (
    <Card title="作业布置" subtitle="查看已布置课程并安排后续学习计划">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div>
          已布置课程 {assignments.length} 条 · 可用课程 {courses.length} 套
        </div>
        <Button onClick={() => setShowPlanModal(true)}>制定学习计划</Button>
      </div>
      <Table columns={['班级', '课程', '章节数', '提示上限', '操作']} emptyState={<EmptyState title="暂无布置" />}>
        {assignments.length ? (
          assignments.map((assignment) => (
            <tr key={`${assignment.classId}-${assignment.courseId}`}>
              <td>{assignment.className}</td>
              <td>{assignment.courseName}</td>
              <td>{assignment.chapterCount}</td>
              <td>{assignment.hintLimit}</td>
              <td>
                <Button variant="ghost" onClick={() => navigate(`/teacher/classes/${assignment.classId}`)}>
                  查看班级
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={5}>
              <EmptyState title="尚未分配课程" description="可前往班级列表选择课程" />
            </td>
          </tr>
        )}
      </Table>

      <section style={{ marginTop: '24px' }}>
        <h3 style={{ margin: '0 0 12px 0' }}>待布置课程</h3>
        {unassignedCourses.length ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {unassignedCourses.map((course) => (
              <div
                key={course.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '16px',
                  borderRadius: '12px',
                  background: '#f8fafc'
                }}
              >
                <div>
                  <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{course.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{course.chapters.length} 个章节</div>
                </div>
                <Button variant="secondary" onClick={() => navigate('/teacher/classes')}>
                  去分配
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="所有课程均已布置" />
        )}
      </section>

      <Modal
        title="制定学习计划"
        open={showPlanModal}
        onClose={() => setShowPlanModal(false)}
        primaryAction={{ label: '确认', onClick: () => setShowPlanModal(false) }}
        secondaryAction={{ label: '取消', onClick: () => setShowPlanModal(false) }}
      >
        <p style={{ color: '#475569', fontSize: '14px' }}>
          建议按照章节难度分批布置课程，结合班级提示上限以及学生完成度进行调整。可在班级详情中设置提示次数限制。
        </p>
      </Modal>
    </Card>
  );
};

export default AssignmentsPage;
