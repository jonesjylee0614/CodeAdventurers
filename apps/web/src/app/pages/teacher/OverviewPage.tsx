import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';

const OverviewPage = () => (
  <div style={{ display: 'grid', gap: '1.5rem' }}>
    <Card title="今日看板" subtitle="班级、作业、内容库概览">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
        <Card title="班级" subtitle="共 4 个活跃班级">
          <p>待处理申请：2</p>
        </Card>
        <Card title="作业" subtitle="本周布置 6 份">
          <p>平均完成率：82%</p>
        </Card>
        <Card title="内容库" subtitle="新增关卡 3 个">
          <p>审核中：1</p>
        </Card>
      </div>
    </Card>
    <Card title="教学分析" subtitle="概念热力 / 卡关榜 / 用时">
      <EmptyState title="等待接入后端数据" description="预留接口适配层" />
    </Card>
  </div>
);

export default OverviewPage;
