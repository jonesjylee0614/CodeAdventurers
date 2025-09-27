import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Badge } from '../../../components/ui/Badge';
import { Progress } from '../../../components/ui/Progress';
import { Skeleton } from '../../../components/ui/Skeleton';
import { useAppStore } from '../../../store/useAppStore';
import { BlockEditor } from '../../../../student/src/BlockEditor';
import { GameCanvas } from '../../../../student/src/GameCanvas';
import { Level } from '../../../services/api/client';
import { apiClient } from '../../../services/api/client';

const PlayPage = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const navigate = useNavigate();
  
  const [level, setLevel] = useState<Level | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [levelPrep, setLevelPrep] = useState<any>(null);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isPlaying, setIsPlaying] = useState(false);
  
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
    setProgram
  } = useAppStore();

  // 重定向到登录页面如果未登录
  useEffect(() => {
    if (!isLoggedIn) {
      navigate('/auth');
      return;
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

    try {
      // 获取关卡准备数据
      const prepResponse = await apiClient.getLevelPrep(levelId);
      if (prepResponse.error) {
        console.error('获取关卡准备数据失败:', prepResponse.error);
        return;
      }
      
      setLevelPrep(prepResponse.data);
      
      // 加载示例关卡数据（实际应该从API获取）
      const response = await fetch('/levels/sample-1.json');
      const levelData: Level = await response.json();
      
      setLevel(levelData);
      setCurrentLevel(levelData);
      resetGame();
      setStartTime(Date.now());
      
    } catch (error) {
      console.error('加载关卡数据失败:', error);
    }
  };

  const handleRun = async () => {
    if (!level) return;
    
    setIsPlaying(true);
    await runProgram();
    setIsPlaying(false);
  };

  const handleReset = () => {
    resetGame();
    setIsPlaying(false);
    setStartTime(Date.now());
  };

  const handleGetHint = async () => {
    await getHint();
    setShowHint(true);
  };

  const handleComplete = async () => {
    if (!game.simulationResult?.success) return;
    
    const duration = Math.round((Date.now() - startTime) / 1000);
    
    await completeLevel({
      stars: game.simulationResult.stars,
      steps: game.simulationResult.steps,
      hints: game.hints.length,
      duration
    });
    
    setShowResult(true);
  };

  const handleContinue = () => {
    navigate('/student/levels');
  };

  if (loading || !level) {
    return (
      <div style={{ display: 'grid', gap: '1.5rem' }}>
        <Skeleton height={400} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
          <Skeleton height={200} />
          <Skeleton height={200} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Card title="加载失败">
        <p style={{ color: '#ef4444' }}>{error}</p>
        <Button onClick={() => window.location.reload()}>重新加载</Button>
      </Card>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>最佳步数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{level.bestSteps}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>尝试次数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{game.attempts}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.2)', padding: '8px 12px', borderRadius: '8px' }}>
              <div style={{ fontSize: '14px', opacity: 0.9 }}>提示次数</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold' }}>{game.hints.length}</div>
            </div>
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

      {/* 主要游戏界面 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: '1.5rem', minHeight: '600px' }}>
        {/* 左侧：游戏场景 */}
        <Card title="🎮 游戏场景" style={{ padding: '16px' }}>
          <GameCanvas
            level={level}
            simulationResult={game.simulationResult}
            isPlaying={isPlaying}
            playbackSpeed={500}
          />
        </Card>

        {/* 右侧：控制面板 */}
        <div style={{ display: 'grid', gap: '1rem', alignContent: 'start' }}>
          {/* 目标说明 */}
          <Card title="🎯 任务目标" size="sm">
            <div style={{ fontSize: '14px', color: '#374151' }}>
              {level.goal.reach && (
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🏁</span>
                  <span>到达位置 ({level.goal.reach.x}, {level.goal.reach.y})</span>
                </div>
              )}
              {level.goal.collectibles !== undefined && (
                <div style={{ marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⭐</span>
                  <span>收集所有宝石</span>
                </div>
              )}
              {level.goal.stepLimit && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>⚡</span>
                  <span>在 {level.goal.stepLimit} 步内完成</span>
                </div>
              )}
            </div>
          </Card>

          {/* 操作按钮 */}
          <Card title="🎮 游戏控制" size="sm">
            <div style={{ display: 'grid', gap: '8px' }}>
              <Button
                variant="primary"
                onClick={handleRun}
                disabled={isPlaying || game.isRunning || game.currentProgram.length === 0}
                loading={game.isRunning}
                style={{ width: '100%' }}
              >
                {game.isRunning ? '运行中...' : '▶️ 运行程序'}
              </Button>
              
              <Button
                variant="secondary"
                onClick={handleReset}
                disabled={isPlaying || game.isRunning}
                style={{ width: '100%' }}
              >
                🔄 重置
              </Button>
              
              <Button
                variant="ghost"
                onClick={handleGetHint}
                disabled={isPlaying || game.isRunning}
                style={{ width: '100%' }}
              >
                💡 获取提示
              </Button>
            </div>
          </Card>

          {/* 运行结果 */}
          {game.simulationResult && (
            <Card 
              title={game.simulationResult.success ? "🎉 挑战成功！" : "💫 再试试吧"} 
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
                    {game.simulationResult.steps > level.bestSteps && (
                      <div style={{ fontSize: '14px', color: '#f59e0b' }}>
                        比最佳方案多 {game.simulationResult.steps - level.bestSteps} 步
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

          {/* 提示信息 */}
          {game.hints.length > 0 && (
            <Card title="💡 提示" size="sm" style={{ background: '#fefce8' }}>
              <div style={{ fontSize: '14px', color: '#92400e' }}>
                {game.hints[game.hints.length - 1]}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* 积木编程区域 */}
      <Card title="🧩 积木编程区" subtitle="拖拽积木组建你的解决方案">
        <BlockEditor
          level={level}
          onRun={async (program) => {
            setProgram(program);
            const result = await runProgram();
            return result || { success: false, steps: 0, stars: 0, log: [] };
          }}
          onReset={handleReset}
        />
      </Card>

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
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PlayPage;
