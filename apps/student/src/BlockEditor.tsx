import * as React from 'react';
import * as Engine from '../../../packages/engine/src/index.ts';

type Instruction = Engine.Instruction;
type LevelDefinition = Engine.LevelDefinition;
type SimulationResult = Engine.SimulationResult;

interface BlockType {
  id: string;
  type: Instruction['type'];
  label: string;
  color: string;
  icon: string;
  category: 'action' | 'control' | 'condition';
}

const BLOCK_TYPES: BlockType[] = [
  { id: 'move', type: 'move', label: '向前移动', color: '#4CAF50', icon: '↑', category: 'action' },
  { id: 'turn-left', type: 'turn', label: '向左转', color: '#2196F3', icon: '↶', category: 'action' },
  { id: 'turn-right', type: 'turn', label: '向右转', color: '#2196F3', icon: '↷', category: 'action' },
  { id: 'collect', type: 'collect', label: '收集', color: '#FF9800', icon: '⭐', category: 'action' },
  { id: 'repeat', type: 'repeat', label: '重复', color: '#9C27B0', icon: '🔄', category: 'control' },
  { id: 'if', type: 'conditional', label: '如果', color: '#F44336', icon: '❓', category: 'condition' },
];

interface BlockConfig {
  repeatTimes?: number;
  conditionType?: Engine.Condition['type'];
}

interface ProgramBlock {
  id: string;
  blockType: BlockType;
  config: BlockConfig;
  children?: ProgramBlock[];
  config: BlockConfig;
}

type BlockPath = number[];

type DraggedItem =
  | { source: 'palette'; blockType: BlockType }
  | { source: 'program'; path: BlockPath };

interface BlockEditorProps {
  level: LevelDefinition;
  onRun: (program: Instruction[]) => Promise<SimulationResult>;
  onReset: () => void;
  allowedBlocks?: string[];
  onProgramChange?: (program: Instruction[]) => void;
}

const BLOCK_CODE_BY_ID: Record<string, string> = {
  move: 'MOVE',
  'turn-left': 'TURN_LEFT',
  'turn-right': 'TURN_RIGHT',
  collect: 'COLLECT',
  repeat: 'REPEAT',
  if: 'CONDITIONAL'
};

const createProgramBlock = (blockType: BlockType): ProgramBlock => {
  const baseConfig: BlockConfig = {};
  if (blockType.id === 'repeat') {
    baseConfig.repeatTimes = 2;
  }
  if (blockType.id === 'if') {
    baseConfig.conditionType = 'tile-ahead-walkable';
  }

  const id =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

  return {
    id,
    blockType,
    config: baseConfig,
    children: blockType.category === 'control' || blockType.category === 'condition' ? [] : undefined,
  };
};

const cloneBlock = (block: ProgramBlock): ProgramBlock => ({
  ...block,
  config: { ...block.config },
  children: block.children ? block.children.map(cloneBlock) : undefined,
});

const cloneBlocks = (blocks: ProgramBlock[]): ProgramBlock[] => blocks.map(cloneBlock);

const getBlockAtPath = (blocks: ProgramBlock[], path: BlockPath): ProgramBlock | null => {
  if (path.length === 0) return null;
  let currentArray: ProgramBlock[] | undefined = blocks;
  let current: ProgramBlock | undefined;

  for (const index of path) {
    if (!currentArray) return null;
    current = currentArray[index];
    if (!current) return null;
    currentArray = current.children;
  }

  return current ?? null;
};

const getParentArray = (blocks: ProgramBlock[], parentPath: BlockPath | null): ProgramBlock[] | undefined => {
  if (!parentPath || parentPath.length === 0) {
    return blocks;
  }
  const parent = getBlockAtPath(blocks, parentPath);
  if (!parent) return undefined;
  if (!parent.children) {
    parent.children = [];
  }
  return parent.children;
};

const removeBlockAtPath = (blocks: ProgramBlock[], path: BlockPath): ProgramBlock | null => {
  if (path.length === 0) return null;
  const parentPath = path.slice(0, -1);
  const index = path[path.length - 1];
  const parentArray = getParentArray(blocks, parentPath.length > 0 ? parentPath : null);
  if (!parentArray) return null;
  const [removed] = parentArray.splice(index, 1);
  return removed ?? null;
};

const insertBlockAtPath = (
  blocks: ProgramBlock[],
  parentPath: BlockPath | null,
  index: number,
  block: ProgramBlock
) => {
  const targetArray = getParentArray(blocks, parentPath);
  if (!targetArray) return;
  targetArray.splice(index, 0, block);
};

const pathsEqual = (a: BlockPath | null, b: BlockPath | null) => {
  if (!a && !b) return true;
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
};

const normalizeParentPath = (path: BlockPath): BlockPath | null => (path.length === 0 ? null : path);

export const BlockEditor: React.FC<BlockEditorProps> = ({ level, onRun, onReset, allowedBlocks, onProgramChange }) => {
  const [programBlocks, setProgramBlocks] = React.useState<ProgramBlock[]>([]);
  const [draggedItem, setDraggedItem] = React.useState<DraggedItem | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<SimulationResult | null>(null);
  const [selectedPath, setSelectedPath] = React.useState<BlockPath | null>(null);

  const availableBlockTypes = React.useMemo(() => {
    if (!allowedBlocks || allowedBlocks.length === 0) {
      return BLOCK_TYPES;
    }
    const allowedSet = new Set(allowedBlocks);
    return BLOCK_TYPES.filter((block) => {
      const code = BLOCK_CODE_BY_ID[block.id] ?? block.id.toUpperCase();
      return allowedSet.has(code);
    });
  }, [allowedBlocks]);

  const getBlocksByCategory = React.useCallback(
    (category: BlockType['category']) => availableBlockTypes.filter((block) => block.category === category),
    [availableBlockTypes]
  );

  const blocksToProgram = React.useCallback((blocks: ProgramBlock[]): Instruction[] => {
    return blocks.map((block) => {
      switch (block.blockType.type) {
        case 'move':
          return { type: 'move' };
        case 'turn':
          return {
            type: 'turn',
            direction: block.blockType.id === 'turn-left' ? 'left' : 'right',
          } as Instruction;
        case 'collect':
          return { type: 'collect' };
        case 'repeat':
          return {
            type: 'repeat',
            times: block.config.repeatTimes ?? 2,
            body: block.children ? blocksToProgram(block.children) : [],
          };
        case 'conditional':
          return {
            type: 'conditional',
            condition: { type: block.config.conditionType ?? 'tile-ahead-walkable' },
            truthy: block.children ? blocksToProgram(block.children) : [],
            falsy: [],
          };
        default:
          return { type: 'move' };
      }
    });
  }, []);

  const selectedBlock = React.useMemo(() => {
    if (!selectedPath) return null;
    return getBlockAtPath(programBlocks, selectedPath);
  }, [programBlocks, selectedPath]);

  React.useEffect(() => {
    onProgramChange?.(blocksToProgram(programBlocks));
  }, [programBlocks, blocksToProgram, onProgramChange]);

  React.useEffect(() => {
    setProgramBlocks([]);
    setResult(null);
    setSelectedPath(null);
  }, [level.id]);

  const handleDrop = React.useCallback(
    (event: React.DragEvent, parentPath: BlockPath | null, index: number) => {
      event.preventDefault();
      event.stopPropagation();
      if (!draggedItem) return;

      let nextSelected: BlockPath | null = null;

      setProgramBlocks((previous) => {
        const draft = cloneBlocks(previous);
        if (draggedItem.source === 'palette') {
          const newBlock = createProgramBlock(draggedItem.blockType);
          insertBlockAtPath(draft, parentPath, index, newBlock);
          nextSelected = parentPath ? [...parentPath, index] : [index];
          return draft;
        }

        const draggedPath = draggedItem.path;
        const fromParent = normalizeParentPath(draggedPath.slice(0, -1));
        const removalIndex = draggedPath[draggedPath.length - 1];
        const sameParent = pathsEqual(fromParent, parentPath);
        const block = removeBlockAtPath(draft, draggedPath);
        if (!block) {
          return draft;
        }

        let targetIndex = index;
        if (sameParent && removalIndex < index) {
          targetIndex = Math.max(0, index - 1);
        }

        insertBlockAtPath(draft, parentPath, targetIndex, block);
        nextSelected = parentPath ? [...parentPath, targetIndex] : [targetIndex];
        return draft;
      });

      setTimeout(() => {
        if (nextSelected) {
          setSelectedPath(nextSelected);
        }
      }, 0);

      setDraggedItem(null);
    },
    [draggedItem]
  );

  const handleRun = async () => {
    if (isRunning) return;
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

  const handleReset = () => {
    setProgramBlocks([]);
    setResult(null);
    setSelectedPath(null);
    onReset();
  };

  const handleRemoveBlock = (path: BlockPath) => {
    setProgramBlocks((previous) => {
      const draft = cloneBlocks(previous);
      removeBlockAtPath(draft, path);
      return draft;
    });
    if (selectedPath && pathsEqual(selectedPath, path)) {
      setSelectedPath(null);
    }
  };

  const updateBlockConfig = (path: BlockPath, config: Partial<BlockConfig>) => {
    setProgramBlocks((previous) => {
      const draft = cloneBlocks(previous);
      const block = getBlockAtPath(draft, path);
      if (block) {
        block.config = {
          ...block.config,
          ...config,
        };
      }
      return draft;
    });
  };

  const DropZone = ({ parentPath, index, label }: { parentPath: BlockPath | null; index: number; label?: string }) => (
    <div
      className="drop-zone"
      onDragOver={(event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(event) => handleDrop(event, parentPath, index)}
    >
      <span>{label ?? '拖拽到此'}</span>
    </div>
  );

  const renderBlock = (block: ProgramBlock, path: BlockPath, depth: number = 0) => {
    const parentPath = path.slice(0, -1);
    const siblingIndex = path[path.length - 1];
    const parentForChildren = path;
    const children = block.children ?? [];
    const isSelected = selectedPath ? pathsEqual(selectedPath, path) : false;

    const shouldRenderLeadingDrop = siblingIndex > 0;

    return (
      <React.Fragment key={block.id}>
        {shouldRenderLeadingDrop && (
          <DropZone
            parentPath={normalizeParentPath(parentPath)}
            index={siblingIndex}
          />
        )}
        <div
          className={`program-block ${isSelected ? 'selected' : ''}`}
          style={{ backgroundColor: block.blockType.color }}
          draggable
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move';
            setDraggedItem({ source: 'program', path });
          }}
          onDragEnd={() => setDraggedItem(null)}
          onClick={(event) => {
            event.stopPropagation();
            setSelectedPath(path);
          }}
        >
          <div className="program-block__label">
            <span className="block-icon">{block.blockType.icon}</span>
            {block.blockType.label}
          </div>
          <button
            className="delete-btn"
            onClick={(event) => {
              event.stopPropagation();
              handleRemoveBlock(path);
            }}
            title="删除积木"
          >
            ×
          </button>
        </div>
        {(block.blockType.category === 'control' || block.blockType.category === 'condition') && (
          <div className="program-block__children">
            <DropZone
              parentPath={parentForChildren}
              index={0}
              label={children.length === 0 ? '拖到这里添加子积木' : undefined}
            />
            {children.map((child, childIndex) => renderBlock(child, [...path, childIndex], depth + 1))}
            <DropZone parentPath={parentForChildren} index={children.length} />
          </div>
        )}
      </React.Fragment>
    );
  };

  const updateBlockConfig = (blockId: string, config: Partial<BlockConfig>) => {
    setProgramBlocks((prev) =>
      prev.map((block) =>
        block.id === blockId
          ? {
              ...block,
              config: {
                ...block.config,
                ...config
              }
            }
          : block
      )
    );
  };

  const selectedBlock = React.useMemo(() => programBlocks.find((block) => block.id === selectedBlockId) ?? null, [programBlocks, selectedBlockId]);

  React.useEffect(() => {
    if (onProgramChange) {
      onProgramChange(blocksToProgram(programBlocks));
    }
  }, [programBlocks, onProgramChange, blocksToProgram]);

  return (
    <div className="block-editor">
      <style>{`
        .block-editor {
          display: grid;
          grid-template-columns: 220px 1fr 300px;
          min-height: 560px;
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
          padding: 16px;
          overflow-y: auto;
          min-height: 520px;
          display: flex;
          flex-direction: column;
        }

        .program-empty {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #9ca3af;
          font-size: 16px;
        }

        .drop-zone {
          border: 2px dashed transparent;
          border-radius: 6px;
          padding: 8px;
          margin: 4px 0;
          text-align: center;
          color: #9ca3af;
          font-size: 13px;
          background: rgba(148, 163, 184, 0.08);
          transition: all 0.2s ease;
        }

        .drop-zone:hover,
        .drop-zone:focus-within {
          border-color: #4CAF50;
          color: #4CAF50;
          background: rgba(76, 175, 80, 0.08);
        }

        .program-block {
          border-radius: 6px;
          color: white;
          font-weight: 500;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          margin: 4px 0;
          box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          cursor: move;
          user-select: none;
          transition: transform 0.2s, border-color 0.2s;
          border: 2px solid transparent;
        }

        .program-block.selected {
          border-color: #fde68a;
          transform: scale(1.02);
        }

        .program-block__children {
          margin-left: 18px;
          border-left: 2px dashed rgba(148, 163, 184, 0.5);
          padding-left: 12px;
          margin-bottom: 8px;
        }

        .program-block__label {
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .delete-btn {
          margin-left: 8px;
          background: rgba(255,255,255,0.3);
          border: none;
          border-radius: 4px;
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

        .inspector {
          background: #eef2ff;
          border-radius: 6px;
          padding: 12px;
          display: grid;
          gap: 12px;
        }

        .inspector h4 {
          margin: 0;
          color: #4338ca;
          font-size: 14px;
        }

        .inspector label {
          font-size: 13px;
          color: #1f2937;
          display: grid;
          gap: 4px;
        }

        .inspector input,
        .inspector select {
          padding: 6px 8px;
          border-radius: 4px;
          border: 1px solid #c7d2fe;
          font-size: 13px;
          background: white;
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
      `}</style>

      <div className="block-palette">
        <div className="block-category">
          <h4>🎯 动作积木</h4>
          {getBlocksByCategory('action').map((blockType) => (
            <div
              key={blockType.id}
              className="palette-block"
              style={{ backgroundColor: blockType.color }}
              draggable
              onDragStart={() => setDraggedItem({ source: 'palette', blockType })}
              onDragEnd={() => setDraggedItem(null)}
            >
              <span className="block-icon">{blockType.icon}</span>
              {blockType.label}
            </div>
          ))}
        </div>

        <div className="block-category">
          <h4>🔄 控制积木</h4>
          {getBlocksByCategory('control').map((blockType) => (
            <div
              key={blockType.id}
              className="palette-block"
              style={{ backgroundColor: blockType.color }}
              draggable
              onDragStart={() => setDraggedItem({ source: 'palette', blockType })}
              onDragEnd={() => setDraggedItem(null)}
            >
              <span className="block-icon">{blockType.icon}</span>
              {blockType.label}
            </div>
          ))}
        </div>

        <div className="block-category">
          <h4>🧠 条件积木</h4>
          {getBlocksByCategory('condition').map((blockType) => (
            <div
              key={blockType.id}
              className="palette-block"
              style={{ backgroundColor: blockType.color }}
              draggable
              onDragStart={() => setDraggedItem({ source: 'palette', blockType })}
              onDragEnd={() => setDraggedItem(null)}
            >
              <span className="block-icon">{blockType.icon}</span>
              {blockType.label}
            </div>
          ))}
        </div>
      </div>

      <div className="program-area" onClick={() => setSelectedPath(null)}>
        {programBlocks.length === 0 ? (
          <div className="program-empty">从左侧拖入积木开始编程</div>
        ) : (
          <>
            <DropZone parentPath={null} index={0} label="拖到这里开始程序" />
            {programBlocks.map((block, index) => renderBlock(block, [index]))}
            <DropZone parentPath={null} index={programBlocks.length} label="拖到这里添加到末尾" />
          </>
        )}
      </div>

      <div className="control-panel">
        <div className="goal-section">
          <h4>🎯 目标</h4>
          <p style={{ margin: 0 }}>{level.name}</p>
          <p style={{ margin: '4px 0 0 0' }}>最佳步数: {level.bestSteps}</p>
        </div>

        <div className="inspector">
          <h4>🛠️ 积木设置</h4>
          {selectedBlock && selectedPath ? (
            <>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                当前选择：{selectedBlock.blockType.label}
              </div>
              {selectedBlock.blockType.id === 'repeat' && (
                <label>
                  重复次数
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedBlock.config.repeatTimes ?? 2}
                    onChange={(event) =>
                      updateBlockConfig(selectedPath, { repeatTimes: Number(event.target.value) })
                    }
                  />
                </label>
              )}
              {selectedBlock.blockType.id === 'if' && (
                <label>
                  判断条件
                  <select
                    value={selectedBlock.config.conditionType ?? 'tile-ahead-walkable'}
                    onChange={(event) =>
                      updateBlockConfig(selectedPath, { conditionType: event.target.value as Engine.Condition['type'] })
                    }
                  >
                    <option value="tile-ahead-walkable">前方可通行</option>
                    <option value="collectibles-remaining">关卡仍有宝石</option>
                    <option value="goal-reached">是否已到达终点</option>
                  </select>
                </label>
              )}
              {selectedBlock.blockType.id !== 'repeat' && selectedBlock.blockType.id !== 'if' && (
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>此积木无需额外设置。</div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>选择程序区中的积木以调整参数。</div>
          )}
        </div>

        <div className="inspector">
          <h4>🛠️ 积木设置</h4>
          {selectedBlock ? (
            <>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>
                当前选择：{selectedBlock.blockType.label}
              </div>
              {selectedBlock.blockType.id === 'repeat' && (
                <label>
                  重复次数
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={selectedBlock.config.repeatTimes ?? 2}
                    onChange={(event) => updateBlockConfig(selectedBlock.id, { repeatTimes: Number(event.target.value) })}
                  />
                </label>
              )}
              {selectedBlock.blockType.id === 'if' && (
                <label>
                  判断条件
                  <select
                    value={selectedBlock.config.conditionType ?? 'tile-ahead-walkable'}
                    onChange={(event) => updateBlockConfig(selectedBlock.id, { conditionType: event.target.value as Engine.Condition['type'] })}
                  >
                    <option value="tile-ahead-walkable">前方可通行</option>
                    <option value="collectibles-remaining">关卡仍有宝石</option>
                  </select>
                </label>
              )}
              {(selectedBlock.blockType.id !== 'repeat' && selectedBlock.blockType.id !== 'if') && (
                <div style={{ fontSize: '13px', color: '#9ca3af' }}>
                  此积木无需额外设置。
                </div>
              )}
            </>
          ) : (
            <div style={{ fontSize: '13px', color: '#94a3b8' }}>
              选择程序区中的积木以调整参数。
            </div>
          )}
        </div>

        <div className="controls">
          <button
            className="btn btn-primary"
            onClick={handleRun}
            disabled={isRunning || programBlocks.length === 0}
          >
            {isRunning ? '运行中...' : '▶️ 运行程序'}
          </button>

          <button className="btn btn-secondary" onClick={handleReset}>
            🔄 重置
          </button>
        </div>

        {result && (
          <div className={`result-panel ${result.success ? 'result-success' : 'result-error'}`}>
            {result.success ? (
              <>
                <h4 style={{ margin: '0 0 8px 0' }}>🎉 成功通关！</h4>
                <p style={{ margin: 0 }}>步数: {result.steps}</p>
                <p style={{ margin: 0 }}>星级: {'⭐'.repeat(result.stars)}</p>
                {result.metadata?.bestSteps && (
                  <p style={{ margin: 0 }}>与最佳方案差距: {result.steps - result.metadata.bestSteps} 步</p>
                )}
              </>
            ) : (
              <>
                <h4 style={{ margin: '0 0 8px 0' }}>💡 再试试吧</h4>
                <p style={{ margin: 0 }}>错误: {result.errorCode}</p>
                <p style={{ margin: 0 }}>已执行步数: {result.steps}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlockEditor;
