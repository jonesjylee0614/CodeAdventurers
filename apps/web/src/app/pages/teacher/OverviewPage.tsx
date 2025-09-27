import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient } from '../../../services/api/client';

const OverviewPage = () => {
  const navigate = useNavigate();
  const [teacherData, setTeacherData] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const { isLoggedIn, user } = useAppStore();

  // 重定向到登录页面如果未登录或不是教师
  useEffect(() => {
    if (!isLoggedIn || user?.role !== 'teacher') {
      navigate('/auth?mode=teacher');
      return;
    }
  }, [isLoggedIn, user, navigate]);

  // 加载教师数据
  useEffect(() => {
    if (isLoggedIn && user?.role === 'teacher') {
      loadTeacherData();
    }
  }, [isLoggedIn, user]);

  const loadTeacherData = async () => {
    try {
      const [analyticsResponse, coursesResponse] = await Promise.all([
        apiClient.getTeacherAnalytics(),
        apiClient.getTeacherCourses()
      ]);

      setAnalytics(analyticsResponse.data);
      setTeacherData(coursesResponse.data);
    } catch (error) {
      console.error('加载教师数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟数据
  const mockStats = {
    activeClasses: 3,
    totalStudents: 45,
    completedLevels: 167,
    averageScore: 85,
    trends: {
      classes: '+1 本月',
      students: '+8 本月',
      levels: '+23 本周',
      score: '+5% 提升'
    }
  };

  const mockConcepts = [
    { name: '顺序结构', mastery: 92, studentCount: 41, difficulty: 'easy' },
    { name: '循环结构', mastery: 78, studentCount: 35, difficulty: 'medium' },
    { name: '条件判断', mastery: 65, studentCount: 29, difficulty: 'medium' },
    { name: '变量使用', mastery: 45, studentCount: 20, difficulty: 'hard' },
  ];

  const mockAlerts = [
    { student: '小明', issue: '循环结构卡关超过3天', priority: 'high', days: 3 },
    { student: '小红', issue: '条件判断理解困难', priority: 'medium', days: 2 },
    { student: '小刚', issue: '已3天未参与学习', priority: 'high', days: 3 },
  ];

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Skeleton height={200} />
        <Skeleton height={150} />
        <Skeleton height={200} />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 欢迎卡片 */}
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
              管理 {mockStats.activeClasses} 个班级，{mockStats.totalStudents} 名学生
            </div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>
              本周学生完成了 {mockStats.completedLevels} 个关卡挑战
            </div>
          </div>
        </div>
      </Card>

      {/* 统计概览 */}
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
              {mockStats.activeClasses}
            </div>
            <div style={{ fontSize: '14px', color: '#15803d', marginBottom: '4px' }}>活跃班级</div>
            <div style={{ fontSize: '12px', color: '#16a34a' }}>{mockStats.trends.classes}</div>
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
              {mockStats.totalStudents}
            </div>
            <div style={{ fontSize: '14px', color: '#1e40af', marginBottom: '4px' }}>总学生数</div>
            <div style={{ fontSize: '12px', color: '#2563eb' }}>{mockStats.trends.students}</div>
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
              {mockStats.completedLevels}
            </div>
            <div style={{ fontSize: '14px', color: '#92400e', marginBottom: '4px' }}>完成关卡</div>
            <div style={{ fontSize: '12px', color: '#f59e0b' }}>{mockStats.trends.levels}</div>
          </div>
          
          <div style={{
            textAlign: 'center',
            padding: '24px',
            background: '#fce7f3',
            borderRadius: '12px',
            border: '2px solid #ec4899'
          }}>
            <div style={{ fontSize: '3rem', color: '#ec4899', marginBottom: '8px' }}>📈</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9d174d' }}>
              {mockStats.averageScore}%
            </div>
            <div style={{ fontSize: '14px', color: '#9d174d', marginBottom: '4px' }}>平均分数</div>
            <div style={{ fontSize: '12px', color: '#ec4899' }}>{mockStats.trends.score}</div>
          </div>
        </div>
      </Card>

      {/* 学习概念掌握度 */}
      <Card title="📈 概念掌握热力图" subtitle="学生在不同编程概念上的掌握程度">
        <div style={{ display: 'grid', gap: '16px' }}>
          {mockConcepts.map((concept) => (
            <div key={concept.name} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '12px',
              background: '#f8fafc',
              borderRadius: '8px',
              border: '1px solid #e2e8f0'
            }}>
              <div style={{ flex: 1, marginRight: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: 'bold', color: '#374151' }}>{concept.name}</span>
                  <Badge tone={
                    concept.difficulty === 'easy' ? 'success' :
                    concept.difficulty === 'medium' ? 'warning' : 'danger'
                  }>
                    {concept.difficulty === 'easy' ? '简单' :
                     concept.difficulty === 'medium' ? '中等' : '困难'}
                  </Badge>
                </div>
                <Progress 
                  value={concept.mastery} 
                  label={`${concept.studentCount}/${mockStats.totalStudents} 名学生掌握`}
                />
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#6366f1' }}>
                  {concept.mastery}%
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <Button 
            variant="primary"
            onClick={() => navigate('/teacher/analytics')}
          >
            查看详细分析
          </Button>
        </div>
      </Card>

      {/* 需要关注的学生 */}
      <Card title="⚠️ 需要关注的学生" subtitle="学习进度较慢或遇到困难的学生">
        {mockAlerts.length > 0 ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            {mockAlerts.map((alert, index) => (
              <div 
                key={index}
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  background: alert.priority === 'high' ? '#fef2f2' : '#fefce8',
                  borderRadius: '8px',
                  border: `2px solid ${alert.priority === 'high' ? '#dc2626' : '#f59e0b'}`
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.2rem' }}>
                    {alert.priority === 'high' ? '🚨' : '⚠️'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#374151' }}>
                      {alert.student}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {alert.issue}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge tone={alert.priority === 'high' ? 'danger' : 'warning'}>
                    {alert.days}天前
                  </Badge>
                  <Button variant="ghost" size="sm">
                    查看详情
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState title="暂无需要关注的学生" description="所有学生学习状况良好" />
        )}
        
        <div style={{ 
          marginTop: '20px', 
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'center' 
        }}>
          <Button variant="primary">
            📝 生成个性化辅导计划
          </Button>
          <Button variant="secondary">
            📧 发送家长通知
          </Button>
        </div>
      </Card>

      {/* 快捷操作 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
        gap: '16px' 
      }}>
        <Card 
          title="📚 课程管理" 
          subtitle="创建和编辑课程内容"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/teacher/content')}
        />
        
        <Card 
          title="👥 班级管理" 
          subtitle="管理学生和班级设置"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/teacher/classes')}
        />
        
        <Card 
          title="📊 教学分析" 
          subtitle="深入的学习数据分析"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/teacher/analytics')}
        />
        
        <Card 
          title="📋 作业布置" 
          subtitle="为学生布置练习作业"
          style={{ cursor: 'pointer' }}
          onClick={() => navigate('/teacher/assignments')}
        />
      </div>
    </div>
  );
};

export default OverviewPage;
