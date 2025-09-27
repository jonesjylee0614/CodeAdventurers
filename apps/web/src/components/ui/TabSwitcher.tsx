import { ReactNode } from 'react';
import clsx from 'clsx';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
}

interface TabSwitcherProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  style?: React.CSSProperties;
}

export const TabSwitcher = ({ tabs, activeTab, onTabChange, style }: TabSwitcherProps) => {
  return (
    <div className="tab-switcher" style={style}>
      <style>{`
        .tab-switcher {
          display: flex;
          background: #f1f5f9;
          border-radius: 8px;
          padding: 4px;
          gap: 2px;
        }
        
        .tab-switcher-btn {
          flex: 1;
          padding: 12px 16px;
          border: none;
          border-radius: 6px;
          background: transparent;
          color: #64748b;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        
        .tab-switcher-btn:hover {
          background: rgba(255, 255, 255, 0.5);
          color: #475569;
        }
        
        .tab-switcher-btn.active {
          background: white;
          color: #1e293b;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
        
        .tab-icon {
          font-size: 16px;
        }
      `}</style>
      
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={clsx('tab-switcher-btn', { active: tab.id === activeTab })}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.icon && <span className="tab-icon">{tab.icon}</span>}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
};
