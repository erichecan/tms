
import { useEffect, useState } from 'react';
import { Truck, User, DollarSign, Plus, Calendar, MoreHorizontal, Edit } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './components/Modal/Modal';
import { API_BASE_URL } from './apiConfig';

export const FleetManagement = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'expenses' | 'schedule'>('drivers');
    const [data, setData] = useState<any>({ drivers: [], vehicles: [], expenses: [] });

    const [trips, setTrips] = useState<any[]>([]);

    const fetchData = async () => {
        const API_URL = API_BASE_URL;
        try {
            const [driversRes, vehiclesRes, expensesRes, tripsRes] = await Promise.all([
                fetch(`${API_URL}/drivers`),
                fetch(`${API_URL}/vehicles`),
                fetch(`${API_URL}/expenses`),
                fetch(`${API_URL}/trips`)
            ]);

            const drivers = driversRes.ok ? await driversRes.json() : [];
            const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : [];
            const expenses = expensesRes.ok ? await expensesRes.json() : [];
            const trips = tripsRes.ok ? await tripsRes.json() : [];

            setData({
                drivers: Array.isArray(drivers) ? drivers : [],
                vehicles: Array.isArray(vehicles) ? vehicles : [],
                expenses: Array.isArray(expenses) ? expenses : []
            });
            setTrips(Array.isArray(trips) ? trips : []);
        } catch (e) {
            console.error("Failed to fetch fleet data", e);
            setData({ drivers: [], vehicles: [], expenses: [] });
            setTrips([]);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
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
            const res = await fetch(`${API_BASE_URL}/trips/${draggedTrip.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
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

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newEntry, setNewEntry] = useState<any>({});

    const handleAddClick = () => {
        setNewEntry({});
        setIsModalOpen(true);
    };

    const handleInputChange = (field: string, value: any) => {
        setNewEntry((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const endpoint = activeTab;
        if (endpoint === 'schedule') {
            alert(t('common.comingSoon'));
            setIsModalOpen(false);
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

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setNewEntry({});
                const API_URL = API_BASE_URL;
                const [driversRes, vehiclesRes, expensesRes] = await Promise.all([
                    fetch(`${API_URL}/drivers`),
                    fetch(`${API_URL}/vehicles`),
                    fetch(`${API_URL}/expenses`)
                ]);
                setData({
                    drivers: driversRes.ok ? await driversRes.json() : [],
                    vehicles: vehiclesRes.ok ? await vehiclesRes.json() : [],
                    expenses: expensesRes.ok ? await expensesRes.json() : []
                });
            }
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', paddingBottom: '40px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>{t('fleet.title')}</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Real-time coordination and management of your global fleet assets.</p>
                </div>
                <button
                    className="btn-primary"
                    onClick={handleAddClick}
                    style={{ padding: '12px 24px' }}
                >
                    <Plus size={20} />
                    {t('common.add')} {activeTab === 'expenses' ? t('fleet.expense') : activeTab === 'schedule' ? 'Task' : activeTab === 'drivers' ? t('fleet.driver') : t('fleet.vehicle')}
                </button>
            </div>

            {/* Premium Tabs */}
            <div className="glass" style={{ display: 'inline-flex', gap: '4px', padding: '6px', marginBottom: '32px' }}>
                <TabButton id="drivers" label={t('fleet.drivers')} icon={User} />
                <TabButton id="vehicles" label={t('fleet.vehicles')} icon={Truck} />
                <TabButton id="expenses" label={t('fleet.expenses')} icon={DollarSign} />
                <TabButton id="schedule" label="Schedule" icon={Calendar} />
            </div>

            {/* Content Container */}
            <div className="glass" style={{ padding: '0', overflow: 'hidden' }}>
                {activeTab === 'schedule' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0' }}>
                            <thead>
                                <tr style={{ background: 'var(--slate-50)' }}>
                                    <th style={{ width: '200px', padding: '20px 24px', textAlign: 'left', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', borderRight: '1px solid var(--glass-border)' }}>Operations Team</th>
                                    {DAYS.map(day => (
                                        <th key={day} style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', minWidth: '120px' }}>{day}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.drivers.length === 0 ? (
                                    <tr><td colSpan={8} style={{ padding: '60px', textAlign: 'center', color: 'var(--slate-400)', fontWeight: 600 }}>No drivers assigned to the current roster.</td></tr>
                                ) : data.drivers.map((driver: any, idx: number) => (
                                    <tr key={driver.id || `driver-${idx}`} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                        <td style={{ padding: '20px 24px', borderRight: '1px solid var(--glass-border)', background: 'var(--slate-50)' }}>
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
                                                const tripDay = new Date(t.start_time_est).getDay();
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
                                                        borderRight: dayIdx < 6 ? '1px solid var(--glass-border)' : 'none',
                                                        position: 'relative',
                                                        background: draggedTrip ? 'rgba(0,128,255,0.02)' : 'transparent',
                                                        transition: 'background 0.2s'
                                                    }}
                                                >
                                                    {tripInCell && (
                                                        <div
                                                            draggable
                                                            onDragStart={(e) => handleDragStart(e, tripInCell)}
                                                            style={{
                                                                background: 'var(--primary-grad)',
                                                                color: 'white',
                                                                fontSize: '11px',
                                                                fontWeight: 800,
                                                                padding: '8px 12px',
                                                                borderRadius: '10px',
                                                                boxShadow: '0 4px 12px rgba(0, 128, 255, 0.2)',
                                                                cursor: 'grab',
                                                                zIndex: 10,
                                                                position: 'relative'
                                                            }}
                                                        >
                                                            Mission {tripInCell.id.split('-')[1]}
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
                                                <button className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }}>
                                                    <MoreHorizontal size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={newEntry.id ? `Update ${activeTab.slice(0, -1)} Registry` : `Register New ${activeTab.slice(0, -1)}`}
            >
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {activeTab === 'drivers' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Driver Full Name</label>
                                <input
                                    required
                                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                    value={newEntry.name || ''}
                                    onChange={e => handleInputChange('name', e.target.value)}
                                />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Contact Number</label>
                                    <input
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.phone || ''}
                                        onChange={e => handleInputChange('phone', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Operational Status</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.status || 'IDLE'}
                                        onChange={e => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="IDLE">IDLE / STANDBY</option>
                                        <option value="ON_DUTY">ACTIVE DUTY</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'vehicles' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>License Plate</label>
                                    <input
                                        required
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.plate || ''}
                                        onChange={e => handleInputChange('plate', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Vehicle Model</label>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Payload Capacity (T)</label>
                                    <input
                                        required
                                        type="number"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.capacity || ''}
                                        onChange={e => handleInputChange('capacity', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Status</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.status || 'IDLE'}
                                        onChange={e => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="IDLE">IDLE</option>
                                        <option value="IN_TRANSIT">IN TRANSIT</option>
                                        <option value="MAINTENANCE">UNDER SERVICE</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'expenses' && (
                        <div style={{ display: 'grid', gap: '20px' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Expense Category</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.category || 'Fuel'}
                                        onChange={e => handleInputChange('category', e.target.value)}
                                    >
                                        <option value="Fuel">Fuel / Diesel</option>
                                        <option value="Maintenance">Mechanical Repair</option>
                                        <option value="Toll">Road Tolls</option>
                                        <option value="Insurance">Fleet Insurance</option>
                                        <option value="Other">Miscellaneous</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Transaction Amount ($)</label>
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
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Transaction Date</label>
                                    <input
                                        required
                                        type="date"
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                                        value={newEntry.date ? newEntry.date.split('T')[0] : ''}
                                        onChange={e => handleInputChange('date', e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>Payment Status</label>
                                    <select
                                        style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                                        value={newEntry.status || 'PENDING'}
                                        onChange={e => handleInputChange('status', e.target.value)}
                                    >
                                        <option value="PENDING">SETTLEMENT PENDING</option>
                                        <option value="PAID">COMPLETED / PAID</option>
                                    </select>
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
                            Dismiss
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            style={{ flex: 1 }}
                        >
                            {newEntry.id ? 'Save Updates' : 'Confirm Registration'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
