import { NavLink, Outlet } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import './app-shell.css';

const primaryNav = [
  { to: '/student', label: '学生端' },
  { to: '/teacher', label: '教师端' },
  { to: '/parent', label: '家长端' },
  { to: '/admin', label: '管理端' },
];

export const AppShell = ({ children }: PropsWithChildren) => (
  <div className="app-shell">
    <header className="app-shell__header">
      <div className="app-shell__brand">代码奇兵 Code Adventurers</div>
      <nav aria-label="角色切换">
        <ul>
          {primaryNav.map((item) => (
            <li key={item.to}>
              <NavLink to={item.to}>{item.label}</NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <div className="app-shell__actions">
        <button type="button">消息中心</button>
        <button type="button">账号</button>
      </div>
    </header>
    <main className="app-shell__main">{children ?? <Outlet />}</main>
  </div>
);
