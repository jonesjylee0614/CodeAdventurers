import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';

import { Button } from './Button';
import './modal.css';

export interface ModalProps {
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  primaryAction?: { label: string; onClick: () => void; disabled?: boolean };
  secondaryAction?: { label: string; onClick: () => void; disabled?: boolean };
}

export const Modal = ({
  title,
  open,
  onClose,
  primaryAction,
  secondaryAction,
  children,
}: PropsWithChildren<ModalProps>) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal" role="dialog" aria-modal="true">
      <div className="ui-modal__overlay" onClick={onClose} />
      <div className="ui-modal__content" role="document">
        <header className="ui-modal__header">
          <h2>{title}</h2>
          <button type="button" aria-label="关闭" onClick={onClose} className="ui-modal__close">
            ×
          </button>
        </header>
        <div className="ui-modal__body">{children}</div>
        <footer className="ui-modal__footer">
          {secondaryAction ? (
            <Button variant="ghost" onClick={secondaryAction.onClick} disabled={secondaryAction.disabled}>
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
              {primaryAction.label}
            </Button>
          ) : null}
        </footer>
      </div>
    </div>
  );
};
