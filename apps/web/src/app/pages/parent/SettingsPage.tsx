import { useForm } from 'react-hook-form';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

interface ParentSettings {
  reminderTime: string;
  weeklyReport: string;
}

const SettingsPage = () => {
  const { register, handleSubmit } = useForm<ParentSettings>({
    defaultValues: {
      reminderTime: '20:00',
      weeklyReport: '周日',
    },
  });

  const onSubmit = (values: ParentSettings) => {
    // eslint-disable-next-line no-console
    console.log('保存家长设置', values);
  };

  return (
    <Card title="家长设置" subtitle="提醒与家长控制">
      <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'grid', gap: '1rem', maxWidth: '360px' }}>
        <label>
          <span>每日提醒时间</span>
          <Input type="time" {...register('reminderTime')} />
        </label>
        <label>
          <span>周报发送日</span>
          <Input {...register('weeklyReport')} />
        </label>
        <Button type="submit">保存</Button>
      </form>
    </Card>
  );
};

export default SettingsPage;
