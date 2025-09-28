import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAppStore, AuthMode } from '../../../store/useAppStore';

const AUTH_MODES: AuthMode[] = ['guest', 'student', 'teacher', 'parent'];

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { auth, openAuthModal } = useAppStore((state) => ({
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  useEffect(() => {
    const modeParam = searchParams.get('mode');
    const mode = AUTH_MODES.includes((modeParam as AuthMode) ?? 'guest')
      ? (modeParam as AuthMode)
      : 'guest';
    openAuthModal(mode);
  }, [openAuthModal, searchParams]);

  useEffect(() => {
    if (!auth.isOpen) {
      navigate('/student', { replace: true });
    }
  }, [auth.isOpen, navigate]);

  return (
    <div
      style={{
        minHeight: '60vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#475569',
        fontSize: '14px',
        textAlign: 'center',
      }}
    >
      登录窗口已弹出，如未看到请点击右上角“登录 / 加入”按钮。
    </div>
  );
};

export default AuthPage;
