import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Select } from '../../../components/ui/Select';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';

const filters = [
  { value: 'all', label: '全部关卡' },
  { value: 'completed', label: '已完成' },
  { value: 'unlocked', label: '可挑战' },
  { value: 'locked', label: '未解锁' },
];

const LevelsPage = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('all');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  
  const { 
    chapters, 
    loading, 
    error, 
    isLoggedIn, 
    loadChapters 
  } = useAppStore();

  // 重定向到登录页面如果未登录
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }
  }, [isLoggedIn, navigate]);

  // 加载章节数据
  useEffect(() => {
    if (isLoggedIn) {
      loadChapters();
    }
  }, [isLoggedIn, loadChapters]);

  // 筛选章节选项
  const chapterOptions = [
    { value: 'all', label: '全部章节' },
    ...chapters.map(chapter => ({
      value: chapter.id,
      label: chapter.title
    }))
  ];

  // 获取筛选后的关卡
  const getFilteredLevels = () => {
    let filteredChapters = selectedChapter === 'all' 
      ? chapters 
      : chapters.filter(chapter => chapter.id === selectedChapter);

    return filteredChapters.flatMap(chapter => 
      chapter.levels
        .filter(level => {
          if (filter === 'all') return true;
          return level.status === filter;
        })
        .map(level => ({
          ...level,
          chapterTitle: chapter.title,
          chapterId: chapter.id
        }))
    );
  };

  // 计算章节进度
  const getChapterProgress = (chapter: any) => {
    const totalLevels = chapter.levels.length;
    const completedLevels = chapter.levels.filter((level: any) => level.status === 'completed').length;
    return totalLevels > 0 ? Math.round((completedLevels / totalLevels) * 100) : 0;
  };

  // 获取关卡状态的显示信息
  const getLevelStatusInfo = (level: any) => {
    switch (level.status) {
      case 'completed':
        return {
          color: '#16a34a',
          bgColor: '#dcfce7',
          icon: '✅',
          text: '已完成',
          badgeTone: 'success' as const
        };
      case 'unlocked':
        return {
          color: '#2563eb',
          bgColor: '#dbeafe',
          icon: '🔓',
          text: '可挑战',
          badgeTone: 'info' as const
        };
      case 'locked':
      default:
        return {
          color: '#64748b',
          bgColor: '#f1f5f9',
          icon: '🔒',
          text: '未解锁',
          badgeTone: 'warning' as const
        };
    }
  };

  const filteredLevels = getFilteredLevels();

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Skeleton height={120} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {[1, 2, 3, 4].map(i => <Skeleton key={i} height={200} />)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card title="加载失败">
          <p style={{ color: '#ef4444' }}>{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 章节概览 */}
      <Card 
        title="🗺️ 编程冒险地图" 
        subtitle="探索不同的编程概念，完成挑战获得星级奖励"
        style={{ 
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          color: 'white'
        }}
      >
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '16px',
          marginTop: '16px'
        }}>
          {chapters.map(chapter => {
            const progress = getChapterProgress(chapter);
            const completedCount = chapter.levels.filter(level => level.status === 'completed').length;
            const totalCount = chapter.levels.length;
            
            return (
              <div 
                key={chapter.id}
                style={{ 
                  background: 'rgba(255,255,255,0.15)',
                  borderRadius: '12px',
                  padding: '16px',
                  backdropFilter: 'blur(10px)'
                }}
              >
                <div style={{ fontSize: '1.2rem', fontWeight: 'bold', marginBottom: '8px' }}>
                  {chapter.title}
                </div>
                <Progress 
                  value={progress} 
                  label={`${completedCount}/${totalCount} 关卡完成`}
                  style={{ marginBottom: '8px' }}
                />
                <div style={{ fontSize: '14px', opacity: 0.9 }}>
                  进度：{progress}%
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 筛选器 */}
      <Card title="筛选与排序" subtitle="按状态或章节查看关卡">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              章节筛选
            </label>
            <Select 
              value={selectedChapter} 
              onChange={(event) => setSelectedChapter(event.target.value)}
            >
              {chapterOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#374151' }}>
              状态筛选
            </label>
            <Select 
              value={filter} 
              onChange={(event) => setFilter(event.target.value)}
            >
              {filters.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>
        </div>
        
        <div style={{ 
          marginTop: '16px', 
          padding: '12px', 
          background: '#f8fafc', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#64748b'
        }}>
          找到 {filteredLevels.length} 个关卡
        </div>
      </Card>

      {/* 关卡列表 */}
      {filteredLevels.length > 0 ? (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '1.25rem' 
        }}>
          {filteredLevels.map((level) => {
            const statusInfo = getLevelStatusInfo(level);
            
            return (
              <Card
                key={level.id}
                style={{ 
                  border: `2px solid ${statusInfo.color}20`,
                  background: `linear-gradient(135deg, ${statusInfo.bgColor} 0%, white 100%)`
                }}
              >
                {/* 关卡头部 */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                      {level.name}
                    </div>
                    <div style={{ fontSize: '14px', color: '#6b7280' }}>
                      {level.chapterTitle}
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>
                    {statusInfo.icon}
                  </div>
                </div>

                {/* 关卡信息 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <Badge tone={statusInfo.badgeTone}>
                    {statusInfo.text}
                  </Badge>
                  
                  {level.status === 'completed' && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span style={{ color: '#f59e0b' }}>
                        {'⭐'.repeat(level.stars || 0)}
                      </span>
                      <span style={{ fontSize: '14px', color: '#6b7280' }}>
                        {level.stars || 0} 星
                      </span>
                    </div>
                  )}
                  
                  {level.bestDifference !== null && level.bestDifference > 0 && (
                    <Badge tone="warning">
                      +{level.bestDifference} 步
                    </Badge>
                  )}
                </div>

                {/* 操作按钮 */}
                <div style={{ display: 'flex', gap: '8px' }}>
                  {level.status === 'locked' ? (
                    <Button variant="secondary" disabled style={{ flex: 1 }}>
                      🔒 未解锁
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="primary"
                        style={{ flex: 1 }}
                        onClick={() => navigate(`/student/levels/${level.id}`)}
                      >
                        {level.status === 'completed' ? '🔄 重新挑战' : '⚡ 开始挑战'}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/student/play/${level.id}`)}
                      >
                        👁️ 预览
                      </Button>
                    </>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <EmptyState 
          title="暂无符合条件的关卡" 
          description="尝试调整筛选条件查看更多关卡"
          actions={
            <Button variant="primary" onClick={() => {
              setFilter('all');
              setSelectedChapter('all');
            }}>
              重置筛选
            </Button>
          }
        />
      )}

      {/* 学习提示 */}
      {chapters.length > 0 && (
        <Card 
          title="💡 学习小贴士" 
          subtitle="编程冒险的小技巧"
          style={{ background: '#fefce8', border: '2px solid #fbbf24' }}
        >
          <ul style={{ margin: 0, paddingLeft: '20px', color: '#92400e' }}>
            <li>按顺序完成关卡可以循序渐进地学习编程概念</li>
            <li>获得3星评价需要用最少的步数完成关卡</li>
            <li>善用提示功能，但使用提示会影响星级评价</li>
            <li>完成章节中的所有关卡可以解锁沙盒创作模式</li>
          </ul>
        </Card>
      )}
    </div>
  );
};

export default LevelsPage;
