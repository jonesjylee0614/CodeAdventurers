import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';

const achievements = [
  { id: 'a1', name: '极速先锋', description: '首关通关 ≤ 45s', progress: 100 },
  { id: 'a2', name: '连胜达人', description: '连续通关 5 天', progress: 60 },
];

const AchievementsPage = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    {achievements.length ? (
      achievements.map((achievement) => (
        <Card
          key={achievement.id}
          title={achievement.name}
          subtitle={achievement.description}
          actions={<Badge tone={achievement.progress === 100 ? 'success' : 'info'}>{achievement.progress}%</Badge>}
        >
          <p>距离升级还需 {Math.max(0, 100 - achievement.progress)}%</p>
        </Card>
      ))
    ) : (
      <EmptyState title="暂无成就" description="完成挑战解锁更多徽章" />
    )}
  </div>
);

export default AchievementsPage;
