import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Skeleton } from '../../../components/ui/Skeleton';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { StudentProfile, apiClient } from '../../../services/api/client';

const ACHIEVEMENTS = [
  {
    id: 'first-win',
    name: '初来乍到',
    description: '完成第一个关卡',
    icon: '🎯',
    requirement: (profile: StudentProfile) => Object.keys(profile.progress).length > 0
  },
  {
    id: 'perfect-score',
    name: '完美主义者',
    description: '在一个关卡中获得3星',
    icon: '⭐',
    requirement: (profile: StudentProfile) => Object.values(profile.progress).some(record => record.stars === 3)
  },
  {
    id: 'speed-runner',
    name: '速度之星',
    description: '在30秒内完成关卡',
    icon: '⚡',
    requirement: (profile: StudentProfile) => Object.values(profile.progress).some(record => record.duration <= 30)
  },
  {
    id: 'persistent',
    name: '坚持不懈',
    description: '完成5个关卡',
    icon: '🏆',
    requirement: (profile: StudentProfile) => Object.keys(profile.progress).length >= 5
  },
  {
    id: 'explorer',
    name: '探索者',
    description: '完成10个关卡',
    icon: '🗺️',
    requirement: (profile: StudentProfile) => Object.keys(profile.progress).length >= 10
  },
  {
    id: 'star-collector',
    name: '星星收集者',
    description: '收集50颗星星',
    icon: '🌟',
    requirement: (profile: StudentProfile) => Object.values(profile.progress).reduce((sum, record) => sum + record.stars, 0) >= 50
  }
];

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
  }
];

const dayInMs = 1000 * 60 * 60 * 24;

const calculateStreak = (progress: StudentProfile['progress']) => {
  const completions = Object.values(progress)
    .map(record => new Date(record.completedAt ?? 0))
    .filter(date => !Number.isNaN(date.getTime()))
    .map(date => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime())
    .sort((a, b) => b - a);

  if (completions.length === 0) {
    return 0;
  }

  const uniqueDays = Array.from(new Set(completions));
  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const firstDiff = Math.round((todayStart - uniqueDays[0]) / dayInMs);

  if (firstDiff > 1) {
    return 0;
  }

  let streak = 1;
  let previousDay = uniqueDays[0];

  for (let i = 1; i < uniqueDays.length; i += 1) {
    const diff = Math.round((previousDay - uniqueDays[i]) / dayInMs);
    if (diff === 1) {
      streak += 1;
      previousDay = uniqueDays[i];
    } else if (diff > 1) {
      break;
    }
  }

  return streak;
};

const getRarityColor = (rarity: string) => {
  switch (rarity) {
    case 'common':
      return { bg: '#f0fdf4', border: '#16a34a', text: '#15803d' };
    case 'rare':
      return { bg: '#dbeafe', border: '#2563eb', text: '#1e40af' };
    case 'epic':
      return { bg: '#fef3c7', border: '#d97706', text: '#92400e' };
    case 'legendary':
      return { bg: '#fce7f3', border: '#be185d', text: '#9d174d' };
    default:
      return { bg: '#f8fafc', border: '#64748b', text: '#475569' };
  }
};

const AchievementsPage = () => {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'outfits' | 'stats'>('achievements');
  const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
  const [equipping, setEquipping] = useState<string | null>(null);

  const {
    user,
    chapters,
    loading,
    error,
    isLoggedIn,
    loadStudentData,
    loadChapters,
    openAuthModal,
  } = useAppStore((state) => ({
    user: state.user,
    chapters: state.chapters,
    loading: state.loading,
    error: state.error,
    isLoggedIn: state.isLoggedIn,
    loadStudentData: state.loadStudentData,
    loadChapters: state.loadChapters,
    openAuthModal: state.openAuthModal,
  }));

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('student');
    }
  }, [isLoggedIn, openAuthModal]);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'student') {
      loadStudentData();
      loadChapters();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, user?.role]);

  useEffect(() => {
    if (user && user.role === 'student') {
      setStudentProfile(user as StudentProfile);
    }
  }, [user]);

  const stats = useMemo(() => {
    if (!studentProfile) {
      return { completedLevels: 0, totalStars: 0, totalTime: 0, streak: 0 };
    }
    const completedLevels = Object.keys(studentProfile.progress).length;
    const totalStars = Object.values(studentProfile.progress).reduce((sum, record) => sum + record.stars, 0);
    const totalTime = Object.values(studentProfile.progress).reduce((sum, record) => sum + (record.duration || 0), 0);
    const streak = calculateStreak(studentProfile.progress);
    return { completedLevels, totalStars, totalTime, streak };
  }, [studentProfile]);

  const levelInfo = useMemo(() => {
    const level = Math.floor(stats.totalStars / 10) + 1;
    const currentExp = stats.totalStars % 10;
    const maxExp = 10;
    return { level, currentExp, maxExp, progress: (currentExp / maxExp) * 100 };
  }, [stats.totalStars]);

  const isAchievementUnlocked = (achievement: typeof ACHIEVEMENTS[number]) => {
    return studentProfile ? achievement.requirement(studentProfile) : false;
  };

  const isOutfitUnlocked = (outfitId: string) => {
    if (!studentProfile) {
      return false;
    }
    return studentProfile.avatar.unlocked.includes(outfitId);
  };

  const handleEquipOutfit = async (outfitId: string) => {
    if (!studentProfile || studentProfile.avatar.equipped === outfitId) {
      return;
    }
    setEquipping(outfitId);
    try {
      const response = await apiClient.updateStudentAvatar(outfitId);
      if (response.error) {
        throw new Error(response.error);
      }
      if (response.data) {
        setStudentProfile({
          ...studentProfile,
          avatar: response.data
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setEquipping(null);
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

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card
        title={`🧑‍💻 ${studentProfile?.name || '冒险者'}`}
        subtitle="追踪你的通关记录、星星与装扮收集"
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
            {OUTFITS.find(outfit => outfit.id === studentProfile?.avatar.equipped)?.icon ?? '🧑‍🚀'}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>等级</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>Lv.{levelInfo.level}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>累计星星</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.totalStars}</div>
              </div>
              <div>
                <div style={{ fontSize: '14px', opacity: 0.8 }}>连续练习</div>
                <div style={{ fontSize: '32px', fontWeight: 'bold' }}>{stats.streak} 天</div>
              </div>
            </div>
            <div style={{ marginTop: '12px', background: 'rgba(255,255,255,0.15)', padding: '12px', borderRadius: '12px' }}>
              <div style={{ fontSize: '14px', marginBottom: '4px' }}>距离下一等级还需 {levelInfo.maxExp - levelInfo.currentExp} 星</div>
              <Progress value={levelInfo.progress} />
            </div>
          </div>
        </div>
      </Card>

      <Card
        title="🥇 成就进度"
        subtitle="根据通关表现解锁徽章"
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button size="sm" variant={selectedTab === 'achievements' ? 'primary' : 'secondary'} onClick={() => setSelectedTab('achievements')}>
              成就
            </Button>
            <Button size="sm" variant={selectedTab === 'outfits' ? 'primary' : 'secondary'} onClick={() => setSelectedTab('outfits')}>
              装扮
            </Button>
            <Button size="sm" variant={selectedTab === 'stats' ? 'primary' : 'secondary'} onClick={() => setSelectedTab('stats')}>
              数据
            </Button>
          </div>
        }
      >
        {selectedTab === 'achievements' && (
          <div style={{ display: 'grid', gap: '12px' }}>
            {ACHIEVEMENTS.map(achievement => {
              const unlocked = isAchievementUnlocked(achievement);
              return (
                <Card key={achievement.id} style={{ border: `2px solid ${unlocked ? '#22c55e' : '#e2e8f0'}` }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '2rem' }}>{achievement.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1f2937' }}>{achievement.name}</div>
                      <div style={{ fontSize: '14px', color: '#64748b' }}>{achievement.description}</div>
                    </div>
                    <Badge tone={unlocked ? 'success' : 'warning'}>{unlocked ? '已解锁' : '未完成'}</Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        )}

        {selectedTab === 'outfits' && (
          chapters.length === 0 ? (
            <EmptyState
              title="暂未解锁新装扮"
              description="完成更多关卡、收集星星即可解锁限定外观"
              actions={<Button variant="primary" onClick={() => navigate('/student/levels')}>前往挑战</Button>}
            />
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {OUTFITS.map(outfit => {
                const unlocked = isOutfitUnlocked(outfit.id);
                const isEquipped = studentProfile?.avatar.equipped === outfit.id;
                const rarityColor = getRarityColor(outfit.rarity);

                return (
                  <div
                    key={outfit.id}
                    style={{
                      border: `2px solid ${rarityColor.border}`,
                      background: rarityColor.bg,
                      borderRadius: '16px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '2rem' }}>{outfit.icon}</span>
                        <div>
                          <div style={{ fontSize: '16px', fontWeight: 600, color: rarityColor.text }}>{outfit.name}</div>
                          <div style={{ fontSize: '13px', color: '#475569' }}>{outfit.description}</div>
                        </div>
                      </div>
                      <Badge tone={isEquipped ? 'success' : unlocked ? 'info' : 'warning'}>
                        {isEquipped ? '已装备' : unlocked ? '可装备' : '未解锁'}
                      </Badge>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '12px', color: '#64748b' }}>{outfit.unlockCondition}</span>
                      {unlocked && !isEquipped && (
                        <Button
                          size="sm"
                          variant="primary"
                          disabled={equipping === outfit.id}
                          onClick={() => handleEquipOutfit(outfit.id)}
                        >
                          {equipping === outfit.id ? '切换中...' : '装备'}
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}

        {selectedTab === 'stats' && (
          <div style={{ display: 'grid', gap: '16px' }}>
            <Card title="学习里程">
              <div style={{ display: 'grid', gap: '8px' }}>
                <div>累计完成关卡：{stats.completedLevels}</div>
                <div>收集星星：{stats.totalStars}</div>
                <div>练习时长：{Math.round(stats.totalTime / 60)} 分钟</div>
                <div>连续练习：{stats.streak} 天</div>
              </div>
            </Card>
            <Card title="章节进度">
              {chapters.length === 0 ? (
                <EmptyState title="暂无进度" description="完成首个关卡后即可查看章节进度" />
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {chapters.map(chapter => {
                    const totalLevels = chapter.levels.length;
                    const completedLevels = chapter.levels.filter(level => level.status === 'completed').length;
                    const progressPercent = totalLevels === 0 ? 0 : Math.round((completedLevels / totalLevels) * 100);
                    return (
                      <div key={chapter.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', color: '#1f2937' }}>
                          <span>{chapter.title}</span>
                          <span>{completedLevels}/{totalLevels}</span>
                        </div>
                        <Progress value={progressPercent} />
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AchievementsPage;
