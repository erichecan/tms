import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import Modal from '../Modal/Modal';
import { API_BASE_URL } from '../../apiConfig';
import { useDialog } from '../../context/DialogContext';
import { FileText, Loader2, CheckCircle2 } from 'lucide-react';

interface StatementGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    type: 'customer' | 'driver';
    onSuccess: () => void;
}

const StatementGenerator: React.FC<StatementGeneratorProps> = ({ isOpen, onClose, type, onSuccess }) => {
    const { t } = useTranslation();
    const { alert } = useDialog();
    const [loading, setLoading] = useState(false);
    const [fetchingRefs, setFetchingRefs] = useState(false);
    const [references, setReferences] = useState<any[]>([]);

    // Form state
    const [referenceId, setReferenceId] = useState('');
    const [periodStart, setPeriodStart] = useState('');
    const [periodEnd, setPeriodEnd] = useState('');
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchReferences();
            // Default period: Current month
            const now = new Date();
            const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            setPeriodStart(firstDay);
            setPeriodEnd(lastDay);
            setSuccess(false);
            setReferenceId('');
        }
    }, [isOpen, type]);

    const fetchReferences = async () => {
        setFetchingRefs(true);
        const token = localStorage.getItem('token');
        const endpoint = type === 'customer' ? 'customers' : 'drivers';
        try {
            const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.ok ? await res.json() : [];
            setReferences(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error("Failed to fetch references", e);
        } finally {
            setFetchingRefs(false);
        }
    };

    const handleGenerate = async () => {
        if (!referenceId || !periodStart || !periodEnd) {
            return alert(t('finance.errors.missingParams') || 'Please select a reference and date range', t('common.error'));
        }

        setLoading(true);
        const token = localStorage.getItem('token');
        try {
            const res = await fetch(`${API_BASE_URL}/finance/statements`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    type,
                    referenceId,
                    periodStart,
                    periodEnd
                })
            });

            const data = await res.json();
            if (res.ok) {
                setSuccess(true);
                onSuccess();
            } else {
                alert(data.error || 'Failed to generate statement', t('common.error'));
            }
        } catch (e) {
            console.error("Generation error", e);
            alert('A connection error occurred', t('common.error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={type === 'customer' ? t('common.generateStatement') : t('finance.payable.process')}
        >
            {success ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <CheckCircle2 size={64} color="var(--secondary)" style={{ marginBottom: '16px' }} />
                    <h3 style={{ marginBottom: '8px' }}>{t('messages.updateSuccessTitle')}</h3>
                    <p style={{ color: 'var(--slate-500)', marginBottom: '24px' }}>
                        {t('finance.messages.statementGenerated') || 'Statement has been generated successfully as a draft.'}
                    </p>
                    <button className="btn-primary" onClick={onClose}>
                        {t('modal.confirm')}
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    {/* Reference Selection */}
                    <div>
                        <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '8px' }}>
                            {type === 'customer' ? t('finance.table.customer') : t('finance.table.driver')}
                        </label>
                        <select
                            value={referenceId}
                            onChange={(e) => setReferenceId(e.target.value)}
                            disabled={fetchingRefs || loading}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid var(--glass-border)',
                                background: 'white',
                                fontSize: '14px',
                                fontWeight: 500
                            }}
                        >
                            <option value="">{fetchingRefs ? t('common.loading') : (type === 'customer' ? t('waybill.selectCustomer') : t('common.select') || 'Select...')}</option>
                            {references.map(ref => (
                                <option key={ref.id} value={ref.id}>
                                    {ref.name} {ref.company ? `(${ref.company})` : ''}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Period Selection */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '8px' }}>
                                {t('finance.statement.periodStart') || 'Period Start'}
                            </label>
                            <input
                                type="date"
                                value={periodStart}
                                onChange={(e) => setPeriodStart(e.target.value)}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '14px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '8px' }}>
                                {t('finance.statement.periodEnd') || 'Period End'}
                            </label>
                            <input
                                type="date"
                                value={periodEnd}
                                onChange={(e) => setPeriodEnd(e.target.value)}
                                disabled={loading}
                                style={{
                                    width: '100%',
                                    padding: '12px',
                                    borderRadius: '12px',
                                    border: '1px solid var(--glass-border)',
                                    fontSize: '14px'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ marginTop: '12px', padding: '16px', background: 'var(--slate-50)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--slate-500)', lineHeight: 1.5 }}>
                            {t('finance.statement.hint') || 'Generated statements will aggregate all PENDING financial records for the selected entity during this period. You can review and finalize them in the Statements list.'}
                        </p>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
                        <button className="btn-secondary" onClick={onClose} disabled={loading}>
                            {t('common.cancel')}
                        </button>
                        <button className="btn-primary" onClick={handleGenerate} disabled={loading || !referenceId}>
                            {loading ? <Loader2 className="animate-spin" size={20} /> : <FileText size={20} />}
                            {t('common.generateStatement')}
                        </button>
                    </div>
                </div>
            )}
        </Modal>
    );
};

export default StatementGenerator;
