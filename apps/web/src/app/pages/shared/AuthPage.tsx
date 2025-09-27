import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { TabSwitcher, Tab } from '../../../components/ui/TabSwitcher';
import { Toast } from '../../../components/ui/Toast';
import { useAppStore } from '../../../store/useAppStore';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get('mode') || 'guest');
  const [guestName, setGuestName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [studentName, setStudentName] = useState('');
  const [showToast, setShowToast] = useState(false);
  
  const { 
    loginAsGuest, 
    joinClass, 
    loading, 
    error, 
    isLoggedIn, 
    user,
    setError 
  } = useAppStore();

  // 如果已登录，根据角色重定向
  useEffect(() => {
    if (isLoggedIn && user) {
      navigate(`/${user.role}`);
    }
  }, [isLoggedIn, user, navigate]);

  // 显示错误提示
  useEffect(() => {
    if (error) {
      setShowToast(true);
    }
  }, [error]);

  const handleGuestLogin = async () => {
    const success = await loginAsGuest(guestName || '游客');
    if (success) {
      navigate('/student');
    }
  };

  const handleJoinClass = async () => {
    if (!inviteCode.trim() || !studentName.trim()) {
      setError('请填写完整信息');
      return;
    }
    
    const success = await joinClass(inviteCode.trim(), studentName.trim());
    if (success) {
      navigate('/student');
    }
  };

  const tabs: Tab[] = [
    { id: 'guest', label: '游客体验', icon: '👤' },
    { id: 'student', label: '学生登录', icon: '🎓' },
    { id: 'teacher', label: '教师登录', icon: '👨‍🏫' },
    { id: 'parent', label: '家长登录', icon: '👨‍👩‍👧‍👦' },
  ];

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '480px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px', color: 'white' }}>
          <h1 style={{ fontSize: '2.5rem', marginBottom: '8px', textShadow: '2px 2px 4px rgba(0,0,0,0.3)' }}>
            🚀 CodeAdventurers
          </h1>
          <p style={{ fontSize: '1.1rem', opacity: 0.9 }}>
            编程冒险家 - 让编程学习变得有趣
          </p>
        </div>

        <Card title="登录方式" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}>
          <TabSwitcher
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            style={{ marginBottom: '24px' }}
          />

          {activeTab === 'guest' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>👤 游客模式</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                  快速体验平台功能，无需注册，可随时升级为正式账号。
                </p>
              </div>
              
              <Input
                type="text"
                placeholder="输入昵称（可选）"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
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
              
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
                游客数据将在浏览器本地保存
              </div>
            </div>
          )}

          {activeTab === 'student' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>🎓 学生登录</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                  使用老师提供的班级邀请码加入班级开始学习。
                </p>
              </div>
              
              <Input
                type="text"
                placeholder="输入你的姓名"
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                maxLength={20}
              />
              
              <Input
                type="text"
                placeholder="班级邀请码"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
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
              
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
                没有邀请码？请联系你的老师获取
              </div>
            </div>
          )}

          {activeTab === 'teacher' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>👨‍🏫 教师登录</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                  管理课程内容，创建班级，追踪学生学习进度。
                </p>
              </div>
              
              <Input
                type="email"
                placeholder="教师邮箱"
                disabled
              />
              
              <Input
                type="password"
                placeholder="密码"
                disabled
              />
              
              <Button
                variant="primary"
                disabled
                style={{ width: '100%' }}
              >
                暂未开放
              </Button>
              
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
                教师端功能正在开发中
              </div>
            </div>
          )}

          {activeTab === 'parent' && (
            <div style={{ display: 'grid', gap: '16px' }}>
              <div>
                <h3 style={{ margin: '0 0 12px 0', color: '#4a5568' }}>👨‍👩‍👧‍👦 家长登录</h3>
                <p style={{ color: '#718096', fontSize: '14px', marginBottom: '16px' }}>
                  查看孩子的学习进度，获取学习报告和建议。
                </p>
              </div>
              
              <Input
                type="email"
                placeholder="家长邮箱"
                disabled
              />
              
              <Input
                type="password"
                placeholder="密码"
                disabled
              />
              
              <Button
                variant="primary"
                disabled
                style={{ width: '100%' }}
              >
                暂未开放
              </Button>
              
              <div style={{ textAlign: 'center', fontSize: '12px', color: '#718096' }}>
                家长端功能正在开发中
              </div>
            </div>
          )}

          <div style={{ textAlign: 'center', marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '12px', color: '#718096' }}>
              系统演示版本 - 部分功能正在完善中
            </div>
          </div>
    </Card>
      </div>

      {/* Toast 消息提示 */}
      {showToast && (
        <Toast
          message={error || '操作成功'}
          type={error ? 'error' : 'success'}
          onClose={() => {
            setShowToast(false);
            setError(undefined);
          }}
        />
      )}
  </div>
);
};

export default AuthPage;
