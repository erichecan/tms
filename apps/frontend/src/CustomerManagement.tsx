
import { useEffect, useState } from 'react';
import { Plus, Edit, Trash2, Building2, Mail, Phone as PhoneIcon, MapPin, DollarSign } from 'lucide-react';
// import { useTranslation } from 'react-i18next';
import Modal from './components/Modal/Modal';
import { API_BASE_URL } from './apiConfig';

interface Customer {
    id: string;
    name: string;
    company: string;
    phone: string;
    email: string;
    address: string;
    creditLimit: number;
    status: 'ACTIVE' | 'INACTIVE';
}

export const CustomerManagement = () => {
    // const { t } = useTranslation(); // Removed unused t
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchCustomers = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/customers`);
            if (res.ok) {
                const data = await res.json();
                setCustomers(data);
            }
        } catch (error) {
            console.error('Failed to fetch customers', error);
        }
    };

    useEffect(() => {
        fetchCustomers();
    }, []);

    const handleAddClick = () => {
        setEditingCustomer({ status: 'ACTIVE' });
        setIsModalOpen(true);
    };

    const handleEditClick = (customer: Customer) => {
        setEditingCustomer(customer);
        setIsModalOpen(true);
    };

    const handleDeleteClick = async (id: string) => {
        if (!window.confirm('Archive this customer account?')) return;
        try {
            await fetch(`${API_BASE_URL}/customers/${id}`, { method: 'DELETE' });
            fetchCustomers();
        } catch (error) {
            console.error('Failed to delete customer', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const isEdit = !!editingCustomer.id;
            const url = isEdit
                ? `${API_BASE_URL}/customers/${editingCustomer.id}`
                : `${API_BASE_URL}/customers`;

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCustomer)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchCustomers();
            }
        } catch (error) {
            console.error('Error saving customer', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>Customer Management</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Maintain a high-fidelity database of your corporate partners and individual clients.</p>
                </div>
                <button
                    onClick={handleAddClick}
                    className="btn-primary"
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} />
                    Onboard New Partner
                </button>
            </div>

            <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ background: 'var(--slate-50)' }}>
                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>account entity</th>
                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>contact secure</th>
                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>logistic hub</th>
                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>credit health</th>
                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Status</th>
                            <th style={{ padding: '20px 24px', textAlign: 'right' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ width: 44, height: 44, borderRadius: '14px', background: 'var(--slate-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)' }}>
                                            <Building2 size={22} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--slate-900)', fontSize: '15px' }}>{customer.company}</div>
                                            <div style={{ fontSize: '13px', color: 'var(--slate-500)', fontWeight: 600 }}>Rep: {customer.name}</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)' }}>
                                            <PhoneIcon size={14} color="var(--slate-400)" /> {customer.phone}
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>
                                            <Mail size={14} color="var(--slate-400)" /> {customer.email}
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600, color: 'var(--slate-600)', maxWidth: '240px' }}>
                                        <MapPin size={16} color="var(--primary-start)" />
                                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{customer.address}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 900, color: 'var(--primary-start)', fontSize: '15px' }}>
                                        <DollarSign size={16} />
                                        {customer.creditLimit?.toLocaleString()}
                                    </div>
                                    <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginTop: '4px' }}>Approved Limit</div>
                                </td>
                                <td style={{ padding: '20px 24px' }}>
                                    <span className={customer.status === 'ACTIVE' ? 'badge-green' : 'badge-yellow'} style={{ fontSize: '11px', fontWeight: 800 }}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button onClick={() => handleEditClick(customer)} className="btn-secondary" style={{ padding: '10px', borderRadius: '12px' }}>
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDeleteClick(customer.id)} className="btn-secondary" style={{ padding: '10px', borderRadius: '12px', color: '#EF4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--slate-400)', fontWeight: 600 }}>
                                    The partner roster is currently empty.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCustomer.id ? 'Refine Account Details' : 'Initialize Partner Account'}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: '500px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Authorized Representative</label>
                            <input
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                value={editingCustomer.name || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                                placeholder="Full Name"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Legal Entity Name</label>
                            <input
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                value={editingCustomer.company || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                                placeholder="Company Name"
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Business Contact</label>
                            <input
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                value={editingCustomer.phone || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                placeholder="+1 (000) 000-0000"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Official Email</label>
                            <input
                                type="email"
                                required
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                value={editingCustomer.email || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                placeholder="entity@domain.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>HQ / Logistics Node Address</label>
                        <input
                            required
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                            value={editingCustomer.address || ''}
                            onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                            placeholder="Full Address"
                        />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Credit Allocation ($)</label>
                            <input
                                type="number"
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 900, color: 'var(--primary-start)' }}
                                value={editingCustomer.creditLimit || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, creditLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Account Standing</label>
                            <select
                                style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                value={editingCustomer.status || 'ACTIVE'}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                            >
                                <option value="ACTIVE">ACTIVE PARTNERSHIP</option>
                                <option value="INACTIVE">SUSPENDED / DORMANT</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                        >
                            Dismiss
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="btn-primary"
                            style={{ flex: 1 }}
                        >
                            {isLoading ? 'Processing...' : (editingCustomer.id ? 'Refine Account' : 'Initialize Account')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
