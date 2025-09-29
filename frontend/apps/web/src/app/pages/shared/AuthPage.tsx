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
				display: 'grid',
				placeItems: 'center',
				padding: '2rem',
				color: '#475569',
				fontSize: '0.95rem',
				textAlign: 'center',
				lineHeight: 1.6,
				background: 'radial-gradient(circle at top, rgba(99, 102, 241, 0.08), transparent 60%)',
			}}
		>
			<div>
				<p style={{ margin: '0 0 0.5rem 0', fontWeight: 600, fontSize: '1.1rem', color: '#312e81' }}>
					登录窗口正在等待你的操作
				</p>
				<p style={{ margin: 0 }}>系统已为你打开登录弹窗，如未看到请点击右上角「登录 / 加入」或刷新页面后重试。</p>
			</div>
		</div>
	);
};

export default AuthPage;
