import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { StudentProfile } from '../../../services/api/client';

// 成就定义
const ACHIEVEMENTS = [
  { 
    id: 'first-win', 
    name: '初来乍到', 
    description: '完成第一个关卡', 
    icon: '🎯',
    requirement: (profile: StudentProfile) => 
      Object.keys(profile.progress).length > 0
  },
  { 
    id: 'perfect-score', 
    name: '完美主义者', 
    description: '在一个关卡中获得3星', 
    icon: '⭐',
    requirement: (profile: StudentProfile) => 
      Object.values(profile.progress).some(record => record.stars === 3)
  },
  { 
    id: 'speed-runner', 
    name: '速度之星', 
    description: '在30秒内完成关卡', 
    icon: '⚡',
    requirement: (profile: StudentProfile) => 
      Object.values(profile.progress).some(record => record.duration <= 30)
  },
  { 
    id: 'persistent', 
    name: '坚持不懈', 
    description: '完成5个关卡', 
    icon: '🏆',
    requirement: (profile: StudentProfile) => 
      Object.keys(profile.progress).length >= 5
  },
  { 
    id: 'explorer', 
    name: '探索者', 
    description: '完成10个关卡', 
    icon: '🗺️',
    requirement: (profile: StudentProfile) => 
      Object.keys(profile.progress).length >= 10
  },
  { 
    id: 'star-collector', 
    name: '星星收集者', 
    description: '收集50颗星星', 
    icon: '🌟',
    requirement: (profile: StudentProfile) => 
      Object.values(profile.progress).reduce((sum, record) => sum + record.stars, 0) >= 50
  },
];

// 装扮定义
const OUTFITS = [
  { 
    id: 'starter-cape', 
    name: '新手斗篷', 
    rarity: 'common', 
    icon: '🧥',
    description: '每个冒险者的起点',
    unlockCondition: '默认装备'
  },
  { 
    id: 'wizard-hat', 
    name: '智慧法帽', 
    rarity: 'rare', 
    icon: '🎩',
    description: '智者的象征',
    unlockCondition: '完成5个关卡'
  },
  { 
    id: 'dragon-armor', 
    name: '龙鳞护甲', 
    rarity: 'epic', 
    icon: '🛡️',
    description: '传说中的护甲',
    unlockCondition: '获得30颗星星'
  },
  { 
    id: 'golden-crown', 
    name: '黄金王冠', 
    rarity: 'legendary', 
    icon: '👑',
    description: '编程大师的荣耀',
    unlockCondition: '完成所有关卡'
  },
];

const AchievementsPage = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'outfits' | 'stats'>('achievements');
  
  const { 
    user, 
    chapters,
    loading, 
    error, 
    isLoggedIn, 
    loadStudentData,
    loadChapters
  } = useAppStore();
  
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);

  // 重定向到登录页面如果未登录
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
    }
  }, [isLoggedIn, navigate]);

  // 加载数据
  useEffect(() => {
    if (isLoggedIn && user?.role === 'student') {
      loadStudentData();
      loadChapters();
    }
  }, [isLoggedIn, user, loadStudentData, loadChapters]);

  // 处理用户数据
  useEffect(() => {
    if (user && user.role === 'student') {
      setStudentProfile(user as StudentProfile);
    }
  }, [user]);

  // 计算统计数据
  const getStats = () => {
    if (!studentProfile) return { completedLevels: 0, totalStars: 0, totalTime: 0, streak: 0 };
    
    const completedLevels = Object.keys(studentProfile.progress).length;
    const totalStars = Object.values(studentProfile.progress).reduce((sum, record) => sum + record.stars, 0);
    const totalTime = Object.values(studentProfile.progress).reduce((sum, record) => sum + (record.duration || 0), 0);
    const streak = Math.floor(Math.random() * 7) + 1; // 模拟连续天数
    
    return { completedLevels, totalStars, totalTime, streak };
  };

  // 计算等级和经验
  const getLevelInfo = () => {
    const stats = getStats();
    const level = Math.floor(stats.totalStars / 10) + 1;
    const currentExp = stats.totalStars % 10;
    const maxExp = 10;
    return { level, currentExp, maxExp, progress: (currentExp / maxExp) * 100 };
  };

  // 检查成就是否解锁
  const isAchievementUnlocked = (achievement: any) => {
    return studentProfile ? achievement.requirement(studentProfile) : false;
  };

  // 检查装扮是否解锁
  const isOutfitUnlocked = (outfit: any) => {
    if (!studentProfile) return false;
    return studentProfile.avatar.unlocked.includes(outfit.id);
  };

  // 获取装扮稀有度颜色
  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' };
      case 'rare': return { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' };
      case 'epic': return { bg: '#fef3c7', border: '#d97706', text: '#92400e' };
      case 'legendary': return { bg: '#fce7f3', border: '#be185d', text: '#9d174d' };
      default: return { bg: '#f8fafc', border: '#64748b', text: '#475569' };
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Skeleton height={200} />
        <Skeleton height={300} />
      </div>
    );
  }

  if (error) {
    return (
      <Card title="加载失败">
        <p style={{ color: '#ef4444' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </Card>
    );
  }

  const stats = getStats();
  const levelInfo = getLevelInfo();

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 角色展示卡片 */}
      <Card 
        title={`🧑‍💻 ${studentProfile?.name || '冒险者'}`} 
        subtitle="你的编程冒险档案"
        style={{ 
          background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white'
        }}
      >
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ 
            fontSize: '4rem',
            background: 'rgba(255,255,255,0.1)',
            borderRadius: '50%',
            padding: '20px',
            backdropFilter: 'blur(10px)'
          }}>
            {studentProfile?.avatar.equipped === 'starter-cape' ? '🧑‍💻' : 
             studentProfile?.avatar.equipped === 'wizard-hat' ? '🧙‍♂️' :
             studentProfile?.avatar.equipped === 'dragon-armor' ? '🛡️' : '👑'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px' }}>
              等级 {levelInfo.level} 编程冒险者
            </div>
            <div style={{ fontSize: '16px', opacity: 0.9, marginBottom: '12px' }}>
              经验值: {levelInfo.currentExp}/{levelInfo.maxExp}
            </div>
            <Progress 
              value={levelInfo.progress} 
              label={`升级进度 ${levelInfo.progress.toFixed(0)}%`}
              style={{ marginBottom: '12px' }}
            />
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <Badge tone="success" style={{ background: 'rgba(255,255,255,0.2)' }}>
                🏆 {stats.completedLevels} 关卡完成
              </Badge>
              <Badge tone="warning" style={{ background: 'rgba(255,255,255,0.2)' }}>
                ⭐ {stats.totalStars} 颗星星
              </Badge>
              <Badge tone="info" style={{ background: 'rgba(255,255,255,0.2)' }}>
                🔥 连续 {stats.streak} 天学习
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 标签切换 */}
      <Card>
        <div style={{ 
          display: 'flex', 
          gap: '8px',
          borderBottom: '1px solid #e5e7eb',
          marginBottom: '20px'
        }}>
          {[
            { id: 'achievements', label: '🏆 成就徽章', icon: '🏆' },
            { id: 'outfits', label: '👔 装扮收集', icon: '👔' },
            { id: 'stats', label: '📊 学习统计', icon: '📊' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              style={{
                padding: '12px 20px',
                border: 'none',
                borderBottom: selectedTab === tab.id ? '2px solid #6366f1' : '2px solid transparent',
                background: 'none',
                color: selectedTab === tab.id ? '#6366f1' : '#6b7280',
                fontSize: '16px',
                fontWeight: selectedTab === tab.id ? 'bold' : 'normal',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 成就徽章 */}
        {selectedTab === 'achievements' && (
          <div>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>解锁成就 {ACHIEVEMENTS.filter(achievement => isAchievementUnlocked(achievement)).length}/{ACHIEVEMENTS.length}</h3>
              <Progress 
                value={(ACHIEVEMENTS.filter(achievement => isAchievementUnlocked(achievement)).length / ACHIEVEMENTS.length) * 100}
                label="成就完成度"
              />
            </div>

            {ACHIEVEMENTS.length > 0 ? (
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '16px' 
              }}>
                {ACHIEVEMENTS.map((achievement) => {
                  const unlocked = isAchievementUnlocked(achievement);
                  
                  return (
                    <div
                      key={achievement.id}
                      style={{
                        padding: '20px',
                        border: unlocked ? '2px solid #16a34a' : '2px solid #e5e7eb',
                        borderRadius: '12px',
                        textAlign: 'center',
                        background: unlocked ? '#f0fdf4' : '#f9fafb',
                        opacity: unlocked ? 1 : 0.6,
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <div style={{ 
                        fontSize: '3rem', 
                        marginBottom: '12px',
                        filter: unlocked ? 'none' : 'grayscale(1)'
                      }}>
                        {unlocked ? achievement.icon : '🔒'}
                      </div>
                      <h3 style={{ 
                        margin: '0 0 8px 0', 
                        fontSize: '18px',
                        color: unlocked ? '#16a34a' : '#6b7280'
                      }}>
                        {achievement.name}
                      </h3>
                      <p style={{ 
                        margin: 0, 
                        fontSize: '14px', 
                        color: '#6b7280',
                        lineHeight: '1.4'
                      }}>
                        {achievement.description}
                      </p>
                      {unlocked && (
                        <Badge tone="success" style={{ marginTop: '12px' }}>
                          ✅ 已解锁
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <EmptyState 
                title="暂无成就" 
                description="完成更多关卡来解锁成就吧！"
              />
            )}
          </div>
        )}

        {/* 装扮收集 */}
        {selectedTab === 'outfits' && (
          <div>
            <div style={{ marginBottom: '20px', textAlign: 'center' }}>
              <h3 style={{ color: '#374151', marginBottom: '8px' }}>
                收集装扮 {OUTFITS.filter(outfit => isOutfitUnlocked(outfit)).length}/{OUTFITS.length}
              </h3>
              <div style={{ fontSize: '14px', color: '#6b7280' }}>
                当前装备: {OUTFITS.find(outfit => outfit.id === studentProfile?.avatar.equipped)?.name || '未知'}
              </div>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px' 
            }}>
              {OUTFITS.map((outfit) => {
                const unlocked = isOutfitUnlocked(outfit);
                const equipped = studentProfile?.avatar.equipped === outfit.id;
                const rarityStyle = getRarityColor(outfit.rarity);
                
                return (
                  <div
                    key={outfit.id}
                    style={{
                      padding: '20px',
                      border: equipped ? `3px solid ${rarityStyle.border}` : 
                             unlocked ? `2px solid ${rarityStyle.border}` : '2px solid #e5e7eb',
                      borderRadius: '12px',
                      textAlign: 'center',
                      background: equipped ? rarityStyle.bg : unlocked ? rarityStyle.bg : '#f9fafb',
                      opacity: unlocked ? 1 : 0.5,
                      cursor: unlocked ? 'pointer' : 'default',
                      transition: 'all 0.3s ease',
                      position: 'relative'
                    }}
                  >
                    {equipped && (
                      <div style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '-10px',
                        background: '#16a34a',
                        color: 'white',
                        borderRadius: '50%',
                        width: '24px',
                        height: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px'
                      }}>
                        ✓
                      </div>
                    )}
                    
                    <div style={{ 
                      fontSize: '3rem', 
                      marginBottom: '12px',
                      filter: unlocked ? 'none' : 'grayscale(1)'
                    }}>
                      {unlocked ? outfit.icon : '🔒'}
                    </div>
                    
                    <h3 style={{ 
                      margin: '0 0 4px 0', 
                      fontSize: '16px',
                      color: unlocked ? rarityStyle.text : '#6b7280'
                    }}>
                      {outfit.name}
                    </h3>
                    
                    <Badge 
                      tone={
                        outfit.rarity === 'legendary' ? 'warning' :
                        outfit.rarity === 'epic' ? 'warning' :
                        outfit.rarity === 'rare' ? 'info' : 'success'
                      }
                      style={{ marginBottom: '8px' }}
                    >
                      {outfit.rarity}
                    </Badge>
                    
                    <p style={{ 
                      margin: '8px 0', 
                      fontSize: '12px', 
                      color: '#6b7280',
                      lineHeight: '1.3'
                    }}>
                      {outfit.description}
                    </p>
                    
                    <div style={{ fontSize: '11px', color: '#9ca3af' }}>
                      解锁条件: {outfit.unlockCondition}
                    </div>
                    
                    {equipped && (
                      <div style={{ 
                        marginTop: '8px', 
                        fontSize: '12px', 
                        color: '#16a34a',
                        fontWeight: 'bold'
                      }}>
                        已装备
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 学习统计 */}
        {selectedTab === 'stats' && (
          <div>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div style={{ 
                textAlign: 'center', 
                padding: '24px', 
                background: '#fef3c7', 
                borderRadius: '12px',
                border: '2px solid #f59e0b'
              }}>
                <div style={{ fontSize: '3rem', color: '#d97706', marginBottom: '8px' }}>🎯</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#92400e' }}>
                  {stats.completedLevels}
                </div>
                <div style={{ fontSize: '14px', color: '#92400e' }}>关卡完成</div>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '24px', 
                background: '#dbeafe', 
                borderRadius: '12px',
                border: '2px solid #3b82f6'
              }}>
                <div style={{ fontSize: '3rem', color: '#2563eb', marginBottom: '8px' }}>⭐</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#1e40af' }}>
                  {stats.totalStars}
                </div>
                <div style={{ fontSize: '14px', color: '#1e40af' }}>获得星星</div>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '24px', 
                background: '#dcfce7', 
                borderRadius: '12px',
                border: '2px solid #16a34a'
              }}>
                <div style={{ fontSize: '3rem', color: '#16a34a', marginBottom: '8px' }}>🔥</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#15803d' }}>
                  {stats.streak}
                </div>
                <div style={{ fontSize: '14px', color: '#15803d' }}>连续学习天数</div>
              </div>
              
              <div style={{ 
                textAlign: 'center', 
                padding: '24px', 
                background: '#fce7f3', 
                borderRadius: '12px',
                border: '2px solid #ec4899'
              }}>
                <div style={{ fontSize: '3rem', color: '#be185d', marginBottom: '8px' }}>⏱️</div>
                <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#9d174d' }}>
                  {Math.floor(stats.totalTime / 60)}m
                </div>
                <div style={{ fontSize: '14px', color: '#9d174d' }}>总学习时长</div>
              </div>
            </div>

            {/* 详细统计 */}
            <Card title="📈 详细分析" subtitle="深入了解你的学习表现">
              <div style={{ display: 'grid', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151' }}>平均每关用时</span>
                  <span style={{ fontWeight: 'bold', color: '#6366f1' }}>
                    {stats.completedLevels > 0 ? Math.round(stats.totalTime / stats.completedLevels) : 0}秒
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151' }}>平均星级</span>
                  <span style={{ fontWeight: 'bold', color: '#f59e0b' }}>
                    {stats.completedLevels > 0 ? (stats.totalStars / stats.completedLevels).toFixed(1) : 0} ⭐
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151' }}>3星关卡数</span>
                  <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
                    {studentProfile ? 
                      Object.values(studentProfile.progress).filter(record => record.stars === 3).length 
                      : 0}
                  </span>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#374151' }}>解锁成就</span>
                  <span style={{ fontWeight: 'bold', color: '#8b5cf6' }}>
                    {ACHIEVEMENTS.filter(achievement => isAchievementUnlocked(achievement)).length}/{ACHIEVEMENTS.length}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AchievementsPage;
