import type { PropsWithChildren, ReactNode } from 'react';
import { Children, cloneElement, isValidElement, useMemo, useState } from 'react';
import clsx from 'clsx';

import './tabs.css';

export interface TabItemProps {
  id: string;
  title: ReactNode;
}

export const TabItem = ({ children }: PropsWithChildren<TabItemProps>) => <>{children}</>;

interface TabsProps {
  defaultTab?: string;
  onTabChange?: (tabId: string) => void;
}

export const Tabs = ({ children, defaultTab, onTabChange }: PropsWithChildren<TabsProps>) => {
  const tabs = useMemo(
    () =>
      Children.toArray(children).filter(isValidElement).map((child) => ({
        id: child.props.id as string,
        title: child.props.title as ReactNode,
        content: child,
      })),
    [children],
  );

  const [activeTab, setActiveTab] = useState(defaultTab ?? tabs[0]?.id);

  const handleSelect = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  return (
    <div className="ui-tabs">
      <div role="tablist" className="ui-tabs__list">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            type="button"
            className={clsx('ui-tabs__trigger', { 'is-active': tab.id === activeTab })}
            aria-selected={tab.id === activeTab}
            onClick={() => handleSelect(tab.id)}
          >
            {tab.title}
          </button>
        ))}
      </div>
      <div className="ui-tabs__content" role="tabpanel">
        {tabs.map((tab) =>
          tab.id === activeTab && isValidElement(tab.content)
            ? cloneElement(tab.content, { key: tab.id })
            : null,
        )}
      </div>
    </div>
  );
};
