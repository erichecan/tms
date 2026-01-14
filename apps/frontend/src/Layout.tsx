
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, MessageSquare, Settings, FileText, DollarSign, Users, Bell, Search, UserCircle, ShieldCheck, LogOut } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import logo from './assets/logo.png';
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
            borderRadius: '12px',
            marginBottom: '4px',
            fontSize: '14px',
            fontWeight: isActive ? 600 : 500,
            color: isActive ? '#FFFFFF' : 'var(--slate-500)',
            background: isActive ? 'var(--primary-grad)' : 'transparent',
            boxShadow: isActive ? '0 4px 12px rgba(0, 128, 255, 0.2)' : 'none',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
        })}
    >
        <Icon size={18} />
        <span>{label}</span>
    </NavLink>
);

export const Layout = () => {
    const { t } = useTranslation();
    const location = useLocation();
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();
    const isDashboard = location.pathname === '/';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Role-based visibility helpers
    const isAdmin = hasRole('R-ADMIN') || hasRole('ADMIN');
    // const isFinance = hasRole('FINANCE') || isAdmin;
    // const isDispatcher = hasRole('R-DISPATCHER') || hasRole('DISPATCHER') || isAdmin;
    // const isManager = hasRole('GENERAL_MANAGER') || hasRole('FLEET_MANAGER') || isAdmin;

    // Permission-based visibility (Configurable via Role Management)    
    const canViewWaybills = user?.permissions?.includes('P-WAYBILL-VIEW') || isAdmin; // Fallback to admin if perms not loaded
    const canViewFleet = user?.permissions?.includes('P-FLEET-VIEW') || isAdmin;
    const canViewCustomers = user?.permissions?.includes('P-CUSTOMER-VIEW') || isAdmin;
    const canViewFinance = user?.permissions?.includes('P-FINANCE-VIEW') || isAdmin;
    const canViewUsers = user?.permissions?.includes('P-USER-VIEW') || isAdmin;

    // Role name mapping
    const getRoleName = (roleId: string | undefined): string => {
        if (!roleId) return t('roles.user');
        const roleMap: Record<string, string> = {
            'R-ADMIN': t('roles.admin'),
            'ADMIN': t('roles.admin'),
            'R-DISPATCHER': t('roles.dispatcher'),
            'DISPATCHER': t('roles.dispatcher'),
            'R-DRIVER': t('roles.driver'),
            'DRIVER': t('roles.driver'),
            'R-FINANCE': t('roles.finance'),
            'FINANCE': t('roles.finance'),
            'GENERAL_MANAGER': t('roles.generalManager'),
            'FLEET_MANAGER': t('roles.fleetManager')
        };
        return roleMap[roleId] || roleId;
    };

    return (
        <div className="layout-container">
            <aside className="sidebar">
                <div style={{ padding: '0 8px 32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img src={logo} alt="Apony Group" style={{ height: '32px', objectFit: 'contain' }} />
                </div>

                <nav style={{ flex: 1, overflowY: 'auto' }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '12px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sidebar.core')}</div>

                    <SidebarItem to="/" icon={LayoutDashboard} label={t('sidebar.dashboard')} />
                    <SidebarItem to="/tracking" icon={Package} label={t('sidebar.trackingLoop')} />

                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '12px', marginTop: '24px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sidebar.operations')}</div>

                    {canViewCustomers && <SidebarItem to="/customers" icon={Users} label={t('sidebar.customers')} />}
                    {canViewWaybills && <SidebarItem to="/waybills" icon={FileText} label={t('sidebar.waybills')} />}
                    {canViewFleet && <SidebarItem to="/fleet" icon={Truck} label={t('sidebar.fleetExpenses')} />}
                    <SidebarItem to="/messages" icon={MessageSquare} label={t('sidebar.messages')} />

                    {canViewFinance && (
                        <>
                            <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '12px', marginTop: '24px', paddingLeft: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('sidebar.finance')}</div>
                            <SidebarItem to="/finance" icon={DollarSign} label={t('sidebar.financialOverview')} />
                            <SidebarItem to="/finance/receivables" icon={FileText} label={t('sidebar.receivables')} />
                            <SidebarItem to="/finance/payables" icon={FileText} label={t('sidebar.payables')} />
                            <SidebarItem to="/pricing" icon={DollarSign} label={t('sidebar.priceCalculator')} />
                            <SidebarItem to="/rules" icon={ShieldCheck} label={t('sidebar.universalRules')} />
                        </>
                    )}
                </nav>

                <div style={{ borderTop: '1px solid var(--glass-border)', paddingTop: '24px', marginTop: '24px' }}>
                    {canViewUsers && <SidebarItem to="/users" icon={Users} label={t('sidebar.userManagement')} />}
                    {isAdmin && <SidebarItem to="/roles" icon={ShieldCheck} label={t('sidebar.roleManagement')} />}
                    <SidebarItem to="/settings" icon={Settings} label={t('sidebar.settings')} />
                    <div onClick={handleLogout} style={{
                        display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px',
                        fontSize: '14px', fontWeight: 600, color: '#EF4444',
                        cursor: 'pointer', borderRadius: '12px', transition: 'all 0.2s'
                    }} className="table-row-hover">
                        <LogOut size={18} />
                        <span>{t('common.signOut')}</span>
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <header style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '40px'
                }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>
                            {isDashboard ? t('dashboard.welcome', { name: user?.name || t('common.user') }) : t('dashboard.controlCenter')}
                        </h1>
                        {isDashboard && <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>{t('dashboard.subtitle')}</p>}
                    </div>

                    <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        <div className="glass" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', width: '280px' }}>
                            <Search size={16} color="var(--slate-400)" />
                            <input placeholder={t('common.searchPlaceholder')} style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--slate-900)', fontSize: '14px', width: '100%' }} />
                        </div>
                        <div className="glass" style={{ width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                            <Bell size={18} color="var(--slate-500)" />
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ color: 'var(--slate-900)', fontSize: '14px', fontWeight: 700 }}>{user?.name || t('common.user')}</div>
                                <div style={{ color: 'var(--primary-start)', fontSize: '10px', fontWeight: 800 }}>{getRoleName(user?.roleId)}</div>
                            </div>
                            <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'white', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <UserCircle size={28} color="var(--primary-start)" />
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
