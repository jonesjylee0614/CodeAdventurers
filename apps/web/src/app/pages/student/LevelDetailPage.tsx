import { useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';

const LevelDetailPage = () => {
  const { levelId } = useParams();

  return (
    <Card
      title={`关卡 ${levelId}`}
      subtitle="目标、可用积木与教学漫画一屏掌握"
      actions={<Button variant="primary">进入挑战</Button>}
    >
      <Tabs>
        <TabItem id="goal" title="目标">
          <p>达成指定路径并在 60 步内完成。</p>
        </TabItem>
        <TabItem id="blocks" title="可用积木">
          <ul>
            <li>前进</li>
            <li>向左/向右转</li>
            <li>重复循环</li>
            <li>条件判断</li>
          </ul>
        </TabItem>
        <TabItem id="comic" title="教学漫画">
          <p>漫画占位：讲述小机器人如何学会循环的故事。</p>
        </TabItem>
      </Tabs>
    </Card>
  );
};

export default LevelDetailPage;
