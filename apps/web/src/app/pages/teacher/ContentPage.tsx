import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';

const contents = [
  { id: 'level-101', title: '迷宫指挥官', type: '关卡', status: '上线' },
  { id: 'level-102', title: '循环工坊', type: '关卡', status: '灰度' },
];

const ContentPage = () => {
  const [selected, setSelected] = useState<typeof contents[number] | null>(null);

  return (
    <Card title="内容库" subtitle="树 + 列表 + 详情 Drawer">
      <Table columns={['名称', '类型', '状态', '操作']} emptyState={<EmptyState title="暂无内容" />}>
        {contents.map((item) => (
          <tr key={item.id}>
            <td>{item.title}</td>
            <td>{item.type}</td>
            <td>{item.status}</td>
            <td>
              <Button variant="ghost" onClick={() => setSelected(item)}>
                查看详情
              </Button>
            </td>
          </tr>
        ))}
      </Table>
      <Drawer title="内容详情" open={Boolean(selected)} onClose={() => setSelected(null)}>
        {selected ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3>{selected.title}</h3>
            <p>类型：{selected.type}</p>
            <p>状态：{selected.status}</p>
            <Button variant="primary">编辑内容</Button>
          </div>
        ) : null}
      </Drawer>
    </Card>
  );
};

export default ContentPage;
