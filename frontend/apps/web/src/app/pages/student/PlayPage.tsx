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
  const [isAnimating, setIsAnimating] = useState(false);
  const [playbackStep, setPlaybackStep] = useState(-1);
  const [editorResetTick, setEditorResetTick] = useState(0);
  const [isFetching, setIsFetching] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showLearningPanel, setShowLearningPanel] = useState(false);

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
    setIsAnimating(false);
    setPlaybackStep(-1);
    setStartTime(Date.now());
    setEditorResetTick((tick) => tick + 1);
  }, [resetGame, setProgram]);

  const handleRunButton = async () => {
    if (!level) return;

    setIsAnimating(false);
    setPlaybackStep(-1);
    const result = await runProgram();
    if (result?.log?.length) {
      setIsAnimating(true);
    }
  };

  const handleReset = () => {
    performReset();
  };

  const handleGetHint = async () => {
    setIsAnimating(false);
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
    setIsAnimating(false);
    setPlaybackStep(-1);
    const result = await runProgram(program);
    if (result?.log?.length) {
      setIsAnimating(true);
    }
    return result || { success: false, steps: 0, stars: 0, log: [] };
  }, [runProgram, setProgram]);

  const handleResetCallback = useCallback(() => {
    performReset();
  }, [performReset]);

  const handleGetHintCallback = useCallback(async () => {
    setIsAnimating(false);
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
  const activeStepCount = lastRunSteps ?? currentProgramSteps;
  const totalSimulationSteps = game.simulationResult?.log?.length ?? 0;
  const hasPlayback = totalSimulationSteps > 0;
  const isProgramRunning = game.isRunning;
  const isOverStepLimit = stepLimit !== undefined && activeStepCount > stepLimit;
  const remainingSteps = stepLimit !== undefined ? Math.max(stepLimit - activeStepCount, 0) : null;
  const stepProgressRatio = stepLimit && stepLimit > 0
    ? Math.min(activeStepCount / stepLimit, 1)
    : null;
  const starCount = game.simulationResult?.stars ?? 0;
  const maxStars = 3;
  const bestStepReference = level?.bestSteps ?? null;
  const bestStepDifference =
    bestStepReference !== null && lastRunSteps !== null
      ? Math.max(lastRunSteps - bestStepReference, 0)
      : null;
  const metadataBest = game.simulationResult?.metadata?.bestSteps ?? bestStepReference;
  const finalPlaybackStep = hasPlayback ? game.simulationResult!.log[totalSimulationSteps - 1] : null;
  const goalPosition = victoryCondition?.reach ?? null;
  const stepsToGoal = !game.simulationResult?.success && goalPosition && finalPlaybackStep
    ? Math.abs(goalPosition.x - finalPlaybackStep.position.x) + Math.abs(goalPosition.y - finalPlaybackStep.position.y)
    : null;
  const remainingCollectibles = game.simulationResult?.remainingCollectibles ?? null;
  const latestHint = game.hints.length > 0 ? game.hints[game.hints.length - 1] : null;
  const isAtPlaybackEnd = hasPlayback && playbackStep >= totalSimulationSteps - 1;
  const isAtPlaybackStart = playbackStep <= -1;
  const hintsCount = level?.hints?.length ?? 0;
  const hasLearningContent = hintsCount > 0 || Boolean(level?.comic) || Boolean(level?.rewards?.outfit);
  const progressBarWidth = stepProgressRatio !== null ? `${Math.round(stepProgressRatio * 100)}%` : '0%';
  const progressBarBackground = isOverStepLimit ? '#fee2e2' : '#e0f2fe';
  const progressBarFill = isOverStepLimit ? '#ef4444' : '#0ea5e9';
  const stepStatusLabel = stepLimit !== undefined
    ? isOverStepLimit
      ? `超出 ${activeStepCount - stepLimit} 步（上限 ${stepLimit}）`
      : `已用 ${activeStepCount}/${stepLimit} 步`
    : `当前程序步数 ${activeStepCount}`;
  const playbackStepLabel = hasPlayback
    ? `回放进度：第 ${Math.max(playbackStep + 1, 0)}/${totalSimulationSteps} 步`
    : '运行后可以回放每一步路径';
  const playbackToggleLabel = isAnimating
    ? '⏸ 暂停回放'
    : isAtPlaybackEnd
      ? '⏯ 重播'
      : '▶️ 播放回放';
  const runButtonLabel = isProgramRunning ? '运行中...' : '▶️ 运行程序';
  const runButtonDisabled = isProgramRunning || currentProgramSteps === 0;
  const playbackControlsDisabled = !hasPlayback || isProgramRunning;
  const stepBackwardDisabled = playbackControlsDisabled || isAtPlaybackStart;
  const stepForwardDisabled = playbackControlsDisabled || isAtPlaybackEnd;
  const replayDisabled = playbackControlsDisabled;
  const togglePlaybackDisabled = playbackControlsDisabled || totalSimulationSteps === 0;
  const resetDisabled = isProgramRunning;
  const attemptCount = game.attempts;
  const hintCount = game.hints.length;
  const historicalBest = levelProgress?.steps ?? null;
  const stepBadgeTone = isOverStepLimit
    ? 'danger'
    : remainingSteps !== null && remainingSteps <= 2
      ? 'warning'
      : 'info';
  const stepBadgeText = stepLimit !== undefined
    ? isOverStepLimit
      ? `超出 ${activeStepCount - stepLimit} 步（上限 ${stepLimit}）`
      : `已用 ${activeStepCount}/${stepLimit} 步`
    : `当前程序步数 ${activeStepCount}`;
  const starBadgeTone = starCount >= maxStars ? 'success' : starCount > 0 ? 'info' : 'warning';
  const starBadgeText = starCount > 0 ? `已获 ${starCount} 星` : '尚未获得星星';
  const starGoalLabel = metadataBest ? `3⭐ ≤ ${metadataBest} 步` : null;

  useEffect(() => {
    if (!game.simulationResult) {
      setPlaybackStep(-1);
      setIsAnimating(false);
      return;
    }

    if (!hasPlayback) {
      setPlaybackStep(-1);
      setIsAnimating(false);
    } else {
      setPlaybackStep(-1);
    }
  }, [game.simulationResult, hasPlayback]);

  useEffect(() => {
    if (isProgramRunning) {
      setIsAnimating(false);
    }
  }, [isProgramRunning]);

  const handlePlaybackComplete = useCallback(() => {
    setIsAnimating(false);
  }, []);

  const handleStepBackward = useCallback(() => {
    if (!hasPlayback) return;
    setIsAnimating(false);
    setPlaybackStep((prev) => Math.max(prev - 1, -1));
  }, [hasPlayback]);

  const handleStepForward = useCallback(() => {
    if (!hasPlayback) return;
    setIsAnimating(false);
    setPlaybackStep((prev) => {
      if (totalSimulationSteps === 0) return prev;
      const next = Math.min(prev + 1, totalSimulationSteps - 1);
      return next;
    });
  }, [hasPlayback, totalSimulationSteps]);

  const handleReplay = useCallback(() => {
    if (!hasPlayback) return;
    setIsAnimating(false);
    setPlaybackStep(-1);
    setIsAnimating(true);
  }, [hasPlayback]);

  const handleTogglePlayback = useCallback(() => {
    if (!hasPlayback) return;
    if (isAnimating) {
      setIsAnimating(false);
      return;
    }

    if (isAtPlaybackEnd) {
      setPlaybackStep(-1);
    }
    setIsAnimating(true);
  }, [hasPlayback, isAnimating, isAtPlaybackEnd]);

  const simulationResult = game.simulationResult;
  let feedbackTitle = '等待运行';
  let feedbackTone: 'neutral' | 'success' | 'danger' = 'neutral';
  const feedbackLines: string[] = [];
  const recommendationLines: string[] = [];

  if (simulationResult) {
    if (simulationResult.success) {
      feedbackTitle = '🎉 挑战成功';
      feedbackTone = 'success';
      feedbackLines.push(`本次在 ${simulationResult.steps} 步内完成任务，获得 ${simulationResult.stars} 星。`);
      if (bestStepDifference !== null && bestStepDifference > 0 && metadataBest !== null) {
        recommendationLines.push(`再减少 ${bestStepDifference} 步即可追平最佳 ${metadataBest} 步。`);
      } else if (metadataBest !== null) {
        recommendationLines.push(`已经达到最佳 ${metadataBest} 步，太棒了！`);
      }
    } else {
      feedbackTitle = '💡 再试试吧';
      feedbackTone = 'danger';
      feedbackLines.push(`程序执行了 ${simulationResult.steps} 步，但尚未满足关卡目标。`);

      switch (simulationResult.errorCode) {
        case 'E_STEP_LIMIT':
          if (stepLimit !== undefined) {
            recommendationLines.push(`超出步数上限 ${stepLimit} 步，试着合并重复动作或使用循环积木。`);
          }
          break;
        case 'E_COLLIDE': {
          const collisionIndex = simulationResult.log.findIndex((step: any) => {
            const tile = level?.tiles?.find((t) => t.x === step.position.x && t.y === step.position.y);
            return tile ? !tile.walkable : false;
          });
          if (collisionIndex >= 0) {
            recommendationLines.push(`第 ${collisionIndex + 1} 步撞上障碍，尝试在该动作前调整转向。`);
          } else {
            recommendationLines.push('与障碍发生碰撞，试着提前在障碍前插入转弯动作。');
          }
          break;
        }
        case 'E_GOAL_NOT_MET':
          if (stepsToGoal !== null && goalPosition && finalPlaybackStep) {
            const dx = goalPosition.x - finalPlaybackStep.position.x;
            const dy = goalPosition.y - finalPlaybackStep.position.y;
            const parts: string[] = [];
            if (dy !== 0) {
              parts.push(`${Math.abs(dy)} 格向${dy > 0 ? '下' : '上'}`);
            }
            if (dx !== 0) {
              parts.push(`${Math.abs(dx)} 格向${dx > 0 ? '右' : '左'}`);
            }
            if (parts.length > 0) {
              recommendationLines.push(`终点还差 ${parts.join('，')}，检查倒数两步的方向。`);
            } else {
              recommendationLines.push('尚未抵达终点，检查最后一步是否前进到终点格子。');
            }
          }
          break;
        default:
          break;
      }

      if (remainingCollectibles && remainingCollectibles > 0) {
        recommendationLines.push(`还有 ${remainingCollectibles} 个目标未收集，记得加入“收集”积木。`);
      }
    }
  } else {
    feedbackLines.push('构建程序后点击“运行程序”即可查看反馈。');
  }

  if (simulationResult && recommendationLines.length === 0) {
    recommendationLines.push('需要灵感？点击“获取提示”可以查看逐步引导。');
  }

  const feedbackStyle = (() => {
    switch (feedbackTone) {
      case 'success':
        return { background: '#f0fdf4', border: '#86efac', heading: '#15803d', text: '#166534' };
      case 'danger':
        return { background: '#fef2f2', border: '#fecaca', heading: '#b91c1c', text: '#7f1d1d' };
      default:
        return { background: '#f9fafb', border: '#e5e7eb', heading: '#111827', text: '#374151' };
    }
  })();

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
      <Card
        title={`🎯 ${level.name}`}
        subtitle="编程挑战区 · 拖拽积木完成任务"
        style={{ background: '#ffffff', border: '1px solid #f3f4f6' }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            gap: '16px',
            marginTop: '12px'
          }}
        >
          <div
            style={{
              display: 'grid',
              gap: '12px',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))'
            }}
          >
            <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>最佳步数</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{metadataBest ?? bestStepReference ?? '—'}</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>历史最佳</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>
                {historicalBest !== null ? `${historicalBest} 步` : '暂无记录'}
              </div>
            </div>
            <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>尝试次数</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{attemptCount}</div>
            </div>
            <div style={{ background: '#f9fafb', padding: '8px 12px', borderRadius: '10px' }}>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>提示次数</div>
              <div style={{ fontSize: '18px', fontWeight: 600 }}>{hintCount}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={resetDisabled}
            >
              🔄 清空程序
            </Button>
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
          gridTemplateColumns: 'minmax(360px, 1.05fr) minmax(420px, 1.15fr) minmax(320px, 0.85fr)',
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
                <Badge tone={stepBadgeTone}>🕒 {stepBadgeText}</Badge>
                <Badge tone={starBadgeTone}>⭐ {starBadgeText}</Badge>
                {starGoalLabel && <Badge tone="info">🎯 {starGoalLabel}</Badge>}
              </div>
              {hasPlayback && (
                <Badge tone={isAnimating ? 'info' : 'default'}>
                  {playbackStepLabel}
                </Badge>
              )}
            </div>

            <div style={{ marginBottom: '12px' }}>
              <GameCanvas
                level={level}
                simulationResult={game.simulationResult}
                isPlaying={isAnimating}
                playbackSpeed={450}
                playbackStep={playbackStep}
                onStepChange={setPlaybackStep}
                onPlaybackComplete={handlePlaybackComplete}
              />
            </div>

            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{playbackStepLabel}</div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleRunButton}
                  disabled={runButtonDisabled}
                  loading={isProgramRunning}
                >
                  {runButtonLabel}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleTogglePlayback}
                  disabled={togglePlaybackDisabled}
                >
                  {playbackToggleLabel}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStepBackward}
                  disabled={stepBackwardDisabled}
                >
                  ⏮ 上一步
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStepForward}
                  disabled={stepForwardDisabled}
                >
                  ⏭ 下一步
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReplay}
                  disabled={replayDisabled}
                >
                  🔁 重播
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleReset}
                  disabled={resetDisabled}
                >
                  🧹 回到起点
                </Button>
              </div>
            </div>
          </Card>
        </div>

        <Card title="🎯 任务与反馈" size="sm">
          <div style={{ display: 'grid', gap: '16px', fontSize: '14px', color: '#374151' }}>
            <div style={{ display: 'grid', gap: '6px' }}>
              <strong style={{ fontSize: '15px' }}>关卡目标</strong>
              {victoryCondition?.reach && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🚩</span>
                  <span>抵达坐标 ({victoryCondition.reach.x}, {victoryCondition.reach.y})</span>
                </div>
              )}
              {victoryCondition?.collectibles !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>⭐</span>
                  <span>收集所有目标物</span>
                </div>
              )}
              {stepLimit !== undefined && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '18px' }}>🕒</span>
                  <span>在 {stepLimit} 步内完成挑战</span>
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>步数进度</span>
                <span style={{ color: isOverStepLimit ? '#dc2626' : '#0f766e', fontWeight: 600 }}>
                  {stepStatusLabel}
                </span>
              </div>
              {stepLimit !== undefined && (
                <div
                  style={{
                    position: 'relative',
                    height: '8px',
                    borderRadius: '999px',
                    background: progressBarBackground,
                    overflow: 'hidden'
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      height: '100%',
                      width: progressBarWidth,
                      background: progressBarFill,
                      transition: 'width 0.3s ease'
                    }}
                  />
                </div>
              )}
            </div>

            <div style={{ display: 'grid', gap: '6px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>历史最佳</span>
                <strong>{historicalBest !== null ? `${historicalBest} 步` : '暂无记录'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>当前程序</span>
                <strong>{activeStepCount} 步</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>已运行次数</span>
                <strong>{attemptCount}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>使用提示</span>
                <strong>{hintCount}</strong>
              </div>
            </div>

            {allowedBlocks && allowedBlocks.length > 0 && (
              <div style={{ display: 'grid', gap: '8px' }}>
                <strong>可用积木</strong>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {allowedBlocks.map((block: string) => (
                    <Badge key={block} tone="info">{BLOCK_LABELS[block] ?? block}</Badge>
                  ))}
                </div>
              </div>
            )}

            <div
              style={{
                background: feedbackStyle.background,
                border: `1px solid ${feedbackStyle.border}`,
                borderRadius: '12px',
                padding: '12px'
              }}
            >
              <div style={{ fontWeight: 600, color: feedbackStyle.heading, marginBottom: '6px' }}>
                {feedbackTitle}
              </div>
              {feedbackLines.map((line, index) => (
                <p key={index} style={{ margin: '4px 0', color: feedbackStyle.text }}>
                  {line}
                </p>
              ))}
              {recommendationLines.length > 0 && (
                <ul style={{ margin: '8px 0 0 18px', padding: 0, color: feedbackStyle.text }}>
                  {recommendationLines.map((line, index) => (
                    <li key={index} style={{ marginBottom: '4px' }}>{line}</li>
                  ))}
                </ul>
              )}
            </div>

            {latestHint && (
              <div style={{ background: '#fefce8', borderRadius: '10px', padding: '10px', color: '#92400e' }}>
                <strong>最新提示：</strong>
                <span>{latestHint}</span>
              </div>
            )}

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleGetHintCallback}
                disabled={isProgramRunning}
              >
                💡 获取提示
              </Button>
              {simulationResult?.success && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleComplete}
                  disabled={isProgramRunning}
                >
                  🏆 完成挑战
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>

      {hasLearningContent && (
        <Card title="📘 学习支援" size="sm">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <div style={{ fontSize: '14px', color: '#374151' }}>
              提供 {hintsCount} 条关卡提示{level?.comic ? '、教学漫画' : ''}{level?.rewards?.outfit ? ' 与奖励信息' : ''}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLearningPanel((value) => !value)}
            >
              {showLearningPanel ? '收起内容' : '展开查看'}
            </Button>
          </div>

          {showLearningPanel && (
            <div style={{ marginTop: '12px', display: 'grid', gap: '12px', color: '#374151' }}>
              {level?.hints && level.hints.length > 0 && (
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>学习提示</h4>
                  <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 1.6 }}>
                    {level?.hints?.map((hint, index) => (
                      <li key={index}>{hint}</li>
                    ))}
                  </ol>
                </div>
              )}

              {level?.comic && (
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>教学漫画</h4>
                  <p style={{ margin: 0, lineHeight: 1.6 }}>{level.comic}</p>
                </div>
              )}

              {level?.rewards?.outfit && (
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px' }}>成就奖励</h4>
                  <p style={{ margin: 0 }}>通关可解锁新装扮：{level?.rewards?.outfit}</p>
                </div>
              )}
            </div>
          )}
        </Card>
      )}

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
            {level?.rewards?.outfit && (
              <div style={{ marginTop: '12px', fontSize: '14px', color: '#7c3aed' }}>
                解锁新装扮：{level?.rewards?.outfit}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlayPage;
