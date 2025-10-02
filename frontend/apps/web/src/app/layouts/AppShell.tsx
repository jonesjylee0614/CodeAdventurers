import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { AuthModal } from '../components/AuthModal';
import { Modal } from '../../components/ui/Modal';
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
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
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

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = () => {
    logout();
    setShowLogoutConfirm(false);
    navigate('/');
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
          <button 
            type="button" 
            title="消息中心功能即将上线"
            onClick={() => alert('消息中心功能正在开发中，敬请期待！')}
          >
            消息中心
          </button>
          {isLoggedIn ? (
            <>
              <span className="app-shell__welcome">👋 {user?.name ?? '已登录'}</span>
              <button type="button" onClick={handleLogoutClick}>
                退出登录
              </button>
            </>
          ) : (
            <button type="button" onClick={() => navigate('/login')}>
              登录 / 加入
            </button>
          )}
        </div>
      </header>
      <main className="app-shell__main">{children ?? <Outlet />}</main>
      <AuthModal />
      
      {/* 退出登录确认对话框 */}
      <Modal
        title="确认退出"
        open={showLogoutConfirm}
        onClose={() => setShowLogoutConfirm(false)}
        primaryAction={{
          label: '确认退出',
          onClick: handleLogoutConfirm
        }}
        secondaryAction={{
          label: '取消',
          onClick: () => setShowLogoutConfirm(false)
        }}
      >
        <p>确定要退出登录吗？退出后需要重新登录才能继续使用。</p>
      </Modal>
    </div>
  );
};
