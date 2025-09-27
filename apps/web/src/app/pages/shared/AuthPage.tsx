import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const AuthPage = () => (
  <div style={{ display: 'grid', placeItems: 'center', minHeight: '60vh' }}>
    <Card title="登录" subtitle="统一认证入口">
      <form style={{ display: 'grid', gap: '1rem', width: '320px' }}>
        <label>
          <span>邮箱</span>
          <Input type="email" placeholder="name@example.com" />
        </label>
        <label>
          <span>密码</span>
          <Input type="password" placeholder="••••••" />
        </label>
        <Button type="submit">登录</Button>
      </form>
    </Card>
  </div>
);

export default AuthPage;
