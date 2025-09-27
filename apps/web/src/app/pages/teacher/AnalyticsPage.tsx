import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';

const AnalyticsPage = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    <Card title="概念热力图">
      <EmptyState title="等待数据接入" description="此处将展示概念掌握情况" />
    </Card>
    <Card title="卡关榜">
      <EmptyState title="暂无数据" description="上线后将展示卡关关卡" />
    </Card>
    <Card title="用时分析">
      <EmptyState title="敬请期待" description="预留图表组件占位" />
    </Card>
  </div>
);

export default AnalyticsPage;
