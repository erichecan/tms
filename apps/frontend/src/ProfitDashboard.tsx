import { useEffect, useState } from 'react';
import { API_BASE_URL } from './apiConfig';
import { TrendingUp, DollarSign, Activity, Truck, Target } from 'lucide-react';

export const ProfitDashboard = () => {
    const [analytics, setAnalytics] = useState<any>({ kpis: {}, byDestination: [], byCustomer: [] });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const token = localStorage.getItem('token');
                const headers: HeadersInit = { 'Content-Type': 'application/json' };
                if (token) headers['Authorization'] = `Bearer ${token}`;

                const res = await fetch(`${API_BASE_URL}/analytics/profit`, { headers });
                if (res.ok) {
                    const data = await res.json();
                    setAnalytics(data);
                }
            } catch (err) {
                console.error("Failed to fetch profit analytics:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchAnalytics();
    }, []);

    const formatMoney = (val: number) => `$${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const kpis = analytics.kpis;
    const marginPercent = kpis.total_revenue > 0 ? (kpis.total_margin / kpis.total_revenue) * 100 : 0;

    return (
        <div style={{ paddingBottom: '40px', animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '32px' }}>
                <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)' }}>Analytics Dashboard</h1>
                <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px' }}>Analyze revenue, costs, and profit margins across your operations.</p>
            </div>

            {loading ? (
                <div style={{ padding: '80px', textAlign: 'center' }}>
                    <div style={{ width: 40, height: 40, border: '4px solid var(--primary-start)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }}></div>
                </div>
            ) : (
                <>
                    {/* KPI Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: 'var(--slate-100)', padding: '10px', borderRadius: '12px' }}>
                                    <DollarSign size={20} color="var(--primary-start)" />
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenue</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--slate-900)' }}>{formatMoney(kpis.total_revenue)}</div>
                        </div>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: 'var(--slate-100)', padding: '10px', borderRadius: '12px' }}>
                                    <Activity size={20} color="var(--slate-600)" />
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Cost</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--slate-700)' }}>{formatMoney(kpis.total_cost)}</div>
                        </div>
                        <div className="glass-card" style={{ padding: '24px', background: 'linear-gradient(135deg, var(--primary-start) 0%, var(--primary-end) 100%)', color: 'white' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: 'rgba(255,255,255,0.2)', padding: '10px', borderRadius: '12px' }}>
                                    <TrendingUp size={20} color="white" />
                                </div>
                                <span style={{ fontWeight: 700, color: 'rgba(255,255,255,0.9)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Gross Margin</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: 'white' }}>{formatMoney(kpis.total_margin)}</div>
                            <div style={{ marginTop: '8px', fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
                                {marginPercent.toFixed(1)}% Avg Margin
                            </div>
                        </div>
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                <div style={{ background: 'var(--slate-100)', padding: '10px', borderRadius: '12px' }}>
                                    <Truck size={20} color="var(--primary-start)" />
                                </div>
                                <span style={{ fontWeight: 700, color: 'var(--slate-500)', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Completed Jobs</span>
                            </div>
                            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--slate-900)' }}>{kpis.total_waybills}</div>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                        {/* Margin by Destination */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Target size={20} color="var(--slate-600)" />
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Top Profit Destinations</h2>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                {analytics.byDestination.map((dest: any, idx: number) => {
                                    const maxMargin = Math.max(...analytics.byDestination.map((d: any) => d.margin || 0), 1);
                                    const percent = Math.max(0, ((dest.margin || 0) / maxMargin) * 100);
                                    return (
                                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', fontWeight: 700 }}>
                                                <span>{dest.name}</span>
                                                <span style={{ color: 'var(--primary-start)' }}>{formatMoney(dest.margin)}</span>
                                            </div>
                                            <div style={{ width: '100%', height: '8px', background: 'var(--slate-100)', borderRadius: '4px', overflow: 'hidden' }}>
                                                <div style={{ width: `${percent}%`, height: '100%', background: 'var(--primary-grad)', borderRadius: '4px' }}></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Customer Margin Table */}
                        <div className="glass-card" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <Activity size={20} color="var(--slate-600)" />
                                <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 800 }}>Top Customers by Margin</h2>
                            </div>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr>
                                        <th style={{ padding: '12px 0', borderBottom: '1px solid var(--glass-border)', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Customer</th>
                                        <th style={{ padding: '12px 0', borderBottom: '1px solid var(--glass-border)', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase' }}>Revenue</th>
                                        <th style={{ padding: '12px 0', borderBottom: '1px solid var(--glass-border)', color: 'var(--slate-400)', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', textAlign: 'right' }}>Margin</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {analytics.byCustomer.map((c: any, idx: number) => (
                                        <tr key={idx} style={{ borderBottom: '1px solid var(--glass-border)' }}>
                                            <td style={{ padding: '16px 0', fontWeight: 700, color: 'var(--slate-900)' }}>{c.customer_name || 'N/A'}</td>
                                            <td style={{ padding: '16px 0', fontWeight: 600, color: 'var(--slate-500)' }}>{formatMoney(c.revenue)}</td>
                                            <td style={{ padding: '16px 0', fontWeight: 800, color: 'var(--primary-start)', textAlign: 'right' }}>{formatMoney(c.margin)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
