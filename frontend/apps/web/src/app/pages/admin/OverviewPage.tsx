import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';

const OverviewPage = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    <Card title="关键指标" subtitle="性能预算与错误监控">
      <ul>
        <li>FCP: 1.8s</li>
        <li>LCP: 2.2s</li>
        <li>INP: 180ms</li>
        <li>错误率: 0.2%</li>
      </ul>
    </Card>
    <Card title="待办事项">
      <EmptyState title="暂无待办" description="所有任务均已完成" />
    </Card>
  </div>
);

export default OverviewPage;
