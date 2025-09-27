import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Badge } from '../../../components/ui/Badge';
import { useFeatureFlags } from '../../providers/FeatureFlagProvider';
import './student-layout.css';

export const StudentLayout = ({ children }: PropsWithChildren) => {
  const { flags } = useFeatureFlags();
  const [showAchievementDrawer, setShowAchievementDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  return (
    <div className="student-layout">
      <div className="student-layout__meta">
        <div>
          <h2>今日冒险进度</h2>
          <Badge tone="info">首关目标 ≤ 60s</Badge>
        </div>
        <div className="student-layout__meta-actions">
          <Button variant="secondary" onClick={() => setShowAchievementDrawer(true)}>
            成就抽屉
          </Button>
          <Button variant="ghost" onClick={() => setShowExitConfirm(true)}>
            退出挑战
          </Button>
        </div>
      </div>
      <Tabs defaultTab="overview">
        <TabItem id="overview" title="冒险概览">
          <div className="student-layout__content">{children}</div>
        </TabItem>
        <TabItem id="upcoming" title="下一步提示">
          <div className="student-layout__hints">
            <p>Hint 1：先观察目标图形，确定边缘积木。</p>
            <p>Hint 2：尝试使用循环积木减少重复。</p>
            <p>Hint 3：使用条件判断来控制方向。</p>
          </div>
        </TabItem>
      </Tabs>

      <Drawer
        title="成就与装扮"
        open={showAchievementDrawer}
        onClose={() => setShowAchievementDrawer(false)}
        width={flags['student.drawer.wide'] ? 640 : 520}
      >
        <div className="student-layout__drawer">
          <section>
            <h3>最新成就</h3>
            <ul>
              <li>🔥 连续通关 3 天</li>
              <li>⭐ 本周获得 12 颗星</li>
              <li>🎨 解锁新头像：像素机械师</li>
            </ul>
          </section>
          <section>
            <h3>装扮选择</h3>
            <div className="student-layout__skins">正在开发中的装扮选择体验…</div>
          </section>
        </div>
      </Drawer>

      <Modal
        title="确认退出挑战？"
        open={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        primaryAction={{ label: '确认退出', onClick: () => setShowExitConfirm(false) }}
        secondaryAction={{ label: '继续冒险', onClick: () => setShowExitConfirm(false) }}
      >
        <p>退出后将丢失当前尝试的进度，但保留已解锁的提示。</p>
      </Modal>
    </div>
  );
};

export default StudentLayout;
