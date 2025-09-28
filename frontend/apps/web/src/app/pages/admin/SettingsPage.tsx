import { useForm } from 'react-hook-form';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface AdminSettings {
  theme: string;
  maintenance: string;
}

const SettingsPage = () => {
  const { register, handleSubmit } = useForm<AdminSettings>({
    defaultValues: {
      theme: 'default',
      maintenance: 'off',
    },
  });

  const onSubmit = (values: AdminSettings) => {
    // eslint-disable-next-line no-console
    console.log('保存站点设置', values);
  };

  return (
    <Card title="站点设置" subtitle="主题 / 开关">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem', maxWidth: '360px' }}>
        <label>
          <span>主题</span>
          <Input {...register('theme')} />
        </label>
        <label>
          <span>维护模式</span>
          <Input {...register('maintenance')} />
        </label>
        <Button type="submit">保存</Button>
      </form>
    </Card>
  );
};

export default SettingsPage;
