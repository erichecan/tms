import { useEffect, useState } from 'react';
import { Truck, User, DollarSign, Plus, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import Modal from './components/Modal/Modal';

export const FleetManagement = () => {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'expenses' | 'schedule'>('drivers');
    const [data, setData] = useState<any>({ drivers: [], vehicles: [], expenses: [] });

    useEffect(() => {
        const API_URL = 'http://localhost:3001/api';
        const fetchData = async () => {
            try {
                const [driversRes, vehiclesRes, expensesRes] = await Promise.all([
                    fetch(`${API_URL}/drivers`),
                    fetch(`${API_URL}/vehicles`),
                    fetch(`${API_URL}/expenses`)
                ]);

                const drivers = driversRes.ok ? await driversRes.json() : [];
                const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : [];
                const expenses = expensesRes.ok ? await expensesRes.json() : [];

                setData({
                    drivers: Array.isArray(drivers) ? drivers : [],
                    vehicles: Array.isArray(vehicles) ? vehicles : [],
                    expenses: Array.isArray(expenses) ? expenses : []
                });
            } catch (e) {
                console.error("Failed to fetch fleet data", e);
                setData({ drivers: [], vehicles: [], expenses: [] });
            }
        };
        fetchData();
    }, []);

    const TabButton = ({ id, label, icon: Icon }: any) => (
        <button
            onClick={() => setActiveTab(id)}
            style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px',
                border: 'none', background: 'none',
                borderBottom: activeTab === id ? '2px solid var(--color-primary)' : '2px solid transparent',
                color: activeTab === id ? 'var(--color-primary)' : '#6B7280',
                fontWeight: 500, cursor: 'pointer', fontSize: '15px'
            }}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    // Mock Schedule Data for Visual Timeline
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const MOCK_TASKS: any = {
        'driver-1': { day: 0, title: 'Trip TO-QC', hours: 8 },
        'driver-2': { day: 2, title: 'Local Delivery', hours: 4 }
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
        const endpoint = activeTab; // 'drivers', 'vehicles', 'expenses'
        if (endpoint === 'schedule') {
            alert(t('common.comingSoon'));
            setIsModalOpen(false);
            return;
        }

        try {
            // Set defaults if missing
            const payload = { ...newEntry };
            if (activeTab === 'drivers') payload.status = payload.status || 'IDLE';
            if (activeTab === 'vehicles') payload.status = payload.status || 'IDLE';
            if (activeTab === 'expenses') {
                payload.status = payload.status || 'PENDING';
                payload.date = payload.date || new Date().toISOString();
            }

            const res = await fetch(`http://localhost:3001/api/${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                setIsModalOpen(false);
                setNewEntry({});
                // Refetch data
                const API_URL = 'http://localhost:3001/api';
                const [driversRes, vehiclesRes, expensesRes] = await Promise.all([
                    fetch(`${API_URL}/drivers`),
                    fetch(`${API_URL}/vehicles`),
                    fetch(`${API_URL}/expenses`)
                ]);
                const drivers = driversRes.ok ? await driversRes.json() : [];
                const vehicles = vehiclesRes.ok ? await vehiclesRes.json() : [];
                const expenses = expensesRes.ok ? await expensesRes.json() : [];
                setData({
                    drivers: Array.isArray(drivers) ? drivers : [],
                    vehicles: Array.isArray(vehicles) ? vehicles : [],
                    expenses: Array.isArray(expenses) ? expenses : []
                });
            } else {
                alert('Failed to create entry');
            }
        } catch (error) {
            console.error(error);
            alert('Error creating entry');
        }
    };

    const inputStyle = {
        width: '100%',
        padding: '10px',
        border: '1px solid #D1D5DB',
        borderRadius: '6px',
        marginTop: '4px',
        marginBottom: '16px'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: '#374151'
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>{t('fleet.title')}</h1>
                <button
                    className="btn-primary"
                    onClick={handleAddClick}
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} />
                    {t('common.add')} {activeTab === 'expenses' ? t('fleet.expense') : activeTab === 'schedule' ? 'Task' : activeTab === 'drivers' ? t('fleet.driver') : t('fleet.vehicle')}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '24px' }}>
                <TabButton id="drivers" label={t('fleet.drivers')} icon={User} />
                <TabButton id="vehicles" label={t('fleet.vehicles')} icon={Truck} />
                <TabButton id="expenses" label={t('fleet.expenses')} icon={DollarSign} />
                <TabButton id="schedule" label="Schedule" icon={Calendar} />
            </div>

            {/* Content */}
            <div className="card">
                {activeTab === 'schedule' ? (
                    <div style={{ overflowX: 'auto' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '150px repeat(7, 1fr)', gap: '1px', background: '#E5E7EB', border: '1px solid #E5E7EB' }}>
                            {/* Header */}
                            <div style={{ background: '#F9FAFB', padding: '12px', fontWeight: 600 }}>Driver</div>
                            {DAYS.map(day => (
                                <div key={day} style={{ background: '#F9FAFB', padding: '12px', textAlign: 'center', fontWeight: 600 }}>{day}</div>
                            ))}

                            {/* Rows */}
                            {data.drivers.length === 0 && <div style={{ background: 'white', padding: '20px', gridColumn: 'span 8', textAlign: 'center' }}>No drivers found</div>}

                            {data.drivers.map((driver: any, idx: number) => (
                                <div key={driver.id || `driver-${idx}`} style={{ display: 'contents' }}>
                                    <div style={{ background: 'white', padding: '12px', borderBottom: '1px solid #F3F4F6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#E5E7EB' }}></div>
                                        <span style={{ fontSize: '13px', fontWeight: 500 }}>{driver.name}</span>
                                    </div>
                                    {DAYS.map((_, dayIdx) => {
                                        const task = MOCK_TASKS[`driver-${idx + 1}`]; // Mock matching
                                        const hasTask = task && task.day === dayIdx;
                                        return (
                                            <div key={`c-${idx}-${dayIdx}`} style={{ background: 'white', padding: '4px', borderBottom: '1px solid #F3F4F6', height: '50px' }}>
                                                {hasTask && (
                                                    <div style={{
                                                        background: 'var(--color-primary)', opacity: 0.8, color: 'white',
                                                        fontSize: '11px', padding: '4px 8px', borderRadius: '4px',
                                                        height: '100%', display: 'flex', alignItems: 'center'
                                                    }}>
                                                        {task.title}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                                {activeTab === 'drivers' && (
                                    <>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.name')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.phone')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('common.status')}</th>
                                    </>
                                )}
                                {activeTab === 'vehicles' && (
                                    <>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.plateId')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.model')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.capacity')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('common.status')}</th>
                                    </>
                                )}
                                {activeTab === 'expenses' && (
                                    <>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.category')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.amount')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('fleet.date')}</th>
                                        <th style={{ padding: '16px', color: '#6B7280' }}>{t('common.status')}</th>
                                    </>
                                )}
                                <th style={{ padding: '16px', color: '#6B7280' }}>{t('common.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data[activeTab]?.map((item: any) => (
                                <tr key={item.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                    {activeTab === 'drivers' && (
                                        <>
                                            <td style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#E5E7EB', backgroundImage: `url(${item.avatar_url})`, backgroundSize: 'cover' }}></div>
                                                <span style={{ fontWeight: 500 }}>{item.name}</span>
                                            </td>
                                            <td style={{ padding: '16px' }}>{item.phone}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`badge ${item.status === 'IDLE' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'vehicles' && (
                                        <>
                                            <td style={{ padding: '16px', fontWeight: 500 }}>{item.plate}</td>
                                            <td style={{ padding: '16px' }}>{item.model}</td>
                                            <td style={{ padding: '16px' }}>{item.capacity}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`badge ${item.status === 'IDLE' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                                            </td>
                                        </>
                                    )}
                                    {activeTab === 'expenses' && (
                                        <>
                                            <td style={{ padding: '16px', fontWeight: 500 }}>{item.category}</td>
                                            <td style={{ padding: '16px' }}>${item.amount.toFixed(2)}</td>
                                            <td style={{ padding: '16px' }}>{new Date(item.date).toLocaleDateString()}</td>
                                            <td style={{ padding: '16px' }}>
                                                <span className={`badge ${item.status === 'PAID' ? 'badge-green' : 'badge-yellow'}`}>{item.status}</span>
                                            </td>
                                        </>
                                    )}
                                    <td style={{ padding: '16px' }}>
                                        <button
                                            onClick={() => alert(`Edit ${activeTab} feature coming soon for ID: ${item.id}`)}
                                            style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}
                                        >
                                            {t('common.edit')}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={`Add ${activeTab === 'drivers' ? t('fleet.driver') : activeTab === 'vehicles' ? t('fleet.vehicle') : activeTab === 'expenses' ? t('fleet.expense') : 'Task'}`}
            >
                <form onSubmit={handleSubmit}>
                    {activeTab === 'drivers' && (
                        <>
                            <label style={labelStyle}>{t('fleet.name')}</label>
                            <input
                                required
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.name || ''}
                                onChange={e => handleInputChange('name', e.target.value)}
                            />

                            <label style={labelStyle}>{t('fleet.phone')}</label>
                            <input
                                required
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.phone || ''}
                                onChange={e => handleInputChange('phone', e.target.value)}
                            />

                            <label style={labelStyle}>Status</label>
                            <select
                                style={inputStyle}
                                value={newEntry.status || 'IDLE'}
                                onChange={e => handleInputChange('status', e.target.value)}
                            >
                                <option value="IDLE">IDLE</option>
                                <option value="ON_DUTY">ON DUTY</option>
                            </select>
                        </>
                    )}

                    {activeTab === 'vehicles' && (
                        <>
                            <label style={labelStyle}>{t('fleet.plateId')}</label>
                            <input
                                required
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.plate || ''}
                                onChange={e => handleInputChange('plate', e.target.value)}
                            />

                            <label style={labelStyle}>{t('fleet.model')}</label>
                            <input
                                required
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.model || ''}
                                onChange={e => handleInputChange('model', e.target.value)}
                            />

                            <label style={labelStyle}>{t('fleet.capacity')}</label>
                            <input
                                required
                                type="number"
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.capacity || ''}
                                onChange={e => handleInputChange('capacity', e.target.value)}
                            />

                            <label style={labelStyle}>Status</label>
                            <select
                                style={inputStyle}
                                value={newEntry.status || 'IDLE'}
                                onChange={e => handleInputChange('status', e.target.value)}
                            >
                                <option value="IDLE">IDLE</option>
                                <option value="IN_TRANSIT">IN TRANSIT</option>
                                <option value="MAINTENANCE">MAINTENANCE</option>
                            </select>
                        </>
                    )}

                    {activeTab === 'expenses' && (
                        <>
                            <label style={labelStyle}>{t('fleet.category')}</label>
                            <select
                                style={inputStyle}
                                value={newEntry.category || 'Fuel'}
                                onChange={e => handleInputChange('category', e.target.value)}
                            >
                                <option value="Fuel">Fuel</option>
                                <option value="Maintenance">Maintenance</option>
                                <option value="Toll">Toll</option>
                                <option value="Insurance">Insurance</option>
                                <option value="Other">Other</option>
                            </select>

                            <label style={labelStyle}>{t('fleet.amount')}</label>
                            <input
                                required
                                type="number"
                                step="0.01"
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.amount || ''}
                                onChange={e => handleInputChange('amount', parseFloat(e.target.value))}
                            />

                            <label style={labelStyle}>{t('fleet.date')}</label>
                            <input
                                required
                                type="date"
                                style={{ ...inputStyle, width: '60%' }}
                                value={newEntry.date ? newEntry.date.split('T')[0] : ''}
                                onChange={e => handleInputChange('date', e.target.value)}
                            />

                            <label style={labelStyle}>Status</label>
                            <select
                                style={inputStyle}
                                value={newEntry.status || 'PENDING'}
                                onChange={e => handleInputChange('status', e.target.value)}
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="PAID">PAID</option>
                            </select>
                        </>
                    )}

                    <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                        <button
                            type="button"
                            onClick={() => setIsModalOpen(false)}
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E5E7EB',
                                background: 'white', color: '#374151', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            style={{
                                flex: 1, padding: '10px', borderRadius: '8px', border: 'none',
                                background: 'var(--color-primary)', color: 'white', cursor: 'pointer', fontWeight: 500
                            }}
                        >
                            {t('common.save')}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};
