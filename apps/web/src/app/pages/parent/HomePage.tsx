import { useEffect, useMemo, useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Progress } from '../../../components/ui/Progress';
import { Table } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient, ParentOverview } from '../../../services/api/client';

const HomePage = () => {
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [overview, setOverview] = useState<ParentOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();

  const canLoad = isLoggedIn && user?.role === 'parent';

  useEffect(() => {
    if (!canLoad) {
      if (!auth.isOpen) {
        openAuthModal('parent');
      }
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.getParentOverview();
        setOverview(response.data ?? null);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载家庭概览失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, auth.isOpen, openAuthModal]);

  const primaryChild = useMemo(() => overview?.children[0], [overview]);

  if (!canLoad) {
    return <EmptyState title="请登录家长账号" description="登录后可查看孩子的学习情况" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在获取孩子的学习情况" />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  if (!overview || overview.children.length === 0) {
    return <EmptyState title="暂无孩子数据" description="请联系班主任完成账号绑定" />;
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card title="家庭学习总览" subtitle={`家庭共有 ${overview.children.length} 名孩子参与学习`}>
        {primaryChild ? (
          <div style={{ display: 'grid', gap: '12px' }}>
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#0f172a' }}>{primaryChild.name}</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>所在班级：{primaryChild.classId}</div>
            </div>
            <Progress
              value={primaryChild.weeklyReport ? Math.min(primaryChild.completedLevels * 20, 100) : 0}
              label={`已完成 ${primaryChild.completedLevels} 个关卡`}
            />
            {primaryChild.weeklyReport ? (
              <div style={{ background: '#f0f9ff', borderRadius: '12px', padding: '12px' }}>
                <strong style={{ color: '#0f172a' }}>周报摘要：</strong>
                <p style={{ margin: '8px 0', color: '#1f2937' }}>{primaryChild.weeklyReport.summary}</p>
                <p style={{ margin: 0, color: '#475569', fontSize: '13px' }}>
                  学习概念：{primaryChild.weeklyReport.conceptsLearned.join('、') || '暂无'}
                </p>
              </div>
            ) : (
              <EmptyState title="暂无周报" description="本周尚未生成学习周报" />
            )}
            <Button variant="secondary" onClick={() => window.open(`/parent/progress/${primaryChild.id}`, '_self')}>
              查看详细进度
            </Button>
          </div>
        ) : (
          <EmptyState title="暂无周报数据" />
        )}
      </Card>

      <Card title="孩子学习进度" subtitle="查看每位孩子的完成情况">
        <Table columns={['孩子', '完成关卡', '总时长', '最新周报']}>
          {overview.children.map((child) => (
            <tr key={child.id}>
              <td>{child.name}</td>
              <td>{child.completedLevels}</td>
              <td>{Math.round(child.totalDuration / 60)} 分钟</td>
              <td>
                {child.weeklyReport ? new Date(child.weeklyReport.generatedAt).toLocaleDateString() : '暂无'}
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      <Card title="家庭提醒" subtitle="根据家长设置生成的学习提醒">
        <ul style={{ margin: 0, paddingLeft: '20px', color: '#475569' }}>
          <li>每日提醒时间：{overview.settings.reminderTime}</li>
          <li>周报发送日：{overview.settings.weeklyReportDay}</li>
          <li>通知渠道：{overview.settings.notifyChannels.join('、')}</li>
        </ul>
      </Card>
    </div>
  );
};

export default HomePage;
