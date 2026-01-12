
import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { API_BASE_URL } from './apiConfig';

interface FinancialRecord {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    reference_id: string; // Driver ID
}

export const FinancePayables = () => {
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(false);

    const fetchRecords = () => {
        setLoading(true);
        fetch(`${API_BASE_URL}/finance/records?type=payable`)
            .then(res => res.json())
            .then(data => setRecords(data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchRecords();
    }, []);

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Accounts Payable</h2>
                <button
                    style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#3B82F6', color: 'white', border: 'none',
                        padding: '10px 16px', borderRadius: '8px', fontWeight: 500, cursor: 'pointer'
                    }}
                >
                    <Plus size={18} /> Process Payroll
                </button>
            </div>

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>ID</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>DRIVER</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>AMOUNT</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>STATUS</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>DATE</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>ACTION</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>Loading...</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>No records found</td></tr>
                        ) : (
                            records.map(record => (
                                <tr key={record.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827' }}>{record.id}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#374151' }}>{record.reference_id}</td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#111827', fontWeight: 500 }}>
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(record.amount)}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <span style={{
                                            padding: '4px 10px', borderRadius: '16px', fontSize: '12px', fontWeight: 500,
                                            background: record.status === 'PAID' ? '#D1FAE5' : '#FEF3C7',
                                            color: record.status === 'PAID' ? '#065F46' : '#92400E'
                                        }}>
                                            {record.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '16px', fontSize: '14px', color: '#6B7280' }}>
                                        {new Date(record.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '16px' }}>
                                        <button style={{ color: '#2563EB', background: 'none', border: 'none', fontWeight: 500, cursor: 'pointer' }}>
                                            View
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
