import * as React from 'react';
import * as Engine from '@engine/index.ts';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useDroppable,
  useDraggable,
  useSensor,
  useSensors,
  DragOverEvent,
} from '@dnd-kit/core';

type Instruction = Engine.Instruction;
type LevelDefinition = Engine.LevelDefinition;
type SimulationResult = Engine.SimulationResult;

type BlockCategory = 'action' | 'control' | 'condition';

type BlockType = {
  id: string;
  type: Instruction['type'];
  label: string;
  color: string;
  icon: string;
  category: BlockCategory;
};

interface BlockConfig {
  repeatTimes?: number;
  conditionType?: Engine.Condition['type'];
}

interface ProgramBlock {
  id: string;
  blockType: BlockType;
  config: BlockConfig;
  children?: ProgramBlock[];
}

type BlockPath = number[];

type DragTarget = {
  path: BlockPath | null;
  index: number;
};

type DragSource =
  | { source: 'palette'; blockType: BlockType }
  | { source: 'program'; block: ProgramBlock; path: BlockPath };

const pathKey = (path: BlockPath | null) =>
  !path || path.length === 0 ? 'root' : path.join('-');

const dropZoneId = (path: BlockPath | null, index: number) => `${pathKey(path)}::${index}`;

const normalizePath = (path: BlockPath | null): BlockPath => (path ? [...path] : []);

const pathsEqual = (a: BlockPath | null, b: BlockPath | null) => {
  const pathA = normalizePath(a);
  const pathB = normalizePath(b);
  return pathA.length === pathB.length && pathA.every((value, index) => value === pathB[index]);
};

const isDescendantPath = (ancestor: BlockPath, candidate: BlockPath): boolean => {
  if (ancestor.length === 0) return false;
  if (candidate.length < ancestor.length) return false;
  return ancestor.every((value, index) => candidate[index] === value);
};

interface BlockEditorProps {
  level: LevelDefinition;
  onRun: (program: Instruction[]) => Promise<SimulationResult>;
  onReset: () => void;
  allowedBlocks?: string[];
  onProgramChange?: (program: Instruction[]) => void;
}

const BLOCK_TYPES: BlockType[] = [
  { id: 'move', type: 'move', label: '向前移动', color: '#0ea5e9', icon: '⬆️', category: 'action' },
  { id: 'turn-left', type: 'turn', label: '向左转', color: '#6366f1', icon: '↰', category: 'action' },
  { id: 'turn-right', type: 'turn', label: '向右转', color: '#6366f1', icon: '↱', category: 'action' },
  { id: 'collect', type: 'collect', label: '收集', color: '#f59e0b', icon: '⭐', category: 'action' },
  { id: 'repeat', type: 'repeat', label: '重复', color: '#8b5cf6', icon: '🔁', category: 'control' },
  { id: 'if', type: 'conditional', label: '如果', color: '#f97316', icon: '❓', category: 'condition' },
];

const BLOCK_CODE_BY_ID: Record<string, string> = {
  move: 'MOVE',
  'turn-left': 'TURN_LEFT',
  'turn-right': 'TURN_RIGHT',
  collect: 'COLLECT',
  repeat: 'REPEAT',
  if: 'CONDITIONAL',
};

const generateId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const createProgramBlock = (blockType: BlockType): ProgramBlock => {
  const config: BlockConfig = {};
  if (blockType.type === 'repeat') {
    config.repeatTimes = 2;
  }
  if (blockType.type === 'conditional') {
    config.conditionType = 'tile-ahead-walkable';
  }
  return {
    id: generateId(),
    blockType,
    config,
    children: blockType.category === 'control' || blockType.category === 'condition' ? [] : undefined,
  };
};

const cloneBlocks = (blocks: ProgramBlock[]): ProgramBlock[] =>
  blocks.map((block) => ({
    ...block,
    config: { ...block.config },
    children: block.children ? cloneBlocks(block.children) : undefined,
  }));

const getBlockAtPath = (blocks: ProgramBlock[], path: BlockPath): ProgramBlock | null => {
  let current: ProgramBlock | undefined;
  let currentArray: ProgramBlock[] | undefined = blocks;

  for (const index of path) {
    if (!currentArray) return null;
    current = currentArray[index];
    if (!current) return null;
    currentArray = current.children;
  }

  return current ?? null;
};

const setBlockAtPath = (
  blocks: ProgramBlock[],
  path: BlockPath,
  updater: (block: ProgramBlock) => void
) => {
  const block = getBlockAtPath(blocks, path);
  if (block) {
    updater(block);
  }
};

const removeBlockAtPath = (blocks: ProgramBlock[], path: BlockPath): ProgramBlock[] => {
  if (path.length === 0) return blocks;
  const clone = cloneBlocks(blocks);
  const parentPath = path.slice(0, -1);
  const removeIndex = path[path.length - 1];

  if (parentPath.length === 0) {
    clone.splice(removeIndex, 1);
    return clone;
  }

  const parent = getBlockAtPath(clone, parentPath);
  if (!parent || !parent.children) return clone;
  parent.children.splice(removeIndex, 1);
  return clone;
};

const insertBlock = (
  blocks: ProgramBlock[],
  blockType: BlockType,
  target: DragTarget
): ProgramBlock[] => {
  const clone = cloneBlocks(blocks);
  const newBlock = createProgramBlock(blockType);
  if (!target.path || target.path.length === 0) {
    const result = [...clone];
    result.splice(target.index, 0, newBlock);
    return result;
  }
  const parent = getBlockAtPath(clone, target.path);
  if (!parent) return clone;
  if (!parent.children) parent.children = [];
  parent.children.splice(target.index, 0, newBlock);
  return clone;
};

const moveBlock = (blocks: ProgramBlock[], from: BlockPath, to: DragTarget): ProgramBlock[] => {
  const removed = getBlockAtPath(blocks, from);
  if (!removed) return blocks;
  let without = removeBlockAtPath(blocks, from);
  if (from.length === 0) {
    without = without; // no-op explicit for clarity
  }
  const clone = cloneBlocks(without);
  if (!to.path || to.path.length === 0) {
    const result = [...clone];
    result.splice(to.index, 0, removed);
    return result;
  }
  const parent = getBlockAtPath(clone, to.path);
  if (!parent) return clone;
  if (!parent.children) parent.children = [];
  parent.children.splice(to.index, 0, removed);
  return clone;
};

const blocksToProgram = (blocks: ProgramBlock[]): Instruction[] =>
  blocks.map((block) => {
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
        } as Instruction;
      case 'conditional':
        return {
          type: 'conditional',
          condition: { type: block.config.conditionType ?? 'tile-ahead-walkable' },
          truthy: block.children ? blocksToProgram(block.children) : [],
          falsy: [],
        } as Instruction;
      default:
        return { type: 'move' };
    }
  });

const ChildAdder: React.FC<{
  available: BlockType[];
  onAdd: (type: BlockType) => void;
}> = ({ available, onAdd }) => {
  const [selected, setSelected] = React.useState<string>(available[0]?.id ?? '');

  React.useEffect(() => {
    if (!available.find((item) => item.id === selected)) {
      setSelected(available[0]?.id ?? '');
    }
  }, [available, selected]);

  if (available.length === 0) {
    return null;
  }

  return (
    <div className="child-adder">
      <select
        value={selected}
        onChange={(event) => setSelected(event.target.value)}
      >
        {available.map((type) => (
          <option key={type.id} value={type.id}>
            {type.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => {
          const blockType = available.find((type) => type.id === selected);
          if (blockType) {
            onAdd(blockType);
          }
        }}
      >
        添加
      </button>
    </div>
  );
};

export const BlockEditor: React.FC<BlockEditorProps> = ({
  level,
  onRun,
  onReset,
  allowedBlocks,
  onProgramChange,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );
  const [programBlocks, setProgramBlocks] = React.useState<ProgramBlock[]>([]);
  const [selectedPath, setSelectedPath] = React.useState<BlockPath | null>(null);
  const [isRunning, setIsRunning] = React.useState(false);
  const [result, setResult] = React.useState<SimulationResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [activeDrag, setActiveDrag] = React.useState<DragSource | null>(null);
  const [dropTarget, setDropTarget] = React.useState<DragTarget | null>(null);

  const availableBlockTypes = React.useMemo(() => {
    if (!allowedBlocks || allowedBlocks.length === 0) {
      return BLOCK_TYPES;
    }
    const allowedSet = new Set(allowedBlocks);
    return BLOCK_TYPES.filter((block) => allowedSet.has(BLOCK_CODE_BY_ID[block.id] ?? block.id.toUpperCase()));
  }, [allowedBlocks]);

  const groupedBlockTypes = React.useMemo(() => {
    const groups: Record<BlockCategory, BlockType[]> = {
      action: [],
      control: [],
      condition: [],
    };
    availableBlockTypes.forEach((block) => {
      groups[block.category].push(block);
    });
    return groups;
  }, [availableBlockTypes]);

  const selectedBlock = React.useMemo(() => {
    if (!selectedPath) return null;
    return getBlockAtPath(programBlocks, selectedPath);
  }, [programBlocks, selectedPath]);

  React.useEffect(() => {
    onProgramChange?.(blocksToProgram(programBlocks));
  }, [programBlocks, onProgramChange]);

  React.useEffect(() => {
    setProgramBlocks([]);
    setSelectedPath(null);
    setResult(null);
    setError(null);
  }, [level.id]);

  const addBlock = React.useCallback(
    (blockType: BlockType, parentPath?: BlockPath | null) => {
      setProgramBlocks((prev) => {
        const path = parentPath ?? [];
        const target: DragTarget = {
          path: path.length > 0 ? path : null,
          index: path.length > 0 ? getBlockAtPath(prev, path)?.children?.length ?? 0 : prev.length,
        };
        return insertBlock(prev, blockType, target);
      });
      setError(null);
    },
    []
  );

  const updateBlockConfig = (path: BlockPath, config: Partial<BlockConfig>) => {
    setProgramBlocks((prev) => {
      const clone = cloneBlocks(prev);
      setBlockAtPath(clone, path, (block) => {
        block.config = {
          ...block.config,
          ...config,
        };
      });
      return clone;
    });
  };

  const handleDeleteBlock = (path: BlockPath) => {
    setProgramBlocks((prev) => removeBlockAtPath(prev, path));
    if (selectedPath && path.join(',') === selectedPath.join(',')) {
      setSelectedPath(null);
    }
    setError(null);
  };

  const handleMove = (path: BlockPath, direction: 'up' | 'down') => {
    const parentPath = path.slice(0, -1);
    const index = path[path.length - 1];
    const newIndex = direction === 'up' ? index - 1 : index + 1;

    setProgramBlocks((prev) => {
      const parent = parentPath.length === 0 ? prev : getBlockAtPath(prev, parentPath)?.children ?? [];
      if (newIndex < 0 || newIndex >= parent.length) {
        return prev;
      }
      const target: DragTarget = {
        path: parentPath.length > 0 ? parentPath : null,
        index: newIndex,
      };
      return moveBlock(prev, path, target);
    });
    setError(null);
  };

  const handleDragStart = React.useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as DragSource | undefined;
    if (!data) return;
    setActiveDrag(data);
  }, []);

  const handleDragOver = React.useCallback((event: DragOverEvent) => {
    const data = event.over?.data.current as { target?: DragTarget } | undefined;
    setDropTarget(data?.target ?? null);
  }, []);

  const handleDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      const data = event.active.data.current as DragSource | undefined;
      const overData = event.over?.data.current as { target?: DragTarget } | undefined;
      const target = overData?.target;

      if (data && target) {
        if (data.source === 'palette') {
          setProgramBlocks((prev) => insertBlock(prev, data.blockType, target));
          setError(null);
        } else if (data.source === 'program') {
          const fromPath = data.path;
          const targetPath = normalizePath(target.path);

          if (isDescendantPath(fromPath, [...targetPath, target.index])) {
            setActiveDrag(null);
            setDropTarget(null);
            return;
          }

          const fromParent = fromPath.slice(0, -1);
          const targetParent = targetPath;
          const fromIndex = fromPath[fromPath.length - 1];
          let targetIndex = target.index;

          if (pathsEqual(fromParent, targetParent)) {
            if (targetIndex > fromIndex) {
              targetIndex -= 1;
            }
            if (targetIndex === fromIndex) {
              setActiveDrag(null);
              setDropTarget(null);
              return;
            }
          }

          const adjustedTarget: DragTarget = {
            path: targetParent.length > 0 ? targetParent : null,
            index: targetIndex,
          };

          setProgramBlocks((prev) => moveBlock(prev, fromPath, adjustedTarget));
          setError(null);
        }
      }

      setActiveDrag(null);
      setDropTarget(null);
    },
    [setProgramBlocks]
  );

  const handleDragCancel = React.useCallback(() => {
    setActiveDrag(null);
    setDropTarget(null);
  }, []);

  const handleRun = async () => {
    if (isRunning) return;
    try {
      setIsRunning(true);
      setError(null);
      const program = blocksToProgram(programBlocks);
      const simulation = await onRun(program);
      setResult(simulation);
    } catch (err) {
      setError(err instanceof Error ? err.message : '运行失败');
    } finally {
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setProgramBlocks([]);
    setSelectedPath(null);
    setResult(null);
    setError(null);
    onReset();
  };

  const isActiveTarget = (candidate: DragTarget) =>
    !!dropTarget && dropTarget.index === candidate.index && pathsEqual(dropTarget.path, candidate.path);

  const renderBlockList = (blocks: ProgramBlock[], parentPath: BlockPath = []): React.ReactNode => {
    if (blocks.length === 0) {
      const target: DragTarget = { path: parentPath.length > 0 ? parentPath : null, index: 0 };
      return (
        <ProgramDropZone
          key={`drop-${dropZoneId(parentPath, 0)}`}
          id={dropZoneId(parentPath, 0)}
          target={target}
          isActive={isActiveTarget(target)}
          placeholder={parentPath.length === 0 ? '将积木拖拽到此处开始编程' : '拖拽积木到此处'}
          compact={parentPath.length > 0}
        />
      );
    }

    const elements: React.ReactNode[] = [];
    for (let index = 0; index <= blocks.length; index += 1) {
      const target: DragTarget = { path: parentPath.length > 0 ? parentPath : null, index };
      elements.push(
        <ProgramDropZone
          key={`drop-${dropZoneId(parentPath, index)}`}
          id={dropZoneId(parentPath, index)}
          target={target}
          isActive={isActiveTarget(target)}
          compact={parentPath.length > 0}
        />
      );

      if (index === blocks.length) {
        break;
      }

      const block = blocks[index];
      const path = [...parentPath, index];
      const isSelected = selectedPath && path.join(',') === selectedPath.join(',');
      const canHaveChildren =
        block.blockType.category === 'control' || block.blockType.category === 'condition';

      elements.push(
        <DraggableProgramBlock
          key={block.id}
          block={block}
          path={path}
          isSelected={!!isSelected}
          onSelect={setSelectedPath}
          onMove={handleMove}
          onDelete={handleDeleteBlock}
        >
          {canHaveChildren && (
            <div className="program-children">
              <div className="child-controls">
                <span>添加子积木：</span>
                <ChildAdder
                  available={availableBlockTypes}
                  onAdd={(blockType) => addBlock(blockType, path)}
                />
              </div>
              <div className="child-list">{renderBlockList(block.children ?? [], path)}</div>
            </div>
          )}
        </DraggableProgramBlock>
      );
    }

    return elements;
  };

const overlayBlockType =
  activeDrag?.source === 'palette'
    ? activeDrag.blockType
    : activeDrag?.source === 'program'
      ? activeDrag.block.blockType
      : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="block-editor">
        <style>{`
          .block-editor {
            display: grid;
            grid-template-columns: 260px 1fr 280px;
            gap: 20px;
            min-height: 520px;
            font-family: 'Microsoft YaHei', sans-serif;
          }
        .palette,
        .program-panel,
        .inspector {
          background: #f9fafb;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
        }
        .palette {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .palette h4 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }
        .palette-group {
          display: grid;
          gap: 8px;
        }
        .palette-button {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 10px;
          border: none;
          padding: 10px 12px;
          cursor: grab;
          user-select: none;
          touch-action: none;
          color: #0f172a;
          font-weight: 500;
          background: white;
          box-shadow: inset 0 0 0 1px rgba(148, 163, 184, 0.2);
          transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.2s ease;
        }
        .palette-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 10px rgba(148, 163, 184, 0.25);
        }
        .palette-button:active {
          cursor: grabbing;
        }
        .palette-button.dragging {
          opacity: 0.6;
        }
        .palette-icon {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          margin-right: 8px;
          font-size: 16px;
        }
        .program-panel {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .program-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
          min-height: 260px;
          padding: 8px 0;
        }
        .program-item {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .program-item.dragging {
          opacity: 0.4;
        }
        .program-item.selected .program-block {
          outline: 3px solid rgba(14, 165, 233, 0.4);
        }
        .program-block {
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-radius: 10px;
          padding: 10px 12px;
          color: white;
          cursor: pointer;
          box-shadow: 0 6px 12px rgba(15, 23, 42, 0.15);
        }
        .program-block__label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 600;
        }
        .program-block__actions {
          display: flex;
          gap: 6px;
        }
        .program-block__actions button {
          border: none;
          border-radius: 6px;
          padding: 4px 6px;
          cursor: pointer;
          background: rgba(255, 255, 255, 0.3);
          color: white;
        }
        .program-block__actions .drag-handle {
          background: rgba(15, 23, 42, 0.25);
          cursor: grab;
          font-size: 16px;
        }
        .program-block__actions .drag-handle:active {
          cursor: grabbing;
        }
        .program-children {
          margin-left: 20px;
          padding-left: 16px;
          border-left: 2px dashed rgba(99, 102, 241, 0.3);
          display: grid;
          gap: 12px;
        }
        .child-controls {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 13px;
          color: #475569;
        }
        .child-adder {
          display: inline-flex;
          gap: 6px;
          align-items: center;
        }
        .child-adder select {
          padding: 4px 6px;
          border-radius: 6px;
          border: 1px solid #cbd5f5;
          background: white;
          font-size: 13px;
        }
        .child-adder button {
          border: none;
          border-radius: 6px;
          padding: 4px 8px;
          background: #2563eb;
          color: white;
          cursor: pointer;
        }
        .drop-zone {
          border: 2px dashed rgba(148, 163, 184, 0.3);
          border-radius: 12px;
          min-height: 14px;
          transition: all 0.2s ease;
          background: rgba(241, 245, 249, 0.4);
          margin: 4px 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #94a3b8;
          font-size: 12px;
          padding: 4px 6px;
        }
        .drop-zone--compact {
          min-height: 10px;
          border-radius: 10px;
          margin: 2px 0;
          font-size: 11px;
        }
        .drop-zone.active {
          border-color: rgba(56, 189, 248, 0.9);
          background: rgba(56, 189, 248, 0.18);
          color: #0284c7;
        }
        .drag-preview {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          border-radius: 10px;
          color: white;
          box-shadow: 0 12px 24px rgba(15, 23, 42, 0.3);
          font-weight: 600;
        }
        .inspector {
          display: grid;
          gap: 16px;
        }
        .inspector h4 {
          margin: 0;
          font-size: 16px;
          color: #111827;
        }
        .inspector section {
          background: white;
          border-radius: 10px;
          padding: 12px;
          box-shadow: 0 1px 3px rgba(15, 23, 42, 0.08);
          display: grid;
          gap: 12px;
        }
        .inspector label {
          display: grid;
          gap: 4px;
          font-size: 13px;
          color: #374151;
        }
        .inspector input,
        .inspector select {
          padding: 6px 8px;
          border-radius: 6px;
          border: 1px solid rgba(148, 163, 184, 0.4);
          background: #f8fafc;
        }
        .inspector button {
          border-radius: 8px;
          border: none;
          padding: 10px 14px;
          font-weight: 600;
          cursor: pointer;
          color: white;
        }
        .inspector .primary {
          background: #22c55e;
        }
        .inspector .secondary {
          background: #ef4444;
        }
        .result-card {
          background: white;
          border-radius: 10px;
          padding: 12px;
          border: 1px solid rgba(148, 163, 184, 0.3);
          display: grid;
          gap: 8px;
        }
        .error {
          color: #b91c1c;
          font-size: 13px;
        }
      `}</style>

      <aside className="palette">
        <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
          拖动或点击积木，将它们放到程序区中进行组合。
        </p>
        <div>
          <h4>动作积木</h4>
          <div className="palette-group">
            {groupedBlockTypes.action.map((block) => (
              <PaletteButton key={block.id} block={block} onAdd={addBlock} />
            ))}
          </div>
        </div>
        <div>
          <h4>控制积木</h4>
          <div className="palette-group">
            {groupedBlockTypes.control.map((block) => (
              <PaletteButton key={block.id} block={block} onAdd={addBlock} />
            ))}
          </div>
        </div>
        <div>
          <h4>条件积木</h4>
          <div className="palette-group">
            {groupedBlockTypes.condition.map((block) => (
              <PaletteButton key={block.id} block={block} onAdd={addBlock} />
            ))}
          </div>
        </div>
      </aside>

      <section className="program-panel">
        <header>
          <h3 style={{ margin: '0 0 8px', color: '#0f172a' }}>程序区</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            拖拽积木排序或嵌套，点击积木可设置参数。
          </p>
        </header>
        <div className="program-list">{renderBlockList(programBlocks)}</div>
      </section>

      <aside className="inspector">
        <section>
          <h4>运行控制</h4>
          <button
            type="button"
            className="primary"
            disabled={isRunning || programBlocks.length === 0}
            onClick={handleRun}
          >
            🚀 运行程序
          </button>
          <button type="button" className="secondary" onClick={handleReset}>
            🔄 重置
          </button>
          {error && <div className="error">{error}</div>}
        </section>

        {selectedBlock ? (
          <section>
            <h4>积木设置</h4>
            <div>
              <strong>{selectedBlock.blockType.label}</strong>
            </div>
            {selectedBlock.blockType.type === 'repeat' && (
              <label>
                重复次数
                <input
                  type="number"
                  min={1}
                  value={selectedBlock.config.repeatTimes ?? 2}
                  onChange={(event) =>
                    updateBlockConfig(selectedPath ?? [], {
                      repeatTimes: Math.max(1, Number(event.target.value)),
                    })
                  }
                />
              </label>
            )}
            {selectedBlock.blockType.type === 'conditional' && (
              <label>
                条件类型
                <select
                  value={selectedBlock.config.conditionType ?? 'tile-ahead-walkable'}
                  onChange={(event) =>
                    updateBlockConfig(selectedPath ?? [], {
                      conditionType: event.target.value as Engine.Condition['type'],
                    })
                  }
                >
                  <option value="tile-ahead-walkable">前方可行走</option>
                  <option value="collectibles-remaining">是否还有宝石</option>
                </select>
              </label>
            )}
          </section>
        ) : (
          <section>
            <h4>技巧提示</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', color: '#4b5563', fontSize: '13px' }}>
              <li>选择积木后可以调整其设置。</li>
              <li>控制与条件积木可以容纳子积木，构建更复杂的逻辑。</li>
              <li>建议先构思目标路径，再逐步搭建程序。</li>
            </ul>
          </section>
        )}

        {result && (
          <section className="result-card">
            <h4>最近一次运行</h4>
            <div>结果：{result.success ? '成功 ✅' : '失败 ❌'}</div>
            <div>步数：{result.steps}</div>
            <div>星级：{'⭐'.repeat(result.stars)}</div>
            {!result.success && result.errorCode && <div>错误代码：{result.errorCode}</div>}
          </section>
        )}
      </aside>
      </div>
      <DragOverlay>
        {overlayBlockType && (
          <div className="drag-preview" style={{ backgroundColor: overlayBlockType.color }}>
            <span className="icon">{overlayBlockType.icon}</span>
            <span>{overlayBlockType.label}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
};

interface PaletteButtonProps {
  block: BlockType;
  onAdd: (blockType: BlockType, parentPath?: BlockPath | null) => void;
}

const PaletteButton: React.FC<PaletteButtonProps> = ({ block, onAdd }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${block.id}`,
    data: { source: 'palette', blockType: block } as DragSource,
  });

  return (
    <button
      ref={setNodeRef}
      type="button"
      className={`palette-button${isDragging ? ' dragging' : ''}`}
      onClick={() => onAdd(block)}
      {...listeners}
      {...attributes}
    >
      <span style={{ display: 'flex', alignItems: 'center' }}>
        <span className="palette-icon" style={{ background: `${block.color}20` }}>
          {block.icon}
        </span>
        {block.label}
      </span>
      <span>添加</span>
    </button>
  );
};

interface ProgramDropZoneProps {
  id: string;
  target: DragTarget;
  isActive: boolean;
  placeholder?: string;
  compact?: boolean;
}

const ProgramDropZone: React.FC<ProgramDropZoneProps> = ({
  id,
  target,
  isActive,
  placeholder,
  compact,
}) => {
  const { setNodeRef, isOver } = useDroppable({ id, data: { target } });
  const className = [
    'drop-zone',
    compact ? 'drop-zone--compact' : '',
    isActive || isOver ? 'active' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setNodeRef} className={className}>
      {placeholder && <span>{placeholder}</span>}
    </div>
  );
};

interface DraggableProgramBlockProps {
  block: ProgramBlock;
  path: BlockPath;
  isSelected: boolean;
  onSelect: (path: BlockPath) => void;
  onMove: (path: BlockPath, direction: 'up' | 'down') => void;
  onDelete: (path: BlockPath) => void;
  children?: React.ReactNode;
}

const DraggableProgramBlock: React.FC<DraggableProgramBlockProps> = ({
  block,
  path,
  isSelected,
  onSelect,
  onMove,
  onDelete,
  children,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `program-${block.id}`,
    data: { source: 'program', block, path } as DragSource,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const className = [
    'program-item',
    isSelected ? 'selected' : '',
    isDragging ? 'dragging' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div ref={setNodeRef} style={style} className={className}>
      <div
        role="button"
        tabIndex={0}
        className="program-block"
        style={{ backgroundColor: block.blockType.color }}
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest('.drag-handle')) {
            return;
          }
          onSelect(path);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            onSelect(path);
          }
        }}
      >
        <div className="program-block__label">
          <span className="icon">{block.blockType.icon}</span>
          <span>{block.blockType.label}</span>
        </div>
        <div className="program-block__actions">
          <button
            type="button"
            className="drag-handle"
            title="拖拽移动"
            {...listeners}
            {...attributes}
          >
            ⠿
          </button>
          <button type="button" onClick={() => onMove(path, 'up')} title="上移">
            ↑
          </button>
          <button type="button" onClick={() => onMove(path, 'down')} title="下移">
            ↓
          </button>
          <button type="button" onClick={() => onDelete(path)} title="删除">
            ×
          </button>
        </div>
      </div>
      {children}
    </div>
  );
};

