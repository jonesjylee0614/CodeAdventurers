import * as React from 'react';
import * as Engine from '../../../packages/engine/src/index.ts';

type LevelDefinition = Engine.LevelDefinition;
type Tile = Engine.Tile;
type Direction = Engine.Direction;

interface LevelEditorProps {
  initialLevel?: Partial<LevelDefinition>;
  onSave: (level: LevelDefinition) => void;
  onCancel: () => void;
}

type EditorTool = 'walkable' | 'obstacle' | 'collectible' | 'start' | 'goal' | 'erase';

export const LevelEditor: React.FC<LevelEditorProps> = ({ 
  initialLevel, 
  onSave, 
  onCancel 
}) => {
  const [level, setLevel] = React.useState<Partial<LevelDefinition>>({
    id: '',
    name: '新关卡',
    width: 8,
    height: 6,
    tiles: [],
    start: { x: 0, y: 0, facing: 'east' },
    goal: { reach: { x: 7, y: 5 } },
    bestSteps: 10,
    hints: ['尝试向前移动', '检查路径是否正确', '使用重复积木优化步数'],
    ...initialLevel
  });

  const [selectedTool, setSelectedTool] = React.useState<EditorTool>('walkable');
  const [isDrawing, setIsDrawing] = React.useState(false);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  const CELL_SIZE = 50;
  const CANVAS_WIDTH = (level.width || 8) * CELL_SIZE;
  const CANVAS_HEIGHT = (level.height || 6) * CELL_SIZE;

  // 获取指定位置的瓦片
  const getTileAt = React.useCallback((x: number, y: number): Tile | undefined => {
    return level.tiles?.find(tile => tile.x === x && tile.y === y);
  }, [level.tiles]);

  // 设置瓦片
  const setTileAt = React.useCallback((x: number, y: number, tileData: Partial<Tile>) => {
    setLevel(prev => {
      const tiles = prev.tiles || [];
      const existingIndex = tiles.findIndex(tile => tile.x === x && tile.y === y);
      
      if (existingIndex >= 0) {
        // 更新现有瓦片
        const newTiles = [...tiles];
        newTiles[existingIndex] = { ...newTiles[existingIndex], ...tileData };
        return { ...prev, tiles: newTiles };
      } else {
        // 创建新瓦片
        const newTile: Tile = {
          x,
          y,
          walkable: true,
          ...tileData
        };
        return { ...prev, tiles: [...tiles, newTile] };
      }
    });
  }, []);

  // 删除瓦片
  const removeTileAt = React.useCallback((x: number, y: number) => {
    setLevel(prev => ({
      ...prev,
      tiles: (prev.tiles || []).filter(tile => !(tile.x === x && tile.y === y))
    }));
  }, []);

  // 绘制关卡场景
  const drawLevel = React.useCallback((ctx: CanvasRenderingContext2D) => {
    // 清空画布
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const width = level.width || 8;
    const height = level.height || 6;

    // 绘制网格
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    for (let x = 0; x <= width; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL_SIZE, 0);
      ctx.lineTo(x * CELL_SIZE, height * CELL_SIZE);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL_SIZE);
      ctx.lineTo(width * CELL_SIZE, y * CELL_SIZE);
      ctx.stroke();
    }

    // 绘制所有格子
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const tile = getTileAt(x, y);
        const pixelX = x * CELL_SIZE;
        const pixelY = y * CELL_SIZE;

        if (tile) {
          if (tile.walkable) {
            // 可行走区域
            ctx.fillStyle = '#e8f5e8';
            ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
          } else {
            // 障碍物
            ctx.fillStyle = '#424242';
            ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
          }

          // 收集物
          if (tile.collectible) {
            ctx.fillStyle = '#ffc107';
            ctx.font = '20px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⭐', pixelX + CELL_SIZE / 2, pixelY + CELL_SIZE / 2);
          }
        } else {
          // 空白区域
          ctx.fillStyle = '#f5f5f5';
          ctx.fillRect(pixelX, pixelY, CELL_SIZE, CELL_SIZE);
        }
      }
    }

    // 绘制起始位置
    if (level.start) {
      const startX = level.start.x * CELL_SIZE;
      const startY = level.start.y * CELL_SIZE;
      
      ctx.fillStyle = '#2196f3';
      ctx.beginPath();
      ctx.arc(startX + CELL_SIZE / 2, startY + CELL_SIZE / 2, CELL_SIZE / 3, 0, 2 * Math.PI);
      ctx.fill();

      // 方向指示
      ctx.fillStyle = 'white';
      ctx.font = '16px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const directionEmoji = {
        north: '⬆️',
        south: '⬇️',
        east: '➡️',
        west: '⬅️'
      }[level.start.facing];
      ctx.fillText(directionEmoji, startX + CELL_SIZE / 2, startY + CELL_SIZE / 2);
    }

    // 绘制目标位置
    if (level.goal?.reach) {
      const goalX = level.goal.reach.x * CELL_SIZE;
      const goalY = level.goal.reach.y * CELL_SIZE;
      
      ctx.fillStyle = '#4caf50';
      ctx.globalAlpha = 0.3;
      ctx.fillRect(goalX, goalY, CELL_SIZE, CELL_SIZE);
      ctx.globalAlpha = 1;
      
      ctx.fillStyle = '#2e7d32';
      ctx.font = '24px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('🏁', goalX + CELL_SIZE / 2, goalY + CELL_SIZE / 2);
    }
  }, [level, getTileAt, CANVAS_WIDTH, CANVAS_HEIGHT, CELL_SIZE]);

  // 处理画布点击
  const handleCanvasClick = React.useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((e.clientX - rect.left) / CELL_SIZE);
    const y = Math.floor((e.clientY - rect.top) / CELL_SIZE);

    const width = level.width || 8;
    const height = level.height || 6;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    switch (selectedTool) {
      case 'walkable':
        setTileAt(x, y, { walkable: true, collectible: undefined });
        break;
      case 'obstacle':
        setTileAt(x, y, { walkable: false, collectible: undefined });
        break;
      case 'collectible':
        setTileAt(x, y, { walkable: true, collectible: 'star' });
        break;
      case 'start':
        setLevel(prev => ({ ...prev, start: { x, y, facing: 'east' } }));
        break;
      case 'goal':
        setLevel(prev => ({ 
          ...prev, 
          goal: { ...prev.goal, reach: { x, y } }
        }));
        break;
      case 'erase':
        removeTileAt(x, y);
        break;
    }
  }, [selectedTool, level.width, level.height, setTileAt, removeTileAt, CELL_SIZE]);

  // 绘制场景
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawLevel(ctx);
  }, [drawLevel]);

  // 保存关卡
  const handleSave = () => {
    if (!level.id || !level.name) {
      alert('请填写关卡ID和名称');
      return;
    }

    const completeLevel: LevelDefinition = {
      id: level.id,
      name: level.name,
      width: level.width || 8,
      height: level.height || 6,
      tiles: level.tiles || [],
      start: level.start || { x: 0, y: 0, facing: 'east' },
      goal: level.goal || {},
      bestSteps: level.bestSteps || 10,
      hints: level.hints || []
    };

    onSave(completeLevel);
  };

  // 清空关卡
  const handleClear = () => {
    if (confirm('确定要清空关卡吗？')) {
      setLevel(prev => ({ ...prev, tiles: [] }));
    }
  };

  return (
    <div className="level-editor">
      <style>{`
        .level-editor {
          display: grid;
          grid-template-columns: 300px 1fr;
          height: 100vh;
          font-family: 'Microsoft YaHei', sans-serif;
        }

        .editor-sidebar {
          background: #f5f5f5;
          padding: 20px;
          overflow-y: auto;
        }

        .editor-main {
          padding: 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .form-group {
          margin-bottom: 16px;
        }

        .form-group label {
          display: block;
          margin-bottom: 4px;
          font-weight: 500;
          color: #333;
        }

        .form-group input, .form-group textarea {
          width: 100%;
          padding: 8px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
        }

        .form-group textarea {
          height: 80px;
          resize: vertical;
        }

        .size-inputs {
          display: flex;
          gap: 8px;
        }

        .size-inputs input {
          flex: 1;
        }

        .tool-section {
          margin-bottom: 20px;
        }

        .tool-section h4 {
          margin: 0 0 12px 0;
          color: #333;
        }

        .tool-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }

        .tool-btn {
          padding: 10px;
          border: 2px solid #ddd;
          border-radius: 6px;
          background: white;
          cursor: pointer;
          text-align: center;
          font-size: 12px;
          transition: all 0.2s;
        }

        .tool-btn:hover {
          border-color: #2196f3;
        }

        .tool-btn.active {
          border-color: #2196f3;
          background: #e3f2fd;
          color: #1976d2;
        }

        .tool-icon {
          display: block;
          font-size: 20px;
          margin-bottom: 4px;
        }

        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 20px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background: #4caf50;
          color: white;
        }

        .btn-primary:hover {
          background: #45a049;
        }

        .btn-secondary {
          background: #f44336;
          color: white;
        }

        .btn-secondary:hover {
          background: #da190b;
        }

        .btn-outline {
          background: white;
          color: #666;
          border: 1px solid #ddd;
        }

        .btn-outline:hover {
          background: #f5f5f5;
        }

        .editor-canvas {
          border: 2px solid #333;
          border-radius: 8px;
          cursor: crosshair;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }

        .canvas-info {
          margin-top: 16px;
          text-align: center;
          color: #666;
          font-size: 14px;
        }

        .hints-list {
          list-style: none;
          padding: 0;
        }

        .hints-list li {
          background: #f0f0f0;
          padding: 8px;
          margin: 4px 0;
          border-radius: 4px;
          font-size: 12px;
        }
      `}</style>

      {/* 侧边栏 */}
      <div className="editor-sidebar">
        <h3>关卡设置</h3>
        
        <div className="form-group">
          <label>关卡ID</label>
          <input
            type="text"
            value={level.id || ''}
            onChange={(e: any) => setLevel((prev: any) => ({ ...prev, id: e.target.value }))}
            placeholder="level-001"
          />
        </div>

        <div className="form-group">
          <label>关卡名称</label>
          <input
            type="text"
            value={level.name || ''}
            onChange={(e: any) => setLevel((prev: any) => ({ ...prev, name: e.target.value }))}
            placeholder="第一关"
          />
        </div>

        <div className="form-group">
          <label>地图尺寸</label>
          <div className="size-inputs">
            <input
              type="number"
              value={level.width || 8}
              onChange={(e: any) => setLevel((prev: any) => ({ ...prev, width: parseInt(e.target.value) || 8 }))}
              placeholder="宽度"
              min="3"
              max="20"
            />
            <input
              type="number"
              value={level.height || 6}
              onChange={(e: any) => setLevel((prev: any) => ({ ...prev, height: parseInt(e.target.value) || 6 }))}
              placeholder="高度"
              min="3"
              max="15"
            />
          </div>
        </div>

        <div className="form-group">
          <label>最佳步数</label>
          <input
            type="number"
            value={level.bestSteps || 10}
            onChange={(e: any) => setLevel((prev: any) => ({ ...prev, bestSteps: parseInt(e.target.value) || 10 }))}
            min="1"
          />
        </div>

        <div className="tool-section">
          <h4>🛠️ 编辑工具</h4>
          <div className="tool-grid">
            <button
              className={`tool-btn ${selectedTool === 'walkable' ? 'active' : ''}`}
              onClick={() => setSelectedTool('walkable')}
            >
              <span className="tool-icon">✅</span>
              可行走
            </button>
            <button
              className={`tool-btn ${selectedTool === 'obstacle' ? 'active' : ''}`}
              onClick={() => setSelectedTool('obstacle')}
            >
              <span className="tool-icon">🚫</span>
              障碍物
            </button>
            <button
              className={`tool-btn ${selectedTool === 'collectible' ? 'active' : ''}`}
              onClick={() => setSelectedTool('collectible')}
            >
              <span className="tool-icon">⭐</span>
              收集物
            </button>
            <button
              className={`tool-btn ${selectedTool === 'start' ? 'active' : ''}`}
              onClick={() => setSelectedTool('start')}
            >
              <span className="tool-icon">🏁</span>
              起点
            </button>
            <button
              className={`tool-btn ${selectedTool === 'goal' ? 'active' : ''}`}
              onClick={() => setSelectedTool('goal')}
            >
              <span className="tool-icon">🎯</span>
              终点
            </button>
            <button
              className={`tool-btn ${selectedTool === 'erase' ? 'active' : ''}`}
              onClick={() => setSelectedTool('erase')}
            >
              <span className="tool-icon">🧹</span>
              擦除
            </button>
          </div>
        </div>

        <div className="form-group">
          <label>提示文本 (每行一个)</label>
          <textarea
            value={(level.hints || []).join('\n')}
            onChange={(e: any) => setLevel((prev: any) => ({
              ...prev,
              hints: e.target.value.split('\n').filter((h: string) => h.trim())
            }))}
            placeholder="尝试向前移动&#10;检查路径是否正确&#10;使用重复积木优化步数"
          />
        </div>

        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleSave}>
            💾 保存关卡
          </button>
          <button className="btn btn-outline" onClick={handleClear}>
            🧹 清空地图
          </button>
          <button className="btn btn-secondary" onClick={onCancel}>
            ❌ 取消
          </button>
        </div>
      </div>

      {/* 主编辑区域 */}
      <div className="editor-main">
        <h2>关卡编辑器</h2>
        
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="editor-canvas"
          onClick={handleCanvasClick}
        />
        
        <div className="canvas-info">
          点击格子来编辑地图 • 当前工具: <strong>{
            selectedTool === 'walkable' ? '可行走区域' :
            selectedTool === 'obstacle' ? '障碍物' :
            selectedTool === 'collectible' ? '收集物' :
            selectedTool === 'start' ? '起始位置' :
            selectedTool === 'goal' ? '目标位置' : '擦除'
          }</strong>
        </div>
      </div>
    </div>
  );
};
