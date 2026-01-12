
import { Save, User, Bell, Shield, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Settings = () => {
    const { t, i18n } = useTranslation();
    return (
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>Settings</h1>
            <p style={{ margin: '0 0 32px', color: 'var(--slate-500)', fontSize: '14px' }}>Manage your account and preferences with secure global configurations.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '32px' }}>
                {/* Sidebar Navigation */}
                <div className="glass" style={{ padding: '12px', height: 'fit-content' }}>
                    {[
                        { id: 'Profile', icon: User, label: 'Profile Information' },
                        { id: 'Notifications', icon: Bell, label: 'Notifications' },
                        { id: 'Security', icon: Shield, label: 'Security & Access' },
                        { id: 'Language', icon: Globe, label: 'Localization' }
                    ].map((item, idx) => (
                        <div
                            key={item.id}
                            style={{
                                padding: '12px 16px', borderRadius: '12px', cursor: 'pointer', marginBottom: '4px',
                                background: idx === 0 ? 'var(--primary-grad)' : 'transparent',
                                color: idx === 0 ? '#FFFFFF' : 'var(--slate-500)',
                                fontWeight: idx === 0 ? 700 : 500,
                                display: 'flex', alignItems: 'center', gap: '12px',
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: idx === 0 ? '0 4px 12px rgba(0, 128, 255, 0.2)' : 'none'
                            }}
                        >
                            <item.icon size={18} />
                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Profile Section */}
                    <div className="glass-card">
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>Profile Information</h2>

                        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start', marginBottom: '32px' }}>
                            <div style={{ width: '96px', height: '96px', borderRadius: '24px', background: 'var(--slate-50)', border: '1px solid var(--glass-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                                <User size={48} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>First Name</label>
                                        <input defaultValue="Tom" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>Last Name</label>
                                        <input defaultValue="Admin" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>Email Address</label>
                                        <input defaultValue="tom@aponygroup.com" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                            <button className="btn-primary" style={{ padding: '12px 32px' }}>
                                <Save size={18} /> Save Profile Changes
                            </button>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="glass-card">
                        <h2 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid var(--glass-border)' }}>Company Management</h2>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>Company Legal Name</label>
                                <input defaultValue="Apony Group" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} />
                            </div>
                            <div style={{ gridColumn: 'span 2' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', marginBottom: '8px', textTransform: 'uppercase' }}>Registered Address</label>
                                <textarea defaultValue="123 Logistics Way, Toronto, ON" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600 }} rows={3} />
                            </div>
                        </div>
                    </div>

                    {/* Language Settings */}
                    <div className="glass-card">
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

                </div>
            </div>
        </div>
    );
};
