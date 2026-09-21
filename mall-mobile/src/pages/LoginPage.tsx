import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../api/auth';
import { setToken } from '../api/client';

export default function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('buyer');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(username, password);
      if (result.user.role !== 'customer') {
        throw new Error('请使用买家账号登录移动商城');
      }
      setToken(result.access_token);
      localStorage.setItem('mobile_nickname', result.user.nickname);
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mobile-login-screen">
      <div className="login-brand">
        <span>Mobile Mall</span>
        <h1>登录移动商城</h1>
        <p>买家默认账号：buyer / 123456</p>
      </div>
      <form className="mobile-form" onSubmit={handleSubmit}>
        <label>
          用户名
          <input value={username} onChange={(event) => setUsername(event.target.value)} />
        </label>
        <label>
          密码
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        {error && <div className="error-message" role="alert">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
      </form>
      <Link className="text-link" to="/register">没有账号？注册一个</Link>
    </section>

  );
}
