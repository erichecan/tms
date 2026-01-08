
import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Truck, Package, MessageSquare, Settings, FileText } from 'lucide-react';
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
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', paddingLeft: '16px' }}>CORE</div>
                    <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
                    <SidebarItem to="/tracking" icon={Package} label="Tracking Loop" />

                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#9CA3AF', marginBottom: '8px', marginTop: '24px', paddingLeft: '16px' }}>OPERATIONS</div>
                    <SidebarItem to="/waybills" icon={FileText} label="Waybills" />
                    <SidebarItem to="/fleet" icon={Truck} label="Fleet & Expenses" />
                    <SidebarItem to="/messages" icon={MessageSquare} label="Messages" />

                    <div style={{ marginTop: 'auto', paddingTop: '24px' }}>
                        <SidebarItem to="/settings" icon={Settings} label="Settings" />
                    </div>
                </nav>
            </div>
            <main className="main-content">
                <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '32px' }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>Welcome back, Tom!</h1>
                        <p style={{ margin: '4px 0 0', color: '#6B7280' }}>Here's what's happening today.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <NavLink to="/waybills/create" className="btn-primary" style={{ textDecoration: 'none', display: 'inline-block' }}>New Waybill</NavLink>
                        <div style={{ width: 40, height: 40, background: '#E5E7EB', borderRadius: '50%' }}></div>
                    </div>
                </header>
                <Outlet />
            </main>
        </div>
    );
};
