import type { PropsWithChildren } from 'react';
import { Card } from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import './parent-layout.css';

export const ParentLayout = ({ children }: PropsWithChildren) => (
  <div className="parent-layout">
    <Card title="家庭进度" subtitle="掌握孩子的学习节奏">
      <Badge tone="info">周报待查看</Badge>
    </Card>
    {children}
  </div>
);

export default ParentLayout;
