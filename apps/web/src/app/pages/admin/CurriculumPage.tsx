import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

const CurriculumPage = () => (
  <Card title="课程/关卡大纲编辑器" subtitle="Page 级操作">
    <EmptyState title="编辑器占位" description="预留可视化课程编辑器" />
    <Button variant="primary">创建新章节</Button>
  </Card>
);

export default CurriculumPage;
