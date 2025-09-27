import { useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { EmptyState } from '../../../components/ui/EmptyState';

const ProgressPage = () => {
  const { childId } = useParams();

  return (
    <Card title={`孩子 ${childId}`} subtitle="进度详情 / 关卡清单 / 错题集">
      <Tabs>
        <TabItem id="curve" title="进度曲线">
          <EmptyState title="曲线图占位" description="等待数据接入" />
        </TabItem>
        <TabItem id="levels" title="关卡清单">
          <ul>
            <li>森林启程 - 已完成</li>
            <li>火山挑战 - 练习中</li>
          </ul>
        </TabItem>
        <TabItem id="mistakes" title="错题集">
          <p>暂无错题，保持努力！</p>
        </TabItem>
      </Tabs>
    </Card>
  );
};

export default ProgressPage;
