import type { HTMLAttributes, ReactNode } from 'react';
import './empty.css';

interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  actions?: ReactNode;
}

export const EmptyState = ({ icon, title, description, action, actions, ...rest }: EmptyStateProps) => {
  const actionNode = actions ?? action;
  return (
    <div className="ui-empty" role="status" {...rest}>
      {icon ? <div className="ui-empty__icon" aria-hidden>{icon}</div> : null}
      <h3>{title}</h3>
      {description ? <p>{description}</p> : null}
      {actionNode ? <div className="ui-empty__action">{actionNode}</div> : null}
    </div>
  );
};
