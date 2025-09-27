import './progress.css';

interface ProgressProps {
  value: number;
  max?: number;
  label?: string;
}

export const Progress = ({ value, max = 100, label }: ProgressProps) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className="ui-progress">
      {label ? <span className="ui-progress__label">{label}</span> : null}
      <div className="ui-progress__track">
        <div className="ui-progress__indicator" style={{ width: `${percentage}%` }} aria-hidden />
      </div>
      <span className="ui-progress__value" aria-live="polite">
        {Math.round(percentage)}%
      </span>
    </div>
  );
};
