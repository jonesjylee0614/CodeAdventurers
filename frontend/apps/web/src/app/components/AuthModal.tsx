import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Tab, TabSwitcher } from '../../components/ui/TabSwitcher';
import { AuthMode, useAppStore } from '../../store/useAppStore';
import './auth-modal.css';

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

  const previousLoginState = useRef(isLoggedIn);

  useEffect(() => {
    const wasLoggedIn = previousLoginState.current;
    previousLoginState.current = isLoggedIn;

    if (!wasLoggedIn && isLoggedIn && user) {
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
      <Modal title="登录编程冒险家" open={auth.isOpen} onClose={handleClose}>
        <div className="auth-modal">
          <div className="auth-modal__illustration" aria-hidden="true" />
          <section className="auth-modal__hero">
            <h3 className="auth-modal__hero-title">🚀 欢迎回来</h3>
            <p className="auth-modal__hero-subtitle">选择一种方式登录，继续你的冒险旅程</p>
            <div className="auth-modal__badges">
              <span className="auth-modal__badge">✨ 一键体验</span>
              <span className="auth-modal__badge">🛡️ 数据安全保存</span>
              <span className="auth-modal__badge">👥 多角色切换</span>
            </div>
          </section>

          <div className="auth-modal__content">
            <aside className="auth-modal__summary">
              <h4 className="auth-modal__summary-title">登录后你可以</h4>
              <ul className="auth-modal__summary-list">
                <li>📚 同步课程进度与成就徽章</li>
                <li>🏫 加入或管理班级，查看学习分析</li>
                <li>👨‍👩‍👧 家长实时跟进学习周报</li>
              </ul>
              <div className="auth-modal__divider" />
              <div className="auth-modal__credentials">
                <div>演示账号：</div>
                <div>教师 <strong>teacher-1 / teach123</strong></div>
                <div>家长 <strong>parent-1 / parent123</strong></div>
              </div>
              <div className="auth-modal__cta-group">
                <Button variant="secondary" onClick={() => setActiveTab('guest')}>
                  先试试看
                </Button>
                <Button variant="ghost" onClick={() => setActiveTab('student')}>
                  输入班级邀请码
                </Button>
              </div>
            </aside>

            <div className="auth-modal__panel">
              <div className="auth-modal__tabs">
                <TabSwitcher tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as AuthMode)} />

                {showError && error && (
                  <div role="alert" className="auth-modal__error">
                    {error}
                  </div>
                )}
              </div>

              {activeTab === 'guest' && (
                <div className="auth-modal__form">
                  <div>
                    <h4>👤 游客模式</h4>
                    <p>快速体验平台核心玩法，数据会保存在当前设备中。</p>
                  </div>
                  <Input
                    type="text"
                    placeholder="输入昵称（可选）"
                    value={guestName}
                    onChange={(event) => setGuestName(event.target.value)}
                    maxLength={20}
                  />
                  <div className="auth-modal__actions">
                    <Button variant="primary" loading={loading} onClick={handleGuestLogin}>
                      开始体验
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'student' && (
                <div className="auth-modal__form">
                  <div>
                    <h4>🎓 学生登录</h4>
                    <p>输入你的姓名与班级邀请码加入老师创建的课堂。</p>
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
                  <div className="auth-modal__actions">
                    <Button variant="primary" loading={loading} onClick={handleJoinClass}>
                      加入班级
                    </Button>
                  </div>
                  <div className="auth-modal__hint">没有邀请码？请联系你的老师获取</div>
                </div>
              )}

              {activeTab === 'teacher' && (
                <div className="auth-modal__form">
                  <div>
                    <h4>👨‍🏫 教师登录</h4>
                    <p>使用教师账号进入班级管理与教学分析。</p>
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
                  <div className="auth-modal__actions">
                    <Button variant="primary" loading={loading} onClick={() => handleRoleLogin('teacher')}>
                      登录教师后台
                    </Button>
                  </div>
                </div>
              )}

              {activeTab === 'parent' && (
                <div className="auth-modal__form">
                  <div>
                    <h4>👨‍👩‍👧‍👦 家长登录</h4>
                    <p>跟踪孩子的学习动态与周报。</p>
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
                  <div className="auth-modal__actions">
                    <Button variant="primary" loading={loading} onClick={() => handleRoleLogin('parent')}>
                      登录家长中心
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

    </>
  );
};

export default AuthModal;
