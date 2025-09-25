import React, { useState } from 'react';
import * as Engine from '../../../packages/engine/src/index.ts';
type LevelDefinition = Engine.LevelDefinition;
type SimulationResult = Engine.SimulationResult;

export interface LevelCardProps {
  level: LevelDefinition;
  progress?: { stars: number; completed: boolean };
  onStart: () => void;
}

export const LevelCard: React.FC<LevelCardProps> = ({ level, progress, onStart }) => (
  <div className="level-card" role="article">
    <style>{`
      .level-card {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        border-radius: 12px;
        padding: 20px;
        color: white;
        box-shadow: 0 8px 16px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
        cursor: pointer;
        position: relative;
        overflow: hidden;
      }
      
      .level-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0,0,0,0.15);
      }
      
      .level-card::before {
        content: '';
        position: absolute;
        top: -50%;
        left: -50%;
        width: 200%;
        height: 200%;
        background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
        transform: rotate(45deg);
        pointer-events: none;
      }
      
      .level-header {
        position: relative;
        z-index: 1;
        margin-bottom: 16px;
      }
      
      .level-title {
        font-size: 18px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      
      .level-meta {
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 14px;
        opacity: 0.9;
      }
      
      .level-progress {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      .stars {
        font-size: 16px;
      }
      
      .level-btn {
        position: relative;
        z-index: 1;
        width: 100%;
        padding: 12px;
        background: rgba(255,255,255,0.2);
        border: 2px solid rgba(255,255,255,0.3);
        border-radius: 8px;
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
      }
      
      .level-btn:hover {
        background: rgba(255,255,255,0.3);
        border-color: rgba(255,255,255,0.5);
      }
      
      .completed-badge {
        position: absolute;
        top: 12px;
        right: 12px;
        background: #4caf50;
        color: white;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: 500;
      }
    `}</style>
    
    <div className="level-header">
      <h2 className="level-title">{level.name}</h2>
      <div className="level-meta">
        <span>目标步数: {level.bestSteps}</span>
        {progress && (
          <div className="level-progress">
            <span className="stars">
              {progress.stars > 0 ? '⭐'.repeat(progress.stars) : '☆☆☆'}
            </span>
          </div>
        )}
      </div>
    </div>
    
    <button 
      className="level-btn" 
      onClick={onStart} 
      aria-label={`开始 ${level.name}`}
    >
      {progress?.completed ? '🔄 重新挑战' : '🚀 开始挑战'}
    </button>
    
    {progress?.completed && (
      <div className="completed-badge">✓ 已完成</div>
    )}
  </div>
);

export interface ResultSummaryProps {
  result: SimulationResult;
  onNext?: () => void;
  onRetry?: () => void;
}

export const ResultSummary: React.FC<ResultSummaryProps> = ({ result, onNext, onRetry }) => (
  <section className="result-summary" aria-live="polite">
    <style>{`
      .result-summary {
        background: ${result.success ? 'linear-gradient(135deg, #4caf50, #45a049)' : 'linear-gradient(135deg, #ff5722, #f4511e)'};
        color: white;
        padding: 24px;
        border-radius: 12px;
        text-align: center;
        box-shadow: 0 8px 16px rgba(0,0,0,0.2);
      }
      
      .result-title {
        font-size: 24px;
        margin: 0 0 16px 0;
        font-weight: 600;
      }
      
      .result-stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
        gap: 16px;
        margin: 16px 0;
      }
      
      .stat-item {
        background: rgba(255,255,255,0.2);
        padding: 12px;
        border-radius: 8px;
        backdrop-filter: blur(10px);
      }
      
      .stat-label {
        display: block;
        font-size: 12px;
        opacity: 0.8;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 18px;
        font-weight: 600;
      }
      
      .result-actions {
        display: flex;
        gap: 12px;
        justify-content: center;
        margin-top: 20px;
      }
      
      .result-btn {
        padding: 10px 20px;
        border: 2px solid rgba(255,255,255,0.5);
        border-radius: 8px;
        background: rgba(255,255,255,0.2);
        color: white;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        backdrop-filter: blur(10px);
      }
      
      .result-btn:hover {
        background: rgba(255,255,255,0.3);
        border-color: rgba(255,255,255,0.7);
      }
      
      .stars-display {
        font-size: 32px;
        margin: 8px 0;
      }
    `}</style>
    
    {result.success ? (
      <>
        <h3 className="result-title">🎉 成功通关！</h3>
        <div className="stars-display">
          {'⭐'.repeat(result.stars)}{'☆'.repeat(3 - result.stars)}
        </div>
        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">本次步数</span>
            <div className="stat-value">{result.steps}</div>
          </div>
          <div className="stat-item">
            <span className="stat-label">最佳步数</span>
            <div className="stat-value">{result.metadata.bestSteps}</div>
          </div>
          <div className="stat-item">
            <span className="stat-label">获得星级</span>
            <div className="stat-value">{result.stars}/3</div>
          </div>
        </div>
        <div className="result-actions">
          {onRetry && (
            <button className="result-btn" onClick={onRetry}>
              🔄 再试一次
            </button>
          )}
          {onNext && (
            <button className="result-btn" onClick={onNext}>
              ➡️ 下一关
            </button>
          )}
        </div>
      </>
    ) : (
      <>
        <h3 className="result-title">💡 再试试吧</h3>
        <div className="result-stats">
          <div className="stat-item">
            <span className="stat-label">错误类型</span>
            <div className="stat-value">
              {result.errorCode === 'E_COLLIDE' ? '撞墙了' :
               result.errorCode === 'E_STEP_LIMIT' ? '步数超限' :
               result.errorCode === 'E_GOAL_NOT_MET' ? '未达成目标' : '未知错误'}
            </div>
          </div>
          <div className="stat-item">
            <span className="stat-label">已执行步数</span>
            <div className="stat-value">{result.steps}</div>
          </div>
        </div>
        <div className="result-actions">
          {onRetry && (
            <button className="result-btn" onClick={onRetry}>
              🔄 重新尝试
            </button>
          )}
        </div>
      </>
    )}
  </section>
);

export interface HintModalProps {
  hint: string;
  onClose: () => void;
  isVisible: boolean;
}

export const HintModal: React.FC<HintModalProps> = ({ hint, onClose, isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="hint-modal-overlay" onClick={onClose}>
      <style>{`
        .hint-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          backdrop-filter: blur(4px);
        }
        
        .hint-modal {
          background: white;
          padding: 24px;
          border-radius: 12px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 16px 32px rgba(0,0,0,0.2);
          animation: modalSlideIn 0.3s ease-out;
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .hint-icon {
          font-size: 48px;
          text-align: center;
          margin-bottom: 16px;
        }
        
        .hint-content {
          font-size: 16px;
          line-height: 1.5;
          color: #333;
          text-align: center;
          margin-bottom: 20px;
        }
        
        .hint-close-btn {
          width: 100%;
          padding: 12px;
          background: #2196f3;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        
        .hint-close-btn:hover {
          background: #1976d2;
        }
      `}</style>
      
      <div className="hint-modal" onClick={(e) => e.stopPropagation()}>
        <div className="hint-icon">💡</div>
        <div className="hint-content">{hint}</div>
        <button className="hint-close-btn" onClick={onClose}>
          收到提示
        </button>
      </div>
    </div>
  );
};

export interface AdventureMapProps {
  chapters: Array<{
    id: string;
    title: string;
    levels: Array<{
      id: string;
      name: string;
      status: 'locked' | 'available' | 'completed';
      stars: number;
    }>;
  }>;
  onSelect: (levelId: string) => void;
}

export const AdventureMap: React.FC<AdventureMapProps> = ({ chapters, onSelect }) => {
  const [selectedChapter, setSelectedChapter] = useState(0);

  return (
    <div className="adventure-map">
      <style>{`
        .adventure-map {
          padding: 20px;
          font-family: 'Microsoft YaHei', sans-serif;
        }
        
        .map-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .map-title {
          font-size: 28px;
          font-weight: 600;
          color: #333;
          margin: 0 0 8px 0;
        }
        
        .map-subtitle {
          color: #666;
          font-size: 16px;
        }
        
        .chapter-tabs {
          display: flex;
          justify-content: center;
          margin-bottom: 30px;
          gap: 8px;
          flex-wrap: wrap;
        }
        
        .chapter-tab {
          padding: 10px 20px;
          border: 2px solid #ddd;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-weight: 500;
        }
        
        .chapter-tab.active {
          border-color: #2196f3;
          background: #2196f3;
          color: white;
        }
        
        .chapter-tab:hover:not(.active) {
          border-color: #2196f3;
          color: #2196f3;
        }
        
        .levels-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .level-node {
          background: white;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          cursor: pointer;
          transition: all 0.2s;
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
          position: relative;
        }
        
        .level-node:hover:not(.locked) {
          transform: translateY(-4px);
          box-shadow: 0 8px 16px rgba(0,0,0,0.15);
        }
        
        .level-node.locked {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
        }
        
        .level-node.completed {
          border: 2px solid #4caf50;
        }
        
        .level-status {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          font-weight: bold;
        }
        
        .level-status.locked {
          background: #ccc;
          color: white;
        }
        
        .level-status.available {
          background: #ff9800;
          color: white;
        }
        
        .level-status.completed {
          background: #4caf50;
          color: white;
        }
        
        .level-name {
          font-size: 16px;
          font-weight: 600;
          margin: 8px 0;
          color: #333;
        }
        
        .level-stars {
          font-size: 18px;
          margin: 8px 0;
        }
      `}</style>
      
      <div className="map-header">
        <h1 className="map-title">🗺️ 编程冒险地图</h1>
        <p className="map-subtitle">选择章节开始你的编程之旅</p>
      </div>
      
      <div className="chapter-tabs">
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            className={`chapter-tab ${index === selectedChapter ? 'active' : ''}`}
            onClick={() => setSelectedChapter(index)}
          >
            {chapter.title}
          </button>
        ))}
      </div>
      
      {chapters[selectedChapter] && (
        <div className="levels-grid">
          {chapters[selectedChapter].levels.map((level) => (
            <div
              key={level.id}
              className={`level-node ${level.status}`}
              onClick={() => level.status !== 'locked' && onSelect(level.id)}
            >
              <div className={`level-status ${level.status}`}>
                {level.status === 'locked' ? '🔒' :
                 level.status === 'available' ? '🎯' : '✓'}
              </div>
              
              <div className="level-name">{level.name}</div>
              
              <div className="level-stars">
                {level.status === 'completed' ? (
                  <>{'⭐'.repeat(level.stars)}{'☆'.repeat(3 - level.stars)}</>
                ) : (
                  '☆☆☆'
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
