import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText } from 'lucide-react';
import { WaybillActionMenu } from './components/WaybillActionMenu';
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
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const [loading, setLoading] = useState(false);
    const pageSize = 10;

    // Use a debounced search term for API calls
    const [debouncedSearch, setDebouncedSearch] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const fetchWaybills = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams({
                status: filterStatus,
                page: String(currentPage),
                limit: String(pageSize),
                search: debouncedSearch
            });
            const res = await fetch(`${API_BASE_URL}/waybills?${queryParams.toString()}`);
            if (res.ok) {
                const result = await res.json();
                setWaybills(Array.isArray(result.data) ? result.data : []);
                setTotalPages(result.totalPages || 1);
                setTotalItems(result.total || 0);
            }
        } catch (err) {
            console.error("Failed to fetch waybills", err);
            setWaybills([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchWaybills();
    }, [filterStatus, currentPage, debouncedSearch]);

    // Reset to page 1 when filtering or searching
    useEffect(() => {
        setCurrentPage(1);
    }, [filterStatus, debouncedSearch]);

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
                            {loading ? (
                                <tr>
                                    <td colSpan={7} style={{ padding: '80px', textAlign: 'center' }}>
                                        <div style={{ width: 40, height: 40, border: '4px solid var(--primary-start)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                                    </td>
                                </tr>
                            ) : waybills.length > 0 ? waybills.map(wb => (
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
                                        <WaybillActionMenu waybillId={wb.id} />
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

                {/* Pagination */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px', padding: '0 8px' }}>
                    <div style={{ color: 'var(--slate-500)', fontSize: '13px', fontWeight: 600 }}>
                        Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalItems)} of {totalItems} waybills
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`btn-secondary ${currentPage === 1 ? 'opacity-50 pointer-events-none' : ''}`}
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                            Previous
                        </button>
                        <div style={{ display: 'flex', gap: '4px' }}>
                            {[...Array(totalPages)].map((_, i) => (
                                <button
                                    key={i + 1}
                                    onClick={() => setCurrentPage(i + 1)}
                                    style={{
                                        width: '36px', height: '36px', borderRadius: '10px', border: 'none', cursor: 'pointer',
                                        background: currentPage === i + 1 ? 'var(--primary-grad)' : 'var(--slate-100)',
                                        color: currentPage === i + 1 ? 'white' : 'var(--slate-600)',
                                        fontWeight: 700, fontSize: '13px', transition: 'all 0.2s'
                                    }}
                                >
                                    {i + 1}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages}
                            className={`btn-secondary ${currentPage === totalPages ? 'opacity-50 pointer-events-none' : ''}`}
                            style={{ padding: '8px 16px', fontSize: '13px' }}
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
