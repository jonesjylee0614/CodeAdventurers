import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { useFeatureFlags } from '../../providers/FeatureFlagProvider';
import './student-layout.css';

export const StudentLayout = ({ children }: PropsWithChildren) => {
  const { flags } = useFeatureFlags();
  const [showAchievementDrawer, setShowAchievementDrawer] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  console.log('[StudentLayout] 渲染中，children:', children);

  return (
    <div className="student-layout">
      {/* 主要内容区域 - 直接渲染 children，不要包裹在 Tabs 里 */}
      <div className="student-layout__content">{children}</div>

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
