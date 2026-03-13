/**
 * Transfer Order API client — 2026-03-13 (transfer-order-prd v0.1)
 * Consistent with existing fetch + Bearer token pattern.
 */
import { API_BASE_URL } from '../apiConfig';

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('token');
  const h: HeadersInit = { 'Content-Type': 'application/json' };
  if (token) (h as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  return h;
}

// --- Types (aligned with PRD 4.1 / 4.2) ---
export type TransferOrderStatus = 'DRAFT' | 'PARTIAL_WAYBILLED' | 'COMPLETED' | 'CANCELLED';
export type EntryMethod = '整柜' | '散货' | '散板';
export type Currency = 'CAD' | 'USD' | 'RMB';
export type LineHoldStatus = 'NORMAL' | 'HOLD_PENDING' | 'HOLD_LONGTERM' | 'RELEASED';
export type DeliveryType = '直卡' | '拖车' | '散板' | '拼车';

export interface TransferOrderHeader {
  id: string;
  order_no: string;
  customer_id?: string;
  customer_name?: string;
  partner: string;
  container_no: string;
  warehouse: string;
  entry_method: EntryMethod;
  arrival_date: string;
  main_dest_warehouse?: string;
  currency?: Currency;
  notes?: string;
  status: TransferOrderStatus;
  created_at: string;
  updated_at: string;
  created_by?: string;
  updated_by?: string;
  total_pallets?: number;
  waybilled_pallets?: number;
  hold_pallets?: number;
}

export interface TransferOrderLine {
  id: string;
  transfer_order_id: string;
  line_no: number;
  sku?: string;
  fba?: string;
  po_list?: string;
  container_no?: string;
  warehouse?: string;
  piece_count?: number;
  pallet_count: number;
  cbm?: number;
  weight_kg?: number;
  dest_warehouse?: string;
  delivery_type?: DeliveryType;
  partner?: string;
  planned_depart_date?: string;
  hold_status: LineHoldStatus;
  hold_warehouse?: string;
  hold_reason?: string;
  hold_release_date?: string;
  waybilled_pallets?: number;
  waybilled_cbm?: number;
  remaining_pallets?: number;
  remaining_cbm?: number;
  waybill_ids?: string[];
}

export interface TransferOrderDetail extends TransferOrderHeader {
  lines: TransferOrderLine[];
}

export interface ListFilters {
  status?: string;
  container_no?: string;
  warehouse?: string;
  partner?: string;
  main_dest?: string;
  from_date?: string;
  to_date?: string;
  page?: number;
  limit?: number;
}

export interface ListResponse {
  data: TransferOrderHeader[];
  total: number;
  totalPages?: number;
}

export interface CreateTransferOrderPayload {
  customer_id?: string;
  partner: string;
  container_no: string;
  warehouse: string;
  entry_method: EntryMethod;
  arrival_date: string;
  main_dest_warehouse?: string;
  currency?: Currency;
  notes?: string;
}

export interface UpsertLinePayload {
  sku?: string;
  fba?: string;
  po_list?: string;
  piece_count?: number;
  pallet_count: number;
  cbm?: number;
  weight_kg?: number;
  dest_warehouse?: string;
  delivery_type?: DeliveryType;
  partner?: string;
  planned_depart_date?: string;
  hold_status?: LineHoldStatus;
  hold_warehouse?: string;
  hold_reason?: string;
  hold_release_date?: string;
}

export interface GenerateWaybillsPayload {
  line_ids: string[];
  quantities?: Record<string, number>; // lineId -> pallets to use for this generation
}

/** GET /transfer-orders */
export async function listTransferOrders(filters: ListFilters = {}): Promise<ListResponse> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.container_no) params.set('container_no', filters.container_no);
  if (filters.warehouse) params.set('warehouse', filters.warehouse);
  if (filters.partner) params.set('partner', filters.partner);
  if (filters.main_dest) params.set('main_dest', filters.main_dest);
  if (filters.from_date) params.set('from_date', filters.from_date);
  if (filters.to_date) params.set('to_date', filters.to_date);
  if (filters.page) params.set('page', String(filters.page));
  if (filters.limit) params.set('limit', String(filters.limit));
  const res = await fetch(`${API_BASE_URL}/transfer-orders?${params.toString()}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => 'List transfer orders failed'));
  return res.json();
}

/** GET /transfer-orders/:id */
export async function getTransferOrder(id: string): Promise<TransferOrderDetail> {
  const res = await fetch(`${API_BASE_URL}/transfer-orders/${id}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Get transfer order failed'));
  return res.json();
}

/** POST /transfer-orders */
export async function createTransferOrder(payload: CreateTransferOrderPayload): Promise<TransferOrderHeader> {
  const res = await fetch(`${API_BASE_URL}/transfer-orders`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Create transfer order failed'));
  return res.json();
}

/** PUT /transfer-orders/:id */
export async function updateTransferOrder(id: string, payload: Partial<CreateTransferOrderPayload>): Promise<TransferOrderHeader> {
  const res = await fetch(`${API_BASE_URL}/transfer-orders/${id}`, {
    method: 'PUT',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Update transfer order failed'));
  return res.json();
}

/** POST /transfer-orders/:id/lines — create or update lines (body: { lines: UpsertLinePayload[] } or single line) */
export async function saveTransferOrderLines(
  orderId: string,
  lines: UpsertLinePayload[] | { create?: UpsertLinePayload[]; update?: Array<{ id: string } & Partial<UpsertLinePayload>> }
): Promise<{ lines: TransferOrderLine[] }> {
  const body = Array.isArray(lines) ? { lines } : lines;
  const res = await fetch(`${API_BASE_URL}/transfer-orders/${orderId}/lines`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Save lines failed'));
  return res.json();
}

/** POST /transfer-orders/:id/generate-waybills */
export async function generateWaybills(orderId: string, payload: GenerateWaybillsPayload): Promise<{ waybill_ids?: string[] }> {
  const res = await fetch(`${API_BASE_URL}/transfer-orders/${orderId}/generate-waybills`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Generate waybills failed'));
  return res.json();
}

/** DELETE /transfer-orders/:id */
// 2026-03-13 20:52:00: 提供转运单删除接口（带确认对话框的前端调用），用于误建/作废整张转运单
export async function deleteTransferOrder(id: string): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/transfer-orders/${id}`, {
    method: 'DELETE',
    headers: authHeaders(),
  });
  if (!res.ok) throw new Error(await res.text().catch(() => 'Delete transfer order failed'));
}

/** POST /pricing/transfer/preview — optional; graceful failure */
export async function previewTransferPricing(line: Partial<UpsertLinePayload>): Promise<{ customer_price?: number; cost_price?: number; rule_id?: string } | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/pricing/transfer/preview`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(line),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
