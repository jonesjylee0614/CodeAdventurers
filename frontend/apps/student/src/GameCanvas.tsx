import * as React from 'react';
import * as Engine from '../../../packages/engine/src/index.ts';

type LevelDefinition = Engine.LevelDefinition;
type SimulationResult = Engine.SimulationResult;
type SimulationStep = Engine.SimulationStep;
type Direction = Engine.Direction;

interface GameCanvasProps {
  level: LevelDefinition;
  simulationResult?: SimulationResult;
  isPlaying?: boolean;
  playbackSpeed?: number;
  playbackStep?: number;
  onStepChange?: (step: number) => void;
  onPlaybackComplete?: () => void;
}

interface Position {
  x: number;
  y: number;
  facing: Direction;
}

export const GameCanvas: React.FC<GameCanvasProps> = ({
  level,
  simulationResult,
  isPlaying = false,
  playbackSpeed = 500,
  playbackStep,
  onStepChange,
  onPlaybackComplete
}) => {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [currentStep, setCurrentStep] = React.useState(-1);
  const [playerPosition, setPlayerPosition] = React.useState<Position>({
    x: level.start.x,
    y: level.start.y,
    facing: level.start.facing
  });
  const [collectedItems, setCollectedItems] = React.useState<Set<string>>(new Set());

  const totalSteps = simulationResult?.log.length ?? 0;

  const CELL_SIZE = 60;
  const CANVAS_WIDTH = level.width * CELL_SIZE;
  const CANVAS_HEIGHT = level.height * CELL_SIZE;

  const computeCollected = React.useCallback((stepIndex: number) => {
    if (!simulationResult || stepIndex < 0) {
      return new Set<string>();
    }

    const collected = new Set<string>();
    const log = simulationResult.log;

    for (let i = 0; i <= stepIndex && i < log.length; i++) {
      const step = log[i];
      if (step.instruction.type === 'collect') {
        const collectible = level.tiles.find(
          tile => tile.x === step.position.x &&
                  tile.y === step.position.y &&
                  tile.collectible
        );

        if (collectible) {
          collected.add(`${collectible.x}:${collectible.y}:${collectible.collectible}`);
        }
      }
    }

    return collected;
  }, [simulationResult, level.tiles]);

  // 绘制游戏场景
  const drawScene = React.useCallback((ctx: CanvasRenderingContext2D, position: Position, collected: Set<string>) => {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // 绘制网格背景
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    for (let x = 0; x <= level.width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let y = 0; y <= level.height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, y * CELL_SIZE);
      ctx.stroke();
    }

    // 绘制地图瓦片
    level.tiles.forEach(tile => {
      const pixelX = tile.x * CELL_SIZE;
      const pixelY = tile.y * CELL_SIZE;

      if (tile.walkable) {
        // 可行走区域 - 浅绿色
        ctx.fillStyle = '#e8f5e8';
        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
      } else {
        // 障碍物 - 深灰色
        ctx.fillStyle = '#424242';
        ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
      }

      // 绘制收集物
      if (tile.collectible && !collected.has(`${tile.x}:${tile.y}:${tile.collectible}`)) {
        ctx.fillStyle = '#ffc107';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(
          '⭐', 
          pixelX + CELL_SIZE / 2, 
          pixelY + CELL_SIZE / 2
        );
      }
    });

    // 绘制目标位置
    if (level.goal.reach) {
      const goalX = level.goal.reach.x * CELL_SIZE;
      const goalY = level.goal.reach.y * CELL_SIZE;
      
      ctx.fillStyle = '#4caf50';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(goalX, goalY, CELL_SIZE, CELL_SIZE);
      ctx.globalAlpha = 1;
      
      ctx.fillStyle = '#2e7d32';
      ctx.font = '30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏁', goalX + CELL_SIZE / 2, goalY + CELL_SIZE / 2);
    }

    // 绘制玩家角色
    const playerX = position.x * CELL_SIZE;
    const playerY = position.y * CELL_SIZE;

    // 玩家背景圆圈
    ctx.fillStyle = '#2196f3';
    ctx.beginPath();
    ctx.arc(
      playerX + CELL_SIZE / 2, 
      playerY + CELL_SIZE / 2, 
      CELL_SIZE / 3, 
      0, 
      2 * Math.PI
    );
    ctx.fill();

    // 根据方向绘制玩家
    ctx.fillStyle = 'white';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    let playerEmoji = '🤖';
    switch (position.facing) {
      case 'north': playerEmoji = '⬆️'; break;
      case 'south': playerEmoji = '⬇️'; break;
      case 'east': playerEmoji = '➡️'; break;
      case 'west': playerEmoji = '⬅️'; break;
    }
    
    ctx.fillText(
      playerEmoji,
      playerX + CELL_SIZE / 2,
      playerY + CELL_SIZE / 2
    );

    // 绘制轨迹（如果有模拟结果）
    if (simulationResult && simulationResult.log.length > 0) {
      ctx.strokeStyle = '#ff9800';
      ctx.lineWidth = 3;
      ctx.setLineDash([5, 5]);
      ctx.globalAlpha = 0.6;

      ctx.beginPath();
      ctx.moveTo(
        level.start.x * CELL_SIZE + CELL_SIZE / 2,
        level.start.y * CELL_SIZE + CELL_SIZE / 2
      );

      const visibleSteps = currentStep < 0
        ? []
        : simulationResult.log.slice(0, currentStep + 1);

      visibleSteps.forEach(step => {
        ctx.lineTo(
          step.position.x * CELL_SIZE + CELL_SIZE / 2,
          step.position.y * CELL_SIZE + CELL_SIZE / 2
        );
      });
      
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
    }
  }, [level, simulationResult, currentStep, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE]);

  // 播放动画
  React.useEffect(() => {
    if (!isPlaying || !simulationResult || simulationResult.log.length === 0) {
      return;
    }

    if (currentStep >= simulationResult.log.length - 1) {
      onPlaybackComplete?.();
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= simulationResult.log.length - 1) {
          clearInterval(interval);
          onPlaybackComplete?.();
          return simulationResult.log.length - 1;
        }

        const next = prev + 1;
        const step = simulationResult.log[next];
        if (step) {
          setPlayerPosition(step.position);
          setCollectedItems(computeCollected(next));
        }
        return next;
      });
    }, playbackSpeed);

    return () => clearInterval(interval);
  }, [isPlaying, simulationResult, playbackSpeed, computeCollected, onPlaybackComplete, currentStep]);

  // 绘制场景
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawScene(ctx, playerPosition, collectedItems);
  }, [drawScene, playerPosition, collectedItems]);

  // 同步外部步数控制
  React.useEffect(() => {
    if (typeof playbackStep === 'number' && playbackStep !== currentStep) {
      if (playbackStep < 0) {
        setPlayerPosition({
          x: level.start.x,
          y: level.start.y,
          facing: level.start.facing
        });
        setCollectedItems(new Set());
      }
      setCurrentStep(playbackStep);
      if (simulationResult && playbackStep >= 0 && simulationResult.log[playbackStep]) {
        const step = simulationResult.log[playbackStep];
        setPlayerPosition(step.position);
        setCollectedItems(computeCollected(playbackStep));
      }
    }
  }, [playbackStep, currentStep, simulationResult, computeCollected, level.start]);

  // 当关卡或模拟结果变化时重置
  React.useEffect(() => {
    setCurrentStep(-1);
    setPlayerPosition({
      x: level.start.x,
      y: level.start.y,
      facing: level.start.facing
    });
    setCollectedItems(new Set());
  }, [level.start, level.width, level.height, simulationResult?.success]);

  React.useEffect(() => {
    onStepChange?.(currentStep);
  }, [currentStep, onStepChange]);

  return (
    <div className="game-canvas-container">
      <style>{`
        .game-canvas-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 16px;
          background: #f5f5f5;
          border-radius: 8px;
        }

        .game-canvas {
          border: 2px solid #333;
          border-radius: 8px;
          background: white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .game-info {
          margin-top: 12px;
          display: flex;
          gap: 16px;
          font-family: 'Microsoft YaHei', sans-serif;
        }

        .info-item {
          background: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
      `}</style>

      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        className="game-canvas"
      />
      
      <div className="game-info">
        <div className="info-item">
          📍 位置: ({playerPosition.x}, {playerPosition.y})
        </div>
        <div className="info-item">
          🧭 朝向: {
            playerPosition.facing === 'north' ? '北' :
            playerPosition.facing === 'south' ? '南' :
            playerPosition.facing === 'east' ? '东' : '西'
          }
        </div>
        <div className="info-item">
          ⭐ 收集: {collectedItems.size}/{level.tiles.filter(t => t.collectible).length}
        </div>
        {simulationResult && totalSteps > 0 && (
          <div className="info-item">
            📊 步进: {Math.max(currentStep + 1, 0)}/{totalSteps}
          </div>
        )}
      </div>
    </div>
  );
};
