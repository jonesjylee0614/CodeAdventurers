import { Card } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { Button } from '../../../components/ui/Button';

const HomePage = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    <Card title="孩子进度" subtitle="近七日时长与待查看周报">
      <Progress value={68} label="本周目标达成" />
      <Button variant="secondary">查看周报</Button>
    </Card>
    <Card title="最近活动">
      <ul>
        <li>3 月 14 日：通关 2 关</li>
        <li>3 月 13 日：练习 45 分钟</li>
      </ul>
    </Card>
  </div>
);

export default HomePage;
