import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// Minimal login page for mobile. Timestamp: 2025-09-23T00:00:00Z
export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    navigate('/dashboard');
  }

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 20, marginBottom: 12 }}>登录</h1>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            placeholder="用户名"
            value={username}
            onChange={e => setUsername(e.target.value)}
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
        <button type="submit" style={{ width: '100%', height: 40 }}>进入</button>
      </form>
    </div>
  );
}


