import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Tab, TabSwitcher } from '../../../components/ui/TabSwitcher';
import { AuthMode, useAppStore } from '../../../store/useAppStore';
import './login-page.css';

const AUTH_TABS: Tab[] = [
  { id: 'guest', label: '游客体验', icon: '👤' },
  { id: 'student', label: '学生登录', icon: '🎓' },
  { id: 'teacher', label: '教师登录', icon: '👨‍🏫' },
  { id: 'parent', label: '家长登录', icon: '👨‍👩‍👧‍👦' },
];

const defaultGuestName = '游客';

export const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = searchParams.get('redirect') || '/';

  const {
    loginAsGuest,
    joinClass,
    loginWithCredentials,
    loading,
    error,
    setError,
    isLoggedIn,
    user,
  } = useAppStore((state) => ({
    loginAsGuest: state.loginAsGuest,
    joinClass: state.joinClass,
    loginWithCredentials: state.loginWithCredentials,
    loading: state.loading,
    error: state.error,
    setError: state.setError,
    isLoggedIn: state.isLoggedIn,
    user: state.user,
  }));

  const [activeTab, setActiveTab] = useState<AuthMode>('student');
  const [guestName, setGuestName] = useState('');
  const [studentName, setStudentName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [teacherAccount, setTeacherAccount] = useState('teacher-1');
  const [teacherPassword, setTeacherPassword] = useState('teach123');
  const [parentAccount, setParentAccount] = useState('parent-1');
  const [parentPassword, setParentPassword] = useState('parent123');
  const [showError, setShowError] = useState(false);

  useEffect(() => {
    if (error) {
      setShowError(true);
    }
  }, [error]);

  const previousLoginState = useRef(isLoggedIn);

  // 如果已经登录，重定向到目标页面
  useEffect(() => {
    const wasLoggedIn = previousLoginState.current;
    previousLoginState.current = isLoggedIn;

    if (!wasLoggedIn && isLoggedIn && user) {
      // 登录成功后，跳转到指定页面或用户角色首页
      if (redirectTo && redirectTo !== '/') {
        navigate(redirectTo, { replace: true });
      } else {
        navigate(`/${user.role}`, { replace: true });
      }
    }
  }, [isLoggedIn, user, navigate, redirectTo]);

  const tabs = useMemo(() => AUTH_TABS, []);

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
    <div className="login-page">
      <div className="login-page__container">
        {/* 左侧：品牌和介绍 */}
        <aside className="login-page__hero">
          <div className="login-page__brand">
            <span className="login-page__logo">🧭</span>
            <h1 className="login-page__title">代码奇兵</h1>
            <p className="login-page__subtitle">Code Adventurers</p>
          </div>

          <div className="login-page__features">
            <h2>开启编程冒险之旅</h2>
            <ul>
              <li>
                <span className="login-page__icon">🎮</span>
                <div>
                  <strong>游戏化学习</strong>
                  <p>通过闯关和任务，在游戏中掌握编程技能</p>
                </div>
              </li>
              <li>
                <span className="login-page__icon">🏆</span>
                <div>
                  <strong>成就系统</strong>
                  <p>收集徽章、解锁装扮，见证你的成长</p>
                </div>
              </li>
              <li>
                <span className="login-page__icon">👨‍🏫</span>
                <div>
                  <strong>班级管理</strong>
                  <p>教师和家长可以实时跟踪学习进度</p>
                </div>
              </li>
            </ul>
          </div>

          <div className="login-page__demo-info">
            <h3>演示账号</h3>
            <p><strong>教师：</strong>teacher-1 / teach123</p>
            <p><strong>家长：</strong>parent-1 / parent123</p>
          </div>
        </aside>

        {/* 右侧：登录表单 */}
        <main className="login-page__content">
          <div className="login-page__form-container">
            <h2 className="login-page__form-title">欢迎回来</h2>
            <p className="login-page__form-subtitle">选择一种方式登录，继续你的冒险旅程</p>

            <div className="login-page__tabs">
              <TabSwitcher tabs={tabs} activeTab={activeTab} onTabChange={(tabId) => setActiveTab(tabId as AuthMode)} />
            </div>

            {showError && error && (
              <div role="alert" className="login-page__error">
                ⚠️ {error}
              </div>
            )}

            {/* 游客模式 */}
            {activeTab === 'guest' && (
              <div className="login-page__form">
                <div className="login-page__form-description">
                  <h3>👤 游客模式</h3>
                  <p>快速体验平台核心玩法，数据会保存在当前设备中。</p>
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

            {/* 学生登录 */}
            {activeTab === 'student' && (
              <div className="login-page__form">
                <div className="login-page__form-description">
                  <h3>🎓 学生登录</h3>
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
                <Button 
                  variant="primary" 
                  loading={loading} 
                  onClick={handleJoinClass}
                  style={{ width: '100%' }}
                >
                  加入班级
                </Button>
                <p className="login-page__hint">没有邀请码？请联系你的老师获取</p>
              </div>
            )}

            {/* 教师登录 */}
            {activeTab === 'teacher' && (
              <div className="login-page__form">
                <div className="login-page__form-description">
                  <h3>👨‍🏫 教师登录</h3>
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

            {/* 家长登录 */}
            {activeTab === 'parent' && (
              <div className="login-page__form">
                <div className="login-page__form-description">
                  <h3>👨‍👩‍👧‍👦 家长登录</h3>
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
        </main>
      </div>
    </div>
  );
};

export default LoginPage;

