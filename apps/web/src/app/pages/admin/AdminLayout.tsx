import type { PropsWithChildren } from 'react';
import { Card } from '../../../components/ui/Card';
import './admin-layout.css';

export const AdminLayout = ({ children }: PropsWithChildren) => (
  <div className="admin-layout">
    <Card title="系统健康" subtitle="监控、主题、开关一站式管理">
      <p style={{ margin: 0 }}>LCP: 2.1s · INP: 180ms · 错误率：0.2%</p>
    </Card>
    {children}
  </div>
);

export default AdminLayout;
