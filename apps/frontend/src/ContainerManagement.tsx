import { useState, useEffect, useCallback } from 'react';
import { Plus, MapPin, Box, FileText, X } from 'lucide-react';
import { useAuth } from './context/AuthContext';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface Container {
  id: string; container_no: string; warehouse_id?: string; entry_method?: string;
  arrival_date?: string; customer_id?: string; customer_name?: string;
  total_cbm?: number; total_pieces?: number; status: string;
  billing_amount?: number; billing_status?: string; notes?: string;
  item_count?: number; dispatched_count?: number;
  items?: ContainerItem[];
}
interface ContainerItem {
  id: string; container_id: string; sku?: string; fba_shipment_id?: string;
  piece_count: number; cbm?: number; dest_warehouse?: string; dest_warehouse_name?: string;
  pallet_count?: string; pallet_count_num?: number; notes?: string;
  waybill_id?: string; status: string; appointments?: any[];
}
// Appointment type
interface Appointment {
  id: string; appointment_time?: string; operator_code?: string;
  attempt_number: number; status: string; rejection_reason?: string;
}

const statusColors: Record<string, string> = {
  NEW: '#3B82F6', UNLOADING: '#F59E0B', SORTING: '#8B5CF6',
  DELIVERING: '#F97316', COMPLETED: '#10B981', PENDING: '#94A3B8',
  APPOINTED: '#3B82F6', DISPATCHED: '#F97316', DELIVERED: '#10B981',
  SCHEDULED: '#3B82F6', CONFIRMED: '#10B981', REJECTED: '#EF4444',
};

export const ContainerManagement = () => {
  const { token } = useAuth();
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const [containers, setContainers] = useState<Container[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Detail panel
  const [selected, setSelected] = useState<Container | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Create modal
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ container_no: '', warehouse_id: '', entry_method: '整柜', arrival_date: '', customer_id: '', notes: '' });

  // Add item modal
  const [showAddItem, setShowAddItem] = useState(false);
  const [itemForm, setItemForm] = useState({ fba_shipment_id: '', sku: '', piece_count: 0, cbm: 0, dest_warehouse: '', pallet_count: '', notes: '' });

  // Appointment modal
  const [showAppt, setShowAppt] = useState<string | null>(null);
  const [apptForm, setApptForm] = useState({ appointment_time: '', operator_code: '' });

  // Customers & FC list for dropdowns
  const [customers, setCustomers] = useState<any[]>([]);
  const [fcs, setFcs] = useState<any[]>([]);

  const fetchContainers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '10', search });
      if (filter !== 'ALL') params.set('status', filter);
      const res = await fetch(`${API}/api/containers?${params}`, { headers });
      const data = await res.json();
      setContainers(data.data || []);
      setTotal(data.total || 0);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [page, filter, search, token]);

  const fetchDetail = async (id: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`${API}/api/containers/${id}`, { headers });
      const data = await res.json();
      setSelected(data);
    } catch (e) { console.error(e); }
    setDetailLoading(false);
  };

  useEffect(() => { fetchContainers(); }, [fetchContainers]);

  useEffect(() => {
    // Load customers & FC destinations
    fetch(`${API}/api/customers?limit=200`, { headers }).then(r => r.json()).then(d => setCustomers(d.data || [])).catch(() => {});
    fetch(`${API}/api/pricing/fc-destinations`, { headers }).then(r => r.json()).then(d => setFcs(d || [])).catch(() => {});
  }, [token]);

  const handleCreate = async () => {
    try {
      const res = await fetch(`${API}/api/containers`, { method: 'POST', headers, body: JSON.stringify(form) });
      if (res.ok) {
        setShowCreate(false);
        setForm({ container_no: '', warehouse_id: '', entry_method: '整柜', arrival_date: '', customer_id: '', notes: '' });
        fetchContainers();
      }
    } catch (e) { console.error(e); }
  };

  const handleAddItem = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/api/containers/${selected.id}/items`, {
        method: 'POST', headers, body: JSON.stringify(itemForm)
      });
      if (res.ok) { setShowAddItem(false); setItemForm({ fba_shipment_id: '', sku: '', piece_count: 0, cbm: 0, dest_warehouse: '', pallet_count: '', notes: '' }); fetchDetail(selected.id); }
    } catch (e) { console.error(e); }
  };

  const handleCreateAppt = async (itemId: string) => {
    try {
      const res = await fetch(`${API}/api/containers/items/${itemId}/appointments`, {
        method: 'POST', headers, body: JSON.stringify(apptForm)
      });
      if (res.ok) { setShowAppt(null); setApptForm({ appointment_time: '', operator_code: '' }); if (selected) fetchDetail(selected.id); }
    } catch (e) { console.error(e); }
  };

  const handleGenerateWaybills = async () => {
    if (!selected) return;
    try {
      const res = await fetch(`${API}/api/containers/${selected.id}/generate-waybills`, {
        method: 'POST', headers, body: JSON.stringify({})
      });
      const data = await res.json();
      if (res.ok) {
        alert(`成功生成 ${data.waybills?.length || 0} 张运单`);
        fetchDetail(selected.id);
        fetchContainers();
      } else {
        alert(data.error || '生成失败');
      }
    } catch (e) { console.error(e); }
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <span style={{
      padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700,
      background: `${statusColors[status] || '#94A3B8'}15`,
      color: statusColors[status] || '#94A3B8'
    }}>{status}</span>
  );

  return (
    <div style={{ display: 'flex', gap: '24px', height: 'calc(100vh - 140px)' }}>
      {/* Left: List */}
      <div style={{ flex: selected ? '0 0 420px' : 1, transition: 'all 0.3s' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 800 }}>📦 转运管理</h2>
          <button onClick={() => setShowCreate(true)} className="glass" style={{
            padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px',
            background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px'
          }}><Plus size={16} /> 新增集装箱</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {['ALL', 'NEW', 'UNLOADING', 'SORTING', 'DELIVERING', 'COMPLETED'].map(s => (
            <button key={s} onClick={() => { setFilter(s); setPage(1); }}
              style={{
                padding: '6px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                background: filter === s ? 'var(--primary-grad)' : 'var(--glass-bg)',
                color: filter === s ? 'white' : 'var(--slate-600)', fontWeight: 600, fontSize: '12px'
              }}>{s === 'ALL' ? '全部' : s}</button>
          ))}
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索柜号..."
            className="glass" style={{ padding: '6px 12px', border: 'none', outline: 'none', fontSize: '12px', flex: 1, minWidth: '120px' }} />
        </div>

        {/* Container List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', overflowY: 'auto', maxHeight: 'calc(100vh - 280px)' }}>
          {loading ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>加载中...</div> :
            containers.length === 0 ? <div style={{ textAlign: 'center', padding: '40px', color: 'var(--slate-400)' }}>暂无数据</div> :
            containers.map(c => (
              <div key={c.id} onClick={() => fetchDetail(c.id)}
                className="glass table-row-hover"
                style={{
                  padding: '16px', cursor: 'pointer', borderRadius: '12px',
                  border: selected?.id === c.id ? '2px solid var(--primary-start)' : '1px solid var(--glass-border)',
                  transition: 'all 0.2s'
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 700, fontSize: '15px' }}>{c.container_no}</div>
                  <StatusBadge status={c.status} />
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '12px', color: 'var(--slate-500)' }}>
                  <span>📅 {c.arrival_date?.slice(0, 10) || '-'}</span>
                  <span>👤 {c.customer_name || '-'}</span>
                  <span>📦 {c.dispatched_count || 0}/{c.item_count || 0} 派送</span>
                </div>
                {(c.item_count || 0) > 0 && (
                  <div style={{ marginTop: '8px', height: '4px', borderRadius: '2px', background: 'var(--glass-bg)' }}>
                    <div style={{ height: '100%', borderRadius: '2px', background: 'var(--primary-grad)',
                      width: `${Math.round(((c.dispatched_count || 0) / (c.item_count || 1)) * 100)}%`, transition: 'width 0.5s' }} />
                  </div>
                )}
              </div>
            ))
          }
          {/* Pagination */}
          {total > 10 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '12px' }}>
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="glass" style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '12px' }}>上一页</button>
              <span style={{ padding: '6px 14px', fontSize: '12px', color: 'var(--slate-500)' }}>{page} / {Math.ceil(total / 10)}</span>
              <button disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(p => p + 1)}
                className="glass" style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', borderRadius: '8px', fontSize: '12px' }}>下一页</button>
            </div>
          )}
        </div>
      </div>

      {/* Right: Detail Panel */}
      {selected && (
        <div className="glass" style={{ flex: 1, padding: '24px', borderRadius: '16px', overflowY: 'auto', maxHeight: 'calc(100vh - 140px)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>{selected.container_no}</h3>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '4px' }}>
                {selected.customer_name} | {selected.entry_method} | {selected.arrival_date?.slice(0, 10)}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={handleGenerateWaybills} className="glass" style={{
                padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '6px',
                background: '#10B981', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, fontSize: '12px'
              }}><FileText size={14} /> 批量生成运单</button>
              <button onClick={() => setSelected(null)} style={{
                padding: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: 'var(--slate-400)'
              }}><X size={18} /></button>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
            {[
              { label: '总件数', value: selected.total_pieces || 0, icon: '📦' },
              { label: '总方数', value: (selected.total_cbm || 0).toFixed(2), icon: '📐' },
              { label: '货物条数', value: selected.items?.length || 0, icon: '📋' },
              { label: '状态', value: selected.status, icon: '🔄' },
            ].map((s, i) => (
              <div key={i} className="glass" style={{ padding: '12px', borderRadius: '10px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', marginBottom: '4px' }}>{s.icon}</div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>{s.value}</div>
                <div style={{ fontSize: '10px', color: 'var(--slate-500)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Items Table */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: 0, fontSize: '14px', fontWeight: 700 }}>📋 货物明细</h4>
            <button onClick={() => setShowAddItem(true)} className="glass" style={{
              padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px',
              border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '12px'
            }}><Plus size={14} /> 添加货物</button>
          </div>

          {detailLoading ? <div style={{ textAlign: 'center', padding: '20px', color: 'var(--slate-400)' }}>加载中...</div> :
            (selected.items || []).map(item => (
              <div key={item.id} className="glass" style={{ padding: '14px', borderRadius: '10px', marginBottom: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: '13px' }}>{item.fba_shipment_id || item.sku || 'N/A'}</span>
                    <StatusBadge status={item.status} />
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {item.waybill_id ? (
                      <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 700 }}>✅ 已生成运单</span>
                    ) : (
                      <button onClick={() => { setShowAppt(item.id); setApptForm({ appointment_time: '', operator_code: '' }); }}
                        className="glass" style={{ padding: '4px 10px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}>
                        📅 排预约
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '16px', marginTop: '8px', fontSize: '11px', color: 'var(--slate-500)' }}>
                  <span><MapPin size={11} /> {item.dest_warehouse_name || item.dest_warehouse || '-'}</span>
                  <span><Box size={11} /> {item.piece_count}件</span>
                  <span>📐 {item.cbm || '-'}m³</span>
                  <span>🎨 {item.pallet_count || '-'}板</span>
                </div>
                {/* Appointments */}
                {item.appointments && item.appointments.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--glass-border)' }}>
                    {item.appointments.map((appt: Appointment) => (
                      <div key={appt.id} style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '11px', marginBottom: '4px' }}>
                        <span style={{ color: 'var(--slate-400)' }}>#{appt.attempt_number}</span>
                        <span>{appt.appointment_time?.slice(0, 16).replace('T', ' ') || '-'}</span>
                        <span style={{ fontWeight: 700 }}>{appt.operator_code}</span>
                        <StatusBadge status={appt.status} />
                        {appt.rejection_reason && <span style={{ color: '#EF4444' }}>({appt.rejection_reason})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          }
        </div>
      )}

      {/* Create Container Modal */}
      {showCreate && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '480px', padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>新增集装箱</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={form.container_no} onChange={e => setForm({ ...form, container_no: e.target.value })}
                placeholder="柜号 *" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <select value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
                <option value="">选择客户</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.company || c.name}</option>)}
              </select>
              <input value={form.warehouse_id} onChange={e => setForm({ ...form, warehouse_id: e.target.value })}
                placeholder="仓库编号" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <select value={form.entry_method} onChange={e => setForm({ ...form, entry_method: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
                <option value="整柜">整柜</option>
                <option value="散货入库">散货入库</option>
              </select>
              <input type="date" value={form.arrival_date} onChange={e => setForm({ ...form, arrival_date: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                placeholder="备注" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px', minHeight: '60px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setShowCreate(false)} className="glass" style={{ padding: '8px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>取消</button>
              <button onClick={handleCreate} style={{ padding: '8px 20px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>创建</button>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddItem && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '480px', padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>添加货物明细</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input value={itemForm.fba_shipment_id} onChange={e => setItemForm({ ...itemForm, fba_shipment_id: e.target.value })}
                placeholder="FBA Shipment ID" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <input value={itemForm.sku} onChange={e => setItemForm({ ...itemForm, sku: e.target.value })}
                placeholder="SKU" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <input type="number" value={itemForm.piece_count || ''} onChange={e => setItemForm({ ...itemForm, piece_count: parseInt(e.target.value) || 0 })}
                  placeholder="件数" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
                <input type="number" step="0.01" value={itemForm.cbm || ''} onChange={e => setItemForm({ ...itemForm, cbm: parseFloat(e.target.value) || 0 })}
                  placeholder="方数(CBM)" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              </div>
              <select value={itemForm.dest_warehouse} onChange={e => setItemForm({ ...itemForm, dest_warehouse: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }}>
                <option value="">选择目的仓</option>
                {fcs.map((fc: any) => <option key={fc.code} value={fc.code}>{fc.code} - {fc.name}</option>)}
              </select>
              <input value={itemForm.pallet_count} onChange={e => setItemForm({ ...itemForm, pallet_count: e.target.value })}
                placeholder="托数 (如 5P)" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <input value={itemForm.notes} onChange={e => setItemForm({ ...itemForm, notes: e.target.value })}
                placeholder="备注" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setShowAddItem(false)} className="glass" style={{ padding: '8px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>取消</button>
              <button onClick={handleAddItem} style={{ padding: '8px 20px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>添加</button>
            </div>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {showAppt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="glass-panel" style={{ width: '400px', padding: '32px', borderRadius: '20px' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>排派送预约</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input type="datetime-local" value={apptForm.appointment_time}
                onChange={e => setApptForm({ ...apptForm, appointment_time: e.target.value })}
                className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
              <input value={apptForm.operator_code}
                onChange={e => setApptForm({ ...apptForm, operator_code: e.target.value })}
                placeholder="司机代码 (LH/AD/AF)" className="glass" style={{ padding: '10px 14px', border: 'none', borderRadius: '10px', fontSize: '14px' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '20px' }}>
              <button onClick={() => setShowAppt(null)} className="glass" style={{ padding: '8px 20px', border: 'none', borderRadius: '10px', cursor: 'pointer', fontSize: '13px' }}>取消</button>
              <button onClick={() => handleCreateAppt(showAppt)} style={{ padding: '8px 20px', background: 'var(--primary-grad)', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700, fontSize: '13px' }}>确认预约</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
