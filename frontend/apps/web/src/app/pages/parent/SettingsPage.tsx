import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient, ParentSettings } from '../../../services/api/client';

const SettingsPage = () => {
  const { isLoggedIn, user, auth, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    user: state.user,
    auth: state.auth,
    openAuthModal: state.openAuthModal,
  }));

  const { register, handleSubmit, reset } = useForm<ParentSettings>();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>();
  const [successMessage, setSuccessMessage] = useState<string>();

  const canLoad = isLoggedIn && user?.role === 'parent';

  useEffect(() => {
    if (!canLoad) {
      if (!auth.isOpen) {
        openAuthModal('parent');
      }
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const response = await apiClient.getParentSettings();
        if (response.data) {
          reset(response.data);
        }
        setErrorMessage(undefined);
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '加载设置失败');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [canLoad, auth.isOpen, openAuthModal, reset]);

  const onSubmit = async (values: ParentSettings) => {
    setLoading(true);
    try {
      await apiClient.updateParentSettings(values);
      setSuccessMessage('设置已保存');
      setErrorMessage(undefined);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '保存设置失败');
      setSuccessMessage(undefined);
    } finally {
      setLoading(false);
    }
  };

  if (!canLoad) {
    return <EmptyState title="请登录家长账号" description="登录后可调整提醒设置" />;
  }

  return (
    <Card title="家长设置" subtitle="提醒与家长控制">
      {loading && !successMessage ? (
        <p style={{ color: '#64748b' }}>正在加载设置...</p>
      ) : null}
      {errorMessage ? (
        <div style={{ color: '#b91c1c', marginBottom: '12px' }}>{errorMessage}</div>
      ) : null}
      {successMessage ? (
        <div style={{ color: '#15803d', marginBottom: '12px' }}>{successMessage}</div>
      ) : null}
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem', maxWidth: '360px' }}>
        <label>
          <span>每日提醒时间</span>
          <Input type="time" {...register('reminderTime')} />
        </label>
        <label>
          <span>周报发送日</span>
          <Input {...register('weeklyReportDay')} />
        </label>
        <label>
          <span>通知渠道（以逗号分隔）</span>
          <Input
            {...register('notifyChannels', {
              setValueAs: (value: string) =>
                value
                  .split(',')
                  .map((item) => item.trim())
                  .filter(Boolean) as ParentSettings['notifyChannels']
            })}
            placeholder="app,email,sms"
          />
        </label>
        <Button type="submit" variant="primary" loading={loading}>
          保存
        </Button>
      </form>
    </Card>
  );
};

export default SettingsPage;
