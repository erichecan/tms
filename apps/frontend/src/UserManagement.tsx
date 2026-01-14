
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Plus, Edit, Trash2, User as UserIcon, Key } from 'lucide-react';
import Modal from './components/Modal/Modal';
import { API_BASE_URL } from './apiConfig';
import { useDialog } from './context/DialogContext';

interface User {
    id: string;
    name: string;
    username?: string;
    email: string;
    roleId: string;
    status: 'ACTIVE' | 'INACTIVE';
}

interface Role {
    id: string;
    name: string;
}

export const UserManagement = () => {
    const { t } = useTranslation();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User> & { password?: string }>({});
    const [passwordForm, setPasswordForm] = useState({ userId: '', newPassword: '' });
    const { confirm } = useDialog();

    const fetchData = async () => {
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const [uRes, rRes] = await Promise.all([
                fetch(`${API_BASE_URL}/users`, { headers }),
                fetch(`${API_BASE_URL}/roles`, { headers })
            ]);
            if (uRes.ok) setUsers(await uRes.json());
            if (rRes.ok) setRoles(await rRes.json());
        } catch (e) {
            console.error(e);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = !!editingUser.id;
        const url = isEdit ? `${API_BASE_URL}/users/${editingUser.id}` : `${API_BASE_URL}/users`;
        const method = isEdit ? 'PUT' : 'POST';

        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(editingUser)
            });
            if (!res.ok) throw new Error('Failed to save');
            setIsModalOpen(false);
            fetchData();
        } catch (err) {
            alert(t('messages.saveFailed'));
        }

    };

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/users/${passwordForm.userId}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ password: passwordForm.newPassword })
            });
            if (!res.ok) throw new Error('Failed to reset');
            setIsPasswordModalOpen(false);
            alert(t('messages.updateSuccess'));
        } catch (e) {
            alert(t('messages.saveFailed'));
        }

    };

    const handleDelete = async (id: string) => {
        const ok = await confirm(t('users.deleteConfirm'), t('users.deleteTitle'));
        if (!ok) return;

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE', headers });
        fetchData();
    };

    const getRoleName = (id: string) => roles.find(r => r.id === id)?.name || id;

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('users.title')}</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>{t('users.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setEditingUser({ status: 'ACTIVE' }); setIsModalOpen(true); }}
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} /> {t('users.add')}
                </button>
            </div>

            <div className="glass" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: 'var(--slate-50)' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('users.table.user')}</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('users.table.username')}</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('users.table.role')}</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('users.table.status')}</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>{t('users.table.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>{t('users.empty')}</td></tr>
                        ) : users.map(user => (
                            <tr key={user.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <UserIcon size={18} color="var(--slate-500)" />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{user.name}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px', fontSize: '14px', color: 'var(--slate-700)' }}>{user.username || '-'}</td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <Shield size={14} color="var(--primary-start)" />
                                        <span style={{ fontWeight: 600, color: 'var(--slate-700)', fontSize: '13px' }}>{getRoleName(user.roleId)}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: 800,
                                        background: user.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                                        color: user.status === 'ACTIVE' ? '#166534' : '#64748B'
                                    }}>
                                        {user.status === 'ACTIVE' ? t('users.modal.statusActive') : t('users.modal.statusInactive')}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setPasswordForm({ userId: user.id, newPassword: '' }); setIsPasswordModalOpen(true); }} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }} title={t('users.modal.resetPassword')}>
                                            <Key size={16} />
                                        </button>
                                        <button onClick={() => { setEditingUser(user); setIsModalOpen(true); }} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(user.id)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px', color: '#EF4444' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser({}); }} title={editingUser.id ? t('users.modal.edit') : t('users.modal.new')}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '600px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.name')}</label>
                            <input required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} placeholder={t('users.modal.placeholderName')} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.email')}</label>
                            <input required type="email" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} placeholder={t('users.modal.placeholderEmail')} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.role')}</label>
                            <select required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }} value={editingUser.roleId || ''} onChange={e => setEditingUser({ ...editingUser, roleId: e.target.value })}>
                                <option value="">{t('users.modal.selectRole')}</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.status')}</label>
                            <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }} value={editingUser.status || 'ACTIVE'} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}>
                                <option value="ACTIVE">{t('users.modal.statusActive')}</option>
                                <option value="INACTIVE">{t('users.modal.statusInactive')}</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.username')}</label>
                            <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.username || ''} onChange={e => setEditingUser({ ...editingUser, username: e.target.value })} placeholder={t('users.modal.placeholderUsername')} />
                        </div>
                        {!editingUser.id && (
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.password')}</label>
                                <input required type="password" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} placeholder={t('users.modal.placeholderPassword')} />
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>{t('users.modal.save')}</button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)} title={t('users.modal.resetPassword')}>
                <form onSubmit={handlePasswordReset} style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '400px' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('users.modal.newPassword')}</label>
                        <input
                            required
                            type="password"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                            value={passwordForm.newPassword}
                            onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                            placeholder={t('users.modal.newPassword')}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                        <button type="button" onClick={() => setIsPasswordModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>{t('common.cancel')}</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>{t('users.modal.resetPassword')}</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
