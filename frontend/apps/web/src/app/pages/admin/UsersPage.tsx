import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

const users = [
  { id: 'u1', name: 'Admin', role: '管理员', status: '启用' },
  { id: 'u2', name: 'TeacherA', role: '教师', status: '启用' },
];

const UsersPage = () => {
  const [selected, setSelected] = useState<typeof users[number] | null>(null);

  return (
    <Card title="用户管理" subtitle="列表 → 详情 Drawer">
      <Table columns={['名称', '角色', '状态', '操作']} emptyState={<EmptyState title="暂无用户" />}>
        {users.map((user) => (
          <tr key={user.id}>
            <td>{user.name}</td>
            <td>{user.role}</td>
            <td>{user.status}</td>
            <td>
              <Button variant="ghost" onClick={() => setSelected(user)}>
                查看详情
              </Button>
            </td>
          </tr>
        ))}
      </Table>
      <Drawer title="用户详情" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3>{selected.name}</h3>
            <p>角色：{selected.role}</p>
            <p>状态：{selected.status}</p>
            <Button variant="danger">停用账号</Button>
          </div>
        ) : null}
      </Drawer>
    </Card>
  );
};

export default UsersPage;
