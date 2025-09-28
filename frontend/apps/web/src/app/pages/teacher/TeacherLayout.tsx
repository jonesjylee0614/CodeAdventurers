import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { Drawer } from '../../../components/ui/Drawer';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { useFeatureFlags } from '../../providers/FeatureFlagProvider';
import './teacher-layout.css';

export const TeacherLayout = ({ children }: PropsWithChildren) => {
  const { flags } = useFeatureFlags();
  const [openDrawer, setOpenDrawer] = useState(false);

  return (
    <div className="teacher-layout">
      <header>
        <h2>教学作战室</h2>
        <div>
          <Badge tone="info">灰度中</Badge>
          <Button variant="secondary" onClick={() => setOpenDrawer(true)}>
            详情抽屉
          </Button>
        </div>
      </header>
      <div>{children}</div>
      <Drawer
        title="班级概览"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        width={flags['teacher.drawer.wide'] ? 640 : 520}
      >
        <p>抽屉内可查看班级详情、成绩分布与日志。</p>
      </Drawer>
    </div>
  );
};

export default TeacherLayout;
