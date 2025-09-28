import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Table } from '../../../components/ui/Table';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Progress } from '../../../components/ui/Progress';
import { Badge } from '../../../components/ui/Badge';
import { useAppStore } from '../../../store/useAppStore';
import {
  apiClient,
  ParentProgressRecord,
  WeeklyReport
} from '../../../services/api/client';

const ProgressPage = () => {
  const { childId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const [children, setChildren] = useState<Array<{ id: string; name: string }>>([]);
  const [progress, setProgress] = useState<ParentProgressRecord[]>([]);
  const [weeklyReport, setWeeklyReport] = useState<WeeklyReport | null>(null);
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

    const loadChildren = async () => {
      const response = await apiClient.getParentChildren();
      setChildren(response.data?.children ?? []);
      return response.data?.children ?? [];
    };

    const loadData = async () => {
      setLoading(true);
      try {
        const childList = await loadChildren();
        const targetId = childId ?? childList[0]?.id;
        if (!targetId) {
          setProgress([]);
          setWeeklyReport(null);
          setErrorMessage('暂无孩子进度数据');
          return;
        }
        if (!childId) {
          navigate(`/parent/progress/${targetId}`, { replace: true });
        }
        const [progressResponse, weeklyResponse] = await Promise.all([
          apiClient.getParentProgress(targetId),
          apiClient.getParentWeeklyReport(targetId)
        ]);
        setProgress(progressResponse.data?.progress ?? []);
        setWeeklyReport(weeklyResponse.data ?? null);
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载孩子进度失败');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [canLoad, auth.isOpen, openAuthModal, childId, navigate]);

  const currentChild = useMemo(() => children.find((item) => item.id === childId), [children, childId]);
  const completionRate = useMemo(() => {
    if (!progress.length) return 0;
    const completed = progress.filter((item) => item.stars > 0).length;
    return Math.round((completed / progress.length) * 100);
  }, [progress]);

  if (!canLoad) {
    return <EmptyState title="请登录家长账号" description="登录后可查看孩子进度" />;
  }

  if (loading) {
    return <EmptyState title="加载中" description="正在获取关卡进度" />;
  }

  if (errorMessage) {
    return <EmptyState title="加载失败" description={errorMessage} />;
  }

  if (!currentChild) {
    return <EmptyState title="未找到孩子" description="请返回首页选择孩子" />;
  }

  return (
    <Card title={`孩子 ${currentChild.name}`} subtitle="进度详情 / 关卡清单 / 周报">
      <Tabs>
        <TabItem id="overview" title="进度概览">
          <div style={{ display: 'grid', gap: '12px' }}>
            <Progress value={completionRate} label={`完成率 ${completionRate}%`} />
            {weeklyReport ? (
              <div style={{ background: '#f0fdf4', borderRadius: '12px', padding: '12px' }}>
                <strong style={{ color: '#15803d' }}>本周学习摘要：</strong>
                <p style={{ margin: '8px 0', color: '#14532d' }}>{weeklyReport.summary}</p>
                <p style={{ margin: 0, color: '#166534', fontSize: '13px' }}>
                  推荐：{weeklyReport.recommendations.join('、') || '暂无'}
                </p>
              </div>
            ) : (
              <EmptyState title="暂无周报" />
            )}
          </div>
        </TabItem>
        <TabItem id="levels" title="关卡清单">
          <Table columns={['关卡', '星级', '步数', '用时', '完成时间']}>
            {progress.length ? (
              progress.map((record) => (
                <tr key={record.levelId}>
                  <td>{record.levelId}</td>
                  <td>
                    <Badge tone={record.stars >= 3 ? 'success' : record.stars === 2 ? 'warning' : 'danger'}>
                      {record.stars} 星
                    </Badge>
                  </td>
                  <td>{record.steps}</td>
                  <td>{record.duration} 秒</td>
                  <td>{new Date(record.completedAt).toLocaleString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5}>
                  <EmptyState title="暂无关卡记录" />
                </td>
              </tr>
            )}
          </Table>
        </TabItem>
        <TabItem id="mistakes" title="复习建议">
          {weeklyReport ? (
            <div style={{ display: 'grid', gap: '12px' }}>
              <div>
                <strong style={{ color: '#b45309' }}>常见易错：</strong>
                <p style={{ margin: '8px 0', color: '#78350f' }}>
                  {weeklyReport.commonMistakes.join('、') || '暂无记录'}
                </p>
              </div>
              <div>
                <strong style={{ color: '#2563eb' }}>建议练习：</strong>
                <p style={{ margin: '8px 0', color: '#1d4ed8' }}>
                  {weeklyReport.recommendations.join('、') || '建议复习之前的关卡'}
                </p>
              </div>
            </div>
          ) : (
            <EmptyState title="暂无复习建议" />
          )}
        </TabItem>
      </Tabs>
    </Card>
  );
};

export default ProgressPage;
