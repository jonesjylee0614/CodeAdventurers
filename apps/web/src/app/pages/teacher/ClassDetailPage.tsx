import { useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Table } from '../../../components/ui/Table';

const ClassDetailPage = () => {
  const { classId } = useParams();

  return (
    <Card title={`班级 ${classId}`} subtitle="成员 / 成绩 / 日志">
      <Tabs>
        <TabItem id="members" title="成员">
          <Table columns={['姓名', '进度']}>
            <tr>
              <td>林小小</td>
              <td>88%</td>
            </tr>
            <tr>
              <td>张星星</td>
              <td>92%</td>
            </tr>
          </Table>
        </TabItem>
        <TabItem id="scores" title="成绩">
          <p>成绩分布图占位，等待接入数据。</p>
        </TabItem>
        <TabItem id="logs" title="日志">
          <ul>
            <li>2024-03-14 09:00 发布作业</li>
            <li>2024-03-14 21:00 自动提醒未完成学生</li>
          </ul>
        </TabItem>
      </Tabs>
    </Card>
  );
};

export default ClassDetailPage;
