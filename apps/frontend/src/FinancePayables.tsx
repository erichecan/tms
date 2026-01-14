
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus } from 'lucide-react';
import { API_BASE_URL } from './apiConfig';
import StatementGenerator from './components/Finance/StatementGenerator';

interface FinancialRecord {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    reference_id: string; // Driver ID
}

export const FinancePayables = () => {
    const { t } = useTranslation();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [loading, setLoading] = useState(false);
    const [isGeneratorOpen, setIsGeneratorOpen] = useState(false);

    const fetchRecords = () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${API_BASE_URL}/finance/records?type=payable`, { headers })
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
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>{t('finance.payable.title')}</h2>
                <button
                    onClick={() => setIsGeneratorOpen(true)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> {t('finance.payable.process')}
                </button>
            </div>

            <StatementGenerator
                isOpen={isGeneratorOpen}
                onClose={() => setIsGeneratorOpen(false)}
                type="driver"
                onSuccess={fetchRecords}
            />

            <div style={{ background: 'white', border: '1px solid #E5E7EB', borderRadius: '12px', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                        <tr>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{t('finance.table.id')}</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{t('finance.table.driver')}</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{t('finance.table.amount')}</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{t('finance.table.status')}</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{t('finance.table.date')}</th>
                            <th style={{ padding: '16px', fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{t('finance.table.action')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>{t('common.loading')}</td></tr>
                        ) : records.length === 0 ? (
                            <tr><td colSpan={6} style={{ padding: '24px', textAlign: 'center', color: '#9CA3AF' }}>{t('common.noRecords')}</td></tr>
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
                                            {t('waybill.menu.view')}
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
