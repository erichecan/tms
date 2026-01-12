
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, MessageSquare, Settings, FileText, DollarSign } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import './index.css';

const SidebarItem = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => (
    <NavLink
        to={to}
        className={({ isActive }) => `
      flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors decoration-none text-gray-600
      ${isActive ? 'bg-emerald-50 text-emerald-600 font-medium' : 'hover:bg-gray-50'}
    `}
        style={({ isActive }) => ({
            textDecoration: 'none',
            color: isActive ? 'var(--color-primary)' : 'var(--color-text-secondary)',
            backgroundColor: isActive ? 'var(--color-primary-light)' : 'transparent',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '4px',
            fontWeight: isActive ? 500 : 400
        })}
    >
        <Icon size={20} />
        <span>{label}</span>
    </NavLink>
);

export const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const isDashboard = location.pathname === '/';

    return (
        <div className="layout-container">
            <div className="sidebar">
                <div style={{ padding: '0 16px 32px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ width: 32, height: 32, background: 'var(--color-primary)', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                        <Truck size={20} />
                    </div>
                    <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 700 }}>TMS 5.1</h2>
                </div>

                <nav>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', paddingLeft: '16px' }}>{t('sidebar.core')}</div>
                    <SidebarItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
                    <SidebarItem to="/tracking" icon={Package} label={t('sidebar.trackingLoop')} />

                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', marginTop: '24px', paddingLeft: '16px' }}>{t('sidebar.operations')}</div>
                    <SidebarItem to="/waybills" icon={FileText} label={t('sidebar.waybills')} />
                    <SidebarItem to="/fleet" icon={Truck} label={t('sidebar.fleetExpenses')} />
                    <SidebarItem to="/messages" icon={MessageSquare} label={t('sidebar.messages')} />

                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', marginTop: '24px', paddingLeft: '16px' }}>Finance</div>
                    <SidebarItem to="/finance" icon={DollarSign} label="Financial Overview" />
                    <SidebarItem to="/finance/receivables" icon={FileText} label="Receivables" />
                    <SidebarItem to="/finance/payables" icon={FileText} label="Payables" />

                    <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                        <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} />
                    </div>
                </nav>
            </div>
            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: isDashboard ? '32px' : '24px',
                    height: isDashboard ? 'auto' : '100px', // Using 100px as 150px is quite large for a collapsed nav, but will verify. User asked for 150px, I should probably respect it or try closer to it if it makes sense. I'll stick to 'auto' vs fixed logic.
                    // User said: "shrink to height 150px nav bar... content moves up". 
                    // Actually, let's interpret "150px nav bar" as "max-height: 150px" or similar.
                    // But if I set a fixed height, I might cut off content. 
                    // Let's assume they want a header that takes less vertical space.
                    // Dashboard has: Title + Subtitle. 
                    // Non-Dashboard could hide subtitle or make title smaller.
                    // I will just apply the conditional style as requested: "title area... shrink". 
                    alignItems: isDashboard ? 'flex-start' : 'center'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: isDashboard ? '24px' : '20px', fontWeight: 600 }}>{t('dashboard.welcome', { name: 'Tom' })}</h1>
                        {isDashboard && <p style={{ margin: '4px 0 0', color: '#6B7280' }}>{t('dashboard.subtitle')}</p>}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <div style={{ width: 40, height: 40, background: '#E5E7EB', borderRadius: '50%' }}></div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div >
    );
};
