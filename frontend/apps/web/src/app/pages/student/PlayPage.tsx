import { BlockEditor } from '@student/BlockEditor';
import { GameCanvas } from '@student/GameCanvas';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Modal } from '../../../components/ui/Modal';
import { Skeleton } from '../../../components/ui/Skeleton';
import { apiClient, Level } from '../../../services/api/client';
import { useAppStore } from '../../../store/useAppStore';

const BLOCK_LABELS: Record<string, string> = {
  MOVE: '前进',
  TURN_LEFT: '向左转',
  TURN_RIGHT: '向右转',
  COLLECT: '收集',
  REPEAT: '循环',
  CONDITIONAL: '条件判断'
};

const PlayPage = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();

  const [level, setLevel] = useState<Level | null>(null);
  const [levelStatus, setLevelStatus] = useState<'locked' | 'unlocked' | 'completed'>('locked');
  const [levelProgress, setLevelProgress] = useState<Level['progress'] | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [levelPrep, setLevelPrep] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  const [editorResetTick, setEditorResetTick] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const {
    game,
    loading,
    error,
    isLoggedIn,
    runProgram,
    completeLevel,
    getHint,
    resetGame,
    setCurrentLevel,
    setProgram,
    openAuthModal,
  } = useAppStore((state) => ({
    game: state.game,
    loading: state.loading,
    error: state.error,
    isLoggedIn: state.isLoggedIn,
    runProgram: state.runProgram,
    completeLevel: state.completeLevel,
    getHint: state.getHint,
    resetGame: state.resetGame,
    setCurrentLevel: state.setCurrentLevel,
    setProgram: state.setProgram,
    openAuthModal: state.openAuthModal,
  }));

  // 重定向到登录页面如果未登录
  useEffect(() => {
    if (!isLoggedIn) {
      const currentPath = window.location.pathname;
      navigate(`/login?redirect=${encodeURIComponent(currentPath)}`, { replace: true });
    }
  }, [isLoggedIn, navigate]);

  // 加载关卡数据
  useEffect(() => {
    if (levelId && isLoggedIn) {
      loadLevelData();
    }
  }, [levelId, isLoggedIn]);

  const loadLevelData = async () => {
    if (!levelId) return;

    setIsFetching(true);
    setFetchError(null);

    try {
      const [detailResponse, prepResponse] = await Promise.all([
        apiClient.getStudentLevel(levelId),
        apiClient.getLevelPrep(levelId)
      ]);

      if (detailResponse.error) {
        if (detailResponse.error.includes('未解锁')) {
          setLevel(null);
          setLevelStatus('locked');
        } else {
          setFetchError(detailResponse.error);
        }
      } else if (detailResponse.data) {
        const levelData = detailResponse.data;
        setLevel(levelData);
        setLevelStatus(levelData.status ?? 'locked');
        setLevelProgress(levelData.progress ?? null);
        setCurrentLevel(levelData);
        resetGame();
        setStartTime(Date.now());
      }

      if (prepResponse.error) {
        setFetchError(prepResponse.error);
      } else {
        setLevelPrep(prepResponse.data);
      }
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : '加载关卡数据失败');
    } finally {
      setIsFetching(false);
    }
  };

  const performReset = useCallback(() => {
    resetGame();
    setProgram([]);
    setIsPlaying(false);
    setStartTime(Date.now());
    setEditorResetTick((tick) => tick + 1);
  }, [resetGame, setProgram]);

  const handleRunButton = async () => {
    if (!level) return;

    setIsPlaying(true);
    await runProgram();
    setIsPlaying(false);
  };

  const handleReset = () => {
    performReset();
  };

  const handleGetHint = async () => {
    await getHint();
    setShowHint(true);
  };

  const handleComplete = async () => {
    if (!game.simulationResult?.success) return;

    const duration = Math.round((Date.now() - startTime) / 1000);
    const bestDifference = Math.max(0, (game.simulationResult.steps ?? 0) - (level?.bestSteps ?? 0));

    await completeLevel({
      stars: game.simulationResult.stars,
      steps: game.simulationResult.steps,
      hints: game.hints.length,
      duration,
      bestDifference
    });

    setShowResult(true);
  };

  const handleContinue = () => {
    navigate('/student/levels');
  };

  // 使用 useCallback 防止无限循环更新 - 这些 hooks 必须始终存在
  const handleProgramChange = useCallback((program: any[]) => {
    setProgram(program);
  }, [setProgram]);

  const handleRun = useCallback(async (program: any[]) => {
    setProgram(program);
    const result = await runProgram(program);
    return result || { success: false, steps: 0, stars: 0, log: [] };
  }, [runProgram, setProgram]);

  const handleResetCallback = useCallback(() => {
    performReset();
  }, [performReset]);

  const handleGetHintCallback = useCallback(async () => {
    await getHint();
    setShowHint(true);
  }, [getHint]);

  // 计算派生状态 - 必须在所有 hooks 之后
  const allowedBlocks = levelPrep?.allowedBlocks ?? level?.allowedBlocks ?? [];
  const victoryCondition = levelPrep?.victoryCondition ?? level?.goal;

  const stepLimit =
    typeof victoryCondition?.stepLimit === 'number' ? victoryCondition.stepLimit : undefined;
  const currentProgramSteps = game.currentProgram?.length ?? 0;
  const lastRunSteps = game.simulationResult?.steps ?? null;
  const displayedSteps = lastRunSteps ?? currentProgramSteps;
  const isOverStepLimit = stepLimit !== undefined && displayedSteps > stepLimit;
  const remainingSteps = stepLimit !== undefined ? Math.max(stepLimit - displayedSteps, 0) : null;
  const stepBadgeTone = isOverStepLimit
    ? 'danger'
    : remainingSteps !== null && remainingSteps <= 2
      ? 'warning'
      : 'info';
  const stepBadgeText = stepLimit !== undefined
    ? isOverStepLimit
      ? `超出限制 ${displayedSteps - stepLimit} 步（上限 ${stepLimit} 步）`
      : `剩余 ${remainingSteps} 步（上限 ${stepLimit} 步）`
    : '';
  const starCount = game.simulationResult?.stars ?? 0;
  const maxStars = 3;
  const starBadgeTone = starCount >= maxStars ? 'success' : starCount > 0 ? 'info' : 'warning';
  const bestStepDifference =
    level && game.simulationResult?.steps !== undefined
      ? Math.max(game.simulationResult.steps - level.bestSteps, 0)
      : null;

  // 提前返回的条件必须放在所有 hooks 之后
  // 加载状态
  if (isFetching) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card title="🎯 关卡加载中..." subtitle="请稍候，正在准备游戏场景">
          <Skeleton height={200} />
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem' }}>
          <Card title="游戏场景">
            <Skeleton height={400} />
          </Card>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <Skeleton height={120} />
            <Skeleton height={80} />
            <Skeleton height={100} />
          </div>
        </div>
      </div>
    );
  }

  // 错误状态
  if (fetchError) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card title="❌ 关卡加载失败" subtitle="遇到了一个技术问题">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>😵</div>
            <h2 style={{ color: '#ef4444', marginBottom: '1rem' }}>糟糕，体验出了点问题</h2>
            <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
              {fetchError}
            </p>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              请尝试刷新页面，如果问题持续出现请联系支持团队。
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <Button
                variant="primary"
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/student/levels')}
              >
                返回关卡地图
              </Button>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // 未登录状态（理论上不会出现，因为有重定向）
  if (!isLoggedIn) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card title="🔒 需要登录" subtitle="请先登录以访问关卡">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <p>请登录后继续游戏</p>
            <Button onClick={() => openAuthModal('student')}>
              登录
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // 检查关卡数据是否存在
  if (!level) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Card title="🔒 关卡未解锁" subtitle="这个关卡需要先完成前面的关卡">
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🔒</div>
            <h2 style={{ color: '#f59e0b', marginBottom: '1rem' }}>关卡未解锁</h2>
            <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
              请先完成前面的关卡，再来挑战这个关卡吧！
            </p>
            <Button
              variant="primary"
              onClick={() => navigate('/student/levels')}
            >
              返回关卡地图
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      {/* 关卡头部信息 */}
      <Card
        title={`🎯 ${level.name}`}
        subtitle="编程挑战区 - 使用积木编程完成任务"
        style={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          color: 'white'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginTop: '16px',
            flexWrap: 'wrap',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255,255,255,0.18)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>最佳步数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{level.bestSteps}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.18)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>尝试次数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{game.attempts}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.18)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>提示次数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{game.hints.length}</div>
            </div>
            {levelProgress && (
              <div style={{ background: 'rgba(255,255,255,0.18)', padding: '8px 12px', borderRadius: '8px' }}>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>历史最佳</div>
                <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{levelProgress.steps} 步</div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/student/levels')}
            >
              🔙 返回地图
            </Button>
          </div>
        </div>
      </Card>

      <div
        style={{
          display: 'grid',
          gap: '1.5rem',
          gridTemplateColumns: 'minmax(360px, 1.15fr) minmax(420px, 1fr) 320px',
          alignItems: 'start'
        }}
      >
        <Card
          title="🧩 积木编程区"
          subtitle="拖拽积木，构建你的指令序列"
          style={{ height: '100%' }}
        >
          {level && allowedBlocks ? (
            <div style={{ height: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <BlockEditor
                level={level}
                allowedBlocks={allowedBlocks}
                onProgramChange={handleProgramChange}
                onRun={handleRun}
                onReset={handleResetCallback}
                showRunControls={false}
                externalResetSignal={editorResetTick}
              />
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
              积木编程器加载中...
            </div>
          )}
        </Card>

        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <Card title="🎮 游戏场景" style={{ padding: '16px', height: '100%' }}>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '12px',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}
            >
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {stepLimit !== undefined && (
                  <Badge tone={stepBadgeTone}>🕒 {stepBadgeText}</Badge>
                )}
                <Badge tone={isOverStepLimit ? 'danger' : 'info'}>🚗 程序长度 {displayedSteps} 步</Badge>
              </div>
              <Badge tone={starBadgeTone}>
                ⭐ 目标 {maxStars} 星{starCount ? ` · 已获 ${starCount} 星` : ' · 尚未获得星星'}
              </Badge>
            </div>
            {level ? (
              <GameCanvas
                level={level}
                simulationResult={game.simulationResult}
                isPlaying={isPlaying}
                playbackSpeed={500}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                关卡数据加载中...
              </div>
            )}
          </Card>
        </div>

        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          <Card title="🎯 任务目标" size="sm">
            <div style={{ fontSize: '14px', color: '#374151', display: 'grid', gap: '6px' }}>
              {victoryCondition?.reach && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🚩</span>
                  <span>到达位置 ({victoryCondition.reach.x}, {victoryCondition.reach.y})</span>
                </div>
              )}
              {victoryCondition?.collectibles !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⭐</span>
                  <span>收集所有宝石</span>
                </div>
              )}
              {stepLimit !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🕒</span>
                  <span>在 {stepLimit} 步内完成</span>
                </div>
              )}
            </div>
          </Card>

          {allowedBlocks && allowedBlocks.length > 0 && (
            <Card title="🧰 可用积木" size="sm">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                {allowedBlocks.map((block: string) => (
                  <Badge key={block} tone="info">{BLOCK_LABELS[block] ?? block}</Badge>
                ))}
              </div>
            </Card>
          )}

          <Card title="📈 学习数据" size="sm">
            <div style={{ display: 'grid', gap: '8px', fontSize: '14px', color: '#374151' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>历史最佳</span>
                <strong>{levelProgress ? `${levelProgress.steps} 步` : '暂无记录'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>当前方案</span>
                <strong>{displayedSteps} 步</strong>
              </div>
              {stepLimit !== undefined && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>步数状态</span>
                  <strong style={{ color: isOverStepLimit ? '#dc2626' : '#0f766e' }}>
                    {isOverStepLimit
                      ? `超出 ${displayedSteps - stepLimit} 步`
                      : `剩余 ${remainingSteps} 步`}
                  </strong>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>已尝试次数</span>
                <strong>{game.attempts}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>使用提示</span>
                <strong>{game.hints.length}</strong>
              </div>
            </div>
          </Card>

          <Card title="🕹️ 运行控制" size="sm">
            <div style={{ display: 'grid', gap: '8px' }}>
              <Button
                variant="primary"
                onClick={handleRunButton}
                disabled={isPlaying || game.isRunning || currentProgramSteps === 0}
                loading={game.isRunning}
                style={{ width: '100%' }}
              >
                {game.isRunning ? '运行中...' : '▶️ 运行程序'}
              </Button>

              <Button
                variant="secondary"
                onClick={handleResetCallback}
                disabled={isPlaying || game.isRunning}
                style={{ width: '100%' }}
              >
                🔄 重置
              </Button>

              <Button
                variant="ghost"
                onClick={handleGetHintCallback}
                disabled={isPlaying || game.isRunning}
                style={{ width: '100%' }}
              >
                💡 获取提示
              </Button>
            </div>
          </Card>

          {game.simulationResult && (
            <Card
              title={game.simulationResult.success ? '🎉 挑战成功！' : '💫 再试试吧'}
              size="sm"
              style={{
                background: game.simulationResult.success ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${game.simulationResult.success ? '#16a34a' : '#dc2626'}`
              }}
            >
              {game.simulationResult.success ? (
                <div>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span style={{ color: '#f59e0b' }}>
                        {'⭐'.repeat(game.simulationResult.stars)}
                      </span>
                      <span style={{ fontWeight: 'bold', color: '#16a34a' }}>
                        {game.simulationResult.stars} 星
                      </span>
                    </div>
                    <div style={{ fontSize: '14px', color: '#374151' }}>
                      用时 {game.simulationResult.steps} 步
                    </div>
                    {bestStepDifference !== null && bestStepDifference > 0 && (
                      <div style={{ fontSize: '14px', color: '#f59e0b' }}>
                        比最佳方案多 {bestStepDifference} 步
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleComplete}
                    style={{ width: '100%' }}
                  >
                    🏆 完成挑战
                  </Button>
                </div>
              ) : (
                <div>
                  <div style={{ marginBottom: '12px', fontSize: '14px', color: '#dc2626' }}>
                    {game.simulationResult.errorCode === 'E_COLLIDE' && '撞墙了！检查移动方向'}
                    {game.simulationResult.errorCode === 'E_GOAL_NOT_MET' && '未完成任务目标'}
                    {game.simulationResult.errorCode === 'E_STEP_LIMIT' && '超出步数限制'}
                    {game.simulationResult.errorCode === 'E_LOOP_DEPTH' && '循环嵌套过深'}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    已执行 {game.simulationResult.steps} 步
                  </div>
                </div>
              )}
            </Card>
          )}

          {game.hints.length > 0 && (
            <Card title="💡 最新提示" size="sm" style={{ background: '#fefce8' }}>
              <div style={{ fontSize: '14px', color: '#92400e' }}>
                {game.hints[game.hints.length - 1]}
              </div>
            </Card>
          )}
        </div>
      </div>

      {(level.hints?.length ?? 0) > 0 || level.comic || level.rewards?.outfit ? (
        <div
          style={{
            display: 'grid',
            gap: '1.5rem',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))'
          }}
        >
          {level.hints && level.hints.length > 0 && (
            <Card title="🧠 学习提示" size="sm">
              <ol style={{ margin: 0, paddingLeft: '20px', color: '#374151', lineHeight: 1.6 }}>
                {level.hints.map((hint, index) => (
                  <li key={index}>{hint}</li>
                ))}
              </ol>
            </Card>
          )}

          {level.comic && (
            <Card title="📖 教学漫画" size="sm" style={{ background: '#f5f3ff' }}>
              <p style={{ margin: 0, color: '#4c1d95', lineHeight: 1.6 }}>{level.comic}</p>
            </Card>
          )}

          {level.rewards?.outfit && (
            <Card title="🏅 成就奖励" size="sm" style={{ background: '#ecfeff' }}>
              <div style={{ color: '#0f172a', fontSize: '14px' }}>解锁新装扮：{level.rewards.outfit}</div>
              {bestStepDifference !== null && (
                <p style={{ margin: '8px 0 0', color: '#0369a1', fontSize: '13px' }}>
                  {bestStepDifference > 0
                    ? `再优化 ${bestStepDifference} 步即可追平最佳记录`
                    : '已经追平或超越了最佳记录，太棒了！'}
                </p>
              )}
            </Card>
          )}
        </div>
      ) : null}

      {/* 提示弹窗 */}
      <Modal
        title="💡 编程提示"
        open={showHint}
        onClose={() => setShowHint(false)}
        primaryAction={{ label: '明白了', onClick: () => setShowHint(false) }}
      >
        {game.hints.length > 0 ? (
          <div>
            <div style={{ marginBottom: '16px', fontSize: '16px', color: '#374151' }}>
              {game.hints[game.hints.length - 1]}
            </div>
            {game.hints.length > 1 && (
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#6b7280' }}>历史提示:</h4>
                <ol style={{ margin: 0, paddingLeft: '20px' }}>
                  {game.hints.slice(0, -1).map((hint, index) => (
                    <li key={index} style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>
                      {hint}
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#6b7280' }}>
            暂无提示，继续尝试！
          </div>
        )}
      </Modal>

      {/* 完成挑战弹窗 */}
      <Modal
        title="🎉 挑战完成！"
        open={showResult}
        onClose={() => setShowResult(false)}
        primaryAction={{
          label: '继续冒险',
          onClick: handleContinue
        }}
        secondaryAction={{
          label: '再次挑战',
          onClick: () => {
            setShowResult(false);
            handleReset();
          }
        }}
      >
        {game.simulationResult?.success && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🏆</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#16a34a' }}>
              恭喜完成挑战！
            </div>
            <div style={{ fontSize: '18px', marginBottom: '16px' }}>
              <span style={{ color: '#f59e0b' }}>
                {'⭐'.repeat(game.simulationResult.stars)}
              </span>
              <span style={{ marginLeft: '8px', color: '#374151' }}>
                {game.simulationResult.stars} 星
              </span>
            </div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>
              用时 {game.simulationResult.steps} 步，获得了 {game.simulationResult.stars} 星评价
            </div>
            {level.rewards?.outfit && (
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#7c3aed' }}>
                解锁新装扮：{level.rewards.outfit}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlayPage;
