import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/auth';

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
      localStorage.setItem('access_token', result.access_token);
      localStorage.setItem('nickname', result.user.nickname);
      navigate('/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="auth-layout">
      <div className="auth-panel">
        <p className="eyebrow">新用户注册</p>
        <h1>创建商城账号</h1>
        <form className="form-stack" onSubmit={handleSubmit}>
          <label>用户名<input value={username} onChange={(event) => setUsername(event.target.value)} /></label>
          <label>昵称<input value={nickname} onChange={(event) => setNickname(event.target.value)} /></label>
          <label>密码<input type="password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
          {error && <div className="error-message" role="alert">{error}</div>}
          <button type="submit" disabled={loading}>{loading ? '注册中...' : '注册并登录'}</button>
        </form>
        <p className="hint"><Link to="/login">已有账号，去登录</Link></p>
      </div>
    </section>
  );
}
