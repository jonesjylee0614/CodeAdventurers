import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { useAppStore } from '../../../store/useAppStore';
import { apiClient } from '../../../services/api/client';

const settingsSchema = z.object({
  volume: z.number().min(0).max(1),
  language: z.enum(['zh-CN', 'en-US']),
  lowMotion: z.boolean(),
  resettable: z.boolean(),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const { isLoggedIn, loadStudentData, user, openAuthModal } = useAppStore((state) => ({
    isLoggedIn: state.isLoggedIn,
    loadStudentData: state.loadStudentData,
    user: state.user,
    openAuthModal: state.openAuthModal,
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      volume: 0.8,
      language: 'zh-CN',
      lowMotion: false,
      resettable: true,
    },
  });

  useEffect(() => {
    if (!isLoggedIn) {
      openAuthModal('student');
      return;
    }

    const loadSettings = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await apiClient.getStudentSettings();
        if (response.error) {
          setError(response.error);
          return;
        }

        if (response.data) {
          reset({
            volume: typeof response.data.volume === 'number' ? response.data.volume : 0.8,
            language: response.data.language ?? 'zh-CN',
            lowMotion: Boolean(response.data.lowMotion),
            resettable: response.data.resettable ?? true,
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : '加载设置失败');
      } finally {
        setLoading(false);
      }
    };

    void loadSettings();
  }, [isLoggedIn, openAuthModal, reset]);

  const onSubmit = async (values: SettingsForm) => {
    setFeedback(null);
    setError(null);

    try {
      const response = await apiClient.updateStudentSettings(values);
      if (response.error) {
        setError(response.error);
        return;
      }
      setFeedback('设置已保存，稍后生效。');
      await loadStudentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    }
  };

  const handleResetProgress = async () => {
    setResetting(true);
    setFeedback(null);
    setError(null);
    try {
      const response = await apiClient.resetStudentProgress();
      if (response.error) {
        setError(response.error);
        return;
      }
      setFeedback('已清空关卡进度，可重新开始冒险。');
      await loadStudentData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '重置进度失败');
    } finally {
      setResetting(false);
    }
  };

  if (!isLoggedIn) {
    return null;
  }

  if (loading) {
    return (
      <Card title="加载中">
        <p style={{ color: '#6b7280' }}>正在获取你的设置...</p>
      </Card>
    );
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem', maxWidth: '680px' }}>
      <Card
        title="学生设置"
        subtitle="调整音量、语言与动效偏好，保存后将在下一次关卡中生效"
      >
        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1.25rem' }}>
          <section>
            <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>基础信息</h3>
            <p style={{ margin: 0, color: '#6b7280' }}>当前昵称：{user?.name ?? '冒险者'}</p>
          </section>

          <section>
            <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>音效设置</h3>
            <div style={{ display: 'grid', gap: '0.75rem' }}>
              <Controller
                name="volume"
                control={control}
                render={({ field }) => (
                  <label style={{ display: 'grid', gap: '4px' }}>
                    <span>提示音量 ({Math.round((field.value ?? 0) * 100)}%)</span>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round((field.value ?? 0) * 100)}
                      onChange={(event) => field.onChange(Number(event.target.value) / 100)}
                    />
                  </label>
                )}
              />
              {errors.volume ? <span style={{ color: '#ef4444' }}>{errors.volume.message}</span> : null}
            </div>
          </section>

          <section>
            <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>显示与语言</h3>
            <label style={{ display: 'grid', gap: '4px' }}>
              <span>界面语言</span>
              <Select {...register('language')}>
                <option value="zh-CN">中文</option>
                <option value="en-US">English</option>
              </Select>
            </label>

            <Controller
              name="lowMotion"
              control={control}
              render={({ field }) => (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '12px' }}>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => {
                      setFeedback(null);
                      setError(null);
                      field.onChange(event.target.checked);
                    }}
                  />
                  <span style={{ color: '#374151' }}>低动效模式（减少动画，保护视力）</span>
                </label>
              )}
            />
          </section>

          <section>
            <h3 style={{ margin: '0 0 8px 0', color: '#111827' }}>安全与重置</h3>
            <Controller
              name="resettable"
              control={control}
              render={({ field }) => (
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(event) => {
                      setFeedback(null);
                      setError(null);
                      field.onChange(event.target.checked);
                    }}
                  />
                  <span style={{ color: '#374151' }}>允许课堂老师帮助我重置进度</span>
                </label>
              )}
            />

            <Button
              type="button"
              variant="secondary"
              onClick={handleResetProgress}
              disabled={resetting}
              style={{ marginTop: '12px' }}
            >
              {resetting ? '正在重置...' : '清空关卡进度'}
            </Button>
          </section>

          {error && <div style={{ color: '#ef4444' }}>{error}</div>}
          {feedback && <div style={{ color: '#16a34a' }}>{feedback}</div>}

          <div style={{ display: 'flex', gap: '12px' }}>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? '保存中...' : '保存设置'}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => reset()}
              disabled={isSubmitting}
            >
              恢复默认
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SettingsPage;
