import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, FileText, X } from 'lucide-react';
import { WaybillActionMenu } from './components/WaybillActionMenu';
import { Pagination } from './components/Pagination';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from './apiConfig';
import { DriverForm } from './components/FleetForm/DriverForm';
import { VehicleForm } from './components/FleetForm/VehicleForm';

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

    // Assignment State
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedWaybill, setSelectedWaybill] = useState<string | null>(null);
    const [resources, setResources] = useState<{ drivers: any[], vehicles: any[] }>({ drivers: [], vehicles: [] });
    const [assignData, setAssignData] = useState({ driver_id: '', vehicle_id: '' });
    const [addingResource, setAddingResource] = useState<'driver' | 'vehicle' | null>(null);

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
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/waybills?${queryParams.toString()}`, { headers });
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

    const openAssignModal = async (waybillId: string) => {
        setSelectedWaybill(waybillId);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [drivers, vehicles] = await Promise.all([
            fetch(`${API_BASE_URL}/drivers`, { headers }).then(res => res.json()),
            fetch(`${API_BASE_URL}/vehicles`, { headers }).then(res => res.json())
        ]);
        setResources({
            drivers: Array.isArray(drivers.data) ? drivers.data.filter((d: any) => d.status === 'IDLE') : [],
            vehicles: Array.isArray(vehicles.data) ? vehicles.data.filter((v: any) => v.status === 'IDLE') : []
        });
        setIsAssignModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedWaybill || !assignData.driver_id || !assignData.vehicle_id) return;
        try {
            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const res = await fetch(`${API_BASE_URL}/waybills/${selectedWaybill}/assign`, {
                method: 'POST',
                headers,
                body: JSON.stringify(assignData)
            });
            if (res.ok) {
                setIsAssignModalOpen(false);
                setAssignData({ driver_id: '', vehicle_id: '' });
                setAddingResource(null);
                fetchWaybills();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const refreshResources = async () => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const [drivers, vehicles] = await Promise.all([
            fetch(`${API_BASE_URL}/drivers`, { headers }).then(res => res.json()),
            fetch(`${API_BASE_URL}/vehicles`, { headers }).then(res => res.json())
        ]);
        setResources({
            drivers: Array.isArray(drivers.data) ? drivers.data.filter((d: any) => d.status === 'IDLE') : [],
            vehicles: Array.isArray(vehicles.data) ? vehicles.data.filter((v: any) => v.status === 'IDLE') : []
        });
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
                                {t(`status.${status}`)}
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
                                        <span className={`badge ${getStatusColor(wb.status)}`} style={{ fontSize: '11px', fontWeight: 800 }}>{t(`status.${wb.status}`)}</span>
                                    </td>
                                    <td style={{ padding: '20px', color: 'var(--slate-500)', fontSize: '13px', fontWeight: 600 }}>
                                        {new Date(wb.created_at).toLocaleDateString()}
                                    </td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <WaybillActionMenu waybillId={wb.id} onAssign={() => openAssignModal(wb.id)} />
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

                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            </div>

            {/* Assignment Modal */}
            {isAssignModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="glass-card" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto', padding: '40px', background: 'white' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <h3 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--slate-900)' }}>
                                {addingResource === 'driver' ? t('fleet.modal.registerNew') + ' ' + t('fleet.driver') :
                                    addingResource === 'vehicle' ? t('fleet.modal.registerNew') + ' ' + t('fleet.vehicle') :
                                        t('dashboard.modal.title')}
                            </h3>
                            <button onClick={() => { setIsAssignModalOpen(false); setAddingResource(null); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', padding: '4px' }}>
                                <X size={24} />
                            </button>
                        </div>
                        <p style={{ color: 'var(--slate-500)', fontSize: '14px', marginBottom: '32px', fontWeight: 500 }}>
                            {addingResource ? t('fleet.subtitle') : t('dashboard.modal.subtitle')}
                        </p>

                        {addingResource === 'driver' ? (
                            <DriverForm
                                onSuccess={(newDriver) => {
                                    refreshResources();
                                    setAssignData(prev => ({ ...prev, driver_id: newDriver.id }));
                                    setAddingResource(null);
                                }}
                                onCancel={() => setAddingResource(null)}
                            />
                        ) : addingResource === 'vehicle' ? (
                            <VehicleForm
                                onSuccess={(newVehicle) => {
                                    refreshResources();
                                    setAssignData(prev => ({ ...prev, vehicle_id: newVehicle.id }));
                                    setAddingResource(null);
                                }}
                                onCancel={() => setAddingResource(null)}
                            />
                        ) : (
                            <>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('dashboard.modal.driverLabel')}</label>
                                            <button
                                                onClick={() => setAddingResource('driver')}
                                                style={{ border: 'none', background: 'transparent', color: 'var(--primary-start)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={14} /> {t('common.add')}
                                            </button>
                                        </div>
                                        <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }} onChange={e => setAssignData({ ...assignData, driver_id: e.target.value })} value={assignData.driver_id}>
                                            <option value="">{t('dashboard.modal.driverPlaceholder')}</option>
                                            {resources.drivers.map(d => <option key={d.id} value={d.id}>{d.name} (READY)</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                            <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{t('dashboard.modal.vehicleLabel')}</label>
                                            <button
                                                onClick={() => setAddingResource('vehicle')}
                                                style={{ border: 'none', background: 'transparent', color: 'var(--primary-start)', fontSize: '12px', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <Plus size={14} /> {t('common.add')}
                                            </button>
                                        </div>
                                        <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }} onChange={e => setAssignData({ ...assignData, vehicle_id: e.target.value })} value={assignData.vehicle_id}>
                                            <option value="">{t('dashboard.modal.vehiclePlaceholder')}</option>
                                            {resources.vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} • {v.model}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex' }}>
                                    <button onClick={handleAssign} className="btn-primary" style={{ flex: 1 }}>{t('dashboard.modal.confirm')}</button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
