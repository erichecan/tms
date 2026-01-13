import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../apiConfig';
import { Lock, Mail, ArrowRight, AlertCircle, ShieldCheck } from 'lucide-react';
import logo from '../assets/logo.png';

export const Login = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ identifier, password })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Login failed');
            }

            login(data.token, data.user);
            navigate('/');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            height: '100vh',
            width: '100vw',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e0e7ff 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background Decor */}
            <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '50%', height: '50%', background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', filter: 'blur(150px)', opacity: 0.15, borderRadius: '50%' }} />
            <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '60%', height: '60%', background: 'linear-gradient(135deg, #EF4444 0%, #F59E0B 100%)', filter: 'blur(150px)', opacity: 0.1, borderRadius: '50%' }} />

            <div className="glass" style={{
                width: '100%',
                maxWidth: '440px',
                padding: '48px',
                borderRadius: '24px',
                boxShadow: '0 20px 40px -10px rgba(0,0,0,0.05)',
                position: 'relative',
                zIndex: 10
            }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                        borderRadius: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)'
                    }}>
                        <img src={logo} alt="Logo" style={{ width: '32px', height: '32px' }} />
                    </div>
                    <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px', letterSpacing: '-0.02em' }}>Welcome Back</h1>
                    <p style={{ color: 'var(--slate-500)', fontSize: '15px' }}>Sign in to access TMS 2.0 Dashboard</p>
                </div>

                {error && (
                    <div style={{
                        background: '#FEF2F2',
                        color: '#B91C1C',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '13px',
                        fontWeight: 600,
                        marginBottom: '24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        border: '1px solid #FCA5A5'
                    }}>
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Identity</label>
                        <div style={{ position: 'relative' }}>
                            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                            <input
                                required
                                autoFocus
                                value={identifier}
                                onChange={e => setIdentifier(e.target.value)}
                                placeholder="Email or Username"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--slate-50)',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: 'var(--slate-900)'
                                }}
                            />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-500)', textTransform: 'uppercase' }}>Security Key</label>
                            <a href="#" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--primary-start)', textDecoration: 'none' }}>Forgot code?</a>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                            <input
                                required
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Enter password"
                                style={{
                                    width: '100%',
                                    padding: '14px 16px 14px 48px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    background: 'var(--slate-50)',
                                    fontSize: '15px',
                                    fontWeight: 600,
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    color: 'var(--slate-900)'
                                }}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                        style={{
                            width: '100%',
                            padding: '16px',
                            borderRadius: '14px',
                            fontSize: '16px',
                            fontWeight: 700,
                            marginTop: '8px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            opacity: loading ? 0.7 : 1
                        }}
                    >
                        {loading ? 'Authenticating...' : (
                            <>Sign In <ArrowRight size={18} /></>
                        )}
                    </button>
                </form>

                <div style={{ marginTop: '32px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--slate-400)', fontSize: '13px', fontWeight: 500 }}>
                        <ShieldCheck size={14} />
                        Secured by Apony Guard
                    </div>
                </div>
            </div>
        </div>
    );
};
