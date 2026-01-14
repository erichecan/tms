
import { useState } from 'react';
import { Save, User, Bell, Shield, Globe, Check, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from './apiConfig';
import { useAuth } from './context/AuthContext';

export const Settings = () => {
    const { t, i18n } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('Profile');

    // Password Change State
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordStatus, setPasswordStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);

    // Notifications State (Mock)
    const [notifPreferences, setNotifPreferences] = useState({
        emailOrderUpdates: true,
        emailMarketing: false,
        smsDelivery: true,
        smsSecurity: true
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setPasswordStatus(null);
        if (newPassword !== confirmPassword) {
            setPasswordStatus({ type: 'error', message: t('settings.security.mismatch') });
            return;
        }

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ oldPassword, newPassword })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Failed to change password');
            }

            setPasswordStatus({ type: 'success', message: t('settings.security.success') });
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err: any) {
            setPasswordStatus({ type: 'error', message: err.message });
        }
    };

    const renderProfile = () => (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>{t('settings.profile.title')}</h2>

            <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: 'var(--slate-50)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <User size={48} />
                </div>
                <div style={{ flex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('settings.profile.fullName')}</label>
                            <input defaultValue={user?.name} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('settings.profile.role')}</label>
                            <input disabled defaultValue={user?.roleId} style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-100)', color: 'var(--slate-500)', fontWeight: 600 }} />
                        </div>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('settings.profile.email')}</label>
                            <input defaultValue={user?.email} disabled style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-100)', color: 'var(--slate-500)', fontWeight: 600 }} />
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                <button className="btn-primary" style={{ padding: '12px 32px' }}>
                    <Save size={18} /> {t('settings.profile.save')}
                </button>
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '32px 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>{t('settings.company.title')}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('settings.company.legalName')}</label>
                    <input defaultValue="Apony Group" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>{t('settings.company.address')}</label>
                    <textarea defaultValue="123 Logistics Way, Toronto, ON" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} rows={3} />
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>{t('settings.notifications')}</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--slate-50)', border: '1px solid var(--glass-border)' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{t('settings.notifications.emailOrder')}</div>
                        <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{t('settings.notifications.emailOrderDesc')}</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={notifPreferences.emailOrderUpdates} onChange={e => setNotifPreferences({ ...notifPreferences, emailOrderUpdates: e.target.checked })} />
                        <span className="slider round"></span>
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--slate-50)', border: '1px solid var(--glass-border)' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{t('settings.notifications.emailMarketing')}</div>
                        <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{t('settings.notifications.emailMarketingDesc')}</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={notifPreferences.emailMarketing} onChange={e => setNotifPreferences({ ...notifPreferences, emailMarketing: e.target.checked })} />
                        <span className="slider round"></span>
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--slate-50)', border: '1px solid var(--glass-border)' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{t('settings.notifications.smsDelivery')}</div>
                        <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{t('settings.notifications.smsDeliveryDesc')}</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={notifPreferences.smsDelivery} onChange={e => setNotifPreferences({ ...notifPreferences, smsDelivery: e.target.checked })} />
                        <span className="slider round"></span>
                    </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', borderRadius: '12px', background: 'var(--slate-50)', border: '1px solid var(--glass-border)' }}>
                    <div>
                        <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{t('settings.notifications.smsSecurity')}</div>
                        <div style={{ fontSize: '13px', color: 'var(--slate-500)' }}>{t('settings.notifications.smsSecurityDesc')}</div>
                    </div>
                    <label className="switch">
                        <input type="checkbox" checked={notifPreferences.smsSecurity} onChange={e => setNotifPreferences({ ...notifPreferences, smsSecurity: e.target.checked })} />
                        <span className="slider round"></span>
                    </label>
                </div>
            </div>

            <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn-primary" style={{ padding: '10px 24px' }} onClick={() => alert(t('settings.notifications.saved'))}>{t('settings.notifications.save')}</button>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>{t('settings.security')}</h2>

            <form onSubmit={handlePasswordChange} style={{ maxWidth: '500px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-700)', marginBottom: '16px' }}>{t('settings.security.changePassword')}</h3>

                {passwordStatus && (
                    <div style={{
                        padding: '12px', borderRadius: '8px', marginBottom: '20px',
                        background: passwordStatus.type === 'error' ? '#FEF2F2' : '#F0FDF4',
                        color: passwordStatus.type === 'error' ? '#EF4444' : '#16A34A',
                        border: `1px solid ${passwordStatus.type === 'error' ? '#FECACA' : '#BBF7D0'}`,
                        fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px'
                    }}>
                        {passwordStatus.type === 'error' ? <AlertCircle size={16} /> : <Check size={16} />}
                        {passwordStatus.message}
                    </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('settings.security.currentPassword')}</label>
                    <input type="password" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }}
                        value={oldPassword} onChange={e => setOldPassword(e.target.value)} />
                </div>

                <div style={{ marginBottom: '16px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('settings.security.newPassword')}</label>
                    <input type="password" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }}
                        value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('settings.security.confirmPassword')}</label>
                    <input type="password" required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }}
                        value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>{t('settings.security.update')}</button>
                </div>
            </form>
        </div>
    );

    const renderLocalization = () => (
        <div className="glass-card" style={{ animation: 'fadeIn 0.3s' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>
                {t('settings.language')}
            </h2>
            <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '12px', textTransform: 'uppercase' }}>
                        {t('settings.selectLanguage')}
                    </label>
                    <div className="glass" style={{ display: 'inline-flex', gap: '4px', padding: '4px' }}>
                        <button
                            onClick={() => i18n.changeLanguage('en')}
                            style={{
                                padding: '8px 24px', borderRadius: '10px', border: 'none',
                                background: i18n.language === 'en' ? 'var(--primary-grad)' : 'transparent',
                                color: i18n.language === 'en' ? 'white' : 'var(--slate-500)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            English (US)
                        </button>
                        <button
                            onClick={() => i18n.changeLanguage('zh')}
                            style={{
                                padding: '8px 24px', borderRadius: '10px', border: 'none',
                                background: i18n.language === 'zh' ? 'var(--primary-grad)' : 'transparent',
                                color: i18n.language === 'zh' ? 'white' : 'var(--slate-500)',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all 0.3s'
                            }}
                        >
                            简体中文 (Simplified)
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('settings.title')}</h1>
            <p style={{ margin: '0 0 32px', color: 'var(--slate-500)', fontSize: '14px' }}>{t('settings.subtitle')}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
                {/* Sidebar Navigation */}
                <div className="glass" style={{ padding: '12px', height: 'fit-content' }}>
                    {[
                        { id: 'Profile', icon: User, label: t('settings.tabs.profile') },
                        { id: 'Notifications', icon: Bell, label: t('settings.tabs.notifications') },
                        { id: 'Security', icon: Shield, label: t('settings.tabs.security') },
                        { id: 'Language', icon: Globe, label: t('settings.tabs.language') }
                    ].map((item) => {
                        const isActive = activeTab === item.id;
                        return (
                            <div
                                key={item.id}
                                onClick={() => setActiveTab(item.id)}
                                style={{
                                    padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px',
                                    background: isActive ? 'var(--primary-grad)' : 'transparent',
                                    color: isActive ? '#FFFFFF' : 'var(--slate-500)',
                                    fontWeight: isActive ? 700 : 500,
                                    display: 'flex', alignItems: 'center', gap: '12px',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    boxShadow: isActive ? '0 4px 12px rgba(0, 128, 255, 0.2)' : 'none'
                                }}
                            >
                                <item.icon size={18} />
                                <span style={{ fontSize: '14px' }}>{item.label}</span>
                            </div>
                        );
                    })}
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeTab === 'Profile' && renderProfile()}
                    {activeTab === 'Notifications' && renderNotifications()}
                    {activeTab === 'Security' && renderSecurity()}
                    {activeTab === 'Language' && renderLocalization()}
                </div>
            </div>
        </div>
    );
};

