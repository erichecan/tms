import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API_BASE_URL } from '../../apiConfig';
import { useDialog } from '../../context/DialogContext';

interface VehicleFormProps {
    initialData?: any;
    onSuccess: (vehicle: any) => void;
    onCancel: () => void;
}

export const VehicleForm: React.FC<VehicleFormProps> = ({ initialData = {}, onSuccess, onCancel }) => {
    const { t } = useTranslation();
    const { alert } = useDialog();
    const [formData, setFormData] = useState<any>(initialData);
    const [loading, setLoading] = useState(false);

    const handleInputChange = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload = { ...formData };
            payload.status = payload.status || 'IDLE';

            const isEdit = !!payload.id;
            const url = isEdit ? `${API_BASE_URL}/vehicles/${payload.id}` : `${API_BASE_URL}/vehicles`;
            const method = isEdit ? 'PUT' : 'POST';

            const token = localStorage.getItem('token');
            const res = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const result = await res.json();
                onSuccess(result);
            } else {
                const err = await res.json();
                alert(err.error || 'Failed to save vehicle', t('common.error'));
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred while saving vehicle', t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.licensePlate')}</label>
                        <input
                            required
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                            value={formData.plate || ''}
                            onChange={e => handleInputChange('plate', e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.vehicleModel')}</label>
                        <input
                            required
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                            value={formData.model || ''}
                            onChange={e => handleInputChange('model', e.target.value)}
                        />
                    </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('fleet.modal.payloadCapacity')}</label>
                        <input
                            required
                            disabled={loading}
                            type="number"
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 700 }}
                            value={formData.capacity || ''}
                            onChange={e => handleInputChange('capacity', e.target.value)}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', textTransform: 'uppercase', marginBottom: '8px' }}>{t('common.status')}</label>
                        <select
                            disabled={loading}
                            style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid var(--glass-border)', background: 'var(--slate-50)', fontWeight: 800 }}
                            value={formData.status || 'IDLE'}
                            onChange={e => handleInputChange('status', e.target.value)}
                        >
                            <option value="IDLE">{t('fleet.modal.statusOptions.idle')}</option>
                            <option value="IN_TRANSIT">{t('fleet.modal.statusOptions.inTransit')}</option>
                            <option value="MAINTENANCE">{t('fleet.modal.statusOptions.maintenance')}</option>
                        </select>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', marginTop: '16px' }}>
                <button
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                    className="btn-secondary"
                    style={{ flex: 1 }}
                >
                    {t('fleet.modal.dismiss')}
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary"
                    style={{ flex: 1 }}
                >
                    {loading ? '...' : (formData.id ? t('fleet.modal.saveUpdates') : t('fleet.modal.confirmRegistration'))}
                </button>
            </div>
        </form>
    );
};
