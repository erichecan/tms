import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calculator, MapPin, Truck, Settings, Package } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

type Tab = 'RATES' | 'ADDONS' | 'DRIVER_COSTS' | 'ALLINS' | 'QUOTE' | 'FC';

export const PricingManagement = () => {
  const { token } = useAuth();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
  const [tab, setTab] = useState<Tab>('RATES');
  const [customers, setCustomers] = useState<any[]>([]);
  const [fcs, setFcs] = useState<any[]>([]);

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

      {tab === 'RATES' && <RatesTab headers={headers} customers={customers} fcs={fcs} />}
      {tab === 'ADDONS' && <AddonsTab headers={headers} />}
      {tab === 'DRIVER_COSTS' && <DriverCostsTab headers={headers} fcs={fcs} />}
      {tab === 'ALLINS' && <AllinsTab headers={headers} customers={customers} />}
      {tab === 'QUOTE' && <QuoteTab headers={headers} customers={customers} fcs={fcs} />}
      {tab === 'FC' && <FcTab headers={headers} fcs={fcs} onRefresh={() => {
        fetch(`${API}/api/pricing/fc-destinations`, { headers }).then(r => r.json()).then(d => setFcs(d || [])).catch(() => {});
      }} />}
    </div>
  );
};

// ===== Rates Tab =====
const RatesTab = ({ headers, customers, fcs }: { headers: any; customers: any[]; fcs: any[] }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [matrices, setMatrices] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [customerSummary, setCustomerSummary] = useState<any[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/api/pricing/matrices`, { headers }).then(r => r.json()).then(d => setCustomerSummary(d || [])).catch(() => {});
  }, []);

  const loadRates = async (custId: string) => {
    setSelectedCustomer(custId);
    if (!custId) { setMatrices([]); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/pricing/matrices/${custId}`, { headers });
      setMatrices(await res.json());
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const [editForm, setEditForm] = useState({ destination_code: '', vehicle_type: 'STRAIGHT_26', pallet_tier: '1-4', base_price: 0, per_pallet_price: 0 });
  const [showAdd, setShowAdd] = useState(false);

  const handleSaveRate = async () => {
    try {
      await fetch(`${API_URL}/api/pricing/matrices`, {
        method: 'POST', headers,
        body: JSON.stringify({ customer_id: selectedCustomer, ...editForm })
      });
      loadRates(selectedCustomer);
      setShowAdd(false);
    } catch (e) { console.error(e); }
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
        {selectedCustomer && (
          <button onClick={() => setShowAdd(true)} style={{
            padding: '8px 16px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px', display: 'flex', alignItems: 'center', gap: '6px'
          }}><Plus size={14} /> 添加费率</button>
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
                  </tr>
                </thead>
                <tbody>
                  {(rates as any[]).map((r: any) => (
                    <tr key={r.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '8px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 700,
                          background: r.vehicle_type === 'STRAIGHT_26' ? '#3B82F615' : '#8B5CF615',
                          color: r.vehicle_type === 'STRAIGHT_26' ? '#3B82F6' : '#8B5CF6'
                        }}>{r.vehicle_type === 'STRAIGHT_26' ? '26ft' : r.vehicle_type === 'TRAILER_53' ? '53ft' : r.vehicle_type}</span>
                      </td>
                      <td style={{ padding: '8px' }}>{r.pallet_tier}</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: 700 }}>${r.base_price}</td>
                      <td style={{ padding: '8px', textAlign: 'right', color: 'var(--slate-500)' }}>{r.per_pallet_price ? `$${r.per_pallet_price}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {matrices.length === 0 && <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>该客户暂无费率数据</div>}
        </div>
      )}

      {/* Add Rate Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '420px', padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>添加费率</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <select value={editForm.destination_code} onChange={e => setEditForm({ ...editForm, destination_code: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
                <option value="">选择目的仓</option>
                {fcs.map(fc => <option key={fc.code} value={fc.code}>{fc.code} - {fc.name}</option>)}
              </select>
              <select value={editForm.vehicle_type} onChange={e => setEditForm({ ...editForm, vehicle_type: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
                <option value="STRAIGHT_26">26ft 直卡</option>
                <option value="STRAIGHT_28">28ft 直卡</option>
                <option value="TRAILER_53">53ft 拖车</option>
              </select>
              <select value={editForm.pallet_tier} onChange={e => setEditForm({ ...editForm, pallet_tier: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
                <option value="1-4">1-4 板</option>
                <option value="5-13">5-13 板</option>
                <option value="14-28">14-28 板</option>
                <option value="LOOSE">散板</option>
              </select>
              <input type="number" step="0.01" value={editForm.base_price || ''} onChange={e => setEditForm({ ...editForm, base_price: parseFloat(e.target.value) || 0 })}
                placeholder="基础价格 ($)" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <input type="number" step="0.01" value={editForm.per_pallet_price || ''} onChange={e => setEditForm({ ...editForm, per_pallet_price: parseFloat(e.target.value) || 0 })}
                placeholder="每板加价 ($)" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setShowAdd(false)} className="glass" style={{ padding: '8px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>取消</button>
              <button onClick={handleSaveRate} style={{ padding: '8px 20px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===== Addons Tab =====
const AddonsTab = ({ headers }: { headers: any }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [addons, setAddons] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/api/pricing/addons`, { headers }).then(r => r.json()).then(d => setAddons(d || [])).catch(() => {});
  }, []);

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>增值服务目录</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>代码</th>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>名称</th>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>English</th>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>计费单位</th>
            <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>默认价格</th>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>说明</th>
          </tr>
        </thead>
        <tbody>
          {addons.map(a => (
            <tr key={a.id} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '10px' }}><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', color: 'var(--primary-start)' }}>{a.code}</span></td>
              <td style={{ padding: '10px', fontWeight: 600 }}>{a.name}</td>
              <td style={{ padding: '10px', color: 'var(--slate-500)' }}>{a.name_en}</td>
              <td style={{ padding: '10px' }}>
                <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, background: '#F59E0B15', color: '#F59E0B' }}>{a.unit}</span>
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700 }}>${a.default_price}</td>
              <td style={{ padding: '10px', color: 'var(--slate-500)', fontSize: '12px' }}>{a.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===== Driver Costs Tab =====
const DriverCostsTab = ({ headers, fcs }: { headers: any; fcs: any[] }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [costs, setCosts] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/api/pricing/driver-costs`, { headers }).then(r => r.json()).then(d => setCosts(d || [])).catch(() => {});
  }, []);

  // Group by destination
  const grouped = costs.reduce((acc, c) => {
    if (!acc[c.destination_code]) acc[c.destination_code] = {};
    acc[c.destination_code][c.vehicle_type] = c;
    return acc;
  }, {} as Record<string, Record<string, any>>);

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>司机工资标准矩阵</h4>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>目的仓</th>
            <th style={{ textAlign: 'left', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>区域</th>
            <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>26ft 直卡</th>
            <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>53ft 拖车</th>
            <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>免费等待(h)</th>
            <th style={{ textAlign: 'right', padding: '10px', color: 'var(--slate-500)', fontWeight: 700, fontSize: '11px' }}>超时$/h</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(grouped).map(([dest, types]: [string, any]) => (
            <tr key={dest} className="table-row-hover" style={{ borderBottom: '1px solid var(--glass-border)' }}>
              <td style={{ padding: '10px', fontWeight: 700 }}>{dest}</td>
              <td style={{ padding: '10px', color: 'var(--slate-500)' }}>{types.STRAIGHT_26?.dest_name || types.TRAILER_53?.dest_name || ''}</td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#3B82F6' }}>
                {types.STRAIGHT_26 ? `$${types.STRAIGHT_26.driver_pay}` : '-'}
              </td>
              <td style={{ padding: '10px', textAlign: 'right', fontWeight: 700, color: '#8B5CF6' }}>
                {types.TRAILER_53 ? `$${types.TRAILER_53.driver_pay}` : '-'}
              </td>
              <td style={{ padding: '10px', textAlign: 'right' }}>{types.STRAIGHT_26?.waiting_free_hours || 1}</td>
              <td style={{ padding: '10px', textAlign: 'right' }}>${types.STRAIGHT_26?.waiting_rate_hourly || 25}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// ===== Allins Tab =====
const AllinsTab = ({ headers, customers }: { headers: any; customers: any[] }) => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
  const [allins, setAllins] = useState<any[]>([]);
  useEffect(() => {
    fetch(`${API_URL}/api/pricing/container-allins`, { headers }).then(r => r.json()).then(d => setAllins(d || [])).catch(() => {});
  }, []);

  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>整柜全包价</h4>
      {allins.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>暂无全包价数据</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '12px' }}>
          {allins.map(a => (
            <div key={a.id} className="glass" style={{ padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontWeight: 700 }}>{a.dest_group}</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-start)', marginTop: '4px' }}>${a.price}</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>{a.container_type || 'Standard'} | {a.notes || ''}</div>
            </div>
          ))}
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
const FcTab = ({ headers, fcs, onRefresh }: { headers: any; fcs: any[]; onRefresh: () => void }) => {
  return (
    <div className="glass" style={{ padding: '24px', borderRadius: '16px' }}>
      <h4 style={{ margin: '0 0 16px', fontWeight: 700 }}>FC 目的地字典</h4>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
        {fcs.map(fc => (
          <div key={fc.code} className="glass" style={{ padding: '14px', borderRadius: '10px' }}>
            <div style={{ fontWeight: 800, fontSize: '16px', color: 'var(--primary-start)' }}>{fc.code}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, marginTop: '2px' }}>{fc.name}</div>
            <div style={{ fontSize: '11px', color: 'var(--slate-500)', marginTop: '4px' }}>
              {fc.city}, {fc.province} | {fc.region}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
