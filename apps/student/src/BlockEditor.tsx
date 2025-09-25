import * as React from 'react';
import * as Engine from '../../../packages/engine/src/index.ts';

type Instruction = Engine.Instruction;
type LevelDefinition = Engine.LevelDefinition;
type SimulationResult = Engine.SimulationResult;

// 积木类型定义
interface BlockType {
  id: string;
  type: Instruction['type'];
  label: string;
  color: string;
  icon: string;
  category: 'action' | 'control' | 'condition';
}

// 可用积木库
const BLOCK_TYPES: BlockType[] = [
  { id: 'move', type: 'move', label: '向前移动', color: '#4CAF50', icon: '↑', category: 'action' },
  { id: 'turn-left', type: 'turn', label: '向左转', color: '#2196F3', icon: '↶', category: 'action' },
  { id: 'turn-right', type: 'turn', label: '向右转', color: '#2196F3', icon: '↷', category: 'action' },
  { id: 'collect', type: 'collect', label: '收集', color: '#FF9800', icon: '⭐', category: 'action' },
  { id: 'repeat', type: 'repeat', label: '重复', color: '#9C27B0', icon: '🔄', category: 'control' },
  { id: 'if', type: 'conditional', label: '如果', color: '#F44336', icon: '❓', category: 'condition' },
];

// 程序块实例
interface ProgramBlock {
  id: string;
  blockType: BlockType;
  instruction: Instruction;
  x: number;
  y: number;
  children?: ProgramBlock[];
}

interface BlockEditorProps {
  level: LevelDefinition;
  onRun: (program: Instruction[]) => Promise<SimulationResult>;
  onReset: () => void;
}

export const BlockEditor: React.FC<BlockEditorProps> = ({ level, onRun, onReset }: BlockEditorProps) => {
  const [programBlocks, setProgramBlocks] = React.useState<ProgramBlock[]>([]);
  const [draggedBlock, setDraggedBlock] = React.useState<BlockType | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<SimulationResult | null>(null);
  const programAreaRef = React.useRef<HTMLDivElement>(null);

  // 从积木块生成指令程序
  const blocksToProgram = React.useCallback((blocks: ProgramBlock[]): Instruction[] => {
    return blocks.map(block => {
      switch (block.blockType.type) {
        case 'move':
          return { type: 'move' };
        case 'turn':
          return { 
            type: 'turn', 
            direction: block.blockType.id === 'turn-left' ? 'left' : 'right' 
          } as Instruction;
        case 'collect':
          return { type: 'collect' };
        case 'repeat':
          return { 
            type: 'repeat', 
            times: 3, // 默认重复3次，可以设置为可编辑
            body: block.children ? blocksToProgram(block.children) : []
          };
        case 'conditional':
          return {
            type: 'conditional',
            condition: { type: 'tile-ahead-walkable' }, // 默认条件
            truthy: block.children ? blocksToProgram(block.children) : [],
            falsy: []
          };
        default:
          return { type: 'move' };
      }
    });
  }, []);

  // 处理积木拖拽开始
  const handleDragStart = (blockType: BlockType) => {
    setDraggedBlock(blockType);
  };

  // 处理放置到程序区
  const handleDrop = React.useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedBlock || !programAreaRef.current) return;

    const rect = programAreaRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newBlock: ProgramBlock = {
      id: Date.now().toString(),
      blockType: draggedBlock,
      instruction: { type: draggedBlock.type } as Instruction,
      x,
      y,
      children: draggedBlock.category === 'control' ? [] : undefined
    };

    setProgramBlocks((prev: ProgramBlock[]) => [...prev, newBlock]);
    setDraggedBlock(null);
  }, [draggedBlock]);

  // 运行程序
  const handleRun = async () => {
    setIsRunning(true);
    try {
      const program = blocksToProgram(programBlocks);
      const simulationResult = await onRun(program);
      setResult(simulationResult);
    } catch (error) {
      console.error('运行程序时出错:', error);
    } finally {
      setIsRunning(false);
    }
  };

  // 重置程序
  const handleReset = () => {
    setProgramBlocks([]);
    setResult(null);
    onReset();
  };

  // 删除积木
  const removeBlock = (blockId: string) => {
    setProgramBlocks((prev: ProgramBlock[]) => prev.filter((block: ProgramBlock) => block.id !== blockId));
  };

  return (
    <div className="block-editor">
      <style>{`
        .block-editor {
          display: grid;
          grid-template-columns: 200px 1fr 300px;
          height: 600px;
          gap: 16px;
          font-family: 'Microsoft YaHei', sans-serif;
        }

        .block-palette {
          background: #f5f5f5;
          border-radius: 8px;
          padding: 16px;
          overflow-y: auto;
        }

        .block-category {
          margin-bottom: 16px;
        }

        .block-category h4 {
          margin: 0 0 8px 0;
          color: #333;
          font-size: 14px;
        }

        .palette-block {
          display: flex;
          align-items: center;
          padding: 8px 12px;
          margin: 4px 0;
          border-radius: 6px;
          cursor: grab;
          user-select: none;
          transition: transform 0.2s;
          color: white;
          font-weight: 500;
        }

        .palette-block:hover {
          transform: scale(1.05);
        }

        .palette-block:active {
          cursor: grabbing;
        }

        .block-icon {
          margin-right: 8px;
          font-size: 16px;
        }

        .program-area {
          background: #fff;
          border: 2px dashed #ddd;
          border-radius: 8px;
          position: relative;
          overflow: hidden;
        }

        .program-area.drag-over {
          border-color: #4CAF50;
          background-color: #f0f8f0;
        }

        .program-block {
          position: absolute;
          padding: 8px 12px;
          border-radius: 6px;
          color: white;
          font-weight: 500;
          cursor: move;
          user-select: none;
          display: flex;
          align-items: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
        }

        .program-block .delete-btn {
          margin-left: 8px;
          background: rgba(255,255,255,0.3);
          border: none;
          border-radius: 3px;
          color: white;
          cursor: pointer;
          padding: 2px 6px;
          font-size: 12px;
        }

        .control-panel {
          background: #f9f9f9;
          border-radius: 8px;
          padding: 16px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .goal-section {
          background: #e3f2fd;
          border-radius: 6px;
          padding: 12px;
        }

        .goal-section h4 {
          margin: 0 0 8px 0;
          color: #1976d2;
        }

        .controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .btn {
          padding: 10px 16px;
          border: none;
          border-radius: 6px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .btn-primary {
          background: #4CAF50;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #45a049;
        }

        .btn-secondary {
          background: #f44336;
          color: white;
        }

        .btn-secondary:hover {
          background: #da190b;
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .result-panel {
          margin-top: 16px;
          padding: 12px;
          border-radius: 6px;
        }

        .result-success {
          background: #c8e6c9;
          color: #2e7d32;
        }

        .result-error {
          background: #ffcdd2;
          color: #c62828;
        }

        .empty-program {
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100%;
          color: #999;
          font-size: 18px;
        }
      `}</style>

      {/* 积木调色板 */}
      <div className="block-palette">
        <div className="block-category">
          <h4>🎯 动作积木</h4>
          {BLOCK_TYPES.filter(b => b.category === 'action').map(blockType => (
            <div
              key={blockType.id}
              className="palette-block"
              style={{ backgroundColor: blockType.color }}
              draggable
              onDragStart={() => handleDragStart(blockType)}
            >
              <span className="block-icon">{blockType.icon}</span>
              {blockType.label}
            </div>
          ))}
        </div>

        <div className="block-category">
          <h4>🔄 控制积木</h4>
          {BLOCK_TYPES.filter(b => b.category === 'control').map(blockType => (
            <div
              key={blockType.id}
              className="palette-block"
              style={{ backgroundColor: blockType.color }}
              draggable
              onDragStart={() => handleDragStart(blockType)}
            >
              <span className="block-icon">{blockType.icon}</span>
              {blockType.label}
            </div>
          ))}
        </div>

        <div className="block-category">
          <h4>❓ 条件积木</h4>
          {BLOCK_TYPES.filter(b => b.category === 'condition').map(blockType => (
            <div
              key={blockType.id}
              className="palette-block"
              style={{ backgroundColor: blockType.color }}
              draggable
              onDragStart={() => handleDragStart(blockType)}
            >
              <span className="block-icon">{blockType.icon}</span>
              {blockType.label}
            </div>
          ))}
        </div>
      </div>

      {/* 程序编辑区 */}
      <div
        ref={programAreaRef}
        className={`program-area ${draggedBlock ? 'drag-over' : ''}`}
        onDragOver={(e: React.DragEvent) => e.preventDefault()}
        onDrop={(e: React.DragEvent) => handleDrop(e)}
      >
        {programBlocks.length === 0 ? (
          <div className="empty-program">
            拖拽积木到这里开始编程 🧩
          </div>
        ) : (
          programBlocks.map((block: ProgramBlock) => (
            <div
              key={block.id}
              className="program-block"
              style={{
                backgroundColor: block.blockType.color,
                left: block.x,
                top: block.y
              }}
            >
              <span className="block-icon">{block.blockType.icon}</span>
              {block.blockType.label}
              <button
                className="delete-btn"
                onClick={() => removeBlock(block.id)}
                title="删除积木"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {/* 控制面板 */}
      <div className="control-panel">
        <div className="goal-section">
          <h4>🎯 目标</h4>
          <p>{level.name}</p>
          <p>最佳步数: {level.bestSteps}</p>
        </div>

        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={isRunning || programBlocks.length === 0}
          >
            {isRunning ? '运行中...' : '▶️ 运行程序'}
          </button>
          
          <button
            className="btn btn-secondary"
            onClick={handleReset}
          >
            🔄 重置
          </button>
        </div>

        {result && (
          <div className={`result-panel ${result.success ? 'result-success' : 'result-error'}`}>
            {result.success ? (
              <>
                <h4>🎉 成功通关！</h4>
                <p>步数: {result.steps}</p>
                <p>星级: {'⭐'.repeat(result.stars)}</p>
                {result.metadata.bestSteps && (
                  <p>与最佳方案差距: {result.steps - result.metadata.bestSteps} 步</p>
                )}
              </>
            ) : (
              <>
                <h4>💡 再试试吧</h4>
                <p>错误: {result.errorCode}</p>
                <p>已执行步数: {result.steps}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
