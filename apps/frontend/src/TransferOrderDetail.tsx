/**
 * 转运单详情/编辑页 — 2026-03-13 (transfer-order-prd v0.1)
 * 头部表单 + 明细表（行内编辑）+ 保存草稿 / HOLD / 拆分明细 / 生成运单。
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Lock, Unlock, Copy, FileText, Trash2 } from 'lucide-react';
import { API_BASE_URL } from './apiConfig';
import {
  getTransferOrder,
  createTransferOrder,
  updateTransferOrder,
  saveTransferOrderLines,
  generateWaybills,
  type TransferOrderDetail as DetailType,
  type TransferOrderLine,
  type CreateTransferOrderPayload,
  type UpsertLinePayload,
  type EntryMethod,
  type Currency,
  type LineHoldStatus,
} from './services/transferOrderService';

const ENTRY_OPTIONS: EntryMethod[] = ['整柜', '散货', '散板'];
const CURRENCY_OPTIONS: Currency[] = ['CAD', 'USD', 'RMB'];
const HOLD_OPTIONS: LineHoldStatus[] = ['NORMAL', 'HOLD_PENDING', 'HOLD_LONGTERM', 'RELEASED'];

export const TransferOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isCreate = !id;

  const [detail, setDetail] = useState<DetailType | null>(null);
  const [loading, setLoading] = useState(!isCreate);
  const [saving, setSaving] = useState(false);
  const [customers, setCustomers] = useState<{ id: string; company?: string; name?: string }[]>([]);
  const [fcDestinations, setFcDestinations] = useState<{ code: string; name?: string }[]>([]);

  // Header form (for create or edit)
  const [header, setHeader] = useState<CreateTransferOrderPayload & { order_no?: string; status?: string }>({
    partner: '',
    container_no: '',
    warehouse: '',
    entry_method: '整柜',
    arrival_date: '',
    main_dest_warehouse: '',
    currency: 'CAD',
    notes: '',
  });

  // Lines (editable copy; on load we set from detail.lines)
  const [lines, setLines] = useState<(TransferOrderLine & { _dirty?: boolean })[]>([]);
  const [selectedLineIds, setSelectedLineIds] = useState<Set<string>>(new Set());
  const [generateWaybillsLoading, setGenerateWaybillsLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getTransferOrder(id);
      setDetail(data);
      setHeader({
        customer_id: data.customer_id,
        partner: data.partner || '',
        container_no: data.container_no || '',
        warehouse: data.warehouse || '',
        entry_method: data.entry_method || '整柜',
        arrival_date: data.arrival_date ? data.arrival_date.slice(0, 10) : '',
        main_dest_warehouse: data.main_dest_warehouse || '',
        currency: data.currency || 'CAD',
        notes: data.notes || '',
        order_no: data.order_no,
        status: data.status,
      });
      setLines((data.lines || []).map((l) => ({ ...l })));
    } catch (e) {
      console.error(e);
      setDetail(null);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) fetchDetail();
  }, [id, fetchDetail]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const h: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
    fetch(`${API_BASE_URL}/customers?limit=500`, { headers: h })
      .then((r) => r.json())
      .then((d) => setCustomers(d.data || []))
      .catch(() => {});
    fetch(`${API_BASE_URL}/pricing/fc-destinations`, { headers: h })
      .then((r) => r.json())
      .then((d) => setFcDestinations(d || []))
      .catch(() => {});
  }, []);

  const validateHeader = (): boolean => {
    if (!header.partner?.trim()) {
      alert('请填写合作单位');
      return false;
    }
    if (!header.container_no?.trim()) {
      alert('请填写柜号/提单号');
      return false;
    }
    if (!header.warehouse?.trim()) {
      alert('请填写所在仓库');
      return false;
    }
    if (!header.arrival_date?.trim()) {
      alert('请选择到仓日期');
      return false;
    }
    return true;
  };

  const handleSaveDraft = async () => {
    if (!validateHeader()) return;
    setSaving(true);
    try {
      if (isCreate) {
        const created = await createTransferOrder({
          customer_id: header.customer_id,
          partner: header.partner.trim(),
          container_no: header.container_no.trim(),
          warehouse: header.warehouse.trim(),
          entry_method: header.entry_method,
          arrival_date: header.arrival_date,
          main_dest_warehouse: header.main_dest_warehouse || undefined,
          currency: header.currency,
          notes: header.notes || undefined,
        });
        const orderId = created.id;
        if (lines.length > 0) {
          const payload: UpsertLinePayload[] = lines.map((l) => ({
            sku: l.sku,
            fba: l.fba,
            po_list: l.po_list,
            piece_count: l.piece_count,
            pallet_count: l.pallet_count ?? 0,
            cbm: l.cbm,
            dest_warehouse: l.dest_warehouse,
            delivery_type: l.delivery_type,
            partner: l.partner,
            hold_status: l.hold_status,
            hold_warehouse: l.hold_warehouse,
            hold_reason: l.hold_reason,
            hold_release_date: l.hold_release_date,
          }));
          await saveTransferOrderLines(orderId, payload);
        }
        navigate(`/transfer-orders/${orderId}`);
        return;
      }
      await updateTransferOrder(id!, {
        customer_id: header.customer_id,
        partner: header.partner.trim(),
        container_no: header.container_no.trim(),
        warehouse: header.warehouse.trim(),
        entry_method: header.entry_method,
        arrival_date: header.arrival_date,
        main_dest_warehouse: header.main_dest_warehouse || undefined,
        currency: header.currency,
        notes: header.notes || undefined,
      });
      if (lines.some((l) => l._dirty)) {
        const isNewId = (lid: string) => !lid || String(lid).startsWith('new-');
        const updatePayload = lines
          .filter((l) => l.id && !isNewId(l.id) && l._dirty)
          .map((l) => ({
            id: l.id,
            sku: l.sku,
            fba: l.fba,
            po_list: l.po_list,
            piece_count: l.piece_count,
            pallet_count: l.pallet_count ?? 0,
            cbm: l.cbm,
            dest_warehouse: l.dest_warehouse,
            delivery_type: l.delivery_type,
            partner: l.partner,
            hold_status: l.hold_status,
            hold_warehouse: l.hold_warehouse,
            hold_reason: l.hold_reason,
            hold_release_date: l.hold_release_date,
          }));
        const createPayload = lines.filter((l) => isNewId(l.id)).map((l) => ({
          sku: l.sku,
          fba: l.fba,
          po_list: l.po_list,
          piece_count: l.piece_count,
          pallet_count: l.pallet_count ?? 0,
          cbm: l.cbm,
          dest_warehouse: l.dest_warehouse,
          delivery_type: l.delivery_type,
          partner: l.partner,
          hold_status: l.hold_status,
          hold_warehouse: l.hold_warehouse,
          hold_reason: l.hold_reason,
          hold_release_date: l.hold_release_date,
        }));
        if (updatePayload.length || createPayload.length) {
          await saveTransferOrderLines(id!, {
            update: updatePayload.length ? updatePayload : undefined,
            create: createPayload.length ? createPayload : undefined,
          });
        }
      }
      await fetchDetail();
      setLines((prev) => prev.map((l) => ({ ...l, _dirty: false })));
      alert('已保存草稿');
    } catch (e) {
      console.error(e);
      alert('保存失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) {
      // 2026-03-13 20:53:00: 新建未保存的转运单，删除等价于放弃本页编辑并返回列表
      if (window.confirm('确定要放弃当前新建的转运单吗？本页未保存的内容将丢失。')) {
        navigate('/transfer-orders');
      }
      return;
    }
    if (!window.confirm('确定要删除这张转运单吗？此操作不可恢复，已生成的运单不会被删除。')) {
      return;
    }
    try {
      setDeleting(true);
      const { deleteTransferOrder } = await import('./services/transferOrderService');
      await deleteTransferOrder(id);
      navigate('/transfer-orders');
    } catch (e) {
      console.error(e);
      alert('删除转运单失败，请稍后再试。');
    } finally {
      setDeleting(false);
    }
  };

  const updateLine = (lineId: string, patch: Partial<TransferOrderLine>) => {
    setLines((prev) =>
      prev.map((l) => (l.id === lineId ? { ...l, ...patch, _dirty: true } as TransferOrderLine & { _dirty?: boolean } : l))
    );
  };

  const addLine = () => {
    const newLine: TransferOrderLine & { _dirty?: boolean } = {
      id: `new-${Date.now()}`,
      transfer_order_id: id || '',
      line_no: lines.length + 1,
      pallet_count: 0,
      hold_status: 'NORMAL',
    };
    setLines((prev) => [...prev, newLine]);
  };

  const splitLine = (line: TransferOrderLine) => {
    const half = Math.max(0, (line.pallet_count ?? 0) / 2);
    const copy: TransferOrderLine & { _dirty?: boolean } = {
      ...line,
      id: `new-${Date.now()}`,
      pallet_count: half,
      waybilled_pallets: 0,
      waybilled_cbm: 0,
      remaining_pallets: half,
      remaining_cbm: line.remaining_cbm != null ? (line.cbm ?? 0) / 2 : undefined,
      waybill_ids: [],
      _dirty: true,
    };
    updateLine(line.id, { pallet_count: half });
    setLines((prev) => [...prev, copy]);
  };

  const toggleHold = (line: TransferOrderLine, hold: boolean) => {
    updateLine(line.id, {
      hold_status: hold ? 'HOLD_PENDING' : 'NORMAL',
      hold_reason: hold ? line.hold_reason || '暂不处理' : undefined,
      hold_warehouse: hold ? line.hold_warehouse || detail?.warehouse : undefined,
    });
  };

  const toggleSelectLine = (lineId: string) => {
    setSelectedLineIds((prev) => {
      const next = new Set(prev);
      if (next.has(lineId)) next.delete(lineId);
      else next.add(lineId);
      return next;
    });
  };

  const canSelectForWaybill = (l: TransferOrderLine): boolean => {
    if (l.hold_status !== 'NORMAL' && l.hold_status !== 'RELEASED') return false;
    const remaining = l.remaining_pallets ?? l.pallet_count ?? 0;
    return remaining > 0;
  };

  const handleGenerateWaybills = async () => {
    if (!id || selectedLineIds.size === 0) {
      alert('请先勾选要生成运单的明细行');
      return;
    }
    setGenerateWaybillsLoading(true);
    try {
      await generateWaybills(id, { line_ids: Array.from(selectedLineIds) });
      setSelectedLineIds(new Set());
      await fetchDetail();
      setLines((detail?.lines || []).map((l) => ({ ...l })));
      alert('生成运单请求已提交');
    } catch (e) {
      console.error(e);
      alert('生成运单失败：' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setGenerateWaybillsLoading(false);
    }
  };

  if (!isCreate && loading) {
    return (
      <div className="glass" style={{ padding: '40px', textAlign: 'center', borderRadius: '16px' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={{ paddingBottom: '40px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <button
          onClick={() => navigate('/transfer-orders')}
          className="glass"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          <ArrowLeft size={18} /> 返回列表
        </button>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={handleSaveDraft}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: 'var(--primary-grad)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: saving ? 'not-allowed' : 'pointer',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            <Save size={18} /> {saving ? '保存中...' : '保存草稿'}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="glass"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '12px',
              border: 'none',
              cursor: deleting ? 'not-allowed' : 'pointer',
              background: '#FEE2E2',
              color: '#B91C1C',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            <Trash2 size={18} /> {isCreate ? '放弃新建' : '删除转运单'}
          </button>
        </div>
      </div>

      {/* Header form */}
      <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
        <h3 style={{ margin: '0 0 20px', fontSize: '18px', fontWeight: 800 }}>转运单头</h3>
        {!isCreate && (
          <div style={{ display: 'flex', gap: '16px', marginBottom: '16px', fontSize: '13px', color: 'var(--slate-500)' }}>
            <span>单号：<strong style={{ color: 'var(--slate-800)' }}>{header.order_no || id}</strong></span>
            <span>状态：<strong style={{ color: 'var(--slate-800)' }}>{header.status || '-'}</strong></span>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>客户/业务方</label>
            <select
              value={header.customer_id || ''}
              onChange={(e) => setHeader({ ...header, customer_id: e.target.value || undefined })}
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            >
              <option value="">—</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.company || c.name || c.id}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>合作单位 *</label>
            <input
              value={header.partner}
              onChange={(e) => setHeader({ ...header, partner: e.target.value })}
              placeholder="如 JW、ESC"
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>柜号/提单号 *</label>
            <input
              value={header.container_no}
              onChange={(e) => setHeader({ ...header, container_no: e.target.value })}
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>所在仓库 *</label>
            <input
              value={header.warehouse}
              onChange={(e) => setHeader({ ...header, warehouse: e.target.value })}
              placeholder="如 7仓、25仓"
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>进仓方式</label>
            <select
              value={header.entry_method}
              onChange={(e) => setHeader({ ...header, entry_method: e.target.value as EntryMethod })}
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            >
              {ENTRY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>到仓日期 *</label>
            <input
              type="date"
              value={header.arrival_date}
              onChange={(e) => setHeader({ ...header, arrival_date: e.target.value })}
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>主目的仓</label>
            <select
              value={header.main_dest_warehouse || ''}
              onChange={(e) => setHeader({ ...header, main_dest_warehouse: e.target.value || undefined })}
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            >
              <option value="">—</option>
              {fcDestinations.map((fc) => (
                <option key={fc.code} value={fc.code}>{fc.code} {fc.name ? `- ${fc.name}` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>币种</label>
            <select
              value={header.currency || 'CAD'}
              onChange={(e) => setHeader({ ...header, currency: e.target.value as Currency })}
              className="glass"
              style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px' }}
            >
              {CURRENCY_OPTIONS.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ marginTop: '16px' }}>
          <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)', marginBottom: '4px' }}>整体备注</label>
          <textarea
            value={header.notes || ''}
            onChange={(e) => setHeader({ ...header, notes: e.target.value })}
            className="glass"
            style={{ width: '100%', padding: '10px 12px', border: 'none', borderRadius: '10px', fontSize: '13px', minHeight: '60px' }}
          />
        </div>
      </div>

      {/* Lines table */}
      <div className="glass" style={{ padding: '24px', borderRadius: '16px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>明细</h3>
          <button
            onClick={addLine}
            className="glass"
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '10px',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
            }}
          >
            添加一行
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--glass-border)' }}>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>勾选</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>SKU</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>FBA</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>件数</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>托数</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>方数</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>目的仓</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>合作单位</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>HOLD</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>原因</th>
                <th style={{ padding: '8px 6px', textAlign: 'left', fontWeight: 700 }}>操作</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line) => (
                <tr
                  key={line.id}
                  style={{
                    borderBottom: '1px solid var(--glass-border)',
                    background: line.hold_status !== 'NORMAL' && line.hold_status !== 'RELEASED' ? 'rgba(254, 226, 226, 0.3)' : undefined,
                  }}
                >
                  <td style={{ padding: '6px' }}>
                    {canSelectForWaybill(line) && (
                      <input
                        type="checkbox"
                        checked={selectedLineIds.has(line.id)}
                        onChange={() => toggleSelectLine(line.id)}
                      />
                    )}
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      value={line.sku ?? ''}
                      onChange={(e) => updateLine(line.id, { sku: e.target.value })}
                      className="glass"
                      style={{ width: '90px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      value={line.fba ?? ''}
                      onChange={(e) => updateLine(line.id, { fba: e.target.value })}
                      className="glass"
                      style={{ width: '90px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      type="number"
                      value={line.piece_count ?? ''}
                      onChange={(e) => updateLine(line.id, { piece_count: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="glass"
                      style={{ width: '56px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={line.pallet_count ?? ''}
                      onChange={(e) => updateLine(line.id, { pallet_count: e.target.value === '' ? 0 : Number(e.target.value) })}
                      className="glass"
                      style={{ width: '56px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      type="number"
                      step="0.01"
                      value={line.cbm ?? ''}
                      onChange={(e) => updateLine(line.id, { cbm: e.target.value === '' ? undefined : Number(e.target.value) })}
                      className="glass"
                      style={{ width: '56px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select
                      value={line.dest_warehouse ?? ''}
                      onChange={(e) => updateLine(line.id, { dest_warehouse: e.target.value || undefined })}
                      className="glass"
                      style={{ width: '90px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    >
                      <option value="">—</option>
                      {fcDestinations.map((fc) => (
                        <option key={fc.code} value={fc.code}>{fc.code}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      value={line.partner ?? ''}
                      onChange={(e) => updateLine(line.id, { partner: e.target.value })}
                      className="glass"
                      style={{ width: '80px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '12px' }}
                    />
                  </td>
                  <td style={{ padding: '6px' }}>
                    <select
                      value={line.hold_status}
                      onChange={(e) => updateLine(line.id, { hold_status: e.target.value as LineHoldStatus })}
                      className="glass"
                      style={{ width: '100px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '11px' }}
                    >
                      {HOLD_OPTIONS.map((o) => (
                        <option key={o} value={o}>{o}</option>
                      ))}
                    </select>
                  </td>
                  <td style={{ padding: '6px' }}>
                    <input
                      value={line.hold_reason ?? ''}
                      onChange={(e) => updateLine(line.id, { hold_reason: e.target.value })}
                      placeholder="hold 原因"
                      className="glass"
                      style={{ width: '100px', padding: '4px 8px', border: 'none', borderRadius: '6px', fontSize: '11px' }}
                    />
                  </td>
                  <td style={{ padding: '6px', whiteSpace: 'nowrap' }}>
                    <button
                      type="button"
                      onClick={() => toggleHold(line, line.hold_status === 'NORMAL' || line.hold_status === 'RELEASED')}
                      title={line.hold_status !== 'NORMAL' && line.hold_status !== 'RELEASED' ? '解除 HOLD' : '标记 HOLD'}
                      className="glass"
                      style={{ padding: '4px 8px', marginRight: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      {line.hold_status !== 'NORMAL' && line.hold_status !== 'RELEASED' ? <Unlock size={12} /> : <Lock size={12} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => splitLine(line)}
                      title="拆分明细"
                      className="glass"
                      style={{ padding: '4px 8px', marginRight: '4px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}
                    >
                      <Copy size={12} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLines((prev) => prev.filter((l) => l.id !== line.id))}
                      title="删除该行"
                      className="glass"
                      style={{ padding: '4px 8px', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '11px', color: '#B91C1C' }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {lines.length === 0 && (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
            暂无明细，点击「添加一行」或保存草稿后继续添加
          </div>
        )}
      </div>

      {/* Batch: Generate waybills */}
      {!isCreate && (
        <div className="glass" style={{ padding: '20px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--slate-600)' }}>
            已勾选 <strong>{selectedLineIds.size}</strong> 行（仅非 HOLD 且剩余托数&gt;0 可选）
          </span>
          <button
            onClick={handleGenerateWaybills}
            disabled={selectedLineIds.size === 0 || generateWaybillsLoading}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              background: selectedLineIds.size > 0 ? '#10B981' : 'var(--slate-300)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: selectedLineIds.size > 0 && !generateWaybillsLoading ? 'pointer' : 'not-allowed',
              fontWeight: 700,
              fontSize: '14px',
            }}
          >
            <FileText size={18} /> {generateWaybillsLoading ? '提交中...' : '生成运单'}
          </button>
        </div>
      )}
    </div>
  );
};
