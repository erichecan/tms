
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    AlertCircle,
    Calculator,
    Layers,
    Activity,
    CheckCircle2
} from 'lucide-react';
import { API_BASE_URL } from '../apiConfig';
import type { Rule, RuleCondition, RuleAction, RuleType, RuleStatus } from '../types/rules';
import { RuleTypes, RuleStatuses } from '../types/rules';
import { useDialog } from '../context/DialogContext';

interface RuleEditorProps {
    rule: Rule | null;
    onSave: () => void;
    onCancel: () => void;
}

const RuleEditor: React.FC<RuleEditorProps> = ({ rule, onSave, onCancel }) => {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState<RuleType>(RuleTypes.PRICING);
    const [priority, setPriority] = useState(100);
    const [status, setStatus] = useState<RuleStatus>(RuleStatuses.ACTIVE);
    const [conditions, setConditions] = useState<RuleCondition[]>([]);
    const [actions, setActions] = useState<RuleAction[]>([]);
    const [saving, setSaving] = useState(false);
    const { alert } = useDialog();

    useEffect(() => {
        if (rule) {
            setName(rule.name);
            setDescription(rule.description);
            setType(rule.type);
            setPriority(rule.priority);
            setStatus(rule.status);
            setConditions(rule.conditions || []);
            setActions(rule.actions || []);
        } else {
            // Defaults for new rule
            setConditions([{ fact: 'distance', operator: 'greaterThan', value: '' }]);
            setActions([{ type: 'addFee', params: { amount: 0 } }]);
        }
    }, [rule]);

    const addCondition = () => {
        setConditions([...conditions, { fact: 'distance', operator: 'equal', value: '' }]);
    };

    const removeCondition = (index: number) => {
        setConditions(conditions.filter((_, i) => i !== index));
    };

    const updateCondition = (index: number, updates: Partial<RuleCondition>) => {
        const newConditions = [...conditions];
        newConditions[index] = { ...newConditions[index], ...updates };
        setConditions(newConditions);
    };

    const addAction = () => {
        setActions([...actions, { type: 'addFee', params: { amount: 0 } }]);
    };

    const removeAction = (index: number) => {
        setActions(actions.filter((_, i) => i !== index));
    };

    const updateAction = (index: number, updates: Partial<RuleAction>) => {
        const newActions = [...actions];
        newActions[index] = { ...newActions[index], ...updates };
        setActions(newActions);
    };

    const handleSave = async () => {
        if (!name) return alert('Rule name is required', 'Validation Error');

        const ruleData = {
            name,
            description,
            type,
            priority,
            status,
            conditions,
            actions
        };

        try {
            setSaving(true);
            const url = rule ? `${API_BASE_URL}/rules/${rule.id}` : `${API_BASE_URL}/rules`;
            const method = rule ? 'PUT' : 'POST';

            const token = localStorage.getItem('token');
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (token) headers['Authorization'] = `Bearer ${token}`;

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(ruleData)
            });

            if (response.ok) {
                onSave();
            } else {
                const error = await response.json();
                alert(`Error: ${error.error}`, 'Save Failed');
            }
        } catch (error) {
            console.error('Failed to save rule:', error);
        } finally {
            setSaving(false);
        }
    };

    const factOptions = [
        { value: 'distance', label: 'Distance (km)' },
        { value: 'duration', label: 'Duration (min)' },
        { value: 'billingType', label: 'Billing Type (DISTANCE/TIME)' },
        { value: 'weight', label: 'Weight (kg)' },
        { value: 'customerLevel', label: 'Customer Level' },
        { value: 'isHazardous', label: 'Is Hazardous' },
        { value: 'weekendDelivery', label: 'Weekend Delivery' },
        { value: 'fulfillment_center', label: 'Fulfillment Center' }
    ];

    const operatorOptions = [
        { value: 'equal', label: '=' },
        { value: 'notEqual', label: '≠' },
        { value: 'greaterThan', label: '>' },
        { value: 'lessThan', label: '<' },
        { value: 'greaterThanInclusive', label: '≥' },
        { value: 'lessThanInclusive', label: '≤' },
        { value: 'in', label: 'In List' }
    ];

    const actionOptions = [
        { value: 'addFee', label: 'Add Fixed Fee', paramKey: 'amount', unit: 'CAD' },
        { value: 'applyDiscount', label: 'Apply Discount', paramKey: 'percentage', unit: '%' },
        { value: 'calculateBaseFee', label: 'Calculate Base Fee', paramKey: 'ratePerKm', unit: 'CAD/km' },
        { value: 'calculateByTime', label: 'Calculate by Time', paramKey: 'ratePerHour', unit: 'CAD/hr' },
        { value: 'calculateBasePay', label: 'Driver: Base Pay (Fixed + Km)', paramKey: 'ratePerKm', unit: 'CAD/km' },
        { value: 'addPercentage', label: 'Driver: % of Revenue', paramKey: 'percentage', unit: '%' },
        { value: 'setDriverCommission', label: 'Set Driver Commission', paramKey: 'percentage', unit: '%' }
    ];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', padding: '10px 0' }}>
            {/* Basic Info Section */}
            <div className="section-card">
                <div className="section-header">
                    <Layers size={20} color="var(--primary-start)" />
                    <h3>Identification & Context</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
                    <div>
                        <label className="field-label">RULE NAME (DISPLAY ON BREAKDOWN)</label>
                        <input
                            className="input-field"
                            placeholder="e.g., Weekend Surcharge YYZ"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            style={{ width: '100%', marginBottom: '16px' }}
                        />
                        <label className="field-label">DESCRIPTION</label>
                        <textarea
                            className="input-field"
                            placeholder="Briefly describe what this logic achieves..."
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            style={{ width: '100%', minHeight: '80px', paddingTop: '12px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                            <label className="field-label">CATEGORY</label>
                            <select
                                className="input-field"
                                value={type}
                                onChange={e => setType(e.target.value as RuleType)}
                                style={{ width: '100%' }}
                            >
                                <option value={RuleTypes.PRICING}>Pricing Logic</option>
                                <option value={RuleTypes.PAYROLL}>Driver Payroll</option>
                            </select>
                        </div>
                        <div>
                            <label className="field-label">PRIORITY (HIGHTER FIRST)</label>
                            <input
                                type="number"
                                className="input-field"
                                value={priority}
                                onChange={e => setPriority(parseInt(e.target.value))}
                                style={{ width: '100%' }}
                            />
                        </div>
                        <div>
                            <label className="field-label">STATUS</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button
                                    onClick={() => setStatus(RuleStatuses.ACTIVE)}
                                    className={`toggle-btn ${status === RuleStatuses.ACTIVE ? 'active' : ''}`}
                                    style={{ flex: 1 }}
                                >
                                    Active
                                </button>
                                <button
                                    onClick={() => setStatus(RuleStatuses.INACTIVE)}
                                    className={`toggle-btn ${status === RuleStatuses.INACTIVE ? 'inactive' : ''}`}
                                    style={{ flex: 1 }}
                                >
                                    Paused
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conditions (IF) */}
            <div className="section-card">
                <div className="section-header">
                    <Activity size={20} color="#f59e0b" />
                    <h3>Trigger Conditions (IF...)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {conditions.map((c, i) => (
                        <div key={i} style={{
                            display: 'grid',
                            gridTemplateColumns: 'minmax(150px, 1fr) 100px minmax(150px, 1fr) 48px',
                            gap: '12px',
                            alignItems: 'center',
                            background: 'var(--slate-50)',
                            padding: '12px',
                            borderRadius: '12px'
                        }}>
                            <select
                                className="select-box"
                                value={c.fact}
                                onChange={e => updateCondition(i, { fact: e.target.value })}
                            >
                                {factOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <select
                                className="select-box"
                                value={c.operator}
                                onChange={e => updateCondition(i, { operator: e.target.value })}
                            >
                                {operatorOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                            <input
                                className="input-box"
                                placeholder="Value..."
                                value={c.value as string}
                                onChange={e => updateCondition(i, { value: e.target.value })}
                            />
                            <button
                                onClick={() => removeCondition(i)}
                                style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ))}
                    <button onClick={addCondition} className="add-btn">
                        <Plus size={16} /> Add Logic Branch
                    </button>
                </div>
            </div>

            {/* Actions (THEN) */}
            <div className="section-card">
                <div className="section-header">
                    <Calculator size={20} color="#10b981" />
                    <h3>Business Impact (THEN...)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {actions.map((a, i) => {
                        const option = actionOptions.find(o => o.value === a.type);
                        return (
                            <div key={i} style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 48px',
                                gap: '12px',
                                alignItems: 'center',
                                background: 'rgba(16, 185, 129, 0.05)',
                                padding: '12px',
                                borderRadius: '12px',
                                border: '1px solid rgba(16, 185, 129, 0.1)'
                            }}>
                                <select
                                    className="select-box"
                                    value={a.type}
                                    onChange={e => updateAction(i, { type: e.target.value })}
                                >
                                    {actionOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="number"
                                        className="input-box"
                                        placeholder="Value..."
                                        value={a.params[option?.paramKey || 'value']}
                                        onChange={e => updateAction(i, { params: { [option?.paramKey || 'value']: parseFloat(e.target.value) } })}
                                        style={{ width: '100%', paddingRight: '40px' }}
                                    />
                                    <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', fontWeight: 700, fontSize: '12px', color: 'var(--slate-400)' }}>
                                        {option?.unit}
                                    </span>
                                </div>
                                <button
                                    onClick={() => removeAction(i)}
                                    style={{ padding: '8px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        );
                    })}
                    <button onClick={addAction} className="add-btn" style={{ borderColor: '#10b98130', color: '#10b981' }}>
                        <Plus size={16} /> Add Impact Action
                    </button>
                </div>
            </div>

            {/* Footer */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                paddingTop: '20px',
                borderTop: '1px solid var(--slate-100)',
                marginTop: '10px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <AlertCircle size={18} color="var(--slate-400)" />
                    <span style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 500 }}>
                        Declarative rules provide real-time logic execution across the TMS.
                    </span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={onCancel} className="btn-secondary">Cancel</button>
                    <button
                        onClick={handleSave}
                        className="btn-primary"
                        disabled={saving}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 32px' }}
                    >
                        {saving ? <div className="spinner-small"></div> : <CheckCircle2 size={18} />}
                        {rule ? 'Update Rule' : 'Deploy Rule'}
                    </button>
                </div>
            </div>

            <style>{`
                .section-card {
                    background: white;
                    border-radius: 20px;
                    padding: 24px;
                    border: 1px solid var(--slate-100);
                }
                .section-header {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 20px;
                }
                .section-header h3 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 800;
                    color: var(--slate-900);
                }
                .field-label {
                    display: block;
                    font-size: 11px;
                    font-weight: 800;
                    color: var(--slate-400);
                    margin-bottom: 8px;
                    letter-spacing: 0.05em;
                }
                .input-field {
                    background: var(--slate-50);
                    border: 1px solid var(--slate-100);
                    padding: 12px 16px;
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 600;
                    color: var(--slate-900);
                    outline: none;
                    transition: all 0.2s;
                }
                .input-field:focus {
                    border-color: var(--primary-start);
                    background: white;
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.05);
                }
                .select-box, .input-box {
                    background: white;
                    border: 1px solid var(--slate-200);
                    padding: 10px 12px;
                    border-radius: 10px;
                    font-size: 13px;
                    font-weight: 600;
                    color: var(--slate-700);
                    outline: none;
                }
                .add-btn {
                    padding: 12px;
                    border-radius: 12px;
                    border: 2px dashed var(--slate-200);
                    background: transparent;
                    color: var(--slate-500);
                    font-size: 13px;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }
                .add-btn:hover {
                    background: var(--slate-50);
                    border-color: var(--slate-300);
                }
                .toggle-btn {
                    padding: 10px;
                    border-radius: 10px;
                    border: 1px solid var(--slate-200);
                    background: white;
                    color: var(--slate-500);
                    font-size: 12px;
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .toggle-btn.active {
                    background: #dcfce7;
                    color: #16a34a;
                    border-color: #16a34a30;
                }
                .toggle-btn.inactive {
                    background: #f1f5f9;
                    color: #64748b;
                    border-color: #64748b30;
                }
                .btn-secondary {
                    padding: 12px 24px;
                    border-radius: 14px;
                    border: 1px solid var(--slate-200);
                    background: white;
                    color: var(--slate-600);
                    font-weight: 700;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .spinner-small {
                    width: 18px;
                    height: 18px;
                    border: 2px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
};

export default RuleEditor;
