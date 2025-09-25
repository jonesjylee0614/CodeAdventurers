import React from 'react';
import type { LevelDefinition, SimulationResult } from '@engine/index';

export interface LevelCardProps {
  level: LevelDefinition;
  onStart: () => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({ level, onStart }) => (
  <div className="level-card" role="article">
    <header>
      <h2>{level.name}</h2>
      <p>最佳步数：{level.bestSteps}</p>
    </header>
    <button onClick={onStart} aria-label={`开始 ${level.name}`}>
      开始挑战
    </button>
  </div>
);

export interface ResultSummaryProps {
  result: SimulationResult;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({ result }) => (
  <section aria-live="polite">
    {result.success ? (
      <>
        <h3>成功通关！</h3>
        <p>本次步数：{result.steps}</p>
        <p>获得星级：{'⭐'.repeat(result.stars)}</p>
      </>
    ) : (
      <>
        <h3>还差一点点～</h3>
        <p>错误类型：{result.errorCode}</p>
      </>
    )}
  </section>
);

export interface HintModalProps {
  hint: string;
  onClose: () => void;
}

export const HintModal: React.FC<HintModalProps> = ({ hint, onClose }) => (
  <div role="dialog" aria-modal="true" className="hint-modal">
    <p>{hint}</p>
    <button onClick={onClose}>收到</button>
  </div>
);

export interface AdventureMapProps {
  levels: LevelDefinition[];
  onSelect: (levelId: string) => void;
}

export const AdventureMap: React.FC<AdventureMapProps> = ({ levels, onSelect }) => (
  <nav aria-label="冒险地图">
    <ul>
      {levels.map((level) => (
        <li key={level.id}>
          <button onClick={() => onSelect(level.id)}>{level.name}</button>
        </li>
      ))}
    </ul>
  </nav>
);
