
import { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Users, Wallet, ChevronRight, FileText, Search, Filter, Download } from 'lucide-react';
import { API_BASE_URL } from './apiConfig';

interface FinancialRecord {
    id: string;
    type: string;
    amount: number;
    status: string;
    created_at: string;
    reference_id: string; // Driver ID
    shipment_id?: string; // Waybill/Shipment ID
}

interface Driver {
    id: string;
    name: string;
    phone?: string;
}

export const FinancePayables = () => {
    const { } = useTranslation();
    const [records, setRecords] = useState<FinancialRecord[]>([]);
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const fetchData = async () => {
        setLoading(true);
        const token = localStorage.getItem('token');
        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        try {
            const [recordsRes, driversRes] = await Promise.all([
                fetch(`${API_BASE_URL}/finance/records?type=payable`, { headers }),
                fetch(`${API_BASE_URL}/drivers`, { headers })
            ]);

            const [recordsData, driversData] = await Promise.all([
                recordsRes.json(),
                driversRes.json()
            ]);

            setRecords(Array.isArray(recordsData) ? recordsData : []);
            setDrivers(Array.isArray(driversData) ? driversData : []);
        } catch (err) {
            console.error('Failed to fetch finance data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const groupedRecords = useMemo(() => {
        const groups: Record<string, { total: number, records: FinancialRecord[], driverName: string }> = {};

        records.forEach(record => {
            const driver = drivers.find(d => d.id === record.reference_id);
            const driverName = driver?.name || record.reference_id;

            // Filter by search term
            if (searchTerm && !driverName.toLowerCase().includes(searchTerm.toLowerCase()) && !record.reference_id.toLowerCase().includes(searchTerm.toLowerCase())) {
                return;
            }

            if (!groups[record.reference_id]) {
                groups[record.reference_id] = { total: 0, records: [], driverName };
            }
            groups[record.reference_id].total += Number(record.amount);
            groups[record.reference_id].records.push(record);
        });

        return groups;
    }, [records, drivers, searchTerm]);

    const driverList = useMemo(() => {
        return Object.entries(groupedRecords).map(([id, data]) => ({
            id,
            ...data
        })).sort((a, b) => b.total - a.total);
    }, [groupedRecords]);

    const handleExportCSV = () => {
        if (!selectedDriverId || !groupedRecords[selectedDriverId]) return;

        const { driverName, records } = groupedRecords[selectedDriverId];

        // Define CSV Headers
        const headers = ["Record ID", "Waybill/Ref", "Amount", "Status", "Date"];

        // Map records to rows
        const rows = records.map(r => [
            r.id,
            r.shipment_id || r.reference_id,
            r.amount.toFixed(2),
            r.status,
            new Date(r.created_at).toLocaleDateString()
        ]);

        // Combine into CSV string
        const csvContent = [
            headers.join(","),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
        ].join("\n");

        // Trigger download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Payroll_${driverName.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ padding: '32px', minHeight: '100vh', background: 'var(--slate-50)' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '40px'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            padding: '10px',
                            background: 'var(--primary-grad)',
                            borderRadius: '12px',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}>
                            <Wallet size={24} />
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--slate-900)' }}>
                            Accounts Payable
                        </h1>
                    </div>
                    <p style={{ color: 'var(--slate-500)', fontSize: '15px', margin: 0 }}>
                        Automatic payroll tracking and settlement for fleet drivers.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderRadius: '14px', gap: '12px' }}>
                        <Search size={18} color="var(--slate-400)" />
                        <input
                            placeholder="Search driver..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                fontSize: '14px',
                                width: '200px',
                                fontWeight: 500
                            }}
                        />
                    </div>
                </div>
            </div>

            {/* Stats Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px',
                marginBottom: '40px'
            }}>
                {[
                    { label: 'Total Pending', value: records.filter(r => r.status === 'PENDING').reduce((sum, r) => sum + Number(r.amount), 0), icon: <Wallet size={20} />, color: '#6366f1' },
                    { label: 'Active Drivers', value: drivers.length, icon: <Users size={20} />, color: '#22c55e' },
                    { label: 'Paid This Month', value: records.filter(r => r.status === 'PAID').reduce((sum, r) => sum + Number(r.amount), 0), icon: <FileText size={20} />, color: '#f59e0b' },
                    { label: 'System Status', value: 'Automated', icon: <Filter size={20} />, color: '#3b82f6' }
                ].map((stat, idx) => (
                    <div key={idx} className="glass card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: `${stat.color}15`,
                            color: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>
                                {typeof stat.value === 'number' ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(stat.value) : stat.value}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'grid', gridTemplateColumns: selectedDriverId ? '1fr 1fr' : '1fr', gap: '24px' }}>
                {/* Driver List */}
                <div className="glass card" style={{ padding: '0', overflow: 'hidden' }}>
                    <div style={{ padding: '20px', borderBottom: '1px solid var(--slate-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, fontWeight: 800 }}>Pending Payroll by Driver</h3>
                        <span style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 600 }}>{driverList.length} Drivers Found</span>
                    </div>
                    <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
                        {loading ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>Loading data...</div>
                        ) : driverList.length === 0 ? (
                            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--slate-400)' }}>No pending payroll records.</div>
                        ) : (
                            driverList.map(item => (
                                <div
                                    key={item.id}
                                    onClick={() => setSelectedDriverId(item.id === selectedDriverId ? null : item.id)}
                                    style={{
                                        padding: '16px 20px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        cursor: 'pointer',
                                        background: selectedDriverId === item.id ? 'var(--slate-50)' : 'transparent',
                                        borderBottom: '1px solid var(--slate-50)',
                                        transition: 'all 0.2s'
                                    }}
                                    className="list-item"
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            background: 'var(--slate-100)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: 800,
                                            color: 'var(--slate-500)',
                                            fontSize: '14px'
                                        }}>
                                            {item.driverName.charAt(0)}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 800, color: 'var(--slate-900)' }}>{item.driverName}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--slate-400)' }}>{item.records.length} Pending Records</div>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{ fontWeight: 800, color: 'var(--slate-900)', fontSize: '16px' }}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(item.total)}
                                            </div>
                                            <div style={{ fontSize: '10px', color: 'var(--primary-start)', fontWeight: 700, textTransform: 'uppercase' }}>Available</div>
                                        </div>
                                        <ChevronRight size={18} color={selectedDriverId === item.id ? 'var(--primary-start)' : 'var(--slate-300)'} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Detail View */}
                {selectedDriverId && (
                    <div className="glass card" style={{ padding: '0', overflow: 'hidden', animation: 'fadeIn 0.3s ease-out' }}>
                        <div style={{ padding: '20px', borderBottom: '1px solid var(--slate-100)', background: 'var(--slate-50)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '4px' }}>Detail Breakdown</div>
                                <h3 style={{ margin: 0, fontWeight: 800 }}>{groupedRecords[selectedDriverId]?.driverName}</h3>
                            </div>
                            <button
                                onClick={handleExportCSV}
                                className="btn-secondary"
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    border: '1px solid var(--slate-200)',
                                    background: 'white',
                                    cursor: 'pointer'
                                }}
                            >
                                <Download size={16} />
                                Export CSV
                            </button>
                        </div>
                        <div style={{ maxHeight: '550px', overflowY: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ background: 'var(--slate-50)', position: 'sticky', top: 0 }}>
                                    <tr>
                                        <th style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)' }}>SHIPMENT</th>
                                        <th style={{ padding: '12px 20px', textAlign: 'right', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)' }}>PAYOUT</th>
                                        <th style={{ padding: '12px 20px', textAlign: 'center', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)' }}>STATUS</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {groupedRecords[selectedDriverId]?.records.map(record => (
                                        <tr key={record.id} style={{ borderBottom: '1px solid var(--slate-50)' }}>
                                            <td style={{ padding: '16px 20px' }}>
                                                <div style={{ fontWeight: 700, color: 'var(--slate-700)', fontSize: '13px' }}>
                                                    {record.shipment_id || record.id}
                                                </div>
                                                <div style={{ fontSize: '11px', color: 'var(--slate-400)' }}>{new Date(record.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'right', fontWeight: 800, color: 'var(--slate-900)' }}>
                                                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'CAD' }).format(record.amount)}
                                            </td>
                                            <td style={{ padding: '16px 20px', textAlign: 'center' }}>
                                                <span style={{
                                                    padding: '4px 10px', borderRadius: '8px', fontSize: '10px', fontWeight: 800,
                                                    background: record.status === 'PAID' ? '#dcfce7' : '#fef3c7',
                                                    color: record.status === 'PAID' ? '#16a34a' : '#92400e',
                                                    textTransform: 'uppercase'
                                                }}>
                                                    {record.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
                .glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .card {
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                .list-item:hover {
                    background: var(--slate-50) !important;
                }
                .btn-primary {
                    background: var(--primary-grad);
                    color: white;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
                }
                .btn-primary:hover {
                    transform: scale(1.02);
                    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3);
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateX(10px); }
                    to { opacity: 1; transform: translateX(0); }
                }
            `}</style>
        </div>
    );
};
