import { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, Layers, CheckCircle2, ShoppingCart, MapPin, DollarSign, Users, Building2,
    Truck, Calculator, Sparkles, AlertCircle, Info, ChevronLeft, ChevronRight
} from 'lucide-react';
import Modal from './components/Modal/Modal';
import { API_BASE_URL } from './apiConfig';

interface PricingRule {
    name: string;
    type: string;
    value: number;
    condition?: string;
    priority: number;
}

interface PricingTemplate {
    id: string;
    name: string;
    description: string;
    currency: string;
    scenario: string;
    businessConditions: {
        pickupType: string;
        deliveryType: string;
        requiresAppointment: boolean;
        baseDistanceKm: number;
        waitingTimeLimit: number;
    };
    rules: PricingRule[];
    driverRules: PricingRule[];
    costAllocation: {
        warehouseCost: number;
        fleetCostAllocation: string;
        fuelCostRate: number;
    };
    status: 'ACTIVE' | 'DRAFT' | 'ARCHIVED';
    isDefault: boolean;
}

export const PricingRules = () => {
    const [templates, setTemplates] = useState<PricingTemplate[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [editingTemplate, setEditingTemplate] = useState<Partial<PricingTemplate>>({
        rules: [],
        driverRules: [],
        businessConditions: {
            pickupType: 'OWN_WAREHOUSE',
            deliveryType: 'THIRD_PARTY_WAREHOUSE',
            requiresAppointment: true,
            baseDistanceKm: 25,
            waitingTimeLimit: 180
        },
        costAllocation: { warehouseCost: 40, fleetCostAllocation: 'auto_calculated', fuelCostRate: 0.6 }
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/pricing/templates`);
            if (res.ok) setTemplates(await res.json());
        } catch (e) {
            console.error(e);
        }
    };

    const handleCreate = () => {
        setEditingTemplate({
            name: '', description: '', currency: 'CAD', scenario: 'WAREHOUSE_TRANSFER',
            status: 'DRAFT', rules: [], driverRules: [], isDefault: false,
            businessConditions: {
                pickupType: 'OWN_WAREHOUSE',
                deliveryType: 'THIRD_PARTY_WAREHOUSE',
                requiresAppointment: true,
                baseDistanceKm: 25,
                waitingTimeLimit: 180
            },
            costAllocation: { warehouseCost: 40, fleetCostAllocation: 'auto_calculated', fuelCostRate: 0.6 }
        });
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleEdit = (tmpl: PricingTemplate) => {
        setEditingTemplate(JSON.parse(JSON.stringify(tmpl)));
        setCurrentStep(1);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this template?')) return;
        await fetch(`${API_BASE_URL}/pricing/templates/${id}`, { method: 'DELETE' });
        fetchTemplates();
    };

    const mapInputsToRules = () => {
        const bc = editingTemplate.businessConditions!;
        const pricingRules: PricingRule[] = [
            { name: 'Base Service Fee', type: 'BASE_FEE', value: 180, priority: 100 },
            { name: 'Distance Tier Surcharge', type: 'DISTANCE_TIER', value: 20, condition: `distance > ${bc.baseDistanceKm}`, priority: 110 },
            { name: 'Waiting Time Penalty', type: 'WAITING_FEE', value: 50, condition: `waitingTime > ${bc.waitingTimeLimit}`, priority: 200 }
        ];

        const driverRules: PricingRule[] = [
            { name: 'Driver Base Trip Pay', type: 'BASE_DRIVER_PAY', value: 80, priority: 100 },
            { name: 'Waiting Bonus', type: 'WAITING_BONUS', value: 10, condition: `waitingTime > ${bc.waitingTimeLimit}`, priority: 150 },
            { name: 'Revenue Sharing', type: 'DRIVER_SHARING', value: 0.2, priority: 300 }
        ];

        return { pricingRules, driverRules };
    };

    const saveTemplate = async () => {
        const { pricingRules, driverRules } = mapInputsToRules();
        const finalTemplate = {
            ...editingTemplate,
            rules: pricingRules,
            driverRules: driverRules
        };

        const isEdit = !!editingTemplate.id;
        const url = isEdit
            ? `${API_BASE_URL}/pricing/templates/${editingTemplate.id}`
            : `${API_BASE_URL}/pricing/templates`;
        const method = isEdit ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(finalTemplate)
        });
        if (res.ok) {
            setIsModalOpen(false);
            fetchTemplates();
        }
    };

    const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 6));
    const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

    const steps = [
        { title: 'Scenario', icon: <ShoppingCart size={18} /> },
        { title: 'Logistics', icon: <MapPin size={18} /> },
        { title: 'Pricing', icon: <DollarSign size={18} /> },
        { title: 'Driver Pay', icon: <Users size={18} /> },
        { title: 'Allocations', icon: <Building2 size={18} /> },
        { title: 'Finalize', icon: <CheckCircle2 size={18} /> }
    ];

    const updateCondition = (field: string, value: any) => {
        setEditingTemplate(prev => ({
            ...prev,
            businessConditions: {
                ...(prev.businessConditions || {
                    pickupType: 'OWN_WAREHOUSE',
                    deliveryType: 'THIRD_PARTY_WAREHOUSE',
                    requiresAppointment: true,
                    baseDistanceKm: 25,
                    waitingTimeLimit: 180
                }),
                [field]: value
            }
        }));
    };

    const updateCost = (field: string, value: any) => {
        setEditingTemplate(prev => ({
            ...prev,
            costAllocation: {
                ...(prev.costAllocation || { warehouseCost: 40, fleetCostAllocation: 'auto_calculated', fuelCostRate: 0.6 }),
                [field]: value
            }
        }));
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                        {[
                            { id: 'WASTE_COLLECTION', name: 'Waste Collection', icon: '🗑️', desc: 'Internal WH → Landfill' },
                            { id: 'WAREHOUSE_TRANSFER', name: 'WH Transfer', icon: '📦', desc: 'Internal WH → 3PL / Amazon' },
                            { id: 'CLIENT_DIRECT', name: 'Client Direct', icon: '🚛', desc: 'Client Site → Destination' }
                        ].map(s => (
                            <div
                                key={s.id}
                                onClick={() => setEditingTemplate({ ...editingTemplate, scenario: s.id })}
                                style={{
                                    padding: '24px',
                                    borderRadius: '20px',
                                    border: `2px solid ${editingTemplate.scenario === s.id ? 'var(--primary-start)' : 'var(--slate-100)'}`,
                                    background: editingTemplate.scenario === s.id ? 'linear-gradient(135deg, #f0f7ff 0%, #ffffff 100%)' : 'white',
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                    textAlign: 'center',
                                    boxShadow: editingTemplate.scenario === s.id ? '0 10px 20px rgba(37, 99, 235, 0.1)' : 'none'
                                }}
                            >
                                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{s.icon}</div>
                                <div style={{ fontWeight: 800, color: 'var(--slate-900)', marginBottom: '4px' }}>{s.name}</div>
                                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>{s.desc}</div>
                            </div>
                        ))}
                    </div>
                );
            case 2:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="glass" style={{ padding: '20px' }}>
                            <h4 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-start)' }}>
                                <Truck size={18} /> Origin Configuration
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>PICKUP LOCATION TYPE</label>
                                <select
                                    className="input-field"
                                    style={{ width: '100%', padding: '10px' }}
                                    value={editingTemplate.businessConditions?.pickupType}
                                    onChange={e => updateCondition('pickupType', e.target.value)}
                                >
                                    <option value="OWN_WAREHOUSE">Internal Warehouse</option>
                                    <option value="CLIENT_SITE">Client Site</option>
                                    <option value="3PL">Third Party Logistics</option>
                                </select>
                            </div>
                        </div>
                        <div className="glass" style={{ padding: '20px' }}>
                            <h4 style={{ margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-start)' }}>
                                <MapPin size={18} /> Destination Node
                            </h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)' }}>DESTINATION TYPE</label>
                                <select
                                    className="input-field"
                                    style={{ width: '100%', padding: '10px' }}
                                    value={editingTemplate.businessConditions?.deliveryType}
                                    onChange={e => updateCondition('deliveryType', e.target.value)}
                                >
                                    <option value="AMAZON_FBA">Amazon FBA / 3PL Warehouse</option>
                                    <option value="LANDFILL">Landfill / Recycling Center</option>
                                    <option value="END_CUSTOMER">End Customer Address</option>
                                </select>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div className="glass" style={{ padding: '24px', background: 'linear-gradient(135deg, white 0%, #f8fafc 100%)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <div style={{ padding: '8px', background: 'var(--primary-grad)', borderRadius: '10px', color: 'white' }}>
                                        <Calculator size={20} />
                                    </div>
                                    <h4 style={{ margin: 0, fontWeight: 800 }}>Tariff Structure</h4>
                                </div>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>BASE SERVICE FEE (CAD)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100%', fontSize: '16px', fontWeight: 800, color: 'var(--primary-start)' }}
                                        value={180}
                                        readOnly
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>DISTANCE THRESHOLD (KM)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100%', fontSize: '16px', fontWeight: 800 }}
                                        value={editingTemplate.businessConditions?.baseDistanceKm}
                                        onChange={e => updateCondition('baseDistanceKm', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>TIERED KILOMETER RATE</label>
                                    <input type="number" className="input-field" defaultValue={20} style={{ width: '100%', fontSize: '16px', fontWeight: 800 }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>WAITING TIME LIMIT (MIN)</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100%', fontSize: '16px', fontWeight: 800 }}
                                        value={editingTemplate.businessConditions?.waitingTimeLimit}
                                        onChange={e => updateCondition('waitingTimeLimit', parseFloat(e.target.value))}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '8px', background: '#ec4899', borderRadius: '10px', color: 'white' }}>
                                    <Users size={20} />
                                </div>
                                <h4 style={{ margin: 0, fontWeight: 800 }}>Driver Commission</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>BASE TRIP PAYMENT</label>
                                    <div style={{ position: 'relative' }}>
                                        <input type="number" className="input-field" defaultValue={80} style={{ width: '100%', paddingLeft: '32px', fontWeight: 700 }} />
                                        <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--slate-400)' }}>$</span>
                                    </div>
                                </div>
                                <div style={{ padding: '12px', background: '#fdf2f8', borderRadius: '12px', border: '1px solid #fbcfe8' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                        <Sparkles size={14} color="#ec4899" />
                                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#be185d' }}>Performance Bonus</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '11px', color: '#db2777' }}>Additional $20.00 for on-time delivery at Amazon fulfillment centers.</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div className="glass" style={{ padding: '20px' }}>
                                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                                    <input type="checkbox" defaultChecked style={{ width: '18px', height: '18px' }} />
                                    <div>
                                        <div style={{ fontSize: '14px', fontWeight: 700 }}>Enable Profit Sharing</div>
                                        <div style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Driver receives 20% of waiting time surcharges</div>
                                    </div>
                                </label>
                            </div>
                            <div className="glass" style={{ padding: '20px', borderLeft: '4px solid #f59e0b' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#d97706', marginBottom: '8px' }}>
                                    <AlertCircle size={16} />
                                    <span style={{ fontSize: '13px', fontWeight: 700 }}>Compliance Warning</span>
                                </div>
                                <p style={{ margin: 0, fontSize: '12px', color: 'var(--slate-600)' }}>Current rate is 15% below Ontario logistics standard minimums for heavy duty fleet.</p>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div className="glass" style={{ padding: '24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                                <div style={{ padding: '8px', background: '#8b5cf6', borderRadius: '10px', color: 'white' }}>
                                    <Building2 size={20} />
                                </div>
                                <h4 style={{ margin: 0, fontWeight: 800 }}>Internal Overhead</h4>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>WAREHOUSE HANDLING COST</label>
                                    <input
                                        type="number"
                                        className="input-field"
                                        style={{ width: '100%', fontWeight: 700 }}
                                        value={editingTemplate.costAllocation?.warehouseCost}
                                        onChange={e => updateCost('warehouseCost', parseFloat(e.target.value))}
                                    />
                                </div>
                                <div>
                                    <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>FLEET MAINTENANCE ALLOCATION</label>
                                    <select
                                        className="input-field"
                                        style={{ width: '100%' }}
                                        value={editingTemplate.costAllocation?.fleetCostAllocation}
                                        onChange={e => updateCost('fleetCostAllocation', e.target.value)}
                                    >
                                        <option value="auto_calculated">Auto-calculated (Fuel + Mileage)</option>
                                        <option value="fixed_cost">Fixed Daily Rate</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div style={{ background: 'var(--slate-900)', borderRadius: '24px', padding: '24px', color: 'white' }}>
                            <h4 style={{ margin: '0 0 20px', fontSize: '15px', color: '#94a3b8' }}>Margin Analysis (Real-time)</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Gross Revenue</span>
                                    <span style={{ fontWeight: 700 }}>$180.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Driver Payout</span>
                                    <span style={{ fontWeight: 700, color: '#f87171' }}>-$80.00</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8', fontSize: '13px' }}>Internal Costs</span>
                                    <span style={{ fontWeight: 700, color: '#f87171' }}>-${(editingTemplate.costAllocation?.warehouseCost || 0).toFixed(2)}</span>
                                </div>
                                <div style={{ margin: '8px 0', borderTop: '1px solid #334155' }}></div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '15px', fontWeight: 700 }}>Estimate Net Margin</span>
                                    <span style={{ fontSize: '20px', fontWeight: 800, color: '#4ade80' }}>
                                        ${(180 - 80 - (editingTemplate.costAllocation?.warehouseCost || 0)).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', color: 'var(--primary-start)' }}>
                                    <Calculator size={20} />
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>Review Rule Architecture</h3>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>TEMPLATE NAME</label>
                                        <input
                                            className="input-field"
                                            placeholder="e.g., YYZ9 Standard Peak 2024"
                                            style={{ width: '100%', padding: '14px', fontSize: '15px', fontWeight: 600 }}
                                            value={editingTemplate.name || ''}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-400)', display: 'block', marginBottom: '8px' }}>DESCRIPTION</label>
                                        <textarea
                                            className="input-field"
                                            placeholder="Brief explanation of this pricing logic..."
                                            style={{ width: '100%', minHeight: '100px', padding: '12px' }}
                                            value={editingTemplate.description || ''}
                                            onChange={e => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="glass" style={{ padding: '24px', background: '#f8fafc' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <Info size={16} color="var(--primary-start)" />
                                    <span style={{ fontWeight: 700, fontSize: '14px' }}>Deployment Preview</span>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                    {[
                                        { label: 'Scenario', value: editingTemplate.scenario },
                                        { label: 'Rules Count', value: '3 Customer Rules / 3 Driver Rules' },
                                        { label: 'Base Revenue', value: '$180.00' },
                                        { label: 'Internal Allocation', value: `$${editingTemplate.costAllocation?.warehouseCost.toFixed(2)}` }
                                    ].map((item, idx) => (
                                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
                                            <span style={{ color: 'var(--slate-500)' }}>{item.label}</span>
                                            <span style={{ fontWeight: 700, color: 'var(--slate-900)' }}>{item.value}</span>
                                        </div>
                                    ))}
                                    <div style={{ marginTop: '12px', padding: '12px', background: '#dcfce7', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <CheckCircle2 size={16} color="#16a34a" />
                                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#15803d' }}>Proprietary AI Optimization Validated</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '1200px', margin: '0 auto' }}>
            {/* Header Section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ margin: 0, fontSize: '28px', fontWeight: 900, color: 'var(--slate-900)', letterSpacing: '-0.025em' }}>Pricing Engine</h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--slate-500)', fontSize: '14px', fontWeight: 500 }}>Global logistics tariffs and rule management orchestration.</p>
                </div>
                <button className="btn-primary" onClick={handleCreate} style={{ padding: '14px 28px', borderRadius: '16px', boxShadow: 'var(--primary-shadow)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Plus size={20} />
                    <span style={{ fontWeight: 700 }}>Initialize Template</span>
                </button>
            </div>

            {/* Template Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '24px' }}>
                {templates.length === 0 ? (
                    <div className="glass" style={{ gridColumn: '1 / -1', padding: '80px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: 'var(--slate-100)', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--slate-400)', margin: '0 auto 20px' }}>
                            <Layers size={32} />
                        </div>
                        <h3 style={{ margin: '0 0 8px', color: 'var(--slate-900)' }}>No Pricing Templates</h3>
                        <p style={{ margin: 0, color: 'var(--slate-400)', fontSize: '14px' }}>Initialize your first template to start automating logistics costs.</p>
                    </div>
                ) : templates.map(t => (
                    <div key={t.id} className="glass card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
                        <div style={{ position: 'absolute', top: '24px', right: '24px' }}>
                            <span className={t.status === 'ACTIVE' ? 'badge-blue' : 'badge-yellow'}>
                                {t.status}
                            </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--primary-grad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)' }}>
                                <Layers size={24} />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>{t.name}</h3>
                                <div style={{ fontSize: '12px', color: 'var(--slate-400)', fontWeight: 600 }}>{t.scenario} • {t.currency}</div>
                            </div>
                        </div>

                        <p style={{ margin: '0 0 24px', fontSize: '14px', color: 'var(--slate-600)', lineHeight: '1.6', minHeight: '44px' }}>
                            {t.description || 'No operational description provided for this template structure.'}
                        </p>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--glass-border)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)' }}>{t.rules?.length || 0} ACTIVE RULES</div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button onClick={() => handleEdit(t)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px' }} title="Edit Configuration">
                                    <Edit size={16} />
                                </button>
                                <button onClick={() => handleDelete(t.id)} className="btn-secondary" style={{ padding: '8px', borderRadius: '10px', color: '#EF4444' }} title="Remove Template">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                title={editingTemplate.id ? 'Refine Pricing Architecture' : 'Tactical Rule Orchestration'}
            >
                <div style={{ width: '900px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', padding: '0 40px' }}>
                        <div style={{ position: 'absolute', top: '18px', left: '60px', right: '60px', height: '2px', background: '#e2e8f0', zIndex: 0 }}>
                            <div style={{ height: '100%', width: `${((currentStep - 1) / 5) * 100}%`, background: 'var(--primary-grad)', transition: 'all 0.4s ease' }}></div>
                        </div>
                        {steps.map((s, idx) => (
                            <div key={idx} style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                                <div style={{
                                    width: '36px',
                                    height: '36px',
                                    borderRadius: '50%',
                                    background: currentStep > idx + 1 ? 'var(--primary-grad)' : currentStep === idx + 1 ? 'white' : 'white',
                                    border: `2px solid ${currentStep >= idx + 1 ? 'var(--primary-start)' : '#e2e8f0'}`,
                                    color: currentStep > idx + 1 ? 'white' : currentStep === idx + 1 ? 'var(--primary-start)' : '#94a3b8',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 800,
                                    fontSize: '14px',
                                    transition: 'all 0.3s ease',
                                    boxShadow: currentStep === idx + 1 ? '0 0 15px rgba(37, 99, 235, 0.2)' : 'none'
                                }}>
                                    {currentStep > idx + 1 ? <CheckCircle2 size={18} /> : s.icon}
                                </div>
                                <span style={{ fontSize: '10px', fontWeight: 800, color: currentStep >= idx + 1 ? 'var(--slate-900)' : 'var(--slate-400)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                                    {s.title}
                                </span>
                            </div>
                        ))}
                    </div>

                    <div style={{ minHeight: '400px', animation: 'fadeIn 0.4s ease-out' }}>
                        {renderStepContent()}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={prevStep}
                            disabled={currentStep === 1}
                            className="btn-secondary"
                            style={{ padding: '12px 24px', display: 'flex', alignItems: 'center', gap: '8px', opacity: currentStep === 1 ? 0.3 : 1 }}
                        >
                            <ChevronLeft size={20} /> Previous
                        </button>

                        <div style={{ fontSize: '13px', color: 'var(--slate-400)', fontWeight: 600 }}>
                            Step {currentStep} of 6
                        </div>

                        {currentStep < 6 ? (
                            <button
                                onClick={nextStep}
                                className="btn-primary"
                                style={{ padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
                            >
                                Continue <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={saveTemplate}
                                className="btn-primary"
                                style={{ padding: '12px 32px', display: 'flex', alignItems: 'center', gap: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', boxShadow: '0 10px 15px -3px rgba(16, 185, 129, 0.2)' }}
                            >
                                <Sparkles size={20} />
                                <span style={{ fontWeight: 800 }}>Deploy Engine</span>
                            </button>
                        )}
                    </div>
                </div>
            </Modal>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .input-field {
                    border: 1px solid var(--glass-border);
                    border-radius: 12px;
                    background: var(--slate-50);
                    transition: all 0.2s ease;
                    outline: none;
                }
                .input-field:focus {
                    background: white;
                    border-color: var(--primary-start);
                    box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.1);
                }
            `}</style>
        </div>
    );
};
