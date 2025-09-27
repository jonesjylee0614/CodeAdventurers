import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { EmptyState } from '../../../components/ui/EmptyState';

const assignments = [
  { id: 'a1', title: '第 5 章 循环', due: '3 月 18 日', status: '进行中' },
];

const AssignmentsPage = () => {
  const [open, setOpen] = useState(false);

  return (
    <Card title="作业列表" subtitle="统一模板：搜索区 + 表格 + 详情 / 批量布置">
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div />
        <Button onClick={() => setOpen(true)}>批量布置</Button>
      </div>
      <Table columns={['作业名称', '截止时间', '状态', '操作']} emptyState={<EmptyState title="暂无作业" />}>
        {assignments.map((item) => (
          <tr key={item.id}>
            <td>{item.title}</td>
            <td>{item.due}</td>
            <td>{item.status}</td>
            <td>
              <Button variant="ghost">查看详情</Button>
            </td>
          </tr>
        ))}
      </Table>
      <Modal
        title="批量布置作业"
        open={open}
        onClose={() => setOpen(false)}
        primaryAction={{ label: '确认布置', onClick: () => setOpen(false) }}
        secondaryAction={{ label: '取消', onClick: () => setOpen(false) }}
      >
        <p>选择班级后即可批量布置该作业。</p>
      </Modal>
    </Card>
  );
};

export default AssignmentsPage;
