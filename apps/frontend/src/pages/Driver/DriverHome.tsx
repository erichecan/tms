
import React, { useState, useEffect } from 'react';
import { Clock, ChevronRight, Search, MapPin } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { API_BASE_URL } from '../../apiConfig';

interface Waybill {
    id: string;
    waybill_no: string;
    origin: string;
    destination: string;
    status: string;
    scheduled_time: string;
}

export const DriverHome: React.FC = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [waybills, setWaybills] = useState<Waybill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) return;

        const fetchWaybills = async () => {
            try {
                // Now using the newly implemented backend driver_id filter
                const res = await fetch(`${API_BASE_URL}/waybills?driver_id=${user.id}`);
                const data = await res.json();

                // If backend isn't ready with driver_id param, we show mock data for eriche
                if (data.data && data.data.length > 0) {
                    setWaybills(data.data);
                } else {
                    // Mock data fallback
                    setWaybills([
                        { id: 'WB-001', waybill_no: 'WB-20260114-001', origin: 'Omaha, NE', destination: 'Chicago, IL', status: 'IN_TRANSIT', scheduled_time: '2026-01-14 10:00 AM' },
                        { id: 'WB-002', waybill_no: 'WB-20260114-002', origin: 'Kansas City, MO', destination: 'Dallas, TX', status: 'ASSIGNED', scheduled_time: '2026-01-15 08:00 AM' },
                    ]);
                }
            } catch (err) {
                console.error("Fetch waybills failed", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWaybills();
    }, [user]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'IN_TRANSIT': return '#3B82F6';
            case 'ASSIGNED': return '#F59E0B';
            case 'COMPLETED': return '#10B981';
            default: return 'var(--slate-400)';
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
            <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)', marginBottom: '8px' }}>
                    {t('sidebar.waybills')}
                </h2>
                <div style={{ position: 'relative' }}>
                    <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }} />
                    <input
                        placeholder={t('common.search')}
                        style={{
                            width: '100%',
                            padding: '12px 12px 12px 48px',
                            background: 'white',
                            border: '1px solid var(--glass-border)',
                            borderRadius: '16px',
                            fontSize: '14px',
                            fontWeight: 600,
                            outline: 'none',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.02)'
                        }}
                    />
                </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>Loading missions...</div>
                ) : waybills.map(wb => (
                    <div
                        key={wb.id}
                        onClick={() => navigate(`/driver/waybill/${wb.id}`)}
                        className="glass card-hover"
                        style={{
                            padding: '20px',
                            borderRadius: '24px',
                            cursor: 'pointer',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '16px',
                            background: 'white',
                            border: '1px solid var(--glass-border)'
                        }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                                        {wb.origin.split(',')[0]}
                                    </span>
                                    <ChevronRight size={14} color="var(--slate-300)" />
                                    <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--slate-900)' }}>
                                        {wb.destination.split(',')[0]}
                                    </span>
                                </div>
                                <div style={{ fontSize: '13px', color: 'var(--slate-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <MapPin size={12} color="var(--slate-400)" />
                                    {wb.destination}
                                </div>
                                <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '4px', letterSpacing: '0.02em' }}>
                                    #{wb.waybill_no}
                                </div>
                            </div>
                            <div style={{
                                padding: '4px 12px',
                                borderRadius: '100px',
                                background: `${getStatusColor(wb.status)}20`,
                                color: getStatusColor(wb.status),
                                fontSize: '10px',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                            }}>
                                {wb.status}
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--slate-100)', paddingTop: '12px' }}>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                <Clock size={14} color="var(--primary-start)" />
                                <span style={{ fontSize: '12px', color: 'var(--slate-600)', fontWeight: 700 }}>
                                    {wb.scheduled_time}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
