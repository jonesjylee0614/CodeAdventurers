import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';

const ResultPage = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    <Card title="结算" subtitle="星级 / 奖励 / 最佳差距 / 下一步">
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Badge tone="success" style={{ fontSize: '1.5rem' }}>
          ⭐⭐⭐
        </Badge>
        <div>
          <p style={{ margin: 0 }}>获得奖励：500 XP + 稀有积木</p>
          <p style={{ margin: 0 }}>最佳差距：比最佳记录多 4 步</p>
        </div>
      </div>
      <Progress value={72} label="下一颗星进度" />
      <div style={{ display: 'flex', gap: '1rem' }}>
        <Button variant="primary">挑战下一关</Button>
        <Button variant="secondary">回放</Button>
        <Button variant="ghost">分享战报</Button>
      </div>
    </Card>
  </div>
);

export default ResultPage;
