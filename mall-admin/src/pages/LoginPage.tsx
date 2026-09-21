import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api/auth';
import { setAdminProfile, setAdminToken } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.user.role !== 'merchant' && result.user.role !== 'company_admin') {
        throw new Error('请使用商家或公司管理人员账号登录后台');
      }
      setAdminToken(result.access_token);
      setAdminProfile(result.user.nickname, result.user.role);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="admin-auth-layout">
      <div className="admin-auth-card">
        <p className="eyebrow">商城管理后台</p>
        <h1>后台账号登录</h1>
        <p className="muted-text">公司管理人员：admin / 123456；商家：merchant / 123456</p>
        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            密码
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? '登录中...' : '进入后台'}</button>
        </form>
      </div>
    </section>
  );
}
