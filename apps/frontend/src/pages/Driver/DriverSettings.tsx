
import React from 'react';
import { User, LogOut, Shield, Bell, HelpCircle, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const DriverSettings: React.FC = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '24px' }}>
                Profile & Settings
            </h2>

            {/* Profile Card */}
            <div className="glass" style={{
                padding: '24px', borderRadius: '24px', background: 'white',
                marginBottom: '32px', border: '1px solid var(--glass-border)',
                display: 'flex', alignItems: 'center', gap: '20px'
            }}>
                <div style={{
                    width: '64px', height: '64px', borderRadius: '20px',
                    background: 'var(--primary-grad)', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', color: 'white'
                }}>
                    <User size={32} />
                </div>
                <div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'var(--slate-900)' }}>{user?.name}</div>
                    <div style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: 600 }}>{user?.email}</div>
                    <div className="badge badge-blue" style={{ marginTop: '8px', display: 'inline-block' }}>DRIVER</div>
                </div>
            </div>

            {/* Menu options */}
            <div className="glass" style={{ padding: '8px', borderRadius: '24px', background: 'white', border: '1px solid var(--glass-border)' }}>
                <MenuItem icon={Bell} label="Notifications" />
                <MenuItem icon={Shield} label="Privacy & Security" />
                <MenuItem icon={HelpCircle} label="Help Support" />

                <div style={{ height: '1px', background: 'var(--slate-100)', margin: '8px 16px' }}></div>

                <div
                    onClick={handleLogout}
                    style={{
                        padding: '16px', display: 'flex', alignItems: 'center', gap: '16px',
                        cursor: 'pointer', color: '#EF4444'
                    }}
                    className="table-row-hover"
                >
                    <div style={{
                        width: '36px', height: '36px', borderRadius: '10px',
                        background: 'rgba(239, 68, 68, 0.1)', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                    }}>
                        <LogOut size={18} />
                    </div>
                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Sign Out</span>
                </div>
            </div>

            {/* Version Info */}
            <div style={{ textAlign: 'center', marginTop: '40px', color: 'var(--slate-400)', fontSize: '12px', fontWeight: 600 }}>
                TMS 2.0 Mobile v1.0.4 (Beta)
            </div>
        </div>
    );
};

const MenuItem = ({ icon: Icon, label }: { icon: any, label: string }) => (
    <div
        style={{
            padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', borderRadius: '16px'
        }}
        className="table-row-hover"
    >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
                width: '36px', height: '36px', borderRadius: '10px',
                background: 'var(--slate-50)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', color: 'var(--slate-600)'
            }}>
                <Icon size={18} />
            </div>
            <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--slate-700)' }}>{label}</span>
        </div>
        <ChevronRight size={16} color="var(--slate-300)" />
    </div>
);
