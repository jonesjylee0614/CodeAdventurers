import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { useAppStore } from '../../../store/useAppStore';
import {
  apiClient,
  TeacherClassSummary,
  TeacherClassDetail,
  TeacherCourse
} from '../../../services/api/client';

const ClassesPage = () => {
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [classes, setClasses] = useState<TeacherClassSummary[]>([]);
  const [courses, setCourses] = useState<TeacherCourse[]>([]);
  const [keyword, setKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [selectedDetail, setSelectedDetail] = useState<TeacherClassDetail | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [hintLimitInput, setHintLimitInput] = useState<number | ''>('');
  const [actionLoading, setActionLoading] = useState(false);

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
        setErrorMessage(error instanceof Error ? error.message : '加载班级列表失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, auth.isOpen, openAuthModal]);

  const filteredClasses = useMemo(() => {
    if (!keyword.trim()) {
      return classes;
    }
    const lowerKeyword = keyword.trim().toLowerCase();
    return classes.filter((item) => item.name.toLowerCase().includes(lowerKeyword));
  }, [classes, keyword]);

  const handleOpenDrawer = async (classId: string) => {
    setSelectedClassId(classId);
    setDrawerLoading(true);
    try {
      const detailResponse = await apiClient.getTeacherClassDetail(classId);
      if (detailResponse.data) {
        setSelectedDetail(detailResponse.data);
        setHintLimitInput(detailResponse.data.class.hintLimit);
      }
    } catch (error) {
      setSelectedDetail(null);
    } finally {
      setDrawerLoading(false);
    }
  };

  const refreshClasses = async () => {
    const listResponse = await apiClient.getTeacherClasses();
    setClasses(listResponse.data?.classes ?? []);
  };

  const handleHintLimitSave = async () => {
    if (!selectedClassId || typeof hintLimitInput !== 'number') {
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.updateClassHintLimit(selectedClassId, hintLimitInput);
      await Promise.all([handleOpenDrawer(selectedClassId), refreshClasses()]);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignCourse = async (courseId: string) => {
    if (!selectedClassId) {
      return;
    }
    setActionLoading(true);
    try {
      await apiClient.assignCourseToClass(selectedClassId, courseId);
      await Promise.all([handleOpenDrawer(selectedClassId), refreshClasses()]);
    } finally {
      setActionLoading(false);
    }
  };

  if (!canLoad) {
    return <EmptyState title="请登录教师账号" description="登录后可管理班级与课程" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在获取班级数据..." />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  return (
    <Card title="班级列表" subtitle="查看班级概况并管理教学设置">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Input
          placeholder="搜索班级"
          value={keyword}
          onChange={(event) => setKeyword(event.target.value)}
        />
        <Button variant="secondary" onClick={() => setKeyword('')}>
          清空
        </Button>
      </div>
      <Table
        columns={[
          '班级名称',
          '学生数',
          '平均进度',
          '活跃人数',
          '提示上限',
          '操作'
        ]}
        emptyState={<EmptyState title="暂无班级" />}
      >
        {filteredClasses.length ? (
          filteredClasses.map((item) => (
            <tr key={item.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{item.name}</span>
                  <Badge tone="info">邀请码 {item.inviteCode}</Badge>
                </div>
              </td>
              <td>{item.studentCount}</td>
              <td>
                <Progress value={item.averageProgress} label={`${item.averageProgress}%`} />
              </td>
              <td>{item.activeStudents}</td>
              <td>{item.hintLimit}</td>
              <td>
                <Button variant="ghost" onClick={() => handleOpenDrawer(item.id)}>
                  查看详情
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6}>
              <EmptyState title="未找到班级" description="调整关键字后重试" />
            </td>
          </tr>
        )}
      </Table>

      <Drawer title="班级详情" open={Boolean(selectedClassId)} onClose={() => setSelectedClassId(null)}>
        {drawerLoading ? (
          <EmptyState title="加载中" description="正在获取班级详情" />
        ) : selectedDetail ? (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            <section>
              <h3 style={{ margin: '0 0 8px 0' }}>{selectedDetail.class.name}</h3>
              <p style={{ margin: '0 0 4px 0', color: '#475569' }}>
                学生 {selectedDetail.class.studentCount} 名 · 关卡总数 {selectedDetail.class.levelCount}
              </p>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <Progress value={selectedDetail.class.averageProgress} label="平均完成度" />
                <Badge tone="info">完成率 {selectedDetail.class.completionRate}%</Badge>
              </div>
            </section>

            <section>
              <h4 style={{ margin: '0 0 8px 0' }}>提示次数上限</h4>
              <div style={{ display: 'flex', gap: '8px' }}>
                <Input
                  type="number"
                  min={1}
                  value={hintLimitInput}
                  onChange={(event) => setHintLimitInput(Number(event.target.value))}
                  style={{ width: '120px' }}
                />
                <Button variant="primary" loading={actionLoading} onClick={handleHintLimitSave}>
                  保存
                </Button>
              </div>
            </section>

            <section>
              <h4 style={{ margin: '0 0 8px 0' }}>学生列表</h4>
              <Table columns={['姓名', '完成关卡', '累计星星', '最近活跃']}>
                {selectedDetail.students.length ? (
                  selectedDetail.students.map((student) => (
                    <tr key={student.id}>
                      <td>{student.name}</td>
                      <td>
                        {student.completedLevels}/{student.totalLevels}
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
            </section>

            <section>
              <h4 style={{ margin: '0 0 8px 0' }}>课程与章节</h4>
              <div style={{ display: 'grid', gap: '12px' }}>
                {courses.map((course) => {
                  const assigned = selectedDetail.courses.some((item) => item.id === course.id);
                  return (
                    <div
                      key={course.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '12px',
                        borderRadius: '10px',
                        background: '#f8fafc'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{course.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          {course.chapters.length} 个章节
                        </div>
                      </div>
                      {assigned ? (
                        <Badge tone="success">已分配</Badge>
                      ) : (
                        <Button
                          variant="secondary"
                          loading={actionLoading}
                          onClick={() => handleAssignCourse(course.id)}
                        >
                          分配到班级
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>

            <section>
              <h4 style={{ margin: '0 0 8px 0' }}>近期活动</h4>
              {selectedDetail.recentActivities.length ? (
                <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
                  {selectedDetail.recentActivities.map((activity) => (
                    <li key={`${activity.studentId}-${activity.completedAt}`}>
                      {new Date(activity.completedAt).toLocaleString()} · {activity.studentName} 完成关卡 {activity.levelId}，获得 {activity.stars} 星
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState title="暂无活动" description="等待学生完成新挑战" />
              )}
            </section>
          </div>
        ) : (
          <EmptyState title="未选择班级" />
        )}
      </Drawer>
    </Card>
  );
};

export default ClassesPage;
