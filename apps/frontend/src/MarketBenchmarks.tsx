import { useEffect, useState } from 'react';
import { API_BASE_URL } from './apiConfig';
import { Search, Plus, TrendingUp, Edit, Trash2 } from 'lucide-react';
import { useDialog } from './context/DialogContext';

export const MarketBenchmarks = () => {
    const { alert, confirm } = useDialog();
    const [benchmarks, setBenchmarks] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editItem, setEditItem] = useState<any>(null);

    const fetchBenchmarks = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/analytics/benchmarks?search=${searchTerm}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBenchmarks(data.data || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(fetchBenchmarks, 500);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/analytics/benchmarks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(editItem)
            });
            if (res.ok) {
                setIsModalOpen(false);
                fetchBenchmarks();
                alert('Success', 'Market benchmark saved.');
            } else {
                alert('Error', 'Failed to save benchmark.');
            }
        } catch (err) {
            alert('Error', 'An unexpected error occurred.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!await confirm('Delete Benchmark', 'Are you sure you want to delete this market data?')) return;
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE_URL}/analytics/benchmarks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) fetchBenchmarks();
        } catch (err) {
            console.error(err);
        }
    };

    const formatMoney = (val: number) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    return (
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>Market Benchmarks</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Compare your rates against market averages.</p>
                </div>
                <button onClick={() => { setEditItem({}); setIsModalOpen(true); }} className="btn-primary" style={{ padding: '12px 28px' }}>
                    <Plus size={20} /> Add Benchmark
                </button>
            </div>

            <div className="glass" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', marginBottom: '24px' }}>
                    <div style={{ position: 'relative', width: '380px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                        <input
                            type="text"
                            placeholder="Search by Destination (e.g., YYZ3)"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%', padding: '12px 12px 12px 48px',
                                border: '1px solid var(--glass-border)', borderRadius: '12px', outline: 'none',
                                background: 'var(--slate-50)', fontWeight: 600, fontSize: '14px'
                            }}
                        />
                    </div>
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0', textAlign: 'left' }}>
                        <thead>
                            <tr style={{ background: 'var(--slate-50)' }}>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Destination</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Vehicle Type</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Market Low/High (Avg)</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Source</th>
                                <th style={{ padding: '16px 20px', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase' }}>Collected At</th>
                                <th style={{ padding: '16px 20px', textAlign: 'right' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center' }}>Loading...</td>
                                </tr>
                            ) : benchmarks.length > 0 ? benchmarks.map(item => (
                                <tr key={item.id} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                    <td style={{ padding: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>{item.destination_code}</td>
                                    <td style={{ padding: '20px', fontWeight: 700, color: 'var(--slate-700)' }}>{item.vehicle_type || 'N/A'}</td>
                                    <td style={{ padding: '20px' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontWeight: 800, color: 'var(--primary-start)' }}>Avg: {formatMoney(item.avg_price)}</span>
                                            <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>{formatMoney(item.min_price)} - {formatMoney(item.max_price)}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px', fontWeight: 600, color: 'var(--slate-600)' }}>{item.source || '-'}</td>
                                    <td style={{ padding: '20px', color: 'var(--slate-500)', fontSize: '13px' }}>{new Date(item.collected_at).toLocaleDateString()}</td>
                                    <td style={{ padding: '20px', textAlign: 'right' }}>
                                        <button onClick={() => { setEditItem(item); setIsModalOpen(true); }} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--slate-400)', marginRight: '16px' }}>
                                            <Edit size={18} />
                                        </button>
                                        <button onClick={() => handleDelete(item.id)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#EF4444' }}>
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={6} style={{ padding: '60px', textAlign: 'center', color: 'var(--slate-400)' }}>
                                        <div style={{ marginBottom: '16px' }}><TrendingUp size={48} opacity={0.2} /></div>
                                        <div style={{ fontWeight: 600 }}>No Benchmarks Found</div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className="glass-card" style={{ width: '500px', padding: '40px', background: 'white' }}>
                        <h3 style={{ fontSize: '24px', fontWeight: 800, margin: '0 0 24px', color: 'var(--slate-900)' }}>{editItem.id ? 'Edit Benchmark' : 'Add Benchmark'}</h3>
                        <form onSubmit={handleSave}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '8px', textTransform: 'uppercase' }}>Destination Code *</label>
                                    <input required type="text" value={editItem.destination_code || ''} onChange={e => setEditItem({ ...editItem, destination_code: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, outline: 'none' }} placeholder="e.g. YYZ3" />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '8px', textTransform: 'uppercase' }}>Vehicle Type</label>
                                    <select value={editItem.vehicle_type || ''} onChange={e => setEditItem({ ...editItem, vehicle_type: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, outline: 'none' }}>
                                        <option value="">Any</option>
                                        <option value="STRAIGHT_26">26ft Straight</option>
                                        <option value="STRAIGHT_28">28ft Straight</option>
                                        <option value="TRAILER_53">53ft Trailer</option>
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '8px', textTransform: 'uppercase' }}>Min Price</label>
                                    <input type="number" step="0.01" value={editItem.min_price || ''} onChange={e => setEditItem({ ...editItem, min_price: parseFloat(e.target.value) })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '8px', textTransform: 'uppercase' }}>Max Price</label>
                                    <input type="number" step="0.01" value={editItem.max_price || ''} onChange={e => setEditItem({ ...editItem, max_price: parseFloat(e.target.value) })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '8px', textTransform: 'uppercase' }}>Avg Price *</label>
                                    <input required type="number" step="0.01" value={editItem.avg_price || ''} onChange={e => setEditItem({ ...editItem, avg_price: parseFloat(e.target.value) })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, outline: 'none' }} />
                                </div>
                            </div>
                            
                            <div style={{ marginBottom: '32px' }}>
                                <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-500)', marginBottom: '8px', textTransform: 'uppercase' }}>Data Source</label>
                                <input type="text" value={editItem.source || ''} onChange={e => setEditItem({ ...editItem, source: e.target.value })} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 600, outline: 'none' }} placeholder="e.g. Industry Report Q1, Competitor A" />
                            </div>

                            <div style={{ display: 'flex', gap: '16px' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="btn-secondary" style={{ flex: 1, padding: '14px', fontWeight: 700 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px', fontWeight: 800 }}>Save Data</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
