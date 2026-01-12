
import { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export const FinanceDashboard = () => {
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        fetch('http://localhost:3001/api/finance/dashboard')
            .then(res => res.json())
            .then(data => setMetrics(data))
            .catch(err => console.error(err));
    }, []);

    const MetricCard = ({ title, value, icon: Icon, color }: any) => (
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', border: '1px solid #E5E7EB', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#6B7280' }}>
                <span style={{ fontSize: '14px', fontWeight: 500 }}>{title}</span>
                <Icon size={20} color={color} />
            </div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: '#111827' }}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value || 0)}
            </div>
        </div>
    );

    return (
        <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>Financial Overview</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <MetricCard
                    title="Total Revenue"
                    value={metrics?.totalRevenue}
                    icon={DollarSign}
                    color="#10B981"
                />
                <MetricCard
                    title="Total Expenses"
                    value={metrics?.totalExpenses}
                    icon={TrendingDown}
                    color="#EF4444"
                />
                <MetricCard
                    title="Net Profit"
                    value={metrics?.profit}
                    icon={TrendingUp}
                    color={metrics?.profit >= 0 ? '#10B981' : '#EF4444'}
                />
                <MetricCard
                    title="Overdue Receivables"
                    value={metrics?.overdueReceivables}
                    icon={AlertCircle}
                    color="#F59E0B"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', height: '300px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Recent Transactions</h3>
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                        Chart Placeholder
                    </div>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', height: '300px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>Outstanding Statements</h3>
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                        List Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
};
