import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';
import { setToken } from '../api/client';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [nickname, setNickname] = useState('');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await register(username, password, nickname);
      setToken(result.access_token);
      localStorage.setItem('mobile_nickname', result.user.nickname);
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mobile-login-screen">
      <div className="login-brand"><span>Mobile Mall</span><h1>注册移动商城</h1><p>创建账号后自动登录</p></div>
      <form className="mobile-form" onSubmit={handleSubmit}>
        <label>用户名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
        <label>昵称<input value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
        <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        {error && <div className="error-message" role="alert">{error}</div>}
        <button type="submit" disabled={loading}>{loading ? '注册中...' : '注册并登录'}</button>
      </form>
      <Link className="text-link" to="/login">已有账号，去登录</Link>
    </section>
  );
}
