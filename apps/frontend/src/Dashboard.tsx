

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Clock, AlertCircle, FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Metrics {
    totalWaybills: number;
    activeTrips: number;
    pendingWaybills: number;
    onTimeRate: number;
}

interface Job {
    id: string;
    waybill_no: string;
    origin: string;
    destination: string;
    status: string;
    price_estimated: number;
}

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '12px', borderRadius: '12px', background: color + '20', color: color }}>
            <Icon size={24} />
        </div>
        <div>
            <div style={{ color: '#6B7280', fontSize: '14px', marginBottom: '4px' }}>{label}</div>
            <div style={{ fontSize: '24px', fontWeight: 700 }}>{value}</div>
        </div>
    </div>
);

export const Dashboard = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [metrics, setMetrics] = useState<Metrics | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedWaybill, setSelectedWaybill] = useState<string | null>(null);
    const [resources, setResources] = useState<{ drivers: any[], vehicles: any[] }>({ drivers: [], vehicles: [] });
    const [assignData, setAssignData] = useState({ driver_id: '', vehicle_id: '' });

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const handleViewReports = () => {
        alert(t('dashboard.viewReports') + ' - Coming Soon (Feature under design)');
    };

    const fetchData = () => {
        const API_URL = 'http://localhost:3001/api';

        fetch(`${API_URL}/dashboard/metrics`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch metrics');
                return res.json();
            })
            .then(setMetrics)
            .catch(err => {
                console.error("Metrics fetch error:", err);
            });

        fetch(`${API_URL}/dashboard/jobs`)
            .then(res => {
                if (!res.ok) throw new Error('Failed to fetch jobs');
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setJobs(data);
                } else {
                    console.error("Jobs API returned non-array:", data);
                    setJobs([]);
                }
            })
            .catch(err => {
                console.error("Jobs fetch error:", err);
                setJobs([]);
            });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAssignModal = async (waybillId: string) => {
        setSelectedWaybill(waybillId);
        // Fetch available resources
        const API_URL = 'http://localhost:3001/api';
        const [drivers, vehicles] = await Promise.all([
            fetch(`${API_URL}/drivers`).then(res => res.json()),
            fetch(`${API_URL}/vehicles`).then(res => res.json())
        ]);
        // Filter for IDLE only in a real app, but for now show all
        setResources({
            drivers: drivers.filter((d: any) => d.status === 'IDLE'),
            vehicles: vehicles.filter((v: any) => v.status === 'IDLE')
        });
        setIsModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedWaybill || !assignData.driver_id || !assignData.vehicle_id) return;

        try {
            const res = await fetch(`http://localhost:3001/api/waybills/${selectedWaybill}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setAssignData({ driver_id: '', vehicle_id: '' });
                setSelectedWaybill(null);
                fetchData(); // Refresh list
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!metrics) return <div>{t('common.loading')}</div>;

    return (
        <div>
            {/* Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <StatCard label={t('dashboard.totalWaybills')} value={metrics.totalWaybills} icon={FileText} color="#6366F1" />
                <StatCard label={t('dashboard.activeTrips')} value={metrics.activeTrips} icon={Truck} color="#10B981" />
                <StatCard label={t('dashboard.pendingWaybills')} value={metrics.pendingWaybills} icon={Clock} color="#F59E0B" />
                <StatCard label={t('dashboard.onTimeRate')} value={`${(metrics.onTimeRate * 100).toFixed(0)}%`} icon={AlertCircle} color="#EC4899" />
            </div>

            {/* Recent Jobs */}
            <div className="card">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ margin: 0, fontSize: '18px' }}>{t('dashboard.pendingWaybills')}</h3>
                    <a href="#" style={{ color: 'var(--color-primary)', textDecoration: 'none', fontWeight: 500 }}>{t('dashboard.viewReports')}</a>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: '12px 0', color: '#6B7280', fontWeight: 500, fontSize: '14px' }}>{t('waybill.waybillNo')}</th>
                            <th style={{ padding: '12px 0', color: '#6B7280', fontWeight: 500, fontSize: '14px' }}>{t('waybill.route')}</th>
                            <th style={{ padding: '12px 0', color: '#6B7280', fontWeight: 500, fontSize: '14px' }}>{t('common.status')}</th>
                            <th style={{ padding: '12px 0', color: '#6B7280', fontWeight: 500, fontSize: '14px' }}>{t('waybill.estPrice')}</th>
                            <th style={{ padding: '12px 0', color: '#6B7280', fontWeight: 500, fontSize: '14px' }}>{t('common.actions')}</th>
                        </tr>
                    </thead>
                    <tbody>
                        {jobs.length === 0 ? (
                            <tr><td colSpan={5} style={{ padding: '20px', textAlign: 'center' }}>{t('dashboard.noJobs')}</td></tr>
                        ) : jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(job => (
                            <tr key={job.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: '16px 0', fontWeight: 500 }}>{job.waybill_no}</td>
                                <td style={{ padding: '16px 0' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <span>{job.origin}</span>
                                        <span style={{ color: '#9CA3AF' }}>→</span>
                                        <span>{job.destination}</span>
                                    </div>
                                </td>
                                <td style={{ padding: '16px 0' }}>
                                    <span className={`badge ${job.status === 'NEW' ? 'badge-yellow' : job.status === 'IN_TRANSIT' ? 'badge-blue' : 'badge-gray'}`}>
                                        {job.status}
                                    </span>
                                </td>
                                <td style={{ padding: '16px 0' }}>${job.price_estimated}</td>
                                <td style={{ padding: '16px 0' }}>
                                    {job.status === 'NEW' ? (
                                        <button
                                            onClick={() => openAssignModal(job.id)}
                                            style={{ padding: '6px 12px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                            Assign
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => navigate(`/tracking/${job.id}`)}
                                            style={{ padding: '6px 12px', background: 'transparent', color: '#6B7280', border: '1px solid #E5E7EB', borderRadius: '6px', fontSize: '13px', cursor: 'pointer' }}
                                        >
                                            Details
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Controls */}
                {jobs.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '16px', padding: '0 8px' }}>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            style={{
                                padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1
                            }}
                        >
                            {t('common.back')}
                        </button>
                        <span style={{ fontSize: '14px', color: '#6B7280' }}>
                            Page {currentPage} of {Math.ceil(jobs.length / pageSize)}
                        </span>
                        <button
                            disabled={currentPage * pageSize >= jobs.length}
                            onClick={() => setCurrentPage(p => Math.min(Math.ceil(jobs.length / pageSize), p + 1))}
                            style={{
                                padding: '6px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', background: 'white',
                                cursor: currentPage * pageSize >= jobs.length ? 'not-allowed' : 'pointer', opacity: currentPage * pageSize >= jobs.length ? 0.5 : 1
                            }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>

            {/* Modal Overlay */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', padding: '32px' }}>
                        <h3 style={{ marginTop: 0 }}>Assign Resources</h3>
                        <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>Select a driver and vehicle for this shipment.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Driver</label>
                                <select
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                    onChange={e => setAssignData({ ...assignData, driver_id: e.target.value })}
                                    value={assignData.driver_id}
                                >
                                    <option value="">Select Driver</option>
                                    {resources.drivers.map(d => <option key={d.id} value={d.id}>{d.name} ({d.status})</option>)}
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: 500 }}>Vehicle</label>
                                <select
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #D1D5DB' }}
                                    onChange={e => setAssignData({ ...assignData, vehicle_id: e.target.value })}
                                    value={assignData.vehicle_id}
                                >
                                    <option value="">Select Vehicle</option>
                                    {resources.vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} - {v.model}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                style={{ padding: '10px 20px', background: 'none', border: '1px solid #E5E7EB', borderRadius: '8px', cursor: 'pointer' }}
                            >
                                {t('common.cancel')}
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleAssign}
                            >
                                {t('common.save')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};
