import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { AuthModal } from '../components/AuthModal';
import { useAppStore } from '../../store/useAppStore';
import './app-shell.css';

const primaryNav = [
  { to: '/student', label: '学生端' },
  { to: '/teacher', label: '教师端' },
  { to: '/parent', label: '家长端' },
  { to: '/admin', label: '管理端' },
];

export const AppShell = ({ children }: PropsWithChildren) => {
  const navigate = useNavigate();
  const { isLoggedIn, user, logout, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    logout: state.logout,
    openAuthModal: state.openAuthModal,
  }));

  const handleBrandClick = () => {
    if (user?.role) {
      navigate(`/${user.role}`);
      return;
    }
    openAuthModal('guest');
  };

  return (
    <div className="app-shell">
      <header className="app-shell__header">
        <button type="button" className="app-shell__brand" onClick={handleBrandClick}>
          <span role="img" aria-label="logo">
            🧭
          </span>
          代码奇兵 Code Adventurers
        </button>
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
          {isLoggedIn ? (
            <>
              <span className="app-shell__welcome">👋 {user?.name ?? '已登录'}</span>
              <button type="button" onClick={logout}>
                退出登录
              </button>
            </>
          ) : (
            <button type="button" onClick={() => openAuthModal('guest')}>
              登录 / 加入
            </button>
          )}
        </div>
      </header>
      <main className="app-shell__main">{children ?? <Outlet />}</main>
      <AuthModal />
    </div>
  );
};
