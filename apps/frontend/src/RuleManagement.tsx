
import React, { useState, useEffect } from 'react';
import {
    Plus,
    Trash2,
    Edit3,
    Search,
    ShieldCheck,
    Zap,
    TrendingUp,
    FileText,
    CheckCircle2,
    ArrowRight,
    HelpCircle
} from 'lucide-react';
import { API_BASE_URL } from './apiConfig';
import Modal from './components/Modal/Modal';
import RuleEditor from './components/RuleEditor';
import type { Rule, RuleType } from './types/rules';
import { RuleTypes, RuleStatuses } from './types/rules';
import { useDialog } from './context/DialogContext';

const RuleManagement: React.FC = () => {
    const [rules, setRules] = useState<Rule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditorOpen, setIsEditorOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<Rule | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<RuleType | 'ALL'>('ALL');
    const { confirm } = useDialog();

    const fetchRules = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_BASE_URL}/rules`);
            const data = await response.json();
            setRules(data);
        } catch (error) {
            console.error('Failed to fetch rules:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRules();
    }, []);

    const handleDelete = async (id: string) => {
        const ok = await confirm('This will permanently delete the business rule and its associated logic. This action cannot be undone.', 'Delete Business Rule');
        if (!ok) return;
        try {
            await fetch(`${API_BASE_URL}/rules/${id}`, { method: 'DELETE' });
            fetchRules();
        } catch (error) {
            console.error('Failed to delete rule:', error);
        }
    };

    const handleCreate = () => {
        setEditingRule(null);
        setIsEditorOpen(true);
    };

    const handleEdit = (rule: Rule) => {
        setEditingRule(rule);
        setIsEditorOpen(true);
    };

    const filteredRules = rules.filter(r => {
        const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            r.description.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterType === 'ALL' || r.type === filterType;
        return matchesSearch && matchesFilter;
    });

    return (
        <div style={{ padding: '32px', minHeight: '100vh', background: 'var(--slate-50)' }}>
            {/* Header Section */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginBottom: '40px',
                animation: 'fadeInDown 0.6s ease-out'
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <div style={{
                            padding: '10px',
                            background: 'var(--primary-grad)',
                            borderRadius: '12px',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.2)'
                        }}>
                            <ShieldCheck size={24} />
                        </div>
                        <h1 style={{ fontSize: '32px', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--slate-900)' }}>
                            Universal Rules
                        </h1>
                    </div>
                    <p style={{ color: 'var(--slate-500)', fontSize: '15px', margin: 0 }}>
                        Configure declarative business logic for pricing and driver payroll.
                    </p>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div className="glass" style={{ display: 'flex', alignItems: 'center', padding: '6px 16px', borderRadius: '14px', gap: '12px' }}>
                        <Search size={18} color="var(--slate-400)" />
                        <input
                            placeholder="Search rules..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                border: 'none',
                                background: 'transparent',
                                outline: 'none',
                                fontSize: '14px',
                                width: '200px',
                                fontWeight: 500
                            }}
                        />
                    </div>
                    <button
                        onClick={handleCreate}
                        className="btn-primary"
                        style={{
                            padding: '12px 24px',
                            borderRadius: '14px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontWeight: 700
                        }}
                    >
                        <Plus size={20} />
                        Create Rule
                    </button>
                </div>
            </div>

            {/* Stats Summary */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '24px',
                marginBottom: '40px',
                animation: 'fadeInUp 0.6s ease-out 0.1s both'
            }}>
                {[
                    { label: 'Total Rules', value: rules.length, icon: <FileText size={20} />, color: '#6366f1' },
                    { label: 'Active Pricing', value: rules.filter(r => r.type === RuleTypes.PRICING && r.status === RuleStatuses.ACTIVE).length, icon: <TrendingUp size={20} />, color: '#22c55e' },
                    { label: 'Payroll Logic', value: rules.filter(r => r.type === RuleTypes.PAYROLL).length, icon: <Zap size={20} />, color: '#f59e0b' },
                    { label: 'Deployment Status', value: 'Live', icon: <CheckCircle2 size={20} />, color: '#3b82f6' }
                ].map((stat, idx) => (
                    <div key={idx} className="glass card" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{
                            width: '48px',
                            height: '48px',
                            borderRadius: '12px',
                            background: `${stat.color}15`,
                            color: stat.color,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            {stat.icon}
                        </div>
                        <div>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--slate-400)', textTransform: 'uppercase' }}>{stat.label}</div>
                            <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--slate-900)' }}>{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={{
                display: 'flex',
                gap: '8px',
                marginBottom: '24px',
                animation: 'fadeInUp 0.6s ease-out 0.2s both'
            }}>
                {['ALL', RuleTypes.PRICING, RuleTypes.PAYROLL].map(type => (
                    <button
                        key={type}
                        onClick={() => setFilterType(type as any)}
                        style={{
                            padding: '10px 20px',
                            borderRadius: '12px',
                            border: 'none',
                            background: filterType === type ? 'var(--slate-900)' : 'white',
                            color: filterType === type ? 'white' : 'var(--slate-500)',
                            fontWeight: 700,
                            fontSize: '13px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            boxShadow: filterType === type ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                        }}
                    >
                        {type === 'ALL' ? 'All Rules' : type === RuleTypes.PRICING ? 'Pricing Rules' : 'Payroll Rules'}
                    </button>
                ))}
            </div>

            {/* Rules Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                gap: '24px',
                animation: 'fadeInUp 0.8s ease-out 0.3s both'
            }}>
                {loading ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '100px' }}>
                        <div className="spinner"></div>
                        <p style={{ color: 'var(--slate-400)', marginTop: '20px' }}>Syncing Engine Logic...</p>
                    </div>
                ) : filteredRules.length === 0 ? (
                    <div style={{
                        gridColumn: '1/-1',
                        padding: '100px',
                        background: 'white',
                        borderRadius: '24px',
                        textAlign: 'center',
                        border: '2px dashed var(--slate-200)'
                    }}>
                        <div style={{ width: '64px', height: '64px', background: 'var(--slate-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <HelpCircle size={32} color="var(--slate-300)" />
                        </div>
                        <h3 style={{ margin: '0 0 8px', fontWeight: 800 }}>No rules deployed</h3>
                        <p style={{ color: 'var(--slate-400)', margin: 0 }}>Create your first business rule to automate logistics logic.</p>
                    </div>
                ) : filteredRules.map(rule => (
                    <div key={rule.id} className="glass card" style={{
                        padding: '24px',
                        position: 'relative',
                        transition: 'transform 0.3s ease, border-color 0.3s ease',
                        cursor: 'default'
                    }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                            <div style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                fontSize: '10px',
                                fontWeight: 800,
                                background: rule.type === RuleTypes.PRICING ? '#eff6ff' : '#fff7ed',
                                color: rule.type === RuleTypes.PRICING ? '#2563eb' : '#ea580c',
                                textTransform: 'uppercase'
                            }}>
                                {rule.type}
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button
                                    onClick={() => handleEdit(rule)}
                                    style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'var(--slate-50)', color: 'var(--slate-600)', cursor: 'pointer' }}
                                >
                                    <Edit3 size={16} />
                                </button>
                                <button
                                    onClick={() => rule.id && handleDelete(rule.id)}
                                    style={{ padding: '6px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#ef4444', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 800, color: 'var(--slate-900)' }}>{rule.name}</h3>
                        <p style={{ margin: '0 0 20px', fontSize: '13px', color: 'var(--slate-500)', lineHeight: '1.5', height: '40px', overflow: 'hidden' }}>
                            {rule.description}
                        </p>

                        <div style={{
                            background: 'var(--slate-50)',
                            borderRadius: '12px',
                            padding: '12px 16px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            marginBottom: '20px'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', width: '60px' }}>PRIORITY</div>
                                <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--slate-700)' }}>Level {rule.priority}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--slate-400)', width: '60px' }}>LOGIC</div>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-700)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    {rule.conditions.length} Conditions <ArrowRight size={12} /> {rule.actions.length} Actions
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {rule.status === RuleStatuses.ACTIVE ?
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#10b981', fontSize: '12px', fontWeight: 700 }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                                        Active
                                    </div> :
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--slate-400)', fontSize: '12px', fontWeight: 700 }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--slate-300)' }}></div>
                                        Inactive
                                    </div>
                                }
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--slate-400)', fontWeight: 500 }}>
                                Updated {new Date(rule.created_at || Date.now()).toLocaleDateString()}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Rule Editor Modal */}
            <Modal
                isOpen={isEditorOpen}
                onClose={() => setIsEditorOpen(false)}
                title={editingRule ? "Edit Business Rule" : "Create New Rule"}
            >
                <RuleEditor
                    rule={editingRule}
                    onSave={() => {
                        setIsEditorOpen(false);
                        fetchRules();
                    }}
                    onCancel={() => setIsEditorOpen(false)}
                />
            </Modal>

            <style>{`
                .glass {
                    background: rgba(255, 255, 255, 0.7);
                    backdrop-filter: blur(12px);
                    -webkit-backdrop-filter: blur(12px);
                    border: 1px solid rgba(255, 255, 255, 0.3);
                }
                .card {
                    border-radius: 20px;
                    box-shadow: 0 10px 30px rgba(0,0,0,0.02);
                }
                .card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 20px 40px rgba(0,0,0,0.04);
                    border-color: #2563eb30;
                }
                .btn-primary {
                    background: var(--primary-grad);
                    color: white;
                    border: none;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    box-shadow: 0 8px 20px rgba(37, 99, 235, 0.2);
                }
                .btn-primary:hover {
                    transform: scale(1.02);
                    box-shadow: 0 12px 24px rgba(37, 99, 235, 0.3);
                }
                .spinner {
                    width: 40px;
                    height: 40px;
                    border: 3px solid rgba(37, 99, 235, 0.1);
                    border-top-color: var(--primary-start);
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin: 0 auto;
                }
                @keyframes spin { to { transform: rotate(360deg); } }
                @keyframes fadeInDown {
                    from { opacity: 0; transform: translateY(-20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                @keyframes fadeInUp {
                    from { opacity: 0; transform: translateY(20px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default RuleManagement;
