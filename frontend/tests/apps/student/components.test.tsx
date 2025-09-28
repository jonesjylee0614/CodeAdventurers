/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import * as StudentComponents from '../../../apps/student/src/components.tsx';
const AdventureMap = StudentComponents.AdventureMap;
const HintModal = StudentComponents.HintModal;
const LevelCard = StudentComponents.LevelCard;
const ResultSummary = StudentComponents.ResultSummary;
import * as Engine from '../../../packages/engine/src/index.ts';
type LevelDefinition = Engine.LevelDefinition;
type SimulationResult = Engine.SimulationResult;

const level: LevelDefinition = {
  id: 'sample-1',
  name: '首关演示',
  width: 3,
  height: 3,
  tiles: [],
  start: { x: 0, y: 0, facing: 'east' },
  goal: { reach: { x: 1, y: 0 } },
  bestSteps: 3,
  hints: []
};

describe('Student components', () => {
  it('renders level card and triggers callback', () => {
    const handleStart = jest.fn();
    render(<LevelCard level={level} onStart={handleStart} />);

    fireEvent.click(screen.getByRole('button', { name: /开始/ }));
    expect(handleStart).toHaveBeenCalled();
  });

  it('shows success summary', () => {
    const result: SimulationResult = {
      success: true,
      steps: 4,
      stars: 3,
      log: [],
      metadata: { bestSteps: 3, goal: level.goal }
    } as SimulationResult;

    render(<ResultSummary result={result} />);
    expect(screen.getByText(/成功通关！/)).toBeInTheDocument();
    const stepLabel = screen.getByText(/本次步数/);
    expect(stepLabel.nextElementSibling).not.toBeNull();
    expect(stepLabel.nextElementSibling).toHaveTextContent('4');
  });

  it('shows hint modal content', () => {
    const onClose = jest.fn();
    render(<HintModal hint="试试重复积木" onClose={onClose} isVisible />);
    fireEvent.click(screen.getByText('收到提示'));
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates between levels on map', () => {
    const onSelect = jest.fn();
    render(
      <AdventureMap
        chapters={[
          {
            id: 'ch1',
            title: '第一章',
            levels: [
              {
                id: level.id,
                name: level.name,
                status: 'unlocked' as const,
                stars: 0,
              },
            ],
          },
        ]}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByText('首关演示'));
    expect(onSelect).toHaveBeenCalledWith('sample-1');
  });
});
