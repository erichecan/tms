

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Waybill {
    id: string;
    waybill_no: string;
    customer_id: string;
    origin: string;
    destination: string;
    status: string;
    price_estimated: number;
    created_at: string;
}

export const WaybillsList = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [waybills, setWaybills] = useState<Waybill[]>([]);
    const [filterStatus, setFilterStatus] = useState('ALL');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const fetchWaybills = async () => {
            try {
                const res = await fetch('http://localhost:3001/api/waybills');
                if (res.ok) {
                    const data = await res.json();
                    setWaybills(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                console.error("Failed to fetch waybills", err);
                setWaybills([]);
            }
        };
        fetchWaybills();
    }, []);

    const filteredWaybills = waybills.filter(wb => {
        const matchesStatus = filterStatus === 'ALL' || wb.status === filterStatus;
        const matchesSearch = wb.waybill_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wb.customer_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
            wb.destination.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'NEW': return 'badge-yellow';
            case 'ASSIGNED': return 'badge-blue';
            case 'IN_TRANSIT': return 'badge-green';
            case 'DELIVERED': return 'badge-gray';
            default: return 'badge-gray';
        }
    };

    return (
        <div style={{ paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 600 }}>{t('waybill.listTitle')}</h1>
                    <p style={{ margin: '4px 0 0', color: '#6B7280' }}>{t('waybill.listSubtitle')}</p>
                </div>
                <button data-testid="create-waybill-btn" onClick={() => navigate('/waybills/create')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={20} /> {t('waybill.createTitle')}
                </button>
            </div>

            <div className="card">
                {/* Toolbar */}
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '300px', flex: 'none' }}>
                        <Search size={20} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }} />
                        <input
                            data-testid="waybill-search-input"
                            type="text"
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '10px 10px 10px 40px',
                                border: '1px solid #E5E7EB', borderRadius: '8px', outline: 'none'
                            }}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                        {['ALL', 'NEW', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].map(status => (
                            <button
                                key={status}
                                data-testid={`filter-${status}`}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 500, fontSize: '14px',
                                    background: filterStatus === status ? 'var(--color-primary)' : '#F3F4F6',
                                    color: filterStatus === status ? 'white' : '#4B5563'
                                }}
                            >
                                {status === 'ALL' ? 'ALL' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: '16px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>{t('waybill.waybillNo')}</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>{t('waybill.customer')}</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>{t('waybill.route')}</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>{t('waybill.estPrice')}</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>{t('common.status')}</th>
                            <th style={{ padding: '16px', color: '#6B7280', fontSize: '12px', textTransform: 'uppercase' }}>{t('waybill.created')}</th>
                            <th style={{ padding: '16px' }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredWaybills.length > 0 ? filteredWaybills.map(wb => (
                            <tr key={wb.id} data-testid="waybill-row" style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '16px', fontWeight: 500 }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ padding: '8px', background: '#F3F4F6', borderRadius: '8px', color: '#6B7280' }}>
                                            <FileText size={16} />
                                        </div>
                                        {wb.waybill_no}
                                    </div>
                                </td>
                                <td style={{ padding: '16px', color: '#374151' }}>{wb.customer_id}</td>
                                <td style={{ padding: '16px', color: '#374151' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <span>{wb.origin}</span>
                                        <span style={{ color: '#9CA3AF' }}>→</span>
                                        <span>{wb.destination}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px', fontWeight: 500 }}>${wb.price_estimated}</td>
                                <td style={{ padding: '16px' }}>
                                    <span className={`badge ${getStatusColor(wb.status)}`}>{wb.status}</span>
                                </td>
                                <td style={{ padding: '16px', color: '#6B7280', fontSize: '14px' }}>
                                    {new Date(wb.created_at).toLocaleDateString()}
                                </td>
                                <td style={{ padding: '16px', textAlign: 'right' }}>
                                    <button style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#9CA3AF' }}>
                                        <MoreHorizontal size={20} />
                                    </button>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan={7} style={{ padding: '48px', textAlign: 'center', color: '#6B7280' }}>
                                    {t('dashboard.noJobs')}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
