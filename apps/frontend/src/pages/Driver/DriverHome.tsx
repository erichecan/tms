
import React, { useState, useEffect } from 'react';
import { Package, Clock, MapPin, ChevronRight, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

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
    const [waybills, setWaybills] = useState<Waybill[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mocking API call
        setTimeout(() => {
            setWaybills([
                { id: 'WB-001', waybill_no: 'WB-20260114-001', origin: 'Omaha, NE', destination: 'Chicago, IL', status: 'IN_TRANSIT', scheduled_time: '2026-01-14 10:00 AM' },
                { id: 'WB-002', waybill_no: 'WB-20260114-002', origin: 'Kansas City, MO', destination: 'Dallas, TX', status: 'ASSIGNED', scheduled_time: '2026-01-15 08:00 AM' },
                { id: 'WB-003', waybill_no: 'WB-20260114-003', origin: 'Des Moines, IA', destination: 'Minneapolis, MN', status: 'COMPLETED', scheduled_time: '2026-01-13 02:00 PM' },
            ]);
            setLoading(false);
        }, 800);
    }, []);

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
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{
                                    padding: '8px',
                                    borderRadius: '10px',
                                    background: 'rgba(59, 130, 246, 0.1)',
                                    color: 'var(--primary-start)'
                                }}>
                                    <Package size={18} />
                                </div>
                                <span style={{ fontWeight: 800, fontSize: '15px' }}>{wb.waybill_no}</span>
                            </div>
                            <div style={{
                                padding: '4px 12px',
                                borderRadius: '100px',
                                background: `${getStatusColor(wb.status)}20`,
                                color: getStatusColor(wb.status),
                                fontSize: '11px',
                                fontWeight: 800,
                                textTransform: 'uppercase'
                            }}>
                                {wb.status}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <MapPin size={14} color="var(--slate-400)" />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{wb.origin}</span>
                                <ChevronRight size={14} color="var(--slate-300)" />
                                <span style={{ fontSize: '13px', fontWeight: 600 }}>{wb.destination}</span>
                            </div>
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                                <Clock size={14} color="var(--slate-400)" />
                                <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 500 }}>
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
