
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { DollarSign, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from './apiConfig';

export const FinanceDashboard = () => {
    const { t } = useTranslation();
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${API_BASE_URL}/finance/dashboard`, { headers })
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
            <h2 style={{ marginBottom: '24px', fontSize: '24px', fontWeight: 'bold' }}>{t('finance.title')}</h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '32px' }}>
                <MetricCard
                    title={t('finance.metrics.revenue')}
                    value={metrics?.totalRevenue}
                    icon={DollarSign}
                    color="#10B981"
                />
                <MetricCard
                    title={t('finance.metrics.expenses')}
                    value={metrics?.totalExpenses}
                    icon={TrendingDown}
                    color="#EF4444"
                />
                <MetricCard
                    title={t('finance.metrics.profit')}
                    value={metrics?.profit}
                    icon={TrendingUp}
                    color={metrics?.profit >= 0 ? '#10B981' : '#EF4444'}
                />
                <MetricCard
                    title={t('finance.metrics.overdue')}
                    value={metrics?.overdueReceivables}
                    icon={AlertCircle}
                    color="#F59E0B"
                />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', height: '300px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>{t('finance.dashboard.recent')}</h3>
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                        Chart Placeholder
                    </div>
                </div>
                <div style={{ background: 'white', borderRadius: '12px', border: '1px solid #E5E7EB', padding: '24px', height: '300px' }}>
                    <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 600 }}>{t('finance.dashboard.outstanding')}</h3>
                    <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF' }}>
                        List Placeholder
                    </div>
                </div>
            </div>
        </div>
    );
};
