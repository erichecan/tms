
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Truck, Clock, FileText, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from './apiConfig';

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
    trip_id?: string;
}

const StatCard = ({ label, value, icon: Icon, color }: any) => (
    <div className="glass-card" style={{ display: 'flex', alignItems: 'center', gap: '20px', padding: '24px' }}>
        <div style={{ padding: '16px', borderRadius: '14px', background: color + '15', color: color }}>
            <Icon size={28} />
        </div>
        <div>
            <div style={{ color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '6px', letterSpacing: '0.05em' }}>{label}</div>
            <div style={{ fontSize: '32px', fontWeight: 800, color: 'var(--slate-900)', lineHeight: '1' }}>{value}</div>
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

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 8;

    const fetchData = () => {
        const API_URL = API_BASE_URL;
        fetch(`${API_URL}/dashboard/metrics`).then(res => res.json()).then(setMetrics).catch(err => console.error(err));
        fetch(`${API_URL}/dashboard/jobs`).then(res => res.json()).then(data => setJobs(Array.isArray(data) ? data : [])).catch(err => console.error(err));
    };

    useEffect(() => {
        fetchData();
    }, []);

    const openAssignModal = async (waybillId: string) => {
        setSelectedWaybill(waybillId);
        const API_URL = API_BASE_URL;
        const [drivers, vehicles] = await Promise.all([
            fetch(`${API_URL}/drivers`).then(res => res.json()),
            fetch(`${API_URL}/vehicles`).then(res => res.json())
        ]);
        setResources({
            drivers: Array.isArray(drivers) ? drivers.filter((d: any) => d.status === 'IDLE') : [],
            vehicles: Array.isArray(vehicles) ? vehicles.filter((v: any) => v.status === 'IDLE') : []
        });
        setIsModalOpen(true);
    };

    const handleAssign = async () => {
        if (!selectedWaybill || !assignData.driver_id || !assignData.vehicle_id) return;
        try {
            const res = await fetch(`${API_BASE_URL}/waybills/${selectedWaybill}/assign`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(assignData)
            });
            if (res.ok) {
                setIsModalOpen(false);
                setAssignData({ driver_id: '', vehicle_id: '' });
                fetchData();
            }
        } catch (err) {
            console.error(err);
        }
    };

    if (!metrics) return (
        <div style={{ display: 'flex', height: '60vh', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <div style={{ width: 44, height: 44, border: '4px solid var(--primary-start)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }}></div>
                <div style={{ color: 'var(--slate-500)', fontWeight: 800, fontSize: '13px', textTransform: 'uppercase' }}>Synchronizing Data...</div>
            </div>
        </div>
    );

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <StatCard label={t('dashboard.totalWaybills')} value={metrics.totalWaybills} icon={FileText} color="var(--primary-start)" />
                <StatCard label={t('dashboard.activeTrips')} value={metrics.activeTrips} icon={Truck} color="#10B981" />
                <StatCard label={t('dashboard.pendingWaybills')} value={metrics.pendingWaybills} icon={Clock} color="#F59E0B" />
                <StatCard label={t('dashboard.onTimeRate')} value={`${(metrics.onTimeRate * 100).toFixed(0)}%`} icon={CheckCircle2} color="#8B5CF6" />
            </div>

            <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: '32px', borderBottom: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h3 style={{ margin: 0, fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('dashboard.pendingWaybills')}</h3>
                        <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Active logistical deployments requiring immediate executive attention.</p>
                    </div>
                    <button className="btn-secondary" style={{ padding: '10px 24px' }}>Analyze Global Reports</button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                        <thead>
                            <tr style={{ background: 'var(--slate-50)' }}>
                                <th style={{ padding: '16px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('waybill.waybillNo')}</th>
                                <th style={{ padding: '16px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Logistical Route</th>
                                <th style={{ padding: '16px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Deployment Status</th>
                                <th style={{ padding: '16px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Estimated Valuation</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {jobs.length === 0 ? (
                                <tr><td colSpan={5} style={{ padding: '60px', textAlign: 'center', color: 'var(--slate-400)', fontWeight: 600 }}>No outstanding shipments awaiting deployment.</td></tr>
                            ) : jobs.slice((currentPage - 1) * pageSize, currentPage * pageSize).map(job => (
                                <tr key={job.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                    <td style={{ padding: '20px 24px', fontWeight: 800, color: 'var(--slate-900)' }}>{job.waybill_no}</td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <span style={{ fontWeight: 700, color: 'var(--slate-700)' }}>{job.origin}</span>
                                            <ArrowRight size={14} color="var(--primary-start)" />
                                            <span style={{ fontWeight: 700, color: 'var(--slate-700)' }}>{job.destination}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px' }}>
                                        <span className={`badge ${job.status === 'NEW' ? 'badge-yellow' : job.status === 'IN_TRANSIT' ? 'badge-blue' : 'badge-gray'}`} style={{ fontSize: '11px', fontWeight: 800 }}>
                                            {job.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', fontWeight: 900, color: 'var(--slate-900)' }}>${job.price_estimated?.toLocaleString()}</td>
                                    <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                        {job.status === 'NEW' ? (
                                            <button onClick={() => openAssignModal(job.id)} className="btn-primary" style={{ padding: '10px 24px', fontSize: '12px' }}>Dispatch</button>
                                        ) : (
                                            <button onClick={() => navigate(`/tracking/${job.trip_id || job.id}`)} className="btn-secondary" style={{ padding: '10px 24px', fontSize: '12px' }}>Intercept Tracking</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {jobs.length > pageSize && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', padding: '24px', borderTop: '1px solid var(--glass-border)' }}>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                            <ArrowLeft size={18} />
                        </button>
                        <div className="glass" style={{ padding: '8px 16px', fontWeight: 800, fontSize: '13px', color: 'var(--slate-900)' }}>
                            {currentPage} / {Math.ceil(jobs.length / pageSize)}
                        </div>
                        <button disabled={currentPage * pageSize >= jobs.length} onClick={() => setCurrentPage(p => p + 1)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                            <ArrowRight size={18} />
                        </button>
                    </div>
                )}
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, animation: 'fadeIn 0.3s ease-out' }}>
                    <div className="glass-card" style={{ width: '480px', padding: '40px', background: 'white' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px', color: 'var(--slate-900)' }}>Resource Deployment</h3>
                        <p style={{ color: 'var(--slate-500)', fontSize: '14px', marginBottom: '32px', fontWeight: 500 }}>Select the optimal driver and vehicle asset for this specific logistical mission.</p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Operational Pilot</label>
                                <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }} onChange={e => setAssignData({ ...assignData, driver_id: e.target.value })} value={assignData.driver_id}>
                                    <option value="">Select Available Pilot</option>
                                    {resources.drivers.map(d => <option key={d.id} value={d.id}>{d.name} (READY)</option>)}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase' }}>Logistical Asset</label>
                                <select style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700, fontSize: '14px' }} onChange={e => setAssignData({ ...assignData, vehicle_id: e.target.value })} value={assignData.vehicle_id}>
                                    <option value="">Select Operational Vehicle</option>
                                    {resources.vehicles.map(v => <option key={v.id} value={v.id}>{v.plate} • {v.model}</option>)}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '16px' }}>
                            <button onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1 }}>Abort Mission</button>
                            <button onClick={handleAssign} className="btn-primary" style={{ flex: 1 }}>Authorize Deployment</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
