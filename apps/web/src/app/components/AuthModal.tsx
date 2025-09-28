import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { TabSwitcher, Tab } from '../../components/ui/TabSwitcher';
import { useAppStore, AuthMode } from '../../store/useAppStore';

const AUTH_TABS: Tab[] = [
  { id: 'guest', label: '游客体验', icon: '👤' },
  { id: 'student', label: '学生登录', icon: '🎓' },
  { id: 'teacher', label: '教师登录', icon: '👨‍🏫' },
  { id: 'parent', label: '家长登录', icon: '👨‍👩‍👧‍👦' },
];

const defaultGuestName = '游客';

export const AuthModal = () => {
  const {
    auth,
    closeAuthModal,
    loginAsGuest,
    joinClass,
    loginWithCredentials,
    loading,
    error,
    setError,
    isLoggedIn,
    user,
  } = useAppStore((state) => ({
    auth: state.auth,
    closeAuthModal: state.closeAuthModal,
    loginAsGuest: state.loginAsGuest,
    joinClass: state.joinClass,
    loginWithCredentials: state.loginWithCredentials,
    loading: state.loading,
    error: state.error,
    setError: state.setError,
    isLoggedIn: state.isLoggedIn,
    user: state.user,
  }));

  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<AuthMode>('guest');
  const [guestName, setGuestName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teacherAccount, setTeacherAccount] = useState('teacher-1');
  const [teacherPassword, setTeacherPassword] = useState('teach123');
  const [parentAccount, setParentAccount] = useState('parent-1');
  const [parentPassword, setParentPassword] = useState('parent123');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (auth.isOpen) {
      setActiveTab(auth.mode);
      setShowError(false);
      setError(undefined);
    }
  }, [auth.isOpen, auth.mode, setError]);

  useEffect(() => {
    if (!auth.isOpen) {
      setGuestName('');
      setStudentName('');
      setInviteCode('');
      setTeacherAccount('teacher-1');
      setTeacherPassword('teach123');
      setParentAccount('parent-1');
      setParentPassword('parent123');
      setShowError(false);
    }
  }, [auth.isOpen]);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(`/${user.role}`, { replace: true });
    }
  }, [isLoggedIn, user, navigate]);

  const tabs = useMemo(() => AUTH_TABS, []);

  const handleClose = () => {
    closeAuthModal();
  };

  const handleGuestLogin = async () => {
    const success = await loginAsGuest(guestName.trim() || defaultGuestName);
    if (!success) {
      setShowError(true);
    }
  };

  const handleJoinClass = async () => {
    if (!inviteCode.trim() || !studentName.trim()) {
      setError('请填写完整信息');
      setShowError(true);
      return;
    }

    const success = await joinClass(inviteCode.trim(), studentName.trim());
    if (!success) {
      setShowError(true);
    }
  };

  const handleRoleLogin = async (role: 'teacher' | 'parent') => {
    const identifier = role === 'teacher' ? teacherAccount : parentAccount;
    const password = role === 'teacher' ? teacherPassword : parentPassword;

    if (!identifier.trim() || !password.trim()) {
      setError('请输入账号与密码');
      setShowError(true);
      return;
    }

    const success = await loginWithCredentials({ identifier: identifier.trim(), password: password.trim(), role });
    if (!success) {
      setShowError(true);
    }
  };

  return (
    <>
      <Modal
        title="登录编程冒险家"
        open={auth.isOpen}
        onClose={handleClose}
      >
        <div style={{ display: 'grid', gap: '20px' }}>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 8px 0', color: '#0f172a' }}>🚀 欢迎回来</h3>
            <p style={{ margin: 0, color: '#475569', fontSize: '14px' }}>
              选择一种方式登录，继续你的冒险旅程
            </p>
          </div>

          <TabSwitcher
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={(tabId) => setActiveTab(tabId as AuthMode)}
          />

          {showError && error && (
            <div
              role="alert"
              style={{
                background: '#fee2e2',
                borderRadius: '8px',
                padding: '12px',
                color: '#b91c1c',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {activeTab === 'guest' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>👤 游客模式</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  快速体验平台核心玩法，数据会保存在当前设备中。
                </p>
              </div>
              <Input
                type="text"
                placeholder="输入昵称（可选）"
                value={guestName}
                onChange={(event) => setGuestName(event.target.value)}
                maxLength={20}
              />
              <Button
                variant="primary"
                loading={loading}
                onClick={handleGuestLogin}
                style={{ width: '100%' }}
              >
                开始体验
              </Button>
            </div>
          )}

          {activeTab === 'student' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>🎓 学生登录</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  输入你的姓名与班级邀请码加入老师创建的课堂。
                </p>
              </div>
              <Input
                type="text"
                placeholder="输入你的姓名"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
                maxLength={20}
              />
              <Input
                type="text"
                placeholder="班级邀请码"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
                maxLength={10}
                style={{ textTransform: 'uppercase', letterSpacing: '1px' }}
              />
              <Button
                variant="primary"
                loading={loading}
                onClick={handleJoinClass}
                style={{ width: '100%' }}
              >
                加入班级
              </Button>
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                没有邀请码？请联系你的老师获取
              </div>
            </div>
          )}

          {activeTab === 'teacher' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>👨‍🏫 教师登录</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  使用教师账号进入班级管理与教学分析。演示环境可使用 <strong>teacher-1 / teach123</strong>。
                </p>
              </div>
              <Input
                type="text"
                placeholder="教师账号或姓名"
                value={teacherAccount}
                onChange={(event) => setTeacherAccount(event.target.value)}
              />
              <Input
                type="password"
                placeholder="密码"
                value={teacherPassword}
                onChange={(event) => setTeacherPassword(event.target.value)}
              />
              <Button
                variant="primary"
                loading={loading}
                onClick={() => handleRoleLogin('teacher')}
                style={{ width: '100%' }}
              >
                登录教师后台
              </Button>
            </div>
          )}

          {activeTab === 'parent' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h4 style={{ margin: '0 0 8px 0', color: '#1e293b' }}>👨‍👩‍👧‍👦 家长登录</h4>
                <p style={{ margin: 0, color: '#64748b', fontSize: '13px' }}>
                  跟踪孩子的学习动态与周报。演示账号为 <strong>parent-1 / parent123</strong>。
                </p>
              </div>
              <Input
                type="text"
                placeholder="家长账号或姓名"
                value={parentAccount}
                onChange={(event) => setParentAccount(event.target.value)}
              />
              <Input
                type="password"
                placeholder="密码"
                value={parentPassword}
                onChange={(event) => setParentPassword(event.target.value)}
              />
              <Button
                variant="primary"
                loading={loading}
                onClick={() => handleRoleLogin('parent')}
                style={{ width: '100%' }}
              >
                登录家长中心
              </Button>
            </div>
          )}
        </div>
      </Modal>

    </>
  );
};

export default AuthModal;
