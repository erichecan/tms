
import { Save, User, Bell, Shield, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const Settings = () => {
    const { t, i18n } = useTranslation();
    return (
        <div style={{ paddingBottom: '40px' }}>
            <h1 style={{ margin: '0 0 8px', fontSize: '24px', fontWeight: 600 }}>Settings</h1>
            <p style={{ margin: '0 0 32px', color: '#6B7280' }}>Manage your account and preferences.</p>

            <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '32px' }}>
                {/* Sidebar Navigation */}
                <div className="card" style={{ padding: '8px', height: 'fit-content' }}>
                    {['Profile', 'Notifications', 'Security', 'Language'].map((item, idx) => (
                        <div
                            key={item}
                            style={{
                                padding: '12px 16px', borderRadius: '8px', cursor: 'pointer', marginBottom: '4px',
                                background: idx === 0 ? 'var(--color-primary-light)' : 'transparent',
                                color: idx === 0 ? 'var(--color-primary)' : '#4B5563',
                                fontWeight: idx === 0 ? 600 : 400,
                                display: 'flex', alignItems: 'center', gap: '12px'
                            }}
                        >
                            {idx === 0 && <User size={18} />}
                            {idx === 1 && <Bell size={18} />}
                            {idx === 2 && <Shield size={18} />}
                            {idx === 3 && <Globe size={18} />}
                            {item}
                        </div>
                    ))}
                </div>

                {/* Content Area */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

                    {/* Profile Section */}
                    <div className="card">
                        <h2 style={{ fontSize: '18px', margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>Profile Information</h2>

                        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start', marginBottom: '24px' }}>
                            <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                                <User size={40} />
                            </div>
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>First Name</label>
                                        <input defaultValue="Tom" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Last Name</label>
                                        <input defaultValue="Admin" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                                    </div>
                                    <div style={{ gridColumn: 'span 2' }}>
                                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Email Address</label>
                                        <input defaultValue="tom@aponygroup.com" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Save size={18} /> Save Changes
                            </button>
                        </div>
                    </div>

                    {/* Company Info */}
                    <div className="card">
                        <h2 style={{ fontSize: '18px', margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>Company Details</h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Company Name</label>
                                <input defaultValue="Apony Group" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>Address</label>
                                <textarea defaultValue="123 Logistics Way, Toronto, ON" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }} rows={3} />
                            </div>
                        </div>


                    </div>

                    {/* Language Settings */}
                    <div className="card">
                        <h2 style={{ fontSize: '18px', margin: '0 0 24px', paddingBottom: '16px', borderBottom: '1px solid #F3F4F6' }}>
                            {t('settings.language')}
                        </h2>
                        <div style={{ display: 'grid', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                                    {t('settings.selectLanguage')}
                                </label>
                                <div style={{ display: 'flex', gap: '12px' }}>
                                    <button
                                        onClick={() => i18n.changeLanguage('en')}
                                        style={{
                                            padding: '10px 20px', borderRadius: '8px', border: i18n.language === 'en' ? '2px solid var(--color-primary)' : '1px solid #D1D5DB',
                                            background: i18n.language === 'en' ? 'var(--color-primary-light)' : 'white',
                                            fontWeight: i18n.language === 'en' ? 600 : 400,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        English
                                    </button>
                                    <button
                                        onClick={() => i18n.changeLanguage('zh')}
                                        style={{
                                            padding: '10px 20px', borderRadius: '8px', border: i18n.language === 'zh' ? '2px solid var(--color-primary)' : '1px solid #D1D5DB',
                                            background: i18n.language === 'zh' ? 'var(--color-primary-light)' : 'white',
                                            fontWeight: i18n.language === 'zh' ? 600 : 400,
                                            cursor: 'pointer'
                                        }}
                                    >
                                        中文 (Chinese)
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
