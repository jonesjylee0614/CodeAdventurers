import type { ReactNode } from 'react';
import './empty.css';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action }: EmptyStateProps) => (
  <div className="ui-empty" role="status">
    {icon ? <div className="ui-empty__icon" aria-hidden>{icon}</div> : null}
    <h3>{title}</h3>
    {description ? <p>{description}</p> : null}
    {action ? <div className="ui-empty__action">{action}</div> : null}
  </div>
);
