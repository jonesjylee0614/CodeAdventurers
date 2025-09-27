import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { EmptyState } from '../../../components/ui/EmptyState';

const mockLevels = [
  { id: '1', title: '基础动作', stars: 3, time: '32s' },
  { id: '2', title: '循环进阶', stars: 2, time: '54s' },
];

const HomePage = () => (
  <div className="student-home" style={{ display: 'grid', gap: '1.5rem' }}>
    <Card
      title="继续挑战"
      subtitle="挑战最新开放的章节，保持 streak！"
      actions={<Button>进入挑战器</Button>}
    >
      <Progress value={45} label="本周进度" />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Badge tone="success">今日连胜 +1</Badge>
        <Badge tone="info">收藏关卡 5</Badge>
      </div>
    </Card>

    <Card title="历史挑战记录">
      {mockLevels.length ? (
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.75rem' }}>
          {mockLevels.map((level) => (
            <li key={level.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <strong>{level.title}</strong>
                <span style={{ marginLeft: '0.5rem', color: '#64748b' }}>⭐ {level.stars}</span>
              </div>
              <span>{level.time}</span>
            </li>
          ))}
        </ul>
      ) : (
        <EmptyState title="还没有闯关记录" description="先去地图挑一关试试吧" />
      )}
    </Card>
  </div>
);

export default HomePage;
