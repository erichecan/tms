

import { useEffect, useState } from 'react';
import { Truck, User, DollarSign, Plus, Calendar, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './components/Modal/Modal';
import { API_BASE_URL } from './apiConfig';
import { useDialog } from './context/DialogContext';
import { Pagination } from './components/Pagination';
import { useAuth } from './context/AuthContext';
import { Trash2 } from 'lucide-react';

export const FleetManagement = () => {
    const { t } = useTranslation();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'expenses' | 'schedule'>('drivers');
    const [data, setData] = useState<any>({ drivers: [], vehicles: [], expenses: [] });
    const { alert } = useDialog();

    const [trips, setTrips] = useState<any[]>([]);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);
    const pageSize = 10;

    const fetchData = async () => {
        const API_URL = API_BASE_URL;
        const token = localStorage.getItem('token');
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };

        const queryParams = new URLSearchParams({
            page: String(currentPage),
            limit: String(pageSize),
            // Add search parameter here if needed later
        });

        try {
            if (activeTab === 'schedule') {
                const [driversRes, vehiclesRes, tripsRes] = await Promise.all([
                    fetch(`${API_URL}/drivers`, { headers }),
                    fetch(`${API_URL}/vehicles`, { headers }),
                    fetch(`${API_URL}/trips`, { headers })
                ]);

                const driversData = driversRes.ok ? await driversRes.json() : [];
                const driversList = Array.isArray(driversData) ? driversData : (driversData.data || []);
                const vehiclesData = vehiclesRes.ok ? await vehiclesRes.json() : [];
                const vehiclesList = Array.isArray(vehiclesData) ? vehiclesData : (vehiclesData.data || []);

                const trips = tripsRes.ok ? await tripsRes.json() : [];

                setData((prev: any) => ({ ...prev, drivers: driversList, vehicles: vehiclesList }));
                setTrips(Array.isArray(trips) ? trips : []);

            } else {
                // Fetch only for active tab
                const res = await fetch(`${API_URL}/${activeTab}?${queryParams.toString()}`, { headers });

                if (res.ok) {
                    const result = await res.json();
                    // New backend structure: { data: [], total, page, limit, totalPages }
                    // Fallback for endpoints not yet updated or different structure if any
                    const items = result.data || (Array.isArray(result) ? result : []);
                    const total = result.total || items.length;
                    const pages = result.totalPages || 1;

                    setData((prev: any) => ({
                        ...prev,
                        [activeTab]: items
                    }));
                    setTotalItems(total);
                    setTotalPages(pages);
                } else {
                    setData((prev: any) => ({ ...prev, [activeTab]: [] }));
                }
            }
        } catch (e) {
            console.error("Failed to fetch fleet data", e);
            // Don't wipe all data, just current tab could fail
        }
    };

    useEffect(() => {
        fetchData();
    }, [activeTab, currentPage]); // Re-fetch on tab or page change

    const handleTabChange = (tab: 'drivers' | 'vehicles' | 'expenses' | 'schedule') => {
        setActiveTab(tab);
        setCurrentPage(1); // Reset to first page
    };

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => handleTabChange(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: activeTab === id ? 'var(--primary-grad)' : 'transparent',
                color: activeTab === id ? 'white' : 'var(--slate-500)',
                fontWeight: 700, cursor: 'pointer', fontSize: '14px',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: activeTab === id ? '0 4px 12px rgba(0, 128, 255, 0.2)' : 'none'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const [draggedTrip, setDraggedTrip] = useState<any>(null);

    const handleDragStart = (e: React.DragEvent, trip: any) => {
        setDraggedTrip(trip);
        e.dataTransfer.effectAllowed = 'move';
        // Add a class for styling if needed
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, driverId: string, dayIdx: number) => {
        e.preventDefault();
        if (!draggedTrip) return;

        // Calculate new dates based on today's week start
        const today = new Date();
        const currentDay = today.getDay(); // 0 is Sun, 1 is Mon
        const diff = today.getDate() - (currentDay === 0 ? 6 : currentDay - 1); // Get Mon
        const monday = new Date(today.setDate(diff));

        const targetDate = new Date(monday);
        targetDate.setDate(monday.getDate() + dayIdx);

        // Preserve time but change date
        const oldStart = new Date(draggedTrip.start_time_est);
        const oldEnd = new Date(draggedTrip.end_time_est);
        const duration = oldEnd.getTime() - oldStart.getTime();

        const newStart = new Date(targetDate);
        newStart.setHours(oldStart.getHours(), oldStart.getMinutes(), 0, 0);
        const newEnd = new Date(newStart.getTime() + duration);

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/trips/${draggedTrip.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    driver_id: driverId,
                    start_time_est: newStart.toISOString(),
                    end_time_est: newEnd.toISOString()
                })
            });

            if (res.ok) {
                fetchData();
            }
        } catch (error) {
            console.error("Drop failed", error);
        }
        setDraggedTrip(null);
    };

    const handleDragEnd = () => {
        setDraggedTrip(null);
    };

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState<any>({});

    const handleAddClick = () => {
        const now = new Date();
        const nextHour = new Date(now);
        nextHour.setHours(now.getHours() + 1, 0, 0, 0);
        const endHour = new Date(nextHour);
        endHour.setHours(nextHour.getHours() + 4);

        setNewEntry(activeTab === 'schedule' ? {
            start_time_est: nextHour.toISOString(),
            end_time_est: endHour.toISOString(),
            status: 'PLANNED'
        } : {});
        setIsModalOpen(true);
    };

    const handleInputChange = (field: string, value: any) => {
        setNewEntry((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = activeTab;
        if (endpoint === 'schedule') {
            try {
                const token = localStorage.getItem('token');
                const res = await fetch(`${API_BASE_URL}/trips`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify(newEntry)
                });
                if (res.ok) {
                    setIsModalOpen(false);
                    setNewEntry({});
                    await fetchData();
                } else {
                    const err = await res.json();
                    alert(err.error || 'Failed to create mission', t('common.error'));
                }
            } catch (error) {
                console.error(error);
            }
            return;
        }

        try {
            const payload = { ...newEntry };
            if (activeTab === 'drivers') payload.status = payload.status || 'IDLE';
            if (activeTab === 'vehicles') payload.status = payload.status || 'IDLE';
            if (activeTab === 'expenses') {
                payload.status = payload.status || 'PENDING';
                payload.date = payload.date || new Date().toISOString();
            }

            const isEdit = !!payload.id;
            const url = isEdit ? `${API_BASE_URL}/${endpoint}/${payload.id}` : `${API_BASE_URL}/${endpoint}`;
            const method = isEdit ? 'PUT' : 'POST';

            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setNewEntry({});
                await fetchData();
            }
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (id: string, type: 'drivers' | 'vehicles') => {
        const confirmed = window.confirm(t('common.deleteConfirm') || 'Are you sure you want to delete this item?');
        if (!confirmed) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/${type}/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (res.ok) {
                await fetchData();
            } else {
                alert(t('messages.saveFailed'), t('common.error'));
            }
        } catch (error) {
            console.error(error);
            alert(t('messages.connectionError'), t('common.error'));
        }
    };

    const ALLOWED_DELETE_ROLES = ['R-ADMIN', 'ADMIN', 'R-DISPATCHER', 'R-FLEET-MANAGER', 'R-GENERAL-MANAGER'];
    const canDelete = user && (ALLOWED_DELETE_ROLES.includes(user.roleId) || user.roleId === 'admin');

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('fleet.title')}</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>{t('fleet.subtitle')}</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleAddClick}
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} />
                    {t('common.add')} {activeTab === 'expenses' ? t('fleet.expense') : activeTab === 'schedule' ? t('fleet.scheduleTab.mission') : activeTab === 'drivers' ? t('fleet.driver') : t('fleet.vehicle')}
                </button>
            </div>

            {/* Premium Tabs */}
            <div className="glass" style={{ display: 'inline-flex', gap: '4px', padding: '6px', marginBottom: '32px' }}>
                <TabButton id="drivers" label={t('fleet.drivers')} icon={User} />
                <TabButton id="vehicles" label={t('fleet.vehicles')} icon={Truck} />
                <TabButton id="expenses" label={t('fleet.expenses')} icon={DollarSign} />
                <TabButton id="schedule" label={t('fleet.schedule')} icon={Calendar} />
            </div>

            {/* Content Container */}
            <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                {activeTab === 'schedule' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ background: 'var(--slate-50)' }}>
                                    <th style={{ width: '200px', padding: '20px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>{t('fleet.scheduleTab.opsTeam')}</th>
                                    {DAYS.map(day => (
                                        <th key={day} style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '120px', borderBottom: '1px solid #F1F5F9' }}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.drivers.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: 'var(--slate-400)', fontWeight: 600 }}>{t('fleet.scheduleTab.empty')}</td></tr>
                                ) : data.drivers.map((driver: any, idx: number) => (
                                    <tr key={driver.id || `driver-${idx}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{
                                            padding: '20px 24px',
                                            borderRight: '1px solid #F1F5F9',
                                            borderBottom: '1px solid #F1F5F9',
                                            background: 'var(--slate-50)'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'var(--slate-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary-start)' }}>
                                                    <User size={18} />
                                                </div>
                                                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--slate-900)' }}>{driver.name}</span>
                                            </div>
                                        </td>
                                        {DAYS.map((_, dayIdx) => {
                                            const tripInCell = trips.find(t => {
                                                if (t.driver_id !== driver.id) return false;
                                                const tripDate = new Date(t.start_time_est);

                                                // Get start of current week
                                                const now = new Date();
                                                const day = now.getDay();
                                                const diff = now.getDate() - (day === 0 ? 6 : day - 1);
                                                const startOfWeek = new Date(now.setDate(diff));
                                                startOfWeek.setHours(0, 0, 0, 0);

                                                const endOfWeek = new Date(startOfWeek);
                                                endOfWeek.setDate(startOfWeek.getDate() + 7);

                                                // Only show if in this week
                                                if (tripDate < startOfWeek || tripDate >= endOfWeek) return false;

                                                const tripDay = tripDate.getDay();
                                                const adjustedDay = tripDay === 0 ? 6 : tripDay - 1; // 0=Mon...6=Sun
                                                return adjustedDay === dayIdx;
                                            });

                                            return (
                                                <td
                                                    key={`c-${idx}-${dayIdx}`}
                                                    onDragOver={handleDragOver}
                                                    onDrop={(e) => handleDrop(e, driver.id, dayIdx)}
                                                    style={{
                                                        padding: '12px',
                                                        borderRight: dayIdx < 6 ? '1px solid #F1F5F9' : 'none',
                                                        borderBottom: '1px solid #F1F5F9',
                                                        position: 'relative',
                                                        background: draggedTrip ? 'rgba(0,128,255,0.05)' : 'transparent',
                                                        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                                        minHeight: '64px'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        if (draggedTrip) e.currentTarget.style.background = 'rgba(0,128,255,0.1)';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        if (draggedTrip) e.currentTarget.style.background = 'rgba(0,128,255,0.05)';
                                                        else e.currentTarget.style.background = 'transparent';
                                                    }}
                                                >
                                                    {tripInCell && (
                                                        <div
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, tripInCell)}
                                                            onDragEnd={handleDragEnd}
                                                            style={{
                                                                background: 'var(--primary-grad)',
                                                                color: 'white',
                                                                fontSize: '10px',
                                                                fontWeight: 700,
                                                                padding: '6px 8px',
                                                                borderRadius: '8px',
                                                                boxShadow: '0 4px 12px rgba(0, 128, 255, 0.2)',
                                                                cursor: 'grab',
                                                                zIndex: 10,
                                                                position: 'relative',
                                                                width: '100%',
                                                                textAlign: 'left',
                                                                userSelect: 'none',
                                                                display: 'flex',
                                                                flexDirection: 'column',
                                                                gap: '2px'
                                                            }}
                                                        >
                                                            <div style={{ fontWeight: 900, opacity: 0.9, fontSize: '9px', textTransform: 'uppercase' }}>
                                                                {t('fleet.scheduleTab.mission')} {tripInCell.id.split('-')[1]?.substring(0, 6)}
                                                            </div>
                                                            {tripInCell.waybills && tripInCell.waybills.length > 0 ? (
                                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                    <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                                        {tripInCell.waybills[0].origin.split(',')[0]} → {tripInCell.waybills[0].destination.split(',')[0]}
                                                                    </div>
                                                                    <div style={{ fontSize: '8px', opacity: 0.8 }}>
                                                                        {tripInCell.waybills[0].waybill_no}
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <span>{t('fleet.scheduleTab.emptyMission')}</span>
                                                            )}
                                                        </div>
                                                    )}
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--slate-50)' }}>
                                    {activeTab === 'drivers' && (
                                        <>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.name')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.phone')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('common.status')}</th>
                                        </>
                                    )}
                                    {activeTab === 'vehicles' && (
                                        <>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.plateId')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.model')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.capacity')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('common.status')}</th>
                                        </>
                                    )}
                                    {activeTab === 'expenses' && (
                                        <>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.category')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.amount')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('fleet.date')}</th>
                                            <th style={{ padding: '20px 24px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>{t('common.status')}</th>
                                        </>
                                    )}
                                    <th style={{ padding: '20px 24px', textAlign: 'right' }}></th>
                                </tr>
                            </thead>
                            <tbody>
                                {data[activeTab]?.map((item: any) => (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }} className="table-row-hover">
                                        {activeTab === 'drivers' && (
                                            <>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                        <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'var(--slate-100)', backgroundImage: `url(${item.avatar_url})`, backgroundSize: 'cover', backgroundPosition: 'center', border: '1px solid var(--glass-border)' }}>
                                                            {!item.avatar_url && <User size={20} color="var(--primary-start)" style={{ margin: '10px' }} />}
                                                        </div>
                                                        <span style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{item.name}</span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '20px 24px', fontWeight: 600, color: 'var(--slate-600)' }}>{item.phone}</td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span className={`badge ${item.status === 'IDLE' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                                                </td>
                                            </>
                                        )}
                                        {activeTab === 'vehicles' && (
                                            <>
                                                <td style={{ padding: '20px 24px', fontWeight: 800, color: 'var(--slate-900)' }}>{item.plate}</td>
                                                <td style={{ padding: '20px 24px', fontWeight: 600, color: 'var(--slate-700)' }}>{item.model}</td>
                                                <td style={{ padding: '20px 24px', fontWeight: 700 }}>{item.capacity} Tons</td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span className={`badge ${item.status === 'IDLE' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                                                </td>
                                            </>
                                        )}
                                        {activeTab === 'expenses' && (
                                            <>
                                                <td style={{ padding: '20px 24px', fontWeight: 800, color: 'var(--slate-900)' }}>{item.category}</td>
                                                <td style={{ padding: '20px 24px', fontWeight: 900, color: 'var(--primary-start)' }}>${item.amount.toFixed(2)}</td>
                                                <td style={{ padding: '20px 24px', fontWeight: 600, color: 'var(--slate-500)' }}>{new Date(item.date).toLocaleDateString()}</td>
                                                <td style={{ padding: '20px 24px' }}>
                                                    <span className={`badge ${item.status === 'PAID' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                                                </td>
                                            </>
                                        )}
                                        <td style={{ padding: '20px 24px', textAlign: 'right' }}>
                                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                                <button onClick={() => { setNewEntry(item); setIsModalOpen(true); }} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                                    <Edit size={16} />
                                                </button>
                                                {canDelete && (activeTab === 'drivers' || activeTab === 'vehicles') && (
                                                    <button
                                                        onClick={() => handleDelete(item.id, activeTab)}
                                                        className="btn-secondary"
                                                        style={{ padding: '8px', borderRadius: '10px', color: '#EF4444', borderColor: '#EF4444' }}
                                                        title={t('common.delete')}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                                {/* <button className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                                    <MoreHorizontal size={16} />
                                                </button> */}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Pagination for list tabs */}
            {activeTab !== 'schedule' && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalItems={totalItems}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                />
            )}

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={newEntry.id ? t('fleet.modal.updateRegistry') : t('fleet.modal.registerNew') + ' ' + (activeTab === 'drivers' ? t('fleet.driver') : activeTab === 'vehicles' ? t('fleet.vehicle') : t('fleet.expense'))}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeTab === 'drivers' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.driverName')}</label>
                                <input
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                    value={newEntry.name || ''}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.contactNumber')}</label>
                                    <input
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.phone || ''}
                                        onChange={e => handleInputChange('phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.operationalStatus')}</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.status || 'IDLE'}
                                        onChange={e => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="IDLE">{t('fleet.modal.statusOptions.idle')}</option>
                                        <option value="ON_DUTY">{t('fleet.modal.statusOptions.onDuty')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vehicles' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.licensePlate')}</label>
                                        <input
                                            required
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                            value={newEntry.plate || ''}
                                            onChange={e => handleInputChange('plate', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.vehicleModel')}</label>
                                        <input
                                            required
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                            value={newEntry.model || ''}
                                            onChange={e => handleInputChange('model', e.target.value)}
                                        />
                                    </div>
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.payloadCapacity')}</label>
                                        <input
                                            required
                                            type="number"
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                            value={newEntry.capacity || ''}
                                            onChange={e => handleInputChange('capacity', e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('common.status')}</label>
                                        <select
                                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                            value={newEntry.status || 'IDLE'}
                                            onChange={e => handleInputChange('status', e.target.value)}
                                        >
                                            <option value="IDLE">{t('fleet.modal.statusOptions.idle')}</option>
                                            <option value="IN_TRANSIT">{t('fleet.modal.statusOptions.inTransit')}</option>
                                            <option value="MAINTENANCE">{t('fleet.modal.statusOptions.maintenance')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.expenseCategory')}</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.category || 'Fuel'}
                                        onChange={e => handleInputChange('category', e.target.value)}
                                    >
                                        <option value="Fuel">{t('fleet.modal.expenseCategories.fuel')}</option>
                                        <option value="Maintenance">{t('fleet.modal.expenseCategories.maintenance')}</option>
                                        <option value="Toll">{t('fleet.modal.expenseCategories.toll')}</option>
                                        <option value="Insurance">{t('fleet.modal.expenseCategories.insurance')}</option>
                                        <option value="Other">{t('fleet.modal.expenseCategories.other')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.transactionAmount')}</label>
                                    <input
                                        required
                                        type="number"
                                        step="0.01"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 900, color: 'var(--primary-start)' }}
                                        value={newEntry.amount || ''}
                                        onChange={e => handleInputChange('amount', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.transactionDate')}</label>
                                    <input
                                        required
                                        type="date"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.date ? newEntry.date.split('T')[0] : ''}
                                        onChange={e => handleInputChange('date', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.paymentStatus')}</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.status || 'PENDING'}
                                        onChange={e => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="PENDING">{t('fleet.modal.statusOptions.pending')}</option>
                                        <option value="PAID">{t('fleet.modal.statusOptions.paid')}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'schedule' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.driver')}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                    value={newEntry.driver_id || ''}
                                    onChange={e => handleInputChange('driver_id', e.target.value)}
                                >
                                    <option value="">{t('fleet.modal.selectDriver') || 'Select Driver'}</option>
                                    {data.drivers.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.name} ({d.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.vehicle')}</label>
                                <select
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                    value={newEntry.vehicle_id || ''}
                                    onChange={e => handleInputChange('vehicle_id', e.target.value)}
                                >
                                    <option value="">{t('fleet.modal.selectVehicle') || 'Select Vehicle'}</option>
                                    {data.vehicles.map((v: any) => (
                                        <option key={v.id} value={v.id}>{v.plate} - {v.model} ({v.status})</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.scheduleTab.startTime') || 'Start Time'}</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.start_time_est ? newEntry.start_time_est.substring(0, 16) : ''}
                                        onChange={e => handleInputChange('start_time_est', new Date(e.target.value).toISOString())}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.scheduleTab.endTime') || 'End Time'}</label>
                                    <input
                                        required
                                        type="datetime-local"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.end_time_est ? newEntry.end_time_est.substring(0, 16) : ''}
                                        onChange={e => handleInputChange('end_time_est', new Date(e.target.value).toISOString())}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            className="btn-secondary"
                            style={{ flex: 1 }}
                        >
                            {t('fleet.modal.dismiss')}
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ flex: 1 }}
                        >
                            {newEntry.id ? t('fleet.modal.saveUpdates') : t('fleet.modal.confirmRegistration')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
