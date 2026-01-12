import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, MoreHorizontal } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from './apiConfig';

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
                const res = await fetch(`${API_BASE_URL}/waybills`);
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
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('waybill.listTitle')}</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>{t('waybill.listSubtitle')}</p>
                </div>
                <button data-testid="create-waybill-btn" onClick={() => navigate('/waybills/create')} className="btn-primary" style={{ padding: '12px 28px' }}>
                    <Plus size={20} /> {t('waybill.createTitle')}
                </button>
            </div>

            <div className="glass" style={{ padding: '24px' }}>
                {/* Toolbar */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', gap: '24px', flexWrap: 'wrap' }}>
                    <div style={{ position: 'relative', width: '380px', flex: 'none' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                        <input
                            data-testid="waybill-search-input"
                            type="text"
                            placeholder={t('common.search')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 48px',
                                border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none',
                                background: 'var(--slate-50)', fontWeight: 600, fontSize: '14px'
                            }}
                        />
                    </div>

                    <div className="glass" style={{ display: 'flex', gap: '4px', padding: '4px' }}>
                        {['ALL', 'NEW', 'ASSIGNED', 'IN_TRANSIT', 'DELIVERED'].map(status => (
                            <button
                                key={status}
                                data-testid={`filter-${status}`}
                                onClick={() => setFilterStatus(status)}
                                style={{
                                    padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: '12px',
                                    background: filterStatus === status ? 'var(--primary-grad)' : 'transparent',
                                    color: filterStatus === status ? 'white' : 'var(--slate-500)',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                }}
                            >
                                {status === 'ALL' ? 'ALL' : status.replace('_', ' ')}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Table */}
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--slate-50)' }}>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', borderRadius: '12px 0 0 0' }}>{t('waybill.waybillNo')}</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('waybill.customer')}</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('waybill.route')}</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('waybill.estPrice')}</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('common.status')}</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{t('waybill.created')}</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right', borderRadius: '0 12px 0 0' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWaybills.length > 0 ? filteredWaybills.map(wb => (
                                <tr key={wb.id} data-testid="waybill-row" style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                            <div style={{ padding: '10px', background: 'var(--slate-100)', borderRadius: '10px', color: 'var(--primary-start)' }}>
                                                <FileText size={18} />
                                            </div>
                                            <span style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{wb.waybill_no}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', fontWeight: 600, color: 'var(--slate-700)' }}>{wb.customer_id}</td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{wb.origin}</span>
                                            <span style={{ color: 'var(--primary-start)', fontWeight: 800 }}>→</span>
                                            <span style={{ fontWeight: 700, fontSize: '14px' }}>{wb.destination}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', fontWeight: 900, fontSize: '15px' }}>${wb.price_estimated}</td>
                                    <td style={{ padding: '20px' }}>
                                        <span className={`badge ${getStatusColor(wb.status)}`} style={{ fontSize: '11px', fontWeight: 800 }}>{wb.status}</span>
                                    </td>
                                    <td style={{ padding: '20px', color: 'var(--slate-500)', fontSize: '13px', fontWeight: 600 }}>
                                        {new Date(wb.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <button className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                            <MoreHorizontal size={20} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={7} style={{ padding: '80px', textAlign: 'center', color: 'var(--slate-400)' }}>
                                        <div style={{ marginBottom: '16px' }}><Search size={48} opacity={0.2} /></div>
                                        <div style={{ fontWeight: 600 }}>{t('dashboard.noJobs')}</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
