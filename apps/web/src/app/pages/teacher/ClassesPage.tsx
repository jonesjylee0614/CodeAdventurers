import { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Table } from '../../../components/ui/Table';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Drawer } from '../../../components/ui/Drawer';
import { EmptyState } from '../../../components/ui/EmptyState';

const mockClasses = [
  { id: 'c1', name: '五年级 1 班', students: 32, progress: '78%' },
  { id: 'c2', name: '五年级 2 班', students: 28, progress: '84%' },
];

const ClassesPage = () => {
  const [keyword, setKeyword] = useState('');
  const [selectedClass, setSelectedClass] = useState<typeof mockClasses[number] | null>(null);

  const filtered = mockClasses.filter((item) => item.name.includes(keyword));

  return (
    <Card title="班级列表" subtitle="搜索 + 表格 + 详情 Drawer">
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
        <Input placeholder="搜索班级" value={keyword} onChange={(event) => setKeyword(event.target.value)} />
        <Button variant="secondary">导出</Button>
      </div>
      <Table columns={['班级名称', '学生数', '平均进度', '操作']} emptyState={<EmptyState title="暂无班级" />}>
        {filtered.length ? (
          filtered.map((item) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{item.students}</td>
              <td>{item.progress}</td>
              <td>
                <Button variant="ghost" onClick={() => setSelectedClass(item)}>
                  查看详情
                </Button>
              </td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={4}>
              <EmptyState title="未找到班级" />
            </td>
          </tr>
        )}
      </Table>

      <Drawer title="班级详情" open={Boolean(selectedClass)} onClose={() => setSelectedClass(null)}>
        {selectedClass ? (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <h3>{selectedClass.name}</h3>
            <p>学生数：{selectedClass.students}</p>
            <p>平均进度：{selectedClass.progress}</p>
          </div>
        ) : null}
      </Drawer>
    </Card>
  );
};

export default ClassesPage;
