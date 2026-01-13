
import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2, User as UserIcon } from 'lucide-react';
import Modal from './components/Modal/Modal';
import { API_BASE_URL } from './apiConfig';
import { useDialog } from './context/DialogContext';

interface User {
    id: string;
    name: string;
    email: string;
    roleId: string;
    status: 'ACTIVE' | 'INACTIVE';
}

interface Role {
    id: string;
    name: string;
}

export const UserManagement = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<Partial<User & { password?: string }>>({});
    const [passwordMode, setPasswordMode] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const { confirm } = useDialog();

    const fetchData = async () => {
        const [uRes, rRes] = await Promise.all([
            fetch(`${API_BASE_URL}/users`),
            fetch(`${API_BASE_URL}/roles`)
        ]);
        if (uRes.ok) setUsers(await uRes.json());
        if (rRes.ok) setRoles(await rRes.json());
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = !!editingUser.id;
        const url = isEdit ? `${API_BASE_URL}/users/${editingUser.id}` : `${API_BASE_URL}/users`;
        const method = isEdit ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingUser)
        });
        setIsModalOpen(false);
        fetchData();
    };

    const handlePasswordUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPassword) return;
        await fetch(`${API_BASE_URL}/users/${editingUser.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: newPassword })
        });
        setPasswordMode(false);
        setNewPassword('');
        setIsModalOpen(false);
        fetchData();
    };

    const handleDelete = async (id: string) => {
        const ok = await confirm('This action will permanently erase the agent from system records. Do you wish to proceed?', 'Erase Agent');
        if (!ok) return;
        await fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>User Management</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Control system access and permissions for your team.</p>
                </div>
                <button
                    onClick={() => { setEditingUser({ status: 'ACTIVE' }); setIsModalOpen(true); }}
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} /> Add Team Member
                </button>
            </div>

            <div className="glass" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: 'var(--slate-50)' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '16px 0 0 0' }}>User Details</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Role</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Access Status</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '0 16px 0 0' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.length === 0 ? (
                            <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>No users found in the registry.</td></tr>
                        ) : users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)' }}>
                                            <UserIcon size={20} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{u.name}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: 500 }}>{u.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(0,128,255,0.08)', color: 'var(--primary-start)', padding: '6px 14px', borderRadius: '30px', fontSize: '12px', fontWeight: 700 }}>
                                        <Shield size={14} />
                                        {roles.find(r => r.id === u.roleId)?.name || u.roleId}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span className={u.status === 'ACTIVE' ? 'badge-blue' : 'badge-gray'} style={{ fontSize: '11px', fontWeight: 800 }}>
                                        {u.status}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(u.id)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px', color: '#EF4444' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setEditingUser({}); setPasswordMode(false); }} title={passwordMode ? 'Modify Access Credentials' : (editingUser.id ? 'Edit User Profile' : 'New Mission Member')}>
                <form onSubmit={passwordMode ? handlePasswordUpdate : handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '600px' }}>
                    {!passwordMode ? (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Full Identity</label>
                                    <input required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} placeholder="Mission Agent Name" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Secure Email</label>
                                    <input required type="email" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} placeholder="agent@apony.com" />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Clearance Level</label>
                                    <select required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }} value={editingUser.roleId || ''} onChange={e => setEditingUser({ ...editingUser, roleId: e.target.value })}>
                                        <option value="">Select Protocol</option>
                                        {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Deployment Status</label>
                                    <select style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }} value={editingUser.status || 'ACTIVE'} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}>
                                        <option value="ACTIVE">ACTIVE PROTOCOL</option>
                                        <option value="INACTIVE">SUSPENDED</option>
                                    </select>
                                </div>
                            </div>

                            {!editingUser.id && (
                                <div>
                                    <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Initial Passkey</label>
                                    <input required type="password" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} placeholder="Set Entry Cipher" />
                                </div>
                            )}

                            {editingUser.id && (
                                <button type="button" onClick={() => setPasswordMode(true)} className="btn-secondary" style={{ padding: '10px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    <Shield size={14} /> Update Authorization Cipher
                                </button>
                            )}

                            <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Abort</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>{editingUser.id ? 'Authorize Updates' : 'Add Agent'}</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>New Authorization Cipher</label>
                                <input required type="password" style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="Enter New Cipher" />
                            </div>
                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button type="button" onClick={() => setPasswordMode(false)} className="btn-secondary" style={{ flex: 1 }}>Return</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Recode Authorization</button>
                            </div>
                        </>
                    )}
                </form>
            </Modal>
        </div>
    );
};
