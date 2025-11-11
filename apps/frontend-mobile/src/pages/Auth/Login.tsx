import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, TOKEN_STORAGE_KEY } from '../../services/api';
import { LoginPayload } from '../../types';

// 2025-11-11T15:35:32Z Added by Assistant: Driver authentication via backend
export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('请输入邮箱和密码');
      return;
    }

    const payload: LoginPayload = {
      email: email.trim(),
      password: password.trim(),
    };

    try {
      setLoading(true);
      const authResponse = await authApi.login(payload);
      if (!authResponse.user || !localStorage.getItem(TOKEN_STORAGE_KEY)) {
        throw new Error('登录响应无效');
      }
      navigate('/dashboard');
    } catch (err) {
      console.error('司机登录失败:', err);
      setError('登录失败，请检查账号或稍后再试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>司机登录</h1>
      {error && (
        <div style={{ marginBottom: 12, padding: 8, background: '#fff1f0', border: '1px solid #ffa39e', borderRadius: 6, fontSize: 12 }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="邮箱"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 12px' }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            placeholder="密码"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ width: '100%', height: 40, padding: '0 12px' }}
          />
        </div>
        <button type="submit" style={{ width: '100%', height: 40 }} disabled={loading}>
          {loading ? '登录中...' : '进入任务面板'}
        </button>
      </form>
    </div>
  );
}
