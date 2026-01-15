
import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, User, LogOut, Package } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { useGPS } from '../hooks/useGPS';

export const DriverLayout: React.FC = () => {
    const { t } = useTranslation();
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const gpsLocation = useGPS(!!user); // Active if user is logged in

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={{
            height: '100vh',
            display: 'flex',
            flexDirection: 'column',
            background: 'var(--slate-50)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Header */}
            <header className="glass" style={{
                padding: '16px 20px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                zIndex: 10,
                borderRadius: '0 0 24px 24px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '12px',
                        background: 'var(--primary-grad)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                    }}>
                        <Package size={20} />
                    </div>
                    <div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--slate-900)' }}>
                            TMS Driver
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--primary-start)', fontWeight: 700 }}>
                            {user?.name}
                        </div>
                    </div>
                </div>

                {gpsLocation && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.1)',
                        padding: '4px 8px',
                        borderRadius: '100px',
                        animation: 'pulse 2s infinite'
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: 800, color: '#10B981', textTransform: 'uppercase' }}>GPS Active</span>
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    style={{
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: 'none',
                        padding: '8px',
                        borderRadius: '10px',
                        color: '#EF4444',
                        display: 'flex',
                        alignItems: 'center',
                        cursor: 'pointer'
                    }}
                >
                    <LogOut size={18} />
                </button>
            </header>

            {/* Content Area */}
            <main style={{
                flex: 1,
                overflowY: 'auto',
                padding: '20px',
                paddingBottom: '100px' // Space for bottom nav
            }}>
                <Outlet />
            </main>

            {/* Bottom Navigation */}
            <nav className="glass" style={{
                position: 'absolute',
                bottom: '20px',
                left: '20px',
                right: '20px',
                height: '72px',
                display: 'flex',
                justifyContent: 'space-around',
                alignItems: 'center',
                padding: '0 16px',
                borderRadius: '24px',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                zIndex: 100
            }}>
                <NavTab to="/driver" icon={Home} label={t('sidebar.dashboard')} />
                <NavTab to="/driver/messages" icon={MessageSquare} label={t('sidebar.messages')} />
                <NavTab to="/driver/settings" icon={User} label={t('sidebar.settings')} />
            </nav>

            <style>{`
                .nav-tab-active {
                    color: var(--primary-start) !important;
                    background: rgba(59, 130, 246, 0.1);
                }
                .nav-tab {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    padding: 8px 16px;
                    border-radius: 16px;
                    color: var(--slate-400);
                    text-decoration: none;
                    transition: all 0.3s ease;
                }
                .nav-tab span {
                    font-size: 10px;
                    font-weight: 700;
                    text-transform: uppercase;
                    letter-spacing: 0.02em;
                }
                @keyframes pulse {
                    0% { transform: scale(1); opacity: 1; }
                    50% { transform: scale(1.05); opacity: 0.8; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
};

const NavTab = ({ to, icon: Icon, label }: { to: string, icon: any, label: string }) => (
    <NavLink
        to={to}
        end={to === '/driver'}
        className={({ isActive }) => isActive ? 'nav-tab nav-tab-active' : 'nav-tab'}
    >
        <Icon size={22} />
        <span>{label}</span>
    </NavLink>
);
