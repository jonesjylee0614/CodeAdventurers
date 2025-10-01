import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import clsx from 'clsx';

import './button.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  type = 'button',
  ...rest
}: PropsWithChildren<ButtonProps>) => (
  <button
    className={clsx('ui-button', `ui-button--${variant}`, `ui-button--${size}`)}
    disabled={loading || disabled}
    type={type}
    {...rest}
  >
    {loading ? '处理中…' : children}
  </button>
);
