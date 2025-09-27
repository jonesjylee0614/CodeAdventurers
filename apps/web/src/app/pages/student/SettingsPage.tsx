import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Select } from '../../../components/ui/Select';

const settingsSchema = z.object({
  displayName: z.string().min(2, '昵称至少两个字符'),
  language: z.string(),
  enableVoice: z.boolean().default(true),
});

type SettingsForm = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      displayName: '像素冒险家',
      language: 'zh-CN',
      enableVoice: true,
    },
  });

  const onSubmit = (values: SettingsForm) => {
    // eslint-disable-next-line no-console
    console.log('保存设置', values);
  };

  return (
    <Card title="学生设置" subtitle="调节语音提示、语言、昵称等">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem', maxWidth: '420px' }}>
        <label>
          <span>昵称</span>
          <Input {...register('displayName')} />
          {errors.displayName ? <span style={{ color: '#ef4444' }}>{errors.displayName.message}</span> : null}
        </label>
        <label>
          <span>界面语言</span>
          <Select {...register('language')}>
            <option value="zh-CN">中文</option>
            <option value="en-US">English</option>
          </Select>
        </label>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <input type="checkbox" {...register('enableVoice')} /> 启用语音提示
        </label>
        <Button type="submit" disabled={isSubmitting}>
          保存设置
        </Button>
      </form>
    </Card>
  );
};

export default SettingsPage;
