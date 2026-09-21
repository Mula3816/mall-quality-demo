import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { login } from '../api/auth';

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
        throw new Error('请使用买家账号登录商城前台');
      }
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('nickname', result.user.nickname);
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="eyebrow">电商自动化测试项目</p>
        <h1>登录测试商城</h1>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            用户名
            <input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="请输入用户名" />
          </label>
          <label>
            密码
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" />
          </label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? '登录中...' : '登录'}</button>
        </form>
        <p className="hint">买家默认账号：buyer / 123456</p>
        <p className="hint"><Link to="/register">没有账号？注册一个</Link></p>

      </div>
    </section>
  );
}
