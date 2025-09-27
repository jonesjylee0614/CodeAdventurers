import type { PropsWithChildren, ReactNode } from 'react';
import clsx from 'clsx';

import './card.css';

export interface CardProps {
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export const Card = ({ children, title, subtitle, actions, className }: PropsWithChildren<CardProps>) => (
  <section className={clsx('ui-card', className)}>
    {(title || subtitle || actions) && (
      <header className="ui-card__header">
        <div>
          {typeof title === 'string' ? <h2>{title}</h2> : title}
          {subtitle ? <p className="ui-card__subtitle">{subtitle}</p> : null}
        </div>
        {actions ? <div className="ui-card__actions">{actions}</div> : null}
      </header>
    )}
    <div className="ui-card__content">{children}</div>
  </section>
);
