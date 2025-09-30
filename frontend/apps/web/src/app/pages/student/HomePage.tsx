import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAppStore } from '../../../store/useAppStore';
import { StudentProfile } from '../../../services/api/client';

const HomePage = () => {
  const navigate = useNavigate();
  const {
    user,
    chapters,
    loading,
    error,
    loadStudentData,
    loadChapters,
    isLoggedIn,
    openAuthModal,
  } = useAppStore((state) => ({
    user: state.user,
    chapters: state.chapters,
    loading: state.loading,
    error: state.error,
    loadStudentData: state.loadStudentData,
    loadChapters: state.loadChapters,
    isLoggedIn: state.isLoggedIn,
    openAuthModal: state.openAuthModal,
  }));
  
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [recentLevels, setRecentLevels] = useState<any[]>([]);

  // 调试日志 - 查看状态
  useEffect(() => {
    console.log('=== [HomePage] 状态调试 ===');
    console.log('[HomePage] isLoggedIn:', isLoggedIn);
    console.log('[HomePage] user:', user);
    console.log('[HomePage] chapters:', chapters);
    console.log('[HomePage] loading:', loading);
    console.log('[HomePage] error:', error);
    console.log('[HomePage] studentProfile:', studentProfile);
    console.log('[HomePage] recentLevels:', recentLevels);
    console.log('========================');
  }, [isLoggedIn, user, chapters, loading, error, studentProfile, recentLevels]);

  // 重定向到登录页面如果未登录
  useEffect(() => {
    if (!isLoggedIn) {
      console.log('[HomePage] 用户未登录，打开登录窗口');
      openAuthModal('student');
    }
  }, [isLoggedIn, openAuthModal]);

  // 加载学生数据
  useEffect(() => {
    if (isLoggedIn && user?.role === 'student') {
      loadStudentData();
      loadChapters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.role]);

  // 处理用户数据
  useEffect(() => {
    if (user && user.role === 'student') {
      setStudentProfile(user as StudentProfile);
    }
  }, [user]);

  // 计算最近完成的关卡
  useEffect(() => {
    if (!studentProfile || chapters.length === 0) return;

    const completedLevels = chapters
      .flatMap(chapter => chapter.levels)
      .filter(level => level.status === 'completed')
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 5);
      
    setRecentLevels(completedLevels);
  }, [studentProfile, chapters]);

  // 计算整体进度
  const calculateProgress = () => {
    if (chapters.length === 0) return 0;
    
    const totalLevels = chapters.reduce((sum, chapter) => sum + chapter.levels.length, 0);
    const completedLevels = chapters.reduce(
      (sum, chapter) => sum + chapter.levels.filter(level => level.status === 'completed').length, 
      0
    );
    
    return totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
  };

  // 找到下一个可挑战的关卡
  const getNextLevel = () => {
    for (const chapter of chapters) {
      const nextLevel = chapter.levels.find(level => level.status === 'unlocked' || level.status === 'completed');
      if (nextLevel) {
        return { chapter: chapter.id, level: nextLevel.id, name: nextLevel.name };
      }
    }
    return null;
  };

  // 计算连续学习天数（模拟）
  const getStreakDays = () => {
    // 这里可以根据实际的学习记录计算
    return Math.floor(Math.random() * 7) + 1;
  };

  // 计算本周完成的关卡数
  const getWeeklyCompleted = () => {
    return recentLevels.length;
  };

  if (loading) {
    return (
      <div className="student-home" style={{ display: 'grid', gap: '1.5rem' }}>
        <Skeleton height={200} />
        <Skeleton height={150} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="student-home" style={{ display: 'grid', gap: '1.5rem' }}>
        <Card title="加载失败">
          <p style={{ color: '#ef4444' }}>{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </Card>
      </div>
    );
  }

  const nextLevel = getNextLevel();
  const progress = calculateProgress();
  const streakDays = getStreakDays();
  const weeklyCompleted = getWeeklyCompleted();

  return (
    <div className="student-home" style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 欢迎卡片 */}
      <Card
        title={`欢迎回来，${studentProfile?.name || '冒险者'}！`}
        subtitle="准备好继续你的编程冒险之旅吗？"
        style={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
          <div style={{ fontSize: '3rem' }}>
            {studentProfile?.avatar.equipped === 'starter-cape' ? '🧑‍💻' : '👑'}
          </div>
          <div>
            <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '4px' }}>
              等级 {Math.floor(weeklyCompleted / 3) + 1}
            </div>
            <div style={{ opacity: 0.9 }}>
              已完成 {weeklyCompleted} 个关卡
            </div>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <Badge tone="success" style={{ background: 'rgba(255,255,255,0.2)' }}>
            🔥 连续学习 {streakDays} 天
          </Badge>
          <Badge tone="info" style={{ background: 'rgba(255,255,255,0.2)' }}>
            🏆 本周进度 {progress}%
          </Badge>
          {studentProfile?.sandboxUnlocked && (
            <Badge tone="warning" style={{ background: 'rgba(255,255,255,0.2)' }}>
              🛠️ 沙盒已解锁
            </Badge>
          )}
        </div>
      </Card>

      {/* 继续挑战 */}
      <Card
        title="继续挑战"
        subtitle="从上次停下的地方继续你的冒险"
        actions={
          nextLevel ? (
            <Button 
              variant="primary"
              onClick={(e) => {
                console.log('[HomePage] 进入关卡按钮被点击');
                console.log('[HomePage] 下一关卡:', nextLevel);
                console.log('[HomePage] 准备导航到:', `/student/levels/${nextLevel.level}`);
                navigate(`/student/levels/${nextLevel.level}`);
              }}
            >
              进入关卡
            </Button>
          ) : (
            <Button variant="secondary" disabled>
              已完成所有关卡
            </Button>
          )
        }
      >
        <Progress value={progress} label={`整体进度 ${progress}%`} />
        
        {nextLevel ? (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f8fafc', 
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{ fontSize: '1.5rem' }}>🎯</div>
            <div>
              <div style={{ fontWeight: 'bold', color: '#374151' }}>
                下一关：{nextLevel.name}
              </div>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                准备挑战新的编程概念
              </div>
            </div>
          </div>
        ) : (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            background: '#f0fdf4', 
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🎉</div>
            <div style={{ fontWeight: 'bold', color: '#16a34a' }}>
              恭喜！你已完成所有关卡
            </div>
          </div>
        )}
      </Card>

      {/* 最近挑战记录 */}
      <Card title="最近的挑战" subtitle="回顾你的编程成就">
        {recentLevels.length ? (
          <ul style={{ 
            margin: 0, 
            padding: 0, 
            listStyle: 'none', 
            display: 'grid', 
            gap: '12px' 
          }}>
            {recentLevels.map((level) => (
              <li 
                key={level.id} 
                style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  padding: '12px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '1.2rem' }}>
                    {level.status === 'completed' ? '✅' : '🔓'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 'bold', color: '#374151' }}>
                      {level.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {level.status === 'completed' ? '已完成' : '可挑战'}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ color: '#f59e0b' }}>
                    {'⭐'.repeat(level.stars)}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      console.log('[HomePage] 关卡按钮被点击');
                      console.log('[HomePage] 关卡ID:', level.id);
                      console.log('[HomePage] 准备导航到:', `/student/levels/${level.id}`);
                      navigate(`/student/levels/${level.id}`);
                    }}
                  >
                    {level.status === 'completed' ? '回顾' : '挑战'}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState 
            title="还没有闯关记录" 
            description="开始你的第一个编程挑战吧！"
            actions={
              <Button 
                variant="primary"
                onClick={(e) => {
                  console.log('[HomePage] 查看关卡地图按钮被点击');
                  console.log('[HomePage] 准备导航到: /student/levels');
                  navigate('/student/levels');
                }}
              >
                查看关卡地图
              </Button>
            }
          />
        )}
      </Card>

      {/* 快捷入口 */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem' 
      }}>
        <Card title="🗺️ 关卡地图" subtitle="查看所有可用关卡">
          <Button 
            variant="primary" 
            style={{ width: '100%' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[HomePage] 关卡地图按钮被点击');
              console.log('[HomePage] 事件对象:', e);
              console.log('[HomePage] 准备导航到: /student/levels');
              console.log('[HomePage] navigate函数:', navigate);
              
              try {
                navigate('/student/levels');
                console.log('[HomePage] navigate调用成功');
              } catch (error) {
                console.error('[HomePage] navigate调用失败:', error);
              }
            }}
          >
            查看地图
          </Button>
        </Card>
        
        <Card title="🏆 成就收集" subtitle="查看获得的徽章和装扮">
          <Button 
            variant="primary" 
            style={{ width: '100%' }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('[HomePage] 成就收集按钮被点击');
              console.log('[HomePage] 事件对象:', e);
              console.log('[HomePage] 准备导航到: /student/achievements');
              
              try {
                navigate('/student/achievements');
                console.log('[HomePage] navigate调用成功');
              } catch (error) {
                console.error('[HomePage] navigate调用失败:', error);
              }
            }}
          >
            查看成就
          </Button>
        </Card>
        
        {studentProfile?.sandboxUnlocked && (
          <Card title="🛠️ 创作沙盒" subtitle="创建你自己的关卡">
            <Button 
              variant="primary" 
              style={{ width: '100%' }}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('[HomePage] 创作沙盒按钮被点击');
                console.log('[HomePage] 事件对象:', e);
                console.log('[HomePage] 准备导航到: /student/sandbox');
                
                try {
                  navigate('/student/sandbox');
                  console.log('[HomePage] navigate调用成功');
                } catch (error) {
                  console.error('[HomePage] navigate调用失败:', error);
                }
              }}
            >
              进入沙盒
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default HomePage;
