import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Tabs, TabItem } from '../../../components/ui/Tabs';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient, Level } from '../../../services/api/client';

const BLOCK_LABELS: Record<string, string> = {
  MOVE: '向前移动',
  TURN_LEFT: '向左转',
  TURN_RIGHT: '向右转',
  COLLECT: '收集宝石',
  REPEAT: '重复循环',
  CONDITIONAL: '条件判断'
};

const LevelDetailPage = () => {
  const { levelId } = useParams();
  const navigate = useNavigate();
  const { isLoggedIn } = useAppStore();

  const [level, setLevel] = useState<Level | null>(null);
  const [prep, setPrep] = useState<{ victoryCondition: any; allowedBlocks: string[]; comic?: string; rewards?: any } | null>(null);
  const [status, setStatus] = useState<'locked' | 'unlocked' | 'completed'>('locked');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!levelId || !isLoggedIn) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [detailResponse, prepResponse] = await Promise.all([
          apiClient.getStudentLevel(levelId),
          apiClient.getLevelPrep(levelId)
        ]);

        if (!cancelled) {
          if (detailResponse.error) {
            // 如果关卡未解锁，保留状态并允许展示准备信息
            if (detailResponse.error.includes('未解锁')) {
              setStatus('locked');
            } else {
              setError(detailResponse.error);
            }
          } else if (detailResponse.data) {
            setLevel(detailResponse.data);
            setStatus(detailResponse.data.status ?? 'unlocked');
          }

          if (prepResponse.error) {
            setError(prepResponse.error);
          } else if (prepResponse.data) {
            setPrep(prepResponse.data);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '加载关卡信息失败');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [levelId, isLoggedIn]);

  if (!isLoggedIn) {
    return (
      <Card title="请先登录">
        <p>登录后即可查看关卡详情。</p>
        <Button variant="primary" onClick={() => navigate('/auth')}>
          前往登录
        </Button>
      </Card>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', gap: '1rem' }}>
        <Skeleton height={180} />
        <Skeleton height={320} />
      </div>
    );
  }

  if (error) {
    return (
      <Card title="加载失败" subtitle={`关卡 ${levelId}`}>
        <p style={{ color: '#ef4444', marginBottom: '16px' }}>{error}</p>
        <Button variant="primary" onClick={() => window.location.reload()}>
          重试
        </Button>
      </Card>
    );
  }

  const victoryCondition = prep?.victoryCondition ?? level?.goal;
  const allowedBlocks = prep?.allowedBlocks ?? level?.allowedBlocks ?? [];
  const comic = prep?.comic ?? level?.comic;
  const rewards = prep?.rewards ?? level?.rewards;

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <Card
        title={level ? `🎮 ${level.name}` : `关卡 ${levelId}`}
        subtitle="目标、可用积木与教学漫画一屏掌握"
        actions={
          <Button
            variant="primary"
            disabled={status === 'locked'}
            onClick={() => navigate(`/student/play/${levelId}`)}
          >
            {status === 'locked' ? '关卡未解锁' : status === 'completed' ? '再次挑战' : '进入挑战'}
          </Button>
        }
      >
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px' }}>
          <Badge tone={status === 'completed' ? 'success' : status === 'locked' ? 'warning' : 'info'}>
            {status === 'completed' ? '已完成' : status === 'locked' ? '未解锁' : '可挑战'}
          </Badge>
          {level?.bestSteps !== undefined && (
            <span style={{ fontSize: '14px', color: '#64748b' }}>最佳步数：{level.bestSteps}</span>
          )}
          {rewards?.outfit && (
            <Badge tone="info">奖励：{rewards.outfit}</Badge>
          )}
        </div>

        <Tabs>
          <TabItem id="goal" title="任务目标">
            {victoryCondition ? (
              <ul style={{ lineHeight: 1.8, color: '#374151' }}>
                {victoryCondition.reach && (
                  <li>到达坐标 ({victoryCondition.reach.x}, {victoryCondition.reach.y})</li>
                )}
                {victoryCondition.collectibles !== undefined && (
                  <li>收集 {victoryCondition.collectibles === 0 ? '所有宝石' : `${victoryCondition.collectibles} 件道具`}</li>
                )}
                {victoryCondition.stepLimit && (
                  <li>在 {victoryCondition.stepLimit} 步内完成挑战</li>
                )}
              </ul>
            ) : (
              <p style={{ color: '#6b7280' }}>暂无目标信息。</p>
            )}
          </TabItem>

          <TabItem id="blocks" title="可用积木">
            {allowedBlocks.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {allowedBlocks.map((block) => (
                  <Badge key={block} tone="info">
                    {BLOCK_LABELS[block] ?? block}
                  </Badge>
                ))}
              </div>
            ) : (
              <p style={{ color: '#6b7280' }}>该关卡未限制积木类型。</p>
            )}
          </TabItem>

          <TabItem id="comic" title="教学漫画">
            {comic ? (
              <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7, color: '#4b5563' }}>{comic}</p>
            ) : (
              <p style={{ color: '#6b7280' }}>本关暂未配置教学漫画。</p>
            )}
          </TabItem>
        </Tabs>
      </Card>
    </div>
  );
};

export default LevelDetailPage;
