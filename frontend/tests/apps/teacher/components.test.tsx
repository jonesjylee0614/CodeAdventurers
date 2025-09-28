/// <reference types="@testing-library/jest-dom" />
import React from 'react';
import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import * as TeacherComponents from '../../../apps/teacher/src/components.tsx';
const Heatmap = TeacherComponents.Heatmap;
const ReplayViewer = TeacherComponents.ReplayViewer;

describe('Teacher components', () => {
  it('renders heatmap table', () => {
    render(
      <Heatmap
        data={[
          {
            className: '一(1)班',
            concepts: [
              { concept: '顺序', mastery: 0.8 },
              { concept: '循环', mastery: 0.6 }
            ]
          }
        ]}
      />
    );

    expect(screen.getByRole('table', { name: '概念掌握热力图' })).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
  });

  it('renders replay events list', () => {
    render(
      <ReplayViewer
        events={[
          { step: 1, block: '前进', outcome: '移动成功' },
          { step: 2, block: '拾取', outcome: '获得宝石' }
        ]}
      />
    );

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });
});
