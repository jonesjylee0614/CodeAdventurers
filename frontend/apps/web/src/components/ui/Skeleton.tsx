import clsx from 'clsx';
import './skeleton.css';

interface SkeletonProps {
  height?: number | string;
  width?: number | string;
  circle?: boolean;
  className?: string;
}

export const Skeleton = ({ height = 16, width = '100%', circle = false, className }: SkeletonProps) => (
  <div
    className={clsx('ui-skeleton', className, { 'ui-skeleton--circle': circle })}
    style={{ height, width }}
    aria-hidden
  />
);
