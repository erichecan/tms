
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, MessageSquare, Settings, FileText, DollarSign, Users, Bell, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './index.css';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '14px',
            marginBottom: '4px',
            fontSize: '14px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? '#FFFFFF' : '#94A3B8',
            background: isActive ? 'linear-gradient(135deg, rgba(79, 70, 229, 0.4) 0%, rgba(14, 165, 233, 0.4) 100%)' : 'transparent',
            border: isActive ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid transparent',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
        })}
    >
        <Icon size={18} style={{ opacity: 0.9 }} />
        <span>{label}</span>
    </NavLink>
);

export const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const isDashboard = location.pathname === '/';

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div style={{ padding: '0 8px 40px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: 40, height: 40,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)',
                        borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white',
                        boxShadow: '0 8px 16px rgba(79, 70, 229, 0.4)'
                    }}>
                        <Truck size={24} />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800, letterSpacing: '-0.02em', color: 'white' }}>TMS</h2>
                        <span style={{ fontSize: '10px', color: '#6366F1', fontWeight: 700, textTransform: 'uppercase' }}>Enterprise V2</span>
                    </div>
                </div>

                <nav style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '12px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overview</div>
                    <SidebarItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
                    <SidebarItem to="/tracking" icon={Package} label={t('sidebar.trackingLoop')} />

                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '12px', marginTop: '32px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operations</div>
                    <SidebarItem to="/customers" icon={Users} label="Clients" />
                    <SidebarItem to="/waybills" icon={FileText} label={t('sidebar.waybills')} />
                    <SidebarItem to="/fleet" icon={Truck} label="Fleet Ops" />
                    <SidebarItem to="/messages" icon={MessageSquare} label={t('sidebar.messages')} />

                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', marginBottom: '12px', marginTop: '32px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Finance</div>
                    <SidebarItem to="/finance" icon={DollarSign} label="Financials" />
                    <SidebarItem to="/pricing/rules" icon={Settings} label="Rules Engine" />
                </nav>

                <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '24px', marginTop: '24px' }}>
                    <SidebarItem to="/users" icon={Users} label="Users" />
                    <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} />
                </div>
            </aside>

            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '40px',
                    padding: '0 4px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 800, color: 'white', letterSpacing: '-0.02em' }}>
                            {isDashboard ? 'Fleet Intelligence' : t('sidebar.dashboard')}
                        </h1>
                        <p style={{ margin: '4px 0 0', color: '#94A3B8', fontSize: '14px' }}>
                            {isDashboard ? 'Real-time logistics analytics and resource management' : 'Operational control center'}
                        </p>
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div className="glass" style={{ padding: '8px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Search size={16} color="#94A3B8" />
                            <input placeholder="Search..." style={{ background: 'transparent', border: 'none', outline: 'none', color: 'white', fontSize: '14px' }} />
                        </div>
                        <div className="glass" style={{ width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Bell size={18} color="#94A3B8" />
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'rgba(255, 255, 255, 0.1)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'white', fontSize: '14px', fontWeight: 600 }}>Tom Archer</div>
                                <div style={{ color: '#6366F1', fontSize: '11px', fontWeight: 700 }}>ADMIN PERMIT</div>
                            </div>
                            <div style={{
                                width: 44, height: 44,
                                background: 'linear-gradient(135deg, #4F46E5 0%, #0EA5E9 100%)',
                                borderRadius: '14px',
                                border: '2px solid rgba(255, 255, 255, 0.1)',
                                padding: '2px'
                            }}>
                                <div style={{ width: '100%', height: '100%', borderRadius: '10px', background: '#0F172A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Users size={20} color="white" />
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};
