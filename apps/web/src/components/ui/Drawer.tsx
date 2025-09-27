import type { PropsWithChildren, ReactNode } from 'react';
import { useEffect } from 'react';

import { Button } from './Button';
import './drawer.css';

interface DrawerProps {
  title: ReactNode;
  open: boolean;
  onClose: () => void;
  width?: number;
  footer?: ReactNode;
}

export const Drawer = ({ title, open, onClose, width = 520, footer, children }: PropsWithChildren<DrawerProps>) => {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (open) {
      document.addEventListener('keydown', handler);
    }

    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <aside className="ui-drawer" role="complementary" aria-label={typeof title === 'string' ? title : undefined}>
      <div className="ui-drawer__overlay" onClick={onClose} />
      <div className="ui-drawer__panel" style={{ width }}>
        <header className="ui-drawer__header">
          <div>
            {typeof title === 'string' ? <h2>{title}</h2> : title}
          </div>
          <Button variant="ghost" onClick={onClose} aria-label="关闭抽屉">
            关闭
          </Button>
        </header>
        <div className="ui-drawer__body">{children}</div>
        {footer ? <footer className="ui-drawer__footer">{footer}</footer> : null}
      </div>
    </aside>
  );
};
