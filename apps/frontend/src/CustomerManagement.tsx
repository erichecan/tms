import { useEffect, useState } from 'react';
import { Users, Plus, Edit, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './components/Modal/Modal';

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
    const { t } = useTranslation();
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState<Partial<Customer>>({});
    const [isLoading, setIsLoading] = useState(false);

    const fetchCustomers = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/customers');
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
        if (!window.confirm('Are you sure you want to delete this customer?')) return;
        try {
            await fetch(`http://localhost:3001/api/customers/${id}`, { method: 'DELETE' });
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
                ? `http://localhost:3001/api/customers/${editingCustomer.id}`
                : 'http://localhost:3001/api/customers';

            const method = isEdit ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(editingCustomer)
            });

            if (res.ok) {
                setIsModalOpen(false);
                fetchCustomers();
            } else {
                alert('Failed to save customer');
            }
        } catch (error) {
            console.error('Error saving customer', error);
            alert('Error saving customer');
        } finally {
            setIsLoading(false);
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        marginTop: '4px',
        marginBottom: '16px'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151'
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Customer Management</h1>
                <button
                    onClick={handleAddClick}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 500 }}
                >
                    <Plus size={18} />
                    Add Customer
                </button>
            </div>

            <div className="card" style={{ background: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB', background: '#F9FAFB' }}>
                            <th style={{ padding: '16px', color: '#6B7280', fontWeight: 600 }}>Name / Company</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontWeight: 600 }}>Contact Info</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontWeight: 600 }}>Address</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontWeight: 600 }}>Credit Limit</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontWeight: 600 }}>Status</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontWeight: 600 }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers.map((customer) => (
                            <tr key={customer.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontWeight: 500, color: '#111827' }}>{customer.name}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{customer.company}</div>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ fontSize: '14px' }}>{customer.phone}</div>
                                    <div style={{ fontSize: '13px', color: '#6B7280' }}>{customer.email}</div>
                                </td>
                                <td style={{ padding: '16px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {customer.address}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    ${customer.creditLimit?.toLocaleString()}
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <span style={{
                                        padding: '4px 10px',
                                        borderRadius: '9999px',
                                        fontSize: '12px',
                                        fontWeight: 500,
                                        backgroundColor: customer.status === 'ACTIVE' ? '#DEF7EC' : '#FDE8E8',
                                        color: customer.status === 'ACTIVE' ? '#03543F' : '#9B1C1C'
                                    }}>
                                        {customer.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px' }}>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={() => handleEditClick(customer)}
                                            style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#4B5563' }}
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(customer.id)}
                                            style={{ padding: '6px', border: 'none', background: 'none', cursor: 'pointer', color: '#EF4444' }}
                                            title="Delete"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {customers.length === 0 && (
                            <tr>
                                <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#6B7280' }}>
                                    No customers found. Click "Add Customer" to create one.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingCustomer.id ? 'Edit Customer' : 'Add New Customer'}
            >
                <form onSubmit={handleSubmit}>
                    <label style={labelStyle}>Contact Name</label>
                    <input
                        required
                        style={inputStyle}
                        value={editingCustomer.name || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
                        placeholder="e.g. John Doe"
                    />

                    <label style={labelStyle}>Company Name</label>
                    <input
                        required
                        style={inputStyle}
                        value={editingCustomer.company || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, company: e.target.value })}
                        placeholder="e.g. Acme Logistics"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Phone</label>
                            <input
                                required
                                style={inputStyle}
                                value={editingCustomer.phone || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
                                placeholder="+1 234 567 8900"
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Email</label>
                            <input
                                type="email"
                                required
                                style={inputStyle}
                                value={editingCustomer.email || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
                                placeholder="email@company.com"
                            />
                        </div>
                    </div>

                    <label style={labelStyle}>Address</label>
                    <input
                        required
                        style={inputStyle}
                        value={editingCustomer.address || ''}
                        onChange={(e) => setEditingCustomer({ ...editingCustomer, address: e.target.value })}
                        placeholder="Full Address"
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={labelStyle}>Credit Limit ($)</label>
                            <input
                                type="number"
                                style={inputStyle}
                                value={editingCustomer.creditLimit || ''}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, creditLimit: Number(e.target.value) })}
                            />
                        </div>
                        <div>
                            <label style={labelStyle}>Status</label>
                            <select
                                style={inputStyle}
                                value={editingCustomer.status || 'ACTIVE'}
                                onChange={(e) => setEditingCustomer({ ...editingCustomer, status: e.target.value as any })}
                            >
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                                background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 500,
                                opacity: isLoading ? 0.7 : 1
                            }}
                        >
                            {isLoading ? 'Saving...' : 'Save Customer'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
