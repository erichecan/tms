import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, ArrowRight } from 'lucide-react';
import Modal from './components/Modal/Modal';

interface PricingRule {
    id?: string;
    name: string;
    type: 'BASE_RATE' | 'DISTANCE' | 'WEIGHT' | 'QUANTITY' | 'LUMP_SUM' | 'DISCOUNT';
    value: number;
    unit?: string;
    priority: number;
}

interface PricingTemplate {
    id: string;
    name: string;
    description: string;
    currency: string;
    rules: PricingRule[];
    isDefault: boolean;
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
}

export const PricingRules = () => {
    const [templates, setTemplates] = useState<PricingTemplate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingTemplate, setEditingTemplate] = useState<Partial<PricingTemplate>>({ rules: [] });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch('http://localhost:3001/api/pricing/templates');
            if (res.ok) setTemplates(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = () => {
        setEditingTemplate({
            name: '', description: '', currency: 'CAD',
            status: 'DRAFT', rules: [], isDefault: false
        });
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleEdit = (tmpl: PricingTemplate) => {
        setEditingTemplate(JSON.parse(JSON.stringify(tmpl))); // Deep copy
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        await fetch(`http://localhost:3001/api/pricing/templates/${id}`, { method: 'DELETE' });
        fetchTemplates();
    };

    const saveTemplate = async () => {
        const isEdit = !!editingTemplate.id;
        const url = isEdit
            ? `http://localhost:3001/api/pricing/templates/${editingTemplate.id}`
            : 'http://localhost:3001/api/pricing/templates';
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editingTemplate)
        });
        if (res.ok) {
            setIsModalOpen(false);
            fetchTemplates();
        } else {
            alert('Failed to save');
        }
    };

    const addRule = () => {
        const newRule: PricingRule = {
            id: `R-${Date.now()}`,
            name: 'New Rule',
            type: 'BASE_RATE',
            value: 0,
            priority: (editingTemplate.rules?.length || 0) + 1
        };
        setEditingTemplate({
            ...editingTemplate,
            rules: [...(editingTemplate.rules || []), newRule]
        });
    };

    const updateRule = (idx: number, field: string, val: any) => {
        const newRules = [...(editingTemplate.rules || [])];
        newRules[idx] = { ...newRules[idx], [field]: val };
        setEditingTemplate({ ...editingTemplate, rules: newRules });
    };

    const removeRule = (idx: number) => {
        const newRules = [...(editingTemplate.rules || [])];
        newRules.splice(idx, 1);
        setEditingTemplate({ ...editingTemplate, rules: newRules });
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
                <h1>Pricing Rules Engine</h1>
                <button className="btn-primary" onClick={handleCreate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                    <Plus size={18} /> New Template
                </button>
            </div>

            <div className="card" style={{ background: 'white', padding: 20, borderRadius: 12 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                            <th style={{ padding: 12, textAlign: 'left' }}>Name</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Currency</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Rules Count</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Status</th>
                            <th style={{ padding: 12, textAlign: 'left' }}>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {templates.map(t => (
                            <tr key={t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                <td style={{ padding: 12 }}>
                                    <div style={{ fontWeight: 600 }}>{t.name}</div>
                                    <div style={{ fontSize: 13, color: '#666' }}>{t.description}</div>
                                </td>
                                <td style={{ padding: 12 }}>{t.currency}</td>
                                <td style={{ padding: 12 }}>{t.rules.length}</td>
                                <td style={{ padding: 12 }}>{t.status}</td>
                                <td style={{ padding: 12 }}>
                                    <button onClick={() => handleEdit(t)} style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}><Edit size={16} /></button>
                                    <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'red' }}><Trash2 size={16} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTemplate.id ? 'Edit Template' : 'Create Pricing Template'}>
                <div style={{ minWidth: 500, minHeight: 400, display: 'flex', flexDirection: 'column' }}>
                    {/* Stepper */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 20, borderBottom: '1px solid #eee', paddingBottom: 10, alignItems: 'center' }}>
                        <div style={{ fontWeight: currentStep === 1 ? 'bold' : 'normal', color: currentStep === 1 ? 'blue' : 'gray' }}>1. Basic Info</div>
                        <ArrowRight size={16} color="#ccc" />
                        <div style={{ fontWeight: currentStep === 2 ? 'bold' : 'normal', color: currentStep === 2 ? 'blue' : 'gray' }}>2. Rules Configuration</div>
                    </div>

                    {currentStep === 1 && (
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', marginBottom: 5 }}>Template Name</label>
                            <input
                                style={{ width: '100%', padding: '8px 12px', marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
                                value={editingTemplate.name || ''}
                                onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                            />

                            <label style={{ display: 'block', marginBottom: 5 }}>Description</label>
                            <textarea
                                style={{ width: '100%', padding: '8px 12px', marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
                                value={editingTemplate.description || ''}
                                onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                            />

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5 }}>Currency</label>
                                    <select
                                        style={{ width: '100%', padding: '8px 12px', marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
                                        value={editingTemplate.currency || 'CAD'}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, currency: e.target.value })}
                                    >
                                        <option value="CAD">CAD</option>
                                        <option value="USD">USD</option>
                                        <option value="CNY">CNY</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: 5 }}>Status</label>
                                    <select
                                        style={{ width: '100%', padding: '8px 12px', marginBottom: 15, border: '1px solid #ddd', borderRadius: 4 }}
                                        value={editingTemplate.status || 'DRAFT'}
                                        onChange={e => setEditingTemplate({ ...editingTemplate, status: e.target.value as any })}
                                    >
                                        <option value="DRAFT">Draft</option>
                                        <option value="ACTIVE">Active</option>
                                        <option value="ARCHIVED">Archived</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    )}

                    {currentStep === 2 && (
                        <div style={{ flex: 1 }}>
                            <button onClick={addRule} style={{ padding: '6px 12px', background: '#eee', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer', marginBottom: 10 }}>
                                + Add Rule
                            </button>
                            <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                                {editingTemplate.rules?.map((rule, idx) => (
                                    <div key={idx} style={{ padding: 10, border: '1px solid #eee', borderRadius: 6, marginBottom: 8, background: '#fafafa' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                                            <strong>Rule #{idx + 1}</strong>
                                            <button onClick={() => removeRule(idx)} style={{ color: 'red', border: 'none', background: 'none' }}>Remove</button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                                            <input
                                                placeholder="Rule Name"
                                                value={rule.name}
                                                onChange={e => updateRule(idx, 'name', e.target.value)}
                                                style={{ padding: 4 }}
                                            />
                                            <select
                                                value={rule.type}
                                                onChange={e => updateRule(idx, 'type', e.target.value)}
                                                style={{ padding: 4 }}
                                            >
                                                <option value="BASE_RATE">Base Rate</option>
                                                <option value="DISTANCE">Distance Based</option>
                                                <option value="WEIGHT">Weight Based</option>
                                                <option value="LUMP_SUM">Lump Sum</option>
                                                <option value="DISCOUNT">Discount</option>
                                            </select>
                                            <input
                                                type="number"
                                                placeholder="Value"
                                                value={rule.value}
                                                onChange={e => updateRule(idx, 'value', parseFloat(e.target.value))}
                                                style={{ padding: 4 }}
                                            />
                                            <input
                                                type="number"
                                                placeholder="Priority"
                                                value={rule.priority}
                                                onChange={e => updateRule(idx, 'priority', parseInt(e.target.value))}
                                                style={{ padding: 4 }}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20, paddingTop: 10, borderTop: '1px solid #eee' }}>
                        {currentStep > 1 ? (
                            <button onClick={() => setCurrentStep(currentStep - 1)} style={{ padding: '8px 16px', background: 'white', border: '1px solid #ccc', borderRadius: 4, cursor: 'pointer' }}>
                                Back
                            </button>
                        ) : <div />}

                        {currentStep < 2 ? (
                            <button onClick={() => setCurrentStep(currentStep + 1)} style={{ padding: '8px 16px', background: 'blue', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                Next
                            </button>
                        ) : (
                            <button onClick={saveTemplate} style={{ padding: '8px 16px', background: 'green', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                                Save Template
                            </button>
                        )}
                    </div>
                </div>
            </Modal>
        </div>
    );
};
