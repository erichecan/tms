
import { useState, useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, MessageSquare, Settings, FileText, DollarSign, Users, Bell, Search, UserCircle, ShieldCheck, LogOut, X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { searchService } from './services/searchService';
import { notificationService, type Notification } from './services/notificationService';
import { useTranslation } from 'react-i18next';
import { useAuth } from './context/AuthContext';
import logo from './assets/logo.png';
import './index.css';

const SidebarItem = ({ to, icon: Icon, label, indent = 0 }: { to: string; icon: any; label: string; indent?: number }) => (
    <NavLink
        to={to}
        style={({ isActive }) => ({
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            paddingLeft: `${16 + indent}px`,
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

    // --- Search State ---
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearch, setShowSearch] = useState(false);
    const searchTimeout = useRef<any>(null);

    // --- Notification State ---
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // --- Search Logic ---
    useEffect(() => {
        if (!searchQuery || searchQuery.length < 2) {
            setSearchResults([]);
            return;
        }

        if (searchTimeout.current) clearTimeout(searchTimeout.current);

        searchTimeout.current = setTimeout(async () => {
            try {
                const results = await searchService.search(searchQuery);
                setSearchResults(results);
                setShowSearch(true);
            } catch (e) {
                console.error("Search error", e);
            }
        }, 300);
    }, [searchQuery]);

    // --- Notification Logic ---
    const fetchNotifications = async () => {
        if (!user) return;
        try {
            const data = await notificationService.getNotifications(user.id);
            setNotifications(data);
            setUnreadCount(data.filter(n => !n.is_read).length);
        } catch (e) {
            console.error("Failed to fetch notifications");
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll every 60s
        return () => clearInterval(interval);
    }, [user]);

    const handleMarkRead = async (id: string) => {
        try {
            await notificationService.markAsRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error(e);
        }
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
                            <SidebarItem to="/finance/receivables" icon={FileText} label={t('sidebar.receivables')} indent={20} />
                            <SidebarItem to="/finance/payables" icon={FileText} label={t('sidebar.payables')} indent={20} />
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
                        <div style={{ position: 'relative' }}>
                            <div className="glass" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '10px', width: '280px' }}>
                                <Search size={16} color="var(--slate-400)" />
                                <input
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder={t('common.searchPlaceholder')}
                                    onFocus={() => { if (searchResults.length > 0) setShowSearch(true); }}
                                    onBlur={() => setTimeout(() => setShowSearch(false), 200)}
                                    style={{ background: 'transparent', border: 'none', outline: 'none', color: 'var(--slate-900)', fontSize: '14px', width: '100%' }}
                                />
                                {searchQuery && <X size={14} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />}
                            </div>

                            {/* Search Dropdown */}
                            {showSearch && searchResults.length > 0 && (
                                <div className="glass-panel" style={{
                                    position: 'absolute', top: '48px', left: 0, width: '320px',
                                    zIndex: 100, padding: '8px 0', overflow: 'hidden'
                                }}>
                                    <div style={{ padding: '8px 16px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Results</div>
                                    {searchResults.map((item) => (
                                        <div key={item.id}
                                            onClick={() => { navigate(item.link); setShowSearch(false); }}
                                            className="table-row-hover"
                                            style={{
                                                padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer'
                                            }}
                                        >
                                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                {item.type === 'waybill' && <FileText size={12} color="#3B82F6" />}
                                                {item.type === 'customer' && <Users size={12} color="#10B981" />}
                                                {item.type === 'driver' && <Truck size={12} color="#F59E0B" />}
                                            </div>
                                            <div>
                                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-900)' }}>{item.title}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>{item.subtitle}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div
                                className="glass"
                                onClick={() => setShowNotifications(!showNotifications)}
                                style={{ width: 40, height: 40, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative' }}
                            >
                                <Bell size={18} color="var(--slate-500)" />
                                {unreadCount > 0 && (
                                    <div style={{
                                        position: 'absolute', top: 8, right: 8, width: 8, height: 8,
                                        background: '#EF4444', borderRadius: '50%', border: '2px solid white'
                                    }} />
                                )}
                            </div>

                            {/* Notification Panel */}
                            {showNotifications && (
                                <div className="glass-panel" style={{
                                    position: 'absolute', top: '56px', right: 0, width: '360px',
                                    zIndex: 100, padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                                }}>
                                    <div style={{ padding: '16px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ fontWeight: 700, fontSize: '14px' }}>Notifications</div>
                                        <div style={{ fontSize: '12px', color: 'var(--primary-start)', cursor: 'pointer' }}>Mark all read</div>
                                    </div>
                                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                        {notifications.length === 0 ? (
                                            <div style={{ padding: '32px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>No notifications</div>
                                        ) : (
                                            notifications.map(n => (
                                                <div key={n.id} onClick={() => handleMarkRead(n.id)} style={{
                                                    padding: '12px 16px', borderBottom: '1px solid var(--glass-border)',
                                                    background: n.is_read ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                                    cursor: 'pointer', transition: 'all 0.2s', display: 'flex', gap: '12px'
                                                }} className="table-row-hover">
                                                    <div style={{ marginTop: '2px' }}>
                                                        {n.type === 'ALERT' ? <AlertTriangle size={16} color="#EF4444" /> :
                                                            n.type === 'SUCCESS' ? <CheckCircle size={16} color="#10B981" /> :
                                                                <Info size={16} color="#3B82F6" />}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: n.is_read ? 500 : 700, color: 'var(--slate-900)' }}>{n.title}</div>
                                                        <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px', lineHeight: '1.4' }}>{n.content}</div>
                                                        <div style={{ fontSize: '10px', color: 'var(--slate-400)', marginTop: '4px' }}>{new Date(n.created_at).toLocaleString()}</div>
                                                    </div>
                                                    {!n.is_read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3B82F6', marginTop: '6px' }} />}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                        <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)' }}></div>
                        <div
                            style={{ display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                            onClick={() => navigate('/settings')}
                        >
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
