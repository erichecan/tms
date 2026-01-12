import { useState, useEffect } from 'react';
import { Shield, Plus, Edit, Trash2 } from 'lucide-react';
import Modal from './components/Modal/Modal';

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
    const [editingUser, setEditingUser] = useState<Partial<User>>({});

    const fetchData = async () => {
        const [uRes, rRes] = await Promise.all([
            fetch('http://localhost:3001/api/users'),
            fetch('http://localhost:3001/api/roles')
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
        const url = isEdit ? `http://localhost:3001/api/users/${editingUser.id}` : 'http://localhost:3001/api/users';
        const method = isEdit ? 'PUT' : 'POST';

        await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingUser)
        });
        setIsModalOpen(false);
        fetchData();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete user?')) return;
        await fetch(`http://localhost:3001/api/users/${id}`, { method: 'DELETE' });
        fetchData();
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1>User Management</h1>
                <button
                    onClick={() => { setEditingUser({ status: 'ACTIVE' }); setIsModalOpen(true); }}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                >
                    <Plus size={18} /> Add User
                </button>
            </div>

            <div className="card" style={{ background: 'white', padding: 20, borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>User</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Role</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600 }}>{u.name}</div>
                                    <div style={{ fontSize: 13, color: '#666' }}>{u.email}</div>
                                </td>
                                <td style={{ padding: 12 }}>
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#EFF6FF', color: '#1D4ED8', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                                        <Shield size={12} />
                                        {roles.find(r => r.id === u.roleId)?.name || u.roleId}
                                    </span>
                                </td>
                                <td style={{ padding: 12 }}>
                                    <span style={{
                                        padding: '2px 8px', borderRadius: 99, fontSize: 12,
                                        background: u.status === 'ACTIVE' ? '#DEF7EC' : '#FDE8E8',
                                        color: u.status === 'ACTIVE' ? '#03543F' : '#9B1C1C'
                                    }}>
                                        {u.status}
                                    </span>
                                </td>
                                <td style={{ padding: 12 }}>
                                    <button onClick={() => { setEditingUser(u); setIsModalOpen(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(u.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingUser.id ? 'Edit User' : 'Create User'}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Name</label>
                            <input required style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }} value={editingUser.name || ''} onChange={e => setEditingUser({ ...editingUser, name: e.target.value })} />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Email</label>
                            <input required type="email" style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }} value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Role</label>
                            <select required style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }} value={editingUser.roleId || ''} onChange={e => setEditingUser({ ...editingUser, roleId: e.target.value })}>
                                <option value="">Select Role</option>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: 4, fontSize: 14 }}>Status</label>
                            <select style={{ width: '100%', padding: '8px 12px', border: '1px solid #ddd', borderRadius: 4 }} value={editingUser.status || 'ACTIVE'} onChange={e => setEditingUser({ ...editingUser, status: e.target.value as any })}>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: 10, background: 'white', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer' }}>Cancel</button>
                        <button type="submit" style={{ flex: 1, padding: 10, background: 'blue', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Save</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
