// 2026-03-13: 报价管理前端权限 — P-PRICING-VIEW 可访问页；P-PRICING-MANAGE 控制添加/编辑/删除/归档按钮
// 2026-03-13: CR-2/CR-3 根据 URL customerId 预选客户并切到费率矩阵（PRD_Pricing_Management_Full.md）
import { useState, useEffect } from 'react';
import { Navigate, useSearchParams } from 'react-router-dom';
import { DollarSign, Plus, Calculator, MapPin, Truck, Settings, Package, Edit2, Archive } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type Tab = 'RATES' | 'ADDONS' | 'DRIVER_COSTS' | 'ALLINS' | 'QUOTE' | 'FC';

export const PricingManagement = () => {
  const { token, hasPermission } = useAuth();
  const [searchParams] = useSearchParams();
  const canViewPricing = hasPermission('P-PRICING-VIEW');
  const canManagePricing = hasPermission('P-PRICING-MANAGE');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState<Tab>('RATES');
  const [customers, setCustomers] = useState<any[]>([]);
  const [fcs, setFcs] = useState<any[]>([]);

  const customerIdFromUrl = searchParams.get('customerId') || undefined;
  useEffect(() => {
    if (customerIdFromUrl) setTab('RATES');
  }, [customerIdFromUrl]);

  if (!canViewPricing) {
    return <Navigate to="/" replace />;
  }

  useEffect(() => {
    fetch(`${API}/api/customers?limit=200`, { headers }).then(r => r.json()).then(d => setCustomers(d.data || [])).catch(() => {});
    fetch(`${API}/api/pricing/fc-destinations`, { headers }).then(r => r.json()).then(d => setFcs(d || [])).catch(() => {});
  }, [token]);

  const tabs: { key: Tab; label: string; icon: any }[] = [
    { key: 'RATES', label: '费率矩阵', icon: DollarSign },
    { key: 'ADDONS', label: '增值服务', icon: Settings },
    { key: 'DRIVER_COSTS', label: '司机工资', icon: Truck },
    { key: 'ALLINS', label: '全包价', icon: Package },
    { key: 'QUOTE', label: '快速报价', icon: Calculator },
    { key: 'FC', label: 'FC目的地', icon: MapPin },
  ];

  return (
    <div>
      <h2 style={{ margin: '0 0 20px', fontSize: '20px', fontWeight: 800 }}>💰 报价管理</h2>
      {/* Tab Bar */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--glass-bg)', padding: '4px', borderRadius: '12px', width: 'fit-content' }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '8px 16px', border: 'none', borderRadius: '10px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              background: tab === t.key ? 'var(--primary-grad)' : 'transparent',
              color: tab === t.key ? 'white' : 'var(--slate-500)',
              fontWeight: 700, fontSize: '13px', transition: 'all 0.2s'
            }}>
            <t.icon size={14} /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'RATES' && <RatesTab headers={headers} customers={customers} fcs={fcs} canManage={canManagePricing} initialCustomerId={customerIdFromUrl} />}
      {tab === 'ADDONS' && <AddonsTab headers={headers} customers={customers} canManagePricing={canManagePricing} />}
      {tab === 'DRIVER_COSTS' && <DriverCostsTab headers={headers} fcs={fcs} canManagePricing={canManagePricing} />}
      {tab === 'ALLINS' && <AllinsTab headers={headers} customers={customers} canManagePricing={canManagePricing} />}
      {tab === 'QUOTE' && <QuoteTab headers={headers} customers={customers} fcs={fcs} />}
      {tab === 'FC' && <FcTab headers={headers} fcs={fcs} canManagePricing={canManagePricing} onRefresh={() => {
        fetch(`${API}/api/pricing/fc-destinations`, { headers }).then(r => r.json()).then(d => setFcs(d || [])).catch(() => {});
      }} />}
    </div>
  );
};

// ===== Rates Tab =====
// 2026-03-13: 费率矩阵行级编辑 / 归档 / 显示已归档；仅 canManage 时展示操作按钮
// 2026-03-13: initialCustomerId 来自 URL ?customerId=，从客户管理页跳转后自动选中该客户并加载费率
const RatesTab = ({ headers, customers, fcs, canManage, initialCustomerId }: { headers: any; customers: any[]; fcs: any[]; canManage: boolean; initialCustomerId?: string }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [matrices, setMatrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerSummary, setCustomerSummary] = useState<any[]>([]);
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/api/pricing/matrices`, { headers }).then(r => r.json()).then(d => setCustomerSummary(d || [])).catch(() => {});
  }, []);

  const loadRates = async (custId: string, includeArchived: boolean = showArchived) => {
    setSelectedCustomer(custId);
    if (!custId) { setMatrices([]); return; }
    setLoading(true);
    try {
      const url = `${API_URL}/api/pricing/matrices/${custId}?includeArchived=${includeArchived ? 'true' : 'false'}`;
      const res = await fetch(url, { headers });
      setMatrices(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  useEffect(() => {
    if (!initialCustomerId || customers.length === 0) return;
    const found = customers.some((c: any) => c.id === initialCustomerId);
    if (!found) return;
    setSelectedCustomer(initialCustomerId);
    loadRates(initialCustomerId);
  }, [initialCustomerId, customers]);

  const [editForm, setEditForm] = useState({
    destination_code: '',
    vehicle_type: 'STRAIGHT_26',
    pallet_tier: '1-4',
    base_price: 0,
    per_pallet_price: 0,
    effective_date: '',
  });
  const [showEditor, setShowEditor] = useState(false);

  const openForCreate = () => {
    setEditingId(null);
    setEditForm({
      destination_code: '',
      vehicle_type: 'STRAIGHT_26',
      pallet_tier: '1-4',
      base_price: 0,
      per_pallet_price: 0,
      effective_date: '',
    });
    setShowEditor(true);
  };

  const openForEdit = (m: any) => {
    setEditingId(m.id);
    setEditForm({
      destination_code: m.destination_code,
      vehicle_type: m.vehicle_type,
      pallet_tier: m.pallet_tier,
      base_price: m.base_price,
      per_pallet_price: m.per_pallet_price || 0,
      effective_date: m.effective_date ? String(m.effective_date).slice(0, 10) : '',
    });
    setShowEditor(true);
  };

  const handleSaveRate = async () => {
    try {
      await fetch(`${API_URL}/api/pricing/matrices`, {
        method: 'POST', headers,
        // 2026-03-13: 行级编辑与新增共用 upsertMatrix 接口 — 按 customer_id + destination_code + vehicle_type + pallet_tier 唯一键
        body: JSON.stringify({ customer_id: selectedCustomer, ...editForm })
      });
      await loadRates(selectedCustomer);
      setShowEditor(false);
      setEditingId(null);
    } catch (e) { console.error(e); }
  };

  const handleArchiveRate = async (id: string) => {
    if (!canManage) return;
    // 2026-03-13: 费率归档二次确认
    if (!window.confirm('确定归档该费率？')) return;
    try {
      await fetch(`${API_URL}/api/pricing/matrices/${id}`, {
        method: 'DELETE',
        headers,
      });
      if (selectedCustomer) {
        await loadRates(selectedCustomer);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Group matrices by destination for display
  const grouped = matrices.reduce((acc, m) => {
    if (!acc[m.destination_code]) acc[m.destination_code] = [];
    acc[m.destination_code].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div>
      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', alignItems: 'center' }}>
        <select value={selectedCustomer} onChange={e => loadRates(e.target.value)}
          className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px', minWidth: '220px' }}>
          <option value="">选择客户查看费率...</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
        </select>
        {selectedCustomer && canManage && (
          <button onClick={openForCreate} style={{
            padding: '8px 16px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
          }}><Plus size={14} /> 添加费率</button>
        )}
        {selectedCustomer && (
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--slate-500)' }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={e => {
                const checked = e.target.checked;
                setShowArchived(checked);
                if (selectedCustomer) {
                  void loadRates(selectedCustomer, checked);
                }
              }}
            />
            显示已归档
          </label>
        )}
      </div>

      {!selectedCustomer ? (
        <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
          <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>客户费率概览</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
            {customerSummary.map((cs: any) => (
              <div key={cs.customer_id} onClick={() => loadRates(cs.customer_id)}
                className="glass table-row-hover" style={{ padding: '16px', borderRadius: '12px', cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px' }}>{cs.customer_name}</div>
                <div style={{ fontSize: '12px', color: 'var(--slate-500)' }}>
                  {cs.rate_count} 条费率 | ${cs.min_price} ~ ${cs.max_price}
                </div>
              </div>
            ))}
            {customerSummary.length === 0 && (
              <div style={{ color: 'var(--slate-400)', fontSize: '13px' }}>暂无费率数据，请选择客户添加</div>
            )}
          </div>
        </div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>加载中...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(grouped).map(([dest, rates]: [string, any]) => (
            <div key={dest} className="glass" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontWeight: 700, fontSize: '14px', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={14} color="var(--primary-start)" /> {dest}
                {rates[0]?.dest_name && <span style={{ fontSize: '12px', color: 'var(--slate-400)' }}>({rates[0].dest_name})</span>}
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--slate-500)', fontWeight: 600, fontSize: '11px' }}>车型</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: 'var(--slate-500)', fontWeight: 600, fontSize: '11px' }}>板数档</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: 'var(--slate-500)', fontWeight: 600, fontSize: '11px' }}>基础价</th>
                    <th style={{ textAlign: 'right', padding: '8px', color: 'var(--slate-500)', fontWeight: 600, fontSize: '11px' }}>每板加价</th>
                    {canManage && (
                      <th style={{ textAlign: 'right', padding: '8px', color: 'var(--slate-500)', fontWeight: 600, fontSize: '11px' }}>操作</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {(rates as any[]).map((r: any) => (
                    <tr
                      key={r.id}
                      className="table-row-hover"
                      style={{
                        borderBottom: '1px solid var(--glass-border)',
                        opacity: r.status === 'ARCHIVED' ? 0.6 : 1,
                      }}
                    >
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          background: r.vehicle_type === 'STRAIGHT_26' ? '#3B82F615' : '#8B5CF615',
                          color: r.vehicle_type === 'STRAIGHT_26' ? '#3B82F6' : '#8B5CF6'
                        }}>{r.vehicle_type === 'STRAIGHT_26' ? '26ft' : r.vehicle_type === 'TRAILER_53' ? '53ft' : r.vehicle_type}</span>
                      </td>
                      <td style={{ padding: '8px' }}>{r.pallet_tier}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>${r.base_price}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: 'var(--slate-500)' }}>{r.per_pallet_price ? `$${r.per_pallet_price}` : '-'}</td>
                      {canManage && (
                        <td style={{ padding: '8px', textAlign: 'right', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                          {r.status !== 'ARCHIVED' && (
                            <>
                              <button
                                onClick={() => openForEdit(r)}
                                className="glass"
                                style={{
                                  padding: '4px 8px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                }}
                              >
                                编辑
                              </button>
                              <button
                                onClick={() => handleArchiveRate(r.id)}
                                className="glass"
                                style={{
                                  padding: '4px 8px',
                                  border: 'none',
                                  borderRadius: '8px',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  color: '#EF4444',
                                }}
                              >
                                归档
                              </button>
                            </>
                          )}
                          {r.status === 'ARCHIVED' && (
                            <span style={{ fontSize: '11px', color: 'var(--slate-400)' }}>已归档</span>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {matrices.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>该客户暂无费率数据</div>}
        </div>
      )}

      {/* Add / Edit Rate Modal — 仅 P-PRICING-MANAGE 时可通过按钮打开 */}
      {canManage && showEditor && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '420px', padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>{editingId ? '编辑费率' : '添加费率'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select
                value={editForm.destination_code}
                onChange={e => setEditForm({ ...editForm, destination_code: e.target.value })}
                className="glass"
                style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}
                disabled={!!editingId}
              >
                <option value="">选择目的仓</option>
                {fcs.map(fc => <option key={fc.code} value={fc.code}>{fc.code} - {fc.name}</option>)}
              </select>
              <select
                value={editForm.vehicle_type}
                onChange={e => setEditForm({ ...editForm, vehicle_type: e.target.value })}
                className="glass"
                style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}
                disabled={!!editingId}
              >
                <option value="STRAIGHT_26">26ft 直卡</option>
                <option value="STRAIGHT_28">28ft 直卡</option>
                <option value="TRAILER_53">53ft 拖车</option>
              </select>
              <select
                value={editForm.pallet_tier}
                onChange={e => setEditForm({ ...editForm, pallet_tier: e.target.value })}
                className="glass"
                style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}
                disabled={!!editingId}
              >
                <option value="1-4">1-4 板</option>
                <option value="5-13">5-13 板</option>
                <option value="14-28">14-28 板</option>
                <option value="LOOSE">散板</option>
              </select>
              <input type="number" step="0.01" value={editForm.base_price || ''} onChange={e => setEditForm({ ...editForm, base_price: parseFloat(e.target.value) || 0 })}
                placeholder="基础价格 ($)" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <input
                type="number"
                step="0.01"
                value={editForm.per_pallet_price || ''}
                onChange={e => setEditForm({ ...editForm, per_pallet_price: parseFloat(e.target.value) || 0 })}
                placeholder="每板加价 ($)"
                className="glass"
                style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}
              />
              <input
                type="date"
                value={editForm.effective_date || ''}
                onChange={e => setEditForm({ ...editForm, effective_date: e.target.value })}
                className="glass"
                style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingId(null);
                }}
                className="glass"
                style={{ padding: '8px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveRate}
                style={{
                  padding: '8px 20px',
                  background: 'var(--primary-grad)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '13px',
                }}
              >
                {editingId ? '保存修改' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Addons Tab =====
// 2026-03-13: 增值服务主数据 + 客户增值价 CRUD（含权限控制）
const AddonsTab = ({ headers, customers, canManagePricing }: { headers: any; customers: any[]; canManagePricing: boolean }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [addons, setAddons] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingAddon, setEditingAddon] = useState<any | null>(null);
  const [addonForm, setAddonForm] = useState({ code: '', name: '', name_en: '', unit: '', default_price: 0, description: '', status: 'ACTIVE' });
  const [showAddonModal, setShowAddonModal] = useState(false);
  const [addonError, setAddonError] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [addonRates, setAddonRates] = useState<any[]>([]);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [rateForm, setRateForm] = useState<{ service_id: string; custom_price: number }>({ service_id: '', custom_price: 0 });
  const [showRateModal, setShowRateModal] = useState(false);
  const [rateError, setRateError] = useState('');

  const loadAddons = () => {
    setLoading(true);
    fetch(`${API_URL}/api/pricing/addons`, { headers })
      .then(r => r.json())
      .then(d => setAddons(d || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadAddons();
  }, []);

  const loadAddonRates = (customerId: string) => {
    if (!customerId) {
      setAddonRates([]);
      return;
    }
    setRatesLoading(true);
    fetch(`${API_URL}/api/pricing/addon-rates/${customerId}`, { headers })
      .then(r => r.json())
      .then(d => setAddonRates(d || []))
      .catch(() => { })
      .finally(() => setRatesLoading(false));
  };

  const openNewAddon = () => {
    setEditingAddon(null);
    setAddonForm({ code: '', name: '', name_en: '', unit: '', default_price: 0, description: '', status: 'ACTIVE' });
    setAddonError('');
    setShowAddonModal(true);
  };

  const openEditAddon = (addon: any) => {
    setEditingAddon(addon);
    setAddonForm({
      code: addon.code || '',
      name: addon.name || '',
      name_en: addon.name_en || '',
      unit: addon.unit || '',
      default_price: addon.default_price || 0,
      description: addon.description || '',
      status: addon.status || 'ACTIVE',
    });
    setAddonError('');
    setShowAddonModal(true);
  };

  const handleSaveAddon = async () => {
    if (!addonForm.code || !addonForm.name || !addonForm.unit) {
      setAddonError('代码、名称、计费单位为必填项');
      return;
    }
    try {
      await fetch(`${API_URL}/api/pricing/addons`, {
        method: 'POST',
        headers,
        body: JSON.stringify(editingAddon ? { id: editingAddon.id, ...addonForm } : addonForm),
      });
      setShowAddonModal(false);
      loadAddons();
    } catch (e) {
      console.error(e);
      setAddonError('保存失败，请稍后重试');
    }
  };

  const handleDisableAddon = async (addon: any) => {
    if (!canManagePricing) return;
    if (!window.confirm(`确定要停用增值服务「${addon.name}」吗？`)) return;
    try {
      await fetch(`${API_URL}/api/pricing/addons`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: addon.id,
          code: addon.code,
          name: addon.name,
          name_en: addon.name_en,
          unit: addon.unit,
          default_price: addon.default_price,
          description: addon.description,
          status: 'INACTIVE',
        }),
      });
      loadAddons();
    } catch (e) {
      console.error(e);
    }
  };

  const openRateEditor = (serviceId: string) => {
    if (!selectedCustomer) {
      setRateError('请先选择客户');
      return;
    }
    const existing = addonRates.find((r: any) => r.service_id === serviceId);
    setRateForm({ service_id: serviceId, custom_price: existing?.custom_price || 0 });
    setRateError('');
    setShowRateModal(true);
  };

  const handleSaveRate = async () => {
    if (!selectedCustomer || !rateForm.service_id) {
      setRateError('客户与服务为必填');
      return;
    }
    try {
      await fetch(`${API_URL}/api/pricing/addon-rates`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ customer_id: selectedCustomer, ...rateForm }),
      });
      setShowRateModal(false);
      loadAddonRates(selectedCustomer);
    } catch (e) {
      console.error(e);
      setRateError('保存失败，请稍后重试');
    }
  };

  const rateMap = addonRates.reduce((acc, r) => {
    acc[r.service_id] = r;
    return acc;
  }, {} as Record<string, any>);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h4 style={{ margin: 0, fontWeight: 700 }}>增值服务目录</h4>
          {canManagePricing && (
            <button
              onClick={openNewAddon}
              style={{
                padding: '8px 16px',
                background: 'var(--primary-grad)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} /> 新增增值服务
            </button>
          )}
        </div>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>加载中...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>代码</th>
                <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>名称</th>
                <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>English</th>
                <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>计费单位</th>
                <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>默认价格</th>
                <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>说明</th>
                {canManagePricing && <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>操作</th>}
              </tr>
            </thead>
            <tbody>
              {addons.map(a => (
                <tr key={a.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', opacity: a.status === 'INACTIVE' ? 0.5 : 1 }}>
                  <td style={{ padding: '10px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: 'var(--primary-start)' }}>{a.code}</span>
                  </td>
                  <td style={{ padding: '10px', fontWeight: 600 }}>{a.name}</td>
                  <td style={{ padding: '10px', color: 'var(--slate-500)' }}>{a.name_en}</td>
                  <td style={{ padding: '10px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#F59E0B15', color: '#F59E0B' }}>{a.unit}</span>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>${a.default_price}</td>
                  <td style={{ padding: '10px', color: 'var(--slate-500)', fontSize: '12px' }}>{a.description}</td>
                  {canManagePricing && (
                    <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        onClick={() => openEditAddon(a)}
                        className="glass"
                        style={{ padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Edit2 size={12} /> 编辑
                      </button>
                      {a.status !== 'INACTIVE' && (
                        <button
                          onClick={() => handleDisableAddon(a)}
                          className="glass"
                          style={{ padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#F97316', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Archive size={12} /> 停用
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="glass" style={{ padding: '20px 24px', borderRadius: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
          <h4 style={{ margin: 0, fontWeight: 700 }}>客户增值价</h4>
          <select
            value={selectedCustomer}
            onChange={e => {
              const v = e.target.value;
              setSelectedCustomer(v);
              loadAddonRates(v);
            }}
            className="glass"
            style={{ padding: '8px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', minWidth: '220px' }}
          >
            <option value="">选择客户...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
        </div>
        {!selectedCustomer ? (
          <div style={{ color: 'var(--slate-400)', fontSize: '13px', paddingTop: '8px' }}>请选择客户后配置增值服务定制价</div>
        ) : ratesLoading ? (
          <div style={{ textAlign: 'center', padding: '24px', color: 'var(--slate-400)' }}>加载中...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <th style={{ textAlign: 'left', padding: '8px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>服务</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>默认价格</th>
                <th style={{ textAlign: 'right', padding: '8px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>客户定制价</th>
                {canManagePricing && <th style={{ textAlign: 'right', padding: '8px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>操作</th>}
              </tr>
            </thead>
            <tbody>
              {addons.map(a => {
                const rate = rateMap[a.id];
                return (
                  <tr key={a.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '8px' }}>{a.name}</td>
                    <td style={{ padding: '8px', textAlign: 'right' }}>${a.default_price}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>{rate ? `$${rate.custom_price}` : '-'}</td>
                    {canManagePricing && (
                      <td style={{ padding: '8px', textAlign: 'right' }}>
                        <button
                          onClick={() => openRateEditor(a.id)}
                          className="glass"
                          style={{ padding: '4px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                        >
                          <Edit2 size={12} /> 设置
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 增值服务主数据弹窗 2026-03-13 */}
      {showAddonModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '460px', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>{editingAddon ? '编辑增值服务' : '新增增值服务'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={addonForm.code}
                onChange={e => setAddonForm({ ...addonForm, code: e.target.value })}
                placeholder="服务代码 *"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
                disabled={!!editingAddon}
              />
              <input
                value={addonForm.name}
                onChange={e => setAddonForm({ ...addonForm, name: e.target.value })}
                placeholder="中文名称 *"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={addonForm.name_en}
                onChange={e => setAddonForm({ ...addonForm, name_en: e.target.value })}
                placeholder="English 名称"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={addonForm.unit}
                onChange={e => setAddonForm({ ...addonForm, unit: e.target.value })}
                placeholder="计费单位（如 PER_STOP / PER_PALLET） *"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                type="number"
                step="0.01"
                value={addonForm.default_price}
                onChange={e => setAddonForm({ ...addonForm, default_price: parseFloat(e.target.value) || 0 })}
                placeholder="默认价格 ($)"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <textarea
                value={addonForm.description}
                onChange={e => setAddonForm({ ...addonForm, description: e.target.value })}
                placeholder="说明"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px', minHeight: '60px' }}
              />
            </div>
            {addonError && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
                {addonError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={() => setShowAddonModal(false)}
                className="glass"
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveAddon}
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: 'var(--primary-grad)', color: 'white' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 客户增值价弹窗 2026-03-13 */}
      {showRateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '360px', padding: '24px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: '16px', fontWeight: 800 }}>设置客户增值价</h3>
            <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '10px' }}>
              客户：{customers.find(c => c.id === selectedCustomer)?.company || customers.find(c => c.id === selectedCustomer)?.name}
            </div>
            <input
              type="number"
              step="0.01"
              value={rateForm.custom_price}
              onChange={e => setRateForm({ ...rateForm, custom_price: parseFloat(e.target.value) || 0 })}
              placeholder="客户定制价格 ($)"
              className="glass"
              style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
            />
            {rateError && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
                {rateError}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setShowRateModal(false)}
                className="glass"
                style={{ padding: '6px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleSaveRate}
                style={{ padding: '6px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: 'var(--primary-grad)', color: 'white' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Driver Costs Tab =====
// 2026-03-13: 司机成本基线 CRUD（列表 + 表单 + 归档）
const DriverCostsTab = ({ headers, fcs, canManagePricing }: { headers: any; fcs: any[]; canManagePricing: boolean }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [costs, setCosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingCost, setEditingCost] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    destination_code: '',
    vehicle_type: 'STRAIGHT_26',
    driver_pay: 0,
    fuel_cost: 0,
    waiting_free_hours: 1,
    waiting_rate_hourly: 25,
    notes: '',
    status: 'ACTIVE',
  });
  const [error, setError] = useState('');

  const loadCosts = () => {
    setLoading(true);
    fetch(`${API_URL}/api/pricing/driver-costs`, { headers })
      .then(r => r.json())
      .then(d => setCosts(d || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCosts();
  }, []);

  const openNew = () => {
    setEditingCost(null);
    setForm({
      destination_code: '',
      vehicle_type: 'STRAIGHT_26',
      driver_pay: 0,
      fuel_cost: 0,
      waiting_free_hours: 1,
      waiting_rate_hourly: 25,
      notes: '',
      status: 'ACTIVE',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: any) => {
    setEditingCost(c);
    setForm({
      destination_code: c.destination_code || '',
      vehicle_type: c.vehicle_type || 'STRAIGHT_26',
      driver_pay: c.driver_pay || 0,
      fuel_cost: c.fuel_cost || 0,
      waiting_free_hours: c.waiting_free_hours || 1,
      waiting_rate_hourly: c.waiting_rate_hourly || 25,
      notes: c.notes || '',
      status: c.status || 'ACTIVE',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.destination_code || !form.vehicle_type) {
      setError('目的仓与车型为必填');
      return;
    }
    try {
      await fetch(`${API_URL}/api/pricing/driver-costs`, {
        method: 'POST',
        headers,
        body: JSON.stringify(editingCost ? { id: editingCost.id, ...form } : form),
      });
      setShowModal(false);
      loadCosts();
    } catch (e) {
      console.error(e);
      setError('保存失败，请稍后重试');
    }
  };

  const handleArchive = async (c: any) => {
    if (!canManagePricing) return;
    if (!window.confirm(`确定要归档该司机工资记录（${c.destination_code} - ${c.vehicle_type}）吗？`)) return;
    try {
      await fetch(`${API_URL}/api/pricing/driver-costs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: c.id,
          destination_code: c.destination_code,
          vehicle_type: c.vehicle_type,
          driver_pay: c.driver_pay,
          fuel_cost: c.fuel_cost,
          waiting_free_hours: c.waiting_free_hours,
          waiting_rate_hourly: c.waiting_rate_hourly,
          notes: c.notes,
          status: 'ARCHIVED',
        }),
      });
      loadCosts();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>司机工资标准</h4>
        {canManagePricing && (
          <button
            onClick={openNew}
            style={{
              padding: '8px 16px',
              background: 'var(--primary-grad)',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '13px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Plus size={14} /> 新增司机工资
          </button>
        )}
      </div>
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>加载中...</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>目的仓</th>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>车型</th>
              <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>司机工资</th>
              <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>油费</th>
              <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>免费等待(h)</th>
              <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>超时 $/h</th>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>备注</th>
              {canManagePricing && <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {costs.map(c => (
              <tr key={c.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', opacity: c.status === 'ARCHIVED' ? 0.4 : 1 }}>
                <td style={{ padding: '10px', fontWeight: 700 }}>{c.destination_code}</td>
                <td style={{ padding: '10px', color: 'var(--slate-500)' }}>{c.vehicle_type}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>${c.driver_pay}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>${c.fuel_cost}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{c.waiting_free_hours}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>${c.waiting_rate_hourly}</td>
                <td style={{ padding: '10px', color: 'var(--slate-500)', fontSize: '12px' }}>{c.notes}</td>
                {canManagePricing && (
                  <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openEdit(c)}
                      className="glass"
                      style={{ padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={12} /> 编辑
                    </button>
                    {c.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleArchive(c)}
                        className="glass"
                        style={{ padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#F97316', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Archive size={12} /> 归档
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 司机工资弹窗 2026-03-13 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '460px', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>{editingCost ? '编辑司机工资' : '新增司机工资'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <select
                value={form.destination_code}
                onChange={e => setForm({ ...form, destination_code: e.target.value })}
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              >
                <option value="">选择目的仓 *</option>
                {fcs.map(fc => (
                  <option key={fc.code} value={fc.code}>
                    {fc.code} - {fc.name}
                  </option>
                ))}
              </select>
              <select
                value={form.vehicle_type}
                onChange={e => setForm({ ...form, vehicle_type: e.target.value })}
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              >
                <option value="STRAIGHT_26">26ft 直卡</option>
                <option value="STRAIGHT_28">28ft 直卡</option>
                <option value="TRAILER_53">53ft 拖车</option>
              </select>
              <input
                type="number"
                step="0.01"
                value={form.driver_pay}
                onChange={e => setForm({ ...form, driver_pay: parseFloat(e.target.value) || 0 })}
                placeholder="司机工资 ($)"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                type="number"
                step="0.01"
                value={form.fuel_cost}
                onChange={e => setForm({ ...form, fuel_cost: parseFloat(e.target.value) || 0 })}
                placeholder="油费 ($)"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                type="number"
                step="0.1"
                value={form.waiting_free_hours}
                onChange={e => setForm({ ...form, waiting_free_hours: parseFloat(e.target.value) || 0 })}
                placeholder="免费等待小时数"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                type="number"
                step="0.01"
                value={form.waiting_rate_hourly}
                onChange={e => setForm({ ...form, waiting_rate_hourly: parseFloat(e.target.value) || 0 })}
                placeholder="超时费用 $/小时"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="备注"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px', minHeight: '60px' }}
              />
            </div>
            {error && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={() => setShowModal(false)}
                className="glass"
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: 'var(--primary-grad)', color: 'white' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Allins Tab =====
// 2026-03-13: 全包价 Tab — 客户维度列表 + 新增/编辑/归档
const AllinsTab = ({ headers, customers, canManagePricing }: { headers: any; customers: any[]; canManagePricing: boolean }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [allins, setAllins] = useState<any[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    dest_group: '',
    container_type: '',
    price: 0,
    includes: '',
    notes: '',
    effective_date: '',
    status: 'ACTIVE',
  });
  const [error, setError] = useState('');

  const loadAllins = (customerId: string) => {
    if (!customerId) {
      setAllins([]);
      return;
    }
    setLoading(true);
    const url = `${API_URL}/api/pricing/container-allins?customerId=${customerId}`;
    fetch(url, { headers })
      .then(r => r.json())
      .then(d => setAllins(d || []))
      .catch(() => { })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // 等待用户选择客户再加载
  }, []);

  const openNew = () => {
    if (!selectedCustomer) {
      setError('请先选择客户');
      return;
    }
    setEditing(null);
    setForm({
      dest_group: '',
      container_type: '',
      price: 0,
      includes: '',
      notes: '',
      effective_date: '',
      status: 'ACTIVE',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setForm({
      dest_group: item.dest_group || '',
      container_type: item.container_type || '',
      price: item.price || 0,
      includes: item.includes || '',
      notes: item.notes || '',
      effective_date: item.effective_date ? String(item.effective_date).slice(0, 10) : '',
      status: item.status || 'ACTIVE',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!selectedCustomer || !form.dest_group || !form.container_type || !form.price) {
      setError('客户、目的地分组、柜型、价格为必填');
      return;
    }
    try {
      await fetch(`${API_URL}/api/pricing/container-allins`, {
        method: 'POST',
        headers,
        body: JSON.stringify(editing ? { id: editing.id, customer_id: selectedCustomer, ...form } : { customer_id: selectedCustomer, ...form }),
      });
      setShowModal(false);
      loadAllins(selectedCustomer);
    } catch (e) {
      console.error(e);
      setError('保存失败，请稍后重试');
    }
  };

  const handleArchive = async (item: any) => {
    if (!canManagePricing) return;
    if (!window.confirm(`确定要归档全包价（${item.dest_group} - ${item.container_type}）吗？`)) return;
    try {
      await fetch(`${API_URL}/api/pricing/container-allins`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: item.id,
          customer_id: item.customer_id || selectedCustomer,
          dest_group: item.dest_group,
          container_type: item.container_type,
          price: item.price,
          includes: item.includes,
          notes: item.notes,
          effective_date: item.effective_date,
          status: 'ARCHIVED',
        }),
      });
      loadAllins(selectedCustomer);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>整柜全包价</h4>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <select
            value={selectedCustomer}
            onChange={e => {
              const v = e.target.value;
              setSelectedCustomer(v);
              loadAllins(v);
            }}
            className="glass"
            style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px', minWidth: '220px' }}
          >
            <option value="">选择客户...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.company || c.name}
              </option>
            ))}
          </select>
          {canManagePricing && selectedCustomer && (
            <button
              onClick={openNew}
              style={{
                padding: '8px 16px',
                background: 'var(--primary-grad)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} /> 新增全包价
            </button>
          )}
        </div>
      </div>
      {!selectedCustomer ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>请选择客户后查看全包价</div>
      ) : loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>加载中...</div>
      ) : allins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>该客户暂无全包价</div>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>目的地分组</th>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>柜型</th>
              <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>全包价 ($)</th>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>包含内容</th>
              <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>备注</th>
              {canManagePricing && <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {allins.map(a => (
              <tr key={a.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)', opacity: a.status === 'ARCHIVED' ? 0.4 : 1 }}>
                <td style={{ padding: '10px', fontWeight: 700 }}>{a.dest_group}</td>
                <td style={{ padding: '10px' }}>{a.container_type}</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: 'var(--primary-start)' }}>${a.price}</td>
                <td style={{ padding: '10px', fontSize: '12px', color: 'var(--slate-500)' }}>{a.includes}</td>
                <td style={{ padding: '10px', fontSize: '12px', color: 'var(--slate-500)' }}>{a.notes}</td>
                {canManagePricing && (
                  <td style={{ padding: '10px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                    <button
                      onClick={() => openEdit(a)}
                      className="glass"
                      style={{ padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Edit2 size={12} /> 编辑
                    </button>
                    {a.status !== 'ARCHIVED' && (
                      <button
                        onClick={() => handleArchive(a)}
                        className="glass"
                        style={{ padding: '4px 8px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', color: '#F97316', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <Archive size={12} /> 归档
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* 全包价弹窗 2026-03-13 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '460px', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>{editing ? '编辑全包价' : '新增全包价'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={form.dest_group}
                onChange={e => setForm({ ...form, dest_group: e.target.value })}
                placeholder="目的地分组 *（如 TORONTO GROUP）"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={form.container_type}
                onChange={e => setForm({ ...form, container_type: e.target.value })}
                placeholder="柜型 *（如 40HQ, 20GP）"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                type="number"
                step="0.01"
                value={form.price}
                onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })}
                placeholder="全包价 ($) *"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={form.includes}
                onChange={e => setForm({ ...form, includes: e.target.value })}
                placeholder="包含内容（如提柜、拖车、还柜等）"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="备注"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                type="date"
                value={form.effective_date}
                onChange={e => setForm({ ...form, effective_date: e.target.value })}
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
            </div>
            {error && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={() => setShowModal(false)}
                className="glass"
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: 'var(--primary-grad)', color: 'white' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Quote Tab =====
const QuoteTab = ({ headers, customers, fcs }: { headers: any; customers: any[]; fcs: any[] }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [quoteForm, setQuoteForm] = useState({ customer_id: '', destination_code: '', vehicle_type: 'STRAIGHT_26', pallet_count: 4 });
  const [result, setResult] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);

  const handleQuote = async () => {
    if (!quoteForm.customer_id || !quoteForm.destination_code) return;
    setCalculating(true);
    try {
      const res = await fetch(`${API_URL}/api/pricing/quote`, {
        method: 'POST', headers, body: JSON.stringify(quoteForm)
      });
      setResult(await res.json());
    } catch (e) { console.error(e); }
    setCalculating(false);
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
      {/* Left: Input */}
      <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
        <h4 style={{ margin: '0 0 20px', fontWeight: 700 }}>⚡ 快速报价</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <select value={quoteForm.customer_id} onChange={e => setQuoteForm({ ...quoteForm, customer_id: e.target.value })}
            className="glass" style={{ padding: '12px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
            <option value="">选择客户 *</option>
            {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
          </select>
          <select value={quoteForm.destination_code} onChange={e => setQuoteForm({ ...quoteForm, destination_code: e.target.value })}
            className="glass" style={{ padding: '12px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
            <option value="">选择目的仓 *</option>
            {fcs.map(fc => <option key={fc.code} value={fc.code}>{fc.code} - {fc.name} ({fc.region})</option>)}
          </select>
          <select value={quoteForm.vehicle_type} onChange={e => setQuoteForm({ ...quoteForm, vehicle_type: e.target.value })}
            className="glass" style={{ padding: '12px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
            <option value="STRAIGHT_26">26ft 直卡 (≤13板)</option>
            <option value="STRAIGHT_28">28ft 直卡</option>
            <option value="TRAILER_53">53ft 拖车 (≤28板)</option>
          </select>
          <div>
            <label style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>板数: {quoteForm.pallet_count}</label>
            <input type="range" min="1" max="28" value={quoteForm.pallet_count}
              onChange={e => setQuoteForm({ ...quoteForm, pallet_count: parseInt(e.target.value) })}
              style={{ width: '100%', accentColor: 'var(--primary-start)' }} />
          </div>
          <button onClick={handleQuote} disabled={calculating}
            style={{
              padding: '14px', background: 'var(--primary-grad)', color: 'white', border: 'none',
              borderRadius: '12px', cursor: 'pointer', fontWeight: 800, fontSize: '15px',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}>
            <Calculator size={18} /> {calculating ? '计算中...' : '立即报价'}
          </button>
        </div>
      </div>

      {/* Right: Result */}
      <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
        <h4 style={{ margin: '0 0 20px', fontWeight: 700 }}>📊 报价结果</h4>
        {!result ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--slate-400)' }}>
            <Calculator size={48} style={{ marginBottom: '12px', opacity: 0.3 }} />
            <div>选择客户和目的仓后点击报价</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Grand Total */}
            <div style={{ textAlign: 'center', padding: '20px', background: 'var(--primary-grad)', borderRadius: '12px', color: 'white' }}>
              <div style={{ fontSize: '12px', opacity: 0.8 }}>客户报价</div>
              <div style={{ fontSize: '32px', fontWeight: 900 }}>${result.grand_total?.toFixed(2)}</div>
            </div>

            {/* Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                <span style={{ color: 'var(--slate-500)', fontSize: '13px' }}>基础运费</span>
                <span style={{ fontWeight: 700, fontSize: '14px' }}>${result.base_price?.toFixed(2)}</span>
              </div>
              {result.pallet_surcharge > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--slate-500)', fontSize: '13px' }}>板数加价</span>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>+${result.pallet_surcharge?.toFixed(2)}</span>
                </div>
              )}
              {result.addon_total > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--glass-border)' }}>
                  <span style={{ color: 'var(--slate-500)', fontSize: '13px' }}>增值服务</span>
                  <span style={{ fontWeight: 700, fontSize: '14px' }}>+${result.addon_total?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {/* Margin */}
            <div style={{ background: result.gross_margin >= 0 ? '#10B98115' : '#EF444415', padding: '16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--slate-500)', marginBottom: '8px' }}>内部利润分析</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px', textAlign: 'center' }}>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>司机成本</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: '#EF4444' }}>${result.driver_cost?.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>毛利</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: result.gross_margin >= 0 ? '#10B981' : '#EF4444' }}>
                    ${result.gross_margin?.toFixed(2)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>利润率</div>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: result.gross_margin >= 0 ? '#10B981' : '#EF4444' }}>
                    {result.margin_rate}
                  </div>
                </div>
              </div>
            </div>

            {result.grand_total === 0 && (
              <div style={{ padding: '12px', background: '#F59E0B15', borderRadius: '8px', fontSize: '12px', color: '#F59E0B', fontWeight: 600, textAlign: 'center' }}>
                ⚠️ 未找到该客户的费率数据，请先在费率矩阵中添加
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// ===== FC Destinations Tab =====
// 2026-03-13: FC 目的地 CRUD（新增/编辑/停用）
const FcTab = ({ headers, fcs, canManagePricing, onRefresh }: { headers: any; fcs: any[]; canManagePricing: boolean; onRefresh: () => void }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [search, setSearch] = useState('');
  const [editingFc, setEditingFc] = useState<any | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    code: '',
    name: '',
    type: '',
    address: '',
    city: '',
    province: '',
    region: '',
    postal_code: '',
    notes: '',
    status: 'ACTIVE',
  });
  const [error, setError] = useState('');

  const filtered = fcs.filter(fc => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (fc.code && String(fc.code).toLowerCase().includes(s)) || (fc.name && String(fc.name).toLowerCase().includes(s)) || (fc.region && String(fc.region).toLowerCase().includes(s));
  });

  const openNew = () => {
    setEditingFc(null);
    setForm({
      code: '',
      name: '',
      type: '',
      address: '',
      city: '',
      province: '',
      region: '',
      postal_code: '',
      notes: '',
      status: 'ACTIVE',
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (fc: any) => {
    setEditingFc(fc);
    setForm({
      code: fc.code || '',
      name: fc.name || '',
      type: fc.type || '',
      address: fc.address || '',
      city: fc.city || '',
      province: fc.province || '',
      region: fc.region || '',
      postal_code: fc.postal_code || '',
      notes: fc.notes || '',
      status: fc.status || 'ACTIVE',
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code || !form.name) {
      setError('代码与名称为必填');
      return;
    }
    try {
      await fetch(`${API_URL}/api/pricing/fc-destinations`, {
        method: 'POST',
        headers,
        body: JSON.stringify(editingFc ? { id: editingFc.id, ...form } : form),
      });
      setShowModal(false);
      onRefresh();
    } catch (e) {
      console.error(e);
      setError('保存失败，请稍后重试');
    }
  };

  const handleDisable = async (fc: any) => {
    if (!canManagePricing) return;
    if (!window.confirm(`确定要停用 FC 目的地「${fc.code} - ${fc.name}」吗？如已被费率引用，将仅标记停用。`)) return;
    try {
      await fetch(`${API_URL}/api/pricing/fc-destinations`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          id: fc.id,
          code: fc.code,
          name: fc.name,
          type: fc.type,
          address: fc.address,
          city: fc.city,
          province: fc.province,
          region: fc.region,
          postal_code: fc.postal_code,
          notes: fc.notes,
          status: 'INACTIVE',
        }),
      });
      onRefresh();
    } catch (e) {
      console.error(e);
      window.alert('该 FC 可能已被费率引用，后端不支持物理删除，将仅做停用处理或由后端校验。');
    }
  };

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h4 style={{ margin: 0, fontWeight: 700 }}>FC 目的地字典</h4>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="按 code/name/region 搜索"
            className="glass"
            style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px', minWidth: '200px' }}
          />
          {canManagePricing && (
            <button
              onClick={openNew}
              style={{
                padding: '8px 16px',
                background: 'var(--primary-grad)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Plus size={14} /> 新增 FC
            </button>
          )}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
        {filtered.map(fc => (
          <div key={fc.code} className="glass table-row-hover" style={{ padding: '14px', borderRadius: '10px', opacity: fc.status === 'INACTIVE' ? 0.5 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-start)' }}>{fc.code}</div>
              {canManagePricing && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button
                    onClick={() => openEdit(fc)}
                    className="glass"
                    style={{ padding: '2px 6px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '10px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Edit2 size={10} /> 编辑
                  </button>
                  {fc.status !== 'INACTIVE' && (
                    <button
                      onClick={() => handleDisable(fc)}
                      className="glass"
                      style={{ padding: '2px 6px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '10px', color: '#F97316', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Archive size={10} /> 停用
                    </button>
                  )}
                </div>
              )}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 600 }}>{fc.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '4px' }}>
              {fc.city}, {fc.province} | {fc.region}
            </div>
            {fc.notes && (
              <div style={{ fontSize: '11px', color: 'var(--slate-400)', marginTop: '4px' }}>
                {fc.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* FC 弹窗 2026-03-13 */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '460px', padding: '28px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: '18px', fontWeight: 800 }}>{editingFc ? '编辑 FC 目的地' : '新增 FC 目的地'}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <input
                value={form.code}
                onChange={e => setForm({ ...form, code: e.target.value })}
                placeholder="代码 *"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
                disabled={!!editingFc}
              />
              <input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="名称 *"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={form.type}
                onChange={e => setForm({ ...form, type: e.target.value })}
                placeholder="类型（如 FC / HUB）"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value })}
                placeholder="地址"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
              />
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value })}
                  placeholder="城市"
                  className="glass"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
                />
                <input
                  value={form.province}
                  onChange={e => setForm({ ...form, province: e.target.value })}
                  placeholder="省份"
                  className="glass"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  value={form.region}
                  onChange={e => setForm({ ...form, region: e.target.value })}
                  placeholder="大区（如 ON / QC / BC）"
                  className="glass"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
                />
                <input
                  value={form.postal_code}
                  onChange={e => setForm({ ...form, postal_code: e.target.value })}
                  placeholder="邮编"
                  className="glass"
                  style={{ flex: 1, padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px' }}
                />
              </div>
              <textarea
                value={form.notes}
                onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="备注"
                className="glass"
                style={{ padding: '8px 12px', borderRadius: '10px', border: 'none', fontSize: '13px', minHeight: '60px' }}
              />
            </div>
            {error && (
              <div style={{ marginTop: '8px', fontSize: '12px', color: '#EF4444' }}>
                {error}
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '18px' }}>
              <button
                onClick={() => setShowModal(false)}
                className="glass"
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px' }}
              >
                取消
              </button>
              <button
                onClick={handleSave}
                style={{ padding: '8px 18px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '13px', fontWeight: 700, background: 'var(--primary-grad)', color: 'white' }}
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
