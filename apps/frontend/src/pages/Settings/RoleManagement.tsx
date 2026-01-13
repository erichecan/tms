import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import Modal from '../../components/Modal/Modal';
import { API_BASE_URL } from '../../apiConfig';
import { useDialog } from '../../context/DialogContext';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions?: any[]; // Full perm objects or just IDs? Controller returns full objects for role.permissions
}

interface Permission {
    id: string;
    name: string;
    module: string;
}

export const RoleManagement = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Partial<Role> & { permissionIds?: string[] }>({});
    const { confirm } = useDialog();

    const fetchData = async () => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const [rRes, pRes] = await Promise.all([
            fetch(`${API_BASE_URL}/roles`, { headers }),
            fetch(`${API_BASE_URL}/permissions`, { headers })
        ]);
        if (rRes.ok) setRoles(await rRes.json());
        if (pRes.ok) setAllPermissions(await pRes.json());
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const isEdit = !!editingRole.id;
        const url = isEdit ? `${API_BASE_URL}/roles/${editingRole.id}` : `${API_BASE_URL}/roles`;
        const method = isEdit ? 'PUT' : 'POST';

        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        await fetch(url, {
            method,
            headers,
            body: JSON.stringify({
                name: editingRole.name,
                description: editingRole.description,
                permissions: editingRole.permissionIds // Send array of IDs
            })
        });
        setIsModalOpen(false);
        fetchData();
    };

    const handleDelete = async (_id: string) => {
        // Deleting roles is dangerous if users assigned. Should check first.
        const ok = await confirm('Deleting a role might invalid permissions for assigned users. Continue?', 'Delete Role');
        if (!ok) return;
        // API not implemented in this demo for delete role, but easy to add.
        alert("Delete not implemented for safety in this demo.");
    };

    const modules = Array.from(new Set(allPermissions.map(p => p.module)));

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>Role & Permissions</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Define access levels and granular controls.</p>
                </div>
                <button
                    onClick={() => { setEditingRole({ permissionIds: [] }); setIsModalOpen(true); }}
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} /> Create Role
                </button>
            </div>

            <div className="glass" style={{ padding: '0' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                    <thead>
                        <tr style={{ background: 'var(--slate-50)' }}>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Role Name</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Description</th>
                            <th style={{ padding: '16px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Permissions Count</th>
                            <th style={{ padding: '16px 24px', textAlign: 'right', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {roles.map(r => (
                            <tr key={r.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                <td style={{ padding: '20px 24px', fontWeight: 700, color: 'var(--slate-900)' }}>{r.name}</td>
                                <td style={{ padding: '20px 24px', color: 'var(--slate-500)', fontSize: '13px' }}>{r.description}</td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span className="badge-blue">{r.permissions?.length || 0} Access Points</span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => {
                                            setEditingRole({
                                                ...r,
                                                permissionIds: r.permissions?.map((p: any) => p.id) || []
                                            });
                                            setIsModalOpen(true);
                                        }} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                            <Edit size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(r.id)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px', color: '#EF4444' }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingRole.id ? 'Edit Role' : 'Create Role'}>
                <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', minWidth: '600px', maxHeight: '80vh', overflowY: 'auto' }}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Role Name</label>
                        <input required style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingRole.name || ''} onChange={e => setEditingRole({ ...editingRole, name: e.target.value })} placeholder="e.g. Flight Dispatcher" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Description</label>
                        <input style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }} value={editingRole.description || ''} onChange={e => setEditingRole({ ...editingRole, description: e.target.value })} placeholder="Role responsibilities..." />
                    </div>

                    <div>
                        <label style={{ display: 'block', marginBottom: '16px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Permissions Configuration</label>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            {modules.map(mod => (
                                <div key={mod} style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                                    <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--slate-700)', marginBottom: '12px', textTransform: 'uppercase' }}>{mod}</div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {allPermissions.filter(p => p.module === mod).map(p => (
                                            <label key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--slate-600)', cursor: 'pointer' }}>
                                                <input
                                                    type="checkbox"
                                                    checked={editingRole.permissionIds?.includes(p.id)}
                                                    onChange={e => {
                                                        const current = editingRole.permissionIds || [];
                                                        if (e.target.checked) {
                                                            setEditingRole({ ...editingRole, permissionIds: [...current, p.id] });
                                                        } else {
                                                            setEditingRole({ ...editingRole, permissionIds: current.filter(id => id !== p.id) });
                                                        }
                                                    }}
                                                />
                                                {p.name}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
                        <button type="submit" className="btn-primary" style={{ flex: 1 }}>Save Configuration</button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
