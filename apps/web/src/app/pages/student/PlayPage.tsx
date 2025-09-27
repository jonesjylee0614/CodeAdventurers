import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';

const PlayPage = () => {
  const { levelId } = useParams();
  const [showHint, setShowHint] = useState(false);
  const [attempts, setAttempts] = useState(0);

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card title={`挑战器 - 关卡 ${levelId}`} subtitle="场景 / 积木库 / 程序区 / 目标">
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
          <div style={{ minHeight: '280px', background: 'rgba(15, 23, 42, 0.9)', borderRadius: '1rem' }}>
            <p style={{ color: 'white', padding: '1rem' }}>3D 场景占位</p>
          </div>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <section>
              <h3>积木库</h3>
              <p>拖拽积木到程序区构建算法。</p>
            </section>
            <section>
              <h3>目标说明</h3>
              <p>在 60 步内收集所有能源块。</p>
            </section>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setShowHint(true)}>
            查看 Hint
          </Button>
          <Button variant="primary" onClick={() => setAttempts((prev) => prev + 1)}>
            运行程序
          </Button>
        </div>
      </Card>

      <Card title="失败分类提示" subtitle="自动识别错误并给出建议">
        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gap: '0.5rem' }}>
          <li>· 路径偏移：请检查第 12 步的转向。</li>
          <li>· 循环次数不足：考虑使用重复 4 次的循环。</li>
          <li>· 条件判断缺失：使用 if 判断能量块是否存在。</li>
        </ul>
        <p>尝试次数：{attempts}</p>
      </Card>

      <Modal
        title="Hint 分级策略"
        open={showHint}
        onClose={() => setShowHint(false)}
        primaryAction={{ label: '明白了', onClick: () => setShowHint(false) }}
      >
        <ol>
          <li>Hint 1：观察目标格子中的颜色变化。</li>
          <li>Hint 2：尝试将重复动作包裹在循环中。</li>
          <li>Hint 3：当能量块缺失时，使用条件判断跳出循环。</li>
        </ol>
      </Modal>
    </div>
  );
};

export default PlayPage;
