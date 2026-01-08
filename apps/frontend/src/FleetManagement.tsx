
import { useEffect, useState } from 'react';
import { Truck, User, DollarSign, Plus } from 'lucide-react';

export const FleetManagement = () => {
    const [activeTab, setActiveTab] = useState<'drivers' | 'vehicles' | 'expenses'>('drivers');
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

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h1 style={{ margin: 0, fontSize: '24px' }}>Fleet & Expenses</h1>
                <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} />
                    Add {activeTab === 'expenses' ? 'Expense' : activeTab === 'drivers' ? 'Driver' : 'Vehicle'}
                </button>
            </div>

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: '1px solid #E5E7EB', marginBottom: '24px' }}>
                <TabButton id="drivers" label="Drivers" icon={User} />
                <TabButton id="vehicles" label="Vehicles" icon={Truck} />
                <TabButton id="expenses" label="Expenses" icon={DollarSign} />
            </div>

            {/* Content */}
            <div className="card">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                        <tr style={{ borderBottom: '1px solid #E5E7EB' }}>
                            {activeTab === 'drivers' && (
                                <>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>NAME</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>PHONE</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>STATUS</th>
                                </>
                            )}
                            {activeTab === 'vehicles' && (
                                <>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>PLATE ID</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>MODEL</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>CAPACITY</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>STATUS</th>
                                </>
                            )}
                            {activeTab === 'expenses' && (
                                <>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>CATEGORY</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>AMOUNT</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>DATE</th>
                                    <th style={{ padding: '16px', color: '#6B7280' }}>STATUS</th>
                                </>
                            )}
                            <th style={{ padding: '16px', color: '#6B7280' }}>ACTION</th>
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
                                    <button style={{ color: '#6B7280', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
