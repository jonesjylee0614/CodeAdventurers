import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

const ops = [
  { id: 'banner1', name: '春季活动', status: '上线' },
];

const OpsPage = () => (
  <Card title="运营位/公告">
    <Table columns={['名称', '状态', '操作']} emptyState={<EmptyState title="暂无运营位" />}>
      {ops.map((op) => (
        <tr key={op.id}>
          <td>{op.name}</td>
          <td>{op.status}</td>
          <td>
            <Button variant="ghost">编辑</Button>
          </td>
        </tr>
      ))}
    </Table>
  </Card>
);

export default OpsPage;
