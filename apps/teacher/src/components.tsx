import React from 'react';

type HeatmapCell = {
  concept: string;
  mastery: number;
};

type ClassHeatmap = {
  className: string;
  concepts: HeatmapCell[];
};

export interface HeatmapProps {
  data: ClassHeatmap[];
}

export const Heatmap: React.FC<HeatmapProps> = ({ data }) => (
  <table aria-label="概念掌握热力图">
    <thead>
      <tr>
        <th>班级</th>
        {data[0]?.concepts.map((cell) => (
          <th key={cell.concept}>{cell.concept}</th>
        ))}
      </tr>
    </thead>
    <tbody>
      {data.map((row) => (
        <tr key={row.className}>
          <th scope="row">{row.className}</th>
          {row.concepts.map((cell) => (
            <td key={cell.concept} data-mastery={cell.mastery.toFixed(2)}>
              {(cell.mastery * 100).toFixed(0)}%
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

export interface ReplayEvent {
  step: number;
  block: string;
  outcome: string;
}

export interface ReplayViewerProps {
  events: ReplayEvent[];
}

export const ReplayViewer: React.FC<ReplayViewerProps> = ({ events }) => (
  <section aria-label="关卡回放">
    <ol>
      {events.map((event) => (
        <li key={event.step}>
          第 {event.step} 步：{event.block} → {event.outcome}
        </li>
      ))}
    </ol>
  </section>
);
