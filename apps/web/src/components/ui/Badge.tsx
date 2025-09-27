import type { PropsWithChildren } from 'react';
import clsx from 'clsx';
import './badge.css';

type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info';

interface BadgeProps {
  tone?: BadgeTone;
  pill?: boolean;
  className?: string;
}

export const Badge = ({ tone = 'default', pill = true, className, children }: PropsWithChildren<BadgeProps>) => (
  <span className={clsx('ui-badge', `ui-badge--${tone}`, { 'ui-badge--pill': pill }, className)}>{children}</span>
);
