/**
 * 转运单 API — 对齐 docs/transfer-order-prd.md 与前端 transferOrderService.ts
 * 时间戳: 2026-03-25T12:00:00
 */
import { Router } from 'express';
import { PoolClient } from 'pg';
import { pool, query } from '../db-postgres';
import { AuthRequest } from '../middleware/AuthMiddleware';
import { requirePermission, requireAnyPermission } from '../middleware/AuthMiddleware';
import { WaybillStatus } from '../types';

const router = Router();

type TransferOrderStatus = 'DRAFT' | 'PARTIAL_WAYBILLED' | 'COMPLETED' | 'CANCELLED';

function pad2(n: number) {
  return String(n).padStart(2, '0');
}

/** pg DATE 需 YYYY-MM-DD；node-pg 可能把 date 列解析为 JS Date，String() 会变成 "Wed Mar 25 ..." — 2026-03-25T23:20:00 */
function toPgDateOnly(val: unknown): string | null {
  if (val == null || val === '') return null;
  if (val instanceof Date && !isNaN(val.getTime())) {
    return val.toISOString().slice(0, 10);
  }
  const s = String(val).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
  return null;
}

/** 生成 TO-YYYYMMDD-0001 格式单号 — 2026-03-25T12:00:00 */
async function generateOrderNo(): Promise<string> {
  const d = new Date();
  const ds = `${d.getFullYear()}${pad2(d.getMonth() + 1)}${pad2(d.getDate())}`;
  const prefix = `TO-${ds}-`;
  const cnt = await query(`SELECT COUNT(*)::int AS c FROM transfer_orders WHERE order_no LIKE $1`, [`${prefix}%`]);
  const seq = (cnt.rows[0]?.c ?? 0) + 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

function parseWaybillIds(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (raw && typeof raw === 'object') return raw as string[];
  return [];
}

function enrichLine(row: Record<string, unknown>) {
  const palletCount = parseFloat(String(row.pallet_count ?? 0)) || 0;
  const waybilled = parseFloat(String(row.waybilled_pallets ?? 0)) || 0;
  const remaining = Math.max(0, palletCount - waybilled);
  const cbm = parseFloat(String(row.cbm ?? 0)) || 0;
  const waybilledCbm = parseFloat(String(row.waybilled_cbm ?? 0)) || 0;
  const remainingCbm = cbm > 0 ? Math.max(0, cbm - waybilledCbm) : 0;
  const wids = row.waybill_ids;
  let waybill_ids: string[] = [];
  if (Array.isArray(wids)) waybill_ids = wids as string[];
  else if (typeof wids === 'string') {
    try {
      waybill_ids = JSON.parse(wids);
    } catch {
      waybill_ids = [];
    }
  }
  return {
    ...row,
    remaining_pallets: remaining,
    remaining_cbm: remainingCbm,
    waybill_ids,
  };
}

async function recomputeOrderStatus(orderId: string): Promise<TransferOrderStatus> {
  const orderRes = await query(`SELECT status FROM transfer_orders WHERE id = $1`, [orderId]);
  if (orderRes.rows.length === 0) return 'DRAFT';
  if (orderRes.rows[0].status === 'CANCELLED') return 'CANCELLED';

  const linesRes = await query(
    `SELECT pallet_count, waybilled_pallets, hold_status FROM transfer_order_lines WHERE transfer_order_id = $1`,
    [orderId]
  );
  const lines = linesRes.rows;
  if (lines.length === 0) {
    await query(`UPDATE transfer_orders SET status = $2, updated_at = NOW() WHERE id = $1`, [orderId, 'DRAFT']);
    return 'DRAFT';
  }

  let allDone = true;
  let anyWaybill = false;
  for (const l of lines) {
    const pc = parseFloat(String(l.pallet_count ?? 0)) || 0;
    const wb = parseFloat(String(l.waybilled_pallets ?? 0)) || 0;
    if (wb > 0) anyWaybill = true;
    if (pc > 0 && wb < pc) allDone = false;
  }

  let next: TransferOrderStatus = 'DRAFT';
  if (anyWaybill && !allDone) next = 'PARTIAL_WAYBILLED';
  else if (allDone && anyWaybill) next = 'COMPLETED';
  else if (anyWaybill) next = 'PARTIAL_WAYBILLED';
  else next = 'DRAFT';

  await query(`UPDATE transfer_orders SET status = $2, updated_at = NOW() WHERE id = $1`, [orderId, next]);
  return next;
}

function canSelectLine(holdStatus: string): boolean {
  return holdStatus === 'NORMAL' || holdStatus === 'RELEASED';
}

/** 从转运分组创建运单（写入 details.transfer_sources）— 2026-03-25T12:00:00 */
async function insertWaybillForGroup(
  client: PoolClient,
  order: Record<string, unknown>,
  transferOrderId: string,
  allocations: { lineId: string; line: Record<string, unknown>; pallets: number; cbmPart: number }[],
  seq: number
): Promise<string> {
  const id = `WB-${Date.now()}-${seq}`;
  const now = new Date();
  const year = now.getFullYear().toString().slice(-2);
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const mins = String(now.getMinutes()).padStart(2, '0');
  const waybill_no = `Y${year}${month}-${day}${hours}${mins}-${seq}`;

  const customer_id = (order.customer_id as string) || null;
  const origin = String(order.warehouse || '');
  const first = allocations[0];
  const destWh = String(first.line.dest_warehouse || order.main_dest_warehouse || '');
  const fulfillment_center = destWh || null;
  const partnerLine = String(first.line.partner || order.partner || '');
  const cargoParts = allocations.map((a) => {
    const sku = a.line.sku ? String(a.line.sku) : '';
    const fba = a.line.fba ? String(a.line.fba) : '';
    return [sku, fba].filter(Boolean).join('/') || 'Transfer';
  });
  const cargo_desc = `[转运] ${partnerLine} | ${cargoParts.join('; ')}`.slice(0, 2000);

  const totalPallets = allocations.reduce((s, a) => s + a.pallets, 0);
  const pallet_count = Math.max(1, Math.round(totalPallets));

  const transfer_sources = allocations.map((a) => ({
    transferOrderId,
    lineId: a.lineId,
    pallets: a.pallets,
    cbm: a.cbmPart,
  }));

  const details = {
    transfer_sources,
    duration: 120,
  };

  let pricing_matrix_id: string | null = null;
  let auto_price = 0;
  let driver_cost = 0;
  let gross_margin = 0;

  if (customer_id && fulfillment_center) {
    const pallets = pallet_count;
    let tier = '1-4';
    if (pallets >= 14) tier = '14-28';
    else if (pallets >= 5) tier = '5-13';

    const pmRes = await client.query(
      `SELECT id, base_price, per_pallet_price FROM pricing_matrices
       WHERE customer_id = $1 AND destination_code = $2
         AND pallet_tier = $3 AND status = 'ACTIVE'
       ORDER BY effective_date DESC NULLS LAST LIMIT 1`,
      [customer_id, fulfillment_center, tier]
    );
    if (pmRes.rows.length > 0) {
      const pm = pmRes.rows[0];
      pricing_matrix_id = pm.id;
      auto_price = parseFloat(pm.base_price) || 0;
      if (pm.per_pallet_price && pallets > 0) {
        auto_price += parseFloat(pm.per_pallet_price) * pallets;
      }
    }

    const dcRes = await client.query(`SELECT total_cost FROM driver_cost_baselines WHERE destination_code = $1 LIMIT 1`, [
      fulfillment_center,
    ]);
    if (dcRes.rows.length > 0) {
      driver_cost = parseFloat(dcRes.rows[0].total_cost) || 0;
      gross_margin = auto_price - driver_cost;
    }
  }

  const finalPrice = auto_price;
  const delivery_date =
    toPgDateOnly(first.line.planned_depart_date) ?? toPgDateOnly(order.arrival_date);

  await client.query(
    `INSERT INTO waybills (
      id, waybill_no, customer_id, origin, destination, cargo_desc, status,
      price_estimated, created_at, fulfillment_center, delivery_date, reference_code,
      pallet_count, distance, billing_type, details,
      pricing_matrix_id, driver_cost, gross_margin
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)`,
    [
      id,
      waybill_no,
      customer_id,
      origin,
      destWh || 'Destination TBD',
      cargo_desc,
      WaybillStatus.NEW,
      finalPrice,
      fulfillment_center,
      delivery_date,
      order.order_no,
      pallet_count,
      0,
      'DISTANCE',
      JSON.stringify(details),
      pricing_matrix_id,
      driver_cost,
      gross_margin,
    ]
  );

  return id;
}

// --- GET / ---
router.get('/', requirePermission('P-TRANSFER-VIEW'), async (req: AuthRequest, res) => {
  try {
    const {
      status,
      container_no,
      warehouse,
      partner,
      main_dest,
      from_date,
      to_date,
      page = '1',
      limit = '20',
    } = req.query as Record<string, string>;

    const pnum = Math.max(1, parseInt(page, 10) || 1);
    const lnum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pnum - 1) * lnum;

    let where = 'WHERE 1=1';
    const params: unknown[] = [];
    let i = 1;
    if (status) {
      where += ` AND t.status = $${i++}`;
      params.push(status);
    }
    if (container_no) {
      where += ` AND t.container_no ILIKE $${i++}`;
      params.push(`%${container_no}%`);
    }
    if (warehouse) {
      where += ` AND t.warehouse ILIKE $${i++}`;
      params.push(`%${warehouse}%`);
    }
    if (partner) {
      where += ` AND t.partner ILIKE $${i++}`;
      params.push(`%${partner}%`);
    }
    if (main_dest) {
      where += ` AND t.main_dest_warehouse ILIKE $${i++}`;
      params.push(`%${main_dest}%`);
    }
    if (from_date) {
      where += ` AND t.arrival_date >= $${i++}`;
      params.push(from_date);
    }
    if (to_date) {
      where += ` AND t.arrival_date <= $${i++}`;
      params.push(to_date);
    }

    const countSql = `
      SELECT COUNT(*)::int AS c
      FROM transfer_orders t
      ${where}`;
    const countRes = await query(countSql, [...params]);
    const total = countRes.rows[0]?.c ?? 0;

    const sql = `
      SELECT t.*, c.name AS customer_name
      FROM transfer_orders t
      LEFT JOIN customers c ON c.id = t.customer_id
      ${where}
      ORDER BY t.created_at DESC
      LIMIT $${i++} OFFSET $${i++}`;
    params.push(lnum, offset);

    const listRes = await query(sql, params);
    const rows = listRes.rows;

    for (const row of rows) {
      const agg = await query(
        `SELECT 
          COALESCE(SUM(pallet_count),0)::numeric AS total_pallets,
          COALESCE(SUM(waybilled_pallets),0)::numeric AS waybilled_pallets,
          COALESCE(SUM(CASE WHEN hold_status IN ('HOLD_PENDING','HOLD_LONGTERM') THEN pallet_count ELSE 0 END),0)::numeric AS hold_pallets
         FROM transfer_order_lines WHERE transfer_order_id = $1`,
        [row.id]
      );
      row.total_pallets = parseFloat(agg.rows[0].total_pallets) || 0;
      row.waybilled_pallets = parseFloat(agg.rows[0].waybilled_pallets) || 0;
      row.hold_pallets = parseFloat(agg.rows[0].hold_pallets) || 0;
    }

    res.json({
      data: rows,
      total,
      totalPages: Math.ceil(total / lnum) || 1,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list transfer orders' });
  }
});

// --- GET /:id ---
router.get('/:id', requirePermission('P-TRANSFER-VIEW'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const h = await query(
      `SELECT t.*, c.name AS customer_name
       FROM transfer_orders t
       LEFT JOIN customers c ON c.id = t.customer_id
       WHERE t.id = $1`,
      [id]
    );
    if (h.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    const header = h.rows[0];
    const linesRes = await query(
      `SELECT * FROM transfer_order_lines WHERE transfer_order_id = $1 ORDER BY line_no ASC, id ASC`,
      [id]
    );
    const lines = linesRes.rows.map((r) => enrichLine(r));
    res.json({ ...header, lines });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to load transfer order' });
  }
});

// --- POST / ---
router.post('/', requirePermission('P-TRANSFER-MANAGE'), async (req: AuthRequest, res) => {
  try {
    const uid = req.user?.id as string | undefined;
    const {
      customer_id,
      partner,
      container_no,
      warehouse,
      entry_method,
      arrival_date,
      main_dest_warehouse,
      currency,
      notes,
    } = req.body;

    if (!partner || !container_no || !warehouse || !entry_method || !arrival_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const id = `TO-${Date.now()}`;
    const order_no = await generateOrderNo();
    await query(
      `INSERT INTO transfer_orders (
        id, order_no, customer_id, partner, container_no, warehouse, entry_method, arrival_date,
        main_dest_warehouse, currency, notes, status, created_by, updated_by, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::date,$9,$10,$11,'DRAFT',$12,$13,NOW(),NOW())`,
      [
        id,
        order_no,
        customer_id || null,
        String(partner).trim(),
        String(container_no).trim(),
        String(warehouse).trim(),
        entry_method,
        arrival_date,
        main_dest_warehouse || null,
        currency || 'CAD',
        notes || null,
        uid || null,
        uid || null,
      ]
    );
    const row = await query(`SELECT * FROM transfer_orders WHERE id = $1`, [id]);
    res.json(row.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create transfer order' });
  }
});

// --- PUT /:id ---
router.put('/:id', requirePermission('P-TRANSFER-MANAGE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const uid = req.user?.id as string | undefined;
    const cur = await query(`SELECT status FROM transfer_orders WHERE id = $1`, [id]);
    if (cur.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (cur.rows[0].status === 'CANCELLED') return res.status(400).json({ error: 'Order is cancelled' });

    const {
      customer_id,
      partner,
      container_no,
      warehouse,
      entry_method,
      arrival_date,
      main_dest_warehouse,
      currency,
      notes,
    } = req.body;

    await query(
      `UPDATE transfer_orders SET
        customer_id = COALESCE($2, customer_id),
        partner = COALESCE($3, partner),
        container_no = COALESCE($4, container_no),
        warehouse = COALESCE($5, warehouse),
        entry_method = COALESCE($6, entry_method),
        arrival_date = COALESCE($7::date, arrival_date),
        main_dest_warehouse = COALESCE($8, main_dest_warehouse),
        currency = COALESCE($9, currency),
        notes = COALESCE($10, notes),
        updated_by = $11,
        updated_at = NOW()
      WHERE id = $1`,
      [
        id,
        customer_id ?? null,
        partner ? String(partner).trim() : null,
        container_no ? String(container_no).trim() : null,
        warehouse ? String(warehouse).trim() : null,
        entry_method ?? null,
        arrival_date ?? null,
        main_dest_warehouse ?? null,
        currency ?? null,
        notes ?? null,
        uid || null,
      ]
    );
    const row = await query(`SELECT * FROM transfer_orders WHERE id = $1`, [id]);
    res.json(row.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update transfer order' });
  }
});

// --- POST /:id/lines ---
router.post('/:id/lines', requirePermission('P-TRANSFER-MANAGE'), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const orderRes = await query(`SELECT * FROM transfer_orders WHERE id = $1`, [id]);
    if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    if (orderRes.rows[0].status === 'CANCELLED') return res.status(400).json({ error: 'Order is cancelled' });

    const body = req.body as {
      lines?: Record<string, unknown>[];
      create?: Record<string, unknown>[];
      update?: Array<{ id: string } & Record<string, unknown>>;
    };

    const hasWaybillsRes = await query(
      `SELECT EXISTS (SELECT 1 FROM transfer_order_lines WHERE transfer_order_id = $1 AND COALESCE(waybilled_pallets,0) > 0) AS w`,
      [id]
    );
    const hasWaybills = hasWaybillsRes.rows[0]?.w === true;

    if (Array.isArray(body.lines)) {
      if (hasWaybills) {
        return res.status(400).json({ error: 'Cannot replace lines when waybills already generated; use create/update' });
      }
      await query(`DELETE FROM transfer_order_lines WHERE transfer_order_id = $1`, [id]);
      let lineNo = 1;
      for (const raw of body.lines) {
        const lid = `TOL-${Date.now()}-${lineNo}-${Math.random().toString(36).slice(2, 6)}`;
        await query(
          `INSERT INTO transfer_order_lines (
            id, transfer_order_id, line_no, sku, fba, po_list, container_no, warehouse,
            piece_count, pallet_count, cbm, weight_kg, dest_warehouse, delivery_type, partner,
            planned_depart_date, hold_status, hold_warehouse, hold_reason, hold_release_date,
            waybilled_pallets, waybilled_cbm, waybill_ids
          ) VALUES (
            $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::date,$17,$18,$19,$20::date,$21,$22,$23::jsonb
          )`,
          [
            lid,
            id,
            lineNo,
            raw.sku ?? null,
            raw.fba ?? null,
            raw.po_list ?? null,
            orderRes.rows[0].container_no,
            orderRes.rows[0].warehouse,
            raw.piece_count ?? null,
            raw.pallet_count ?? 0,
            raw.cbm ?? null,
            raw.weight_kg ?? null,
            raw.dest_warehouse ?? null,
            raw.delivery_type ?? null,
            raw.partner ?? null,
            raw.planned_depart_date || null,
            raw.hold_status || 'NORMAL',
            raw.hold_warehouse ?? null,
            raw.hold_reason ?? null,
            raw.hold_release_date || null,
            0,
            0,
            JSON.stringify([]),
          ]
        );
        lineNo += 1;
      }
    } else {
      if (body.update?.length) {
        for (const u of body.update) {
          await query(
            `UPDATE transfer_order_lines SET
              sku = COALESCE($2, sku),
              fba = COALESCE($3, fba),
              po_list = COALESCE($4, po_list),
              piece_count = COALESCE($5, piece_count),
              pallet_count = COALESCE($6, pallet_count),
              cbm = COALESCE($7, cbm),
              weight_kg = COALESCE($8, weight_kg),
              dest_warehouse = COALESCE($9, dest_warehouse),
              delivery_type = COALESCE($10, delivery_type),
              partner = COALESCE($11, partner),
              planned_depart_date = COALESCE($12::date, planned_depart_date),
              hold_status = COALESCE($13, hold_status),
              hold_warehouse = COALESCE($14, hold_warehouse),
              hold_reason = COALESCE($15, hold_reason),
              hold_release_date = COALESCE($16::date, hold_release_date)
            WHERE id = $1 AND transfer_order_id = $17`,
            [
              u.id,
              u.sku ?? null,
              u.fba ?? null,
              u.po_list ?? null,
              u.piece_count ?? null,
              u.pallet_count ?? null,
              u.cbm ?? null,
              u.weight_kg ?? null,
              u.dest_warehouse ?? null,
              u.delivery_type ?? null,
              u.partner ?? null,
              u.planned_depart_date ?? null,
              u.hold_status ?? null,
              u.hold_warehouse ?? null,
              u.hold_reason ?? null,
              u.hold_release_date ?? null,
              id,
            ]
          );
        }
      }
      if (body.create?.length) {
        const maxRes = await query(`SELECT COALESCE(MAX(line_no),0)::int AS m FROM transfer_order_lines WHERE transfer_order_id = $1`, [id]);
        let lineNo = (maxRes.rows[0]?.m ?? 0) + 1;
        for (const raw of body.create) {
          const lid = `TOL-${Date.now()}-${lineNo}-${Math.random().toString(36).slice(2, 6)}`;
          await query(
            `INSERT INTO transfer_order_lines (
              id, transfer_order_id, line_no, sku, fba, po_list, container_no, warehouse,
              piece_count, pallet_count, cbm, weight_kg, dest_warehouse, delivery_type, partner,
              planned_depart_date, hold_status, hold_warehouse, hold_reason, hold_release_date,
              waybilled_pallets, waybilled_cbm, waybill_ids
            ) VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16::date,$17,$18,$19,$20::date,$21,$22,$23::jsonb
            )`,
            [
              lid,
              id,
              lineNo,
              raw.sku ?? null,
              raw.fba ?? null,
              raw.po_list ?? null,
              orderRes.rows[0].container_no,
              orderRes.rows[0].warehouse,
              raw.piece_count ?? null,
              raw.pallet_count ?? 0,
              raw.cbm ?? null,
              raw.weight_kg ?? null,
              raw.dest_warehouse ?? null,
              raw.delivery_type ?? null,
              raw.partner ?? null,
              raw.planned_depart_date || null,
              raw.hold_status || 'NORMAL',
              raw.hold_warehouse ?? null,
              raw.hold_reason ?? null,
              raw.hold_release_date || null,
              0,
              0,
              JSON.stringify([]),
            ]
          );
          lineNo += 1;
        }
      }
    }

    await recomputeOrderStatus(id);
    const linesRes = await query(`SELECT * FROM transfer_order_lines WHERE transfer_order_id = $1 ORDER BY line_no ASC`, [id]);
    res.json({ lines: linesRes.rows.map((r) => enrichLine(r)) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to save lines' });
  }
});

// --- POST /:id/generate-waybills ---
router.post('/:id/generate-waybills', requirePermission('P-TRANSFER-MANAGE'), async (req: AuthRequest, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { line_ids, quantities } = req.body as { line_ids: string[]; quantities?: Record<string, number> };

    if (!Array.isArray(line_ids) || line_ids.length === 0) {
      return res.status(400).json({ error: 'line_ids required' });
    }

    await client.query('BEGIN');
    const orderRes = await client.query(`SELECT * FROM transfer_orders WHERE id = $1 FOR UPDATE`, [id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Not found' });
    }
    const order = orderRes.rows[0];
    if (order.status === 'CANCELLED') {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Order is cancelled' });
    }

    const waybillIds: string[] = [];
    type Alloc = { lineId: string; line: Record<string, unknown>; pallets: number; cbmPart: number };
    const groupMap = new Map<string, Alloc[]>();
    let seq = 0;

    for (const lineId of line_ids) {
      const lr = await client.query(`SELECT * FROM transfer_order_lines WHERE id = $1 AND transfer_order_id = $2`, [lineId, id]);
      if (lr.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid line ${lineId}` });
      }
      const line = lr.rows[0];
      const hs = String(line.hold_status || 'NORMAL');
      if (!canSelectLine(hs)) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Line ${lineId} is on hold and cannot generate waybills` });
      }
      const palletCount = parseFloat(String(line.pallet_count ?? 0)) || 0;
      const waybilled = parseFloat(String(line.waybilled_pallets ?? 0)) || 0;
      const remaining = Math.max(0, palletCount - waybilled);
      if (remaining <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Line ${lineId} has no remaining pallets` });
      }

      let usePallets = remaining;
      if (quantities && quantities[lineId] != null) {
        usePallets = Math.min(Math.max(0, Number(quantities[lineId])), remaining);
      }
      if (usePallets <= 0) {
        await client.query('ROLLBACK');
        return res.status(400).json({ error: `Invalid quantity for line ${lineId}` });
      }

      const linePartner = String(line.partner || order.partner || '');
      const dest = String(line.dest_warehouse || '');
      const pdd = line.planned_depart_date ? String(line.planned_depart_date).slice(0, 10) : '';
      const gkey = `${linePartner}|${dest}|${pdd}`;
      const cbmTotal = parseFloat(String(line.cbm ?? 0)) || 0;
      const cbmPart = palletCount > 0 ? (cbmTotal * usePallets) / palletCount : 0;

      const list = groupMap.get(gkey) || [];
      list.push({ lineId, line, pallets: usePallets, cbmPart });
      groupMap.set(gkey, list);
    }

    for (const [, allocations] of groupMap) {
      const wbId = await insertWaybillForGroup(client, order, id, allocations, seq++);
      waybillIds.push(wbId);

      for (const a of allocations) {
        const lr = await client.query(`SELECT * FROM transfer_order_lines WHERE id = $1 FOR UPDATE`, [a.lineId]);
        const row = lr.rows[0];
        const prevWb = parseWaybillIds(row.waybill_ids);
        prevWb.push(wbId);
        const newWaybilled = (parseFloat(String(row.waybilled_pallets ?? 0)) || 0) + a.pallets;
        const newWaybilledCbm = (parseFloat(String(row.waybilled_cbm ?? 0)) || 0) + a.cbmPart;
        await client.query(
          `UPDATE transfer_order_lines SET waybilled_pallets = $2, waybilled_cbm = $3, waybill_ids = $4::jsonb WHERE id = $1`,
          [a.lineId, newWaybilled, newWaybilledCbm, JSON.stringify(prevWb)]
        );
      }
    }

    await client.query('COMMIT');
    await recomputeOrderStatus(id);
    res.json({ waybill_ids: waybillIds });
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch {
      /* ignore */
    }
    console.error(e);
    res.status(500).json({ error: 'Generate waybills failed' });
  } finally {
    client.release();
  }
});

// --- DELETE /:id ---
router.delete(
  '/:id',
  requireAnyPermission(['P-TRANSFER-DELETE', 'P-TRANSFER-MANAGE']),
  async (req: AuthRequest, res) => {
    try {
      const { id } = req.params;
      const orderRes = await query(`SELECT * FROM transfer_orders WHERE id = $1`, [id]);
      if (orderRes.rows.length === 0) return res.status(404).json({ error: 'Not found' });

      const hasWaybills = await query(
        `SELECT EXISTS (SELECT 1 FROM transfer_order_lines WHERE transfer_order_id = $1 AND COALESCE(waybilled_pallets,0) > 0) AS w`,
        [id]
      );
      if (hasWaybills.rows[0]?.w === true) {
        await query(`UPDATE transfer_orders SET status = 'CANCELLED', updated_at = NOW() WHERE id = $1`, [id]);
        return res.json({ ok: true, cancelled: true, message: 'Transfer order marked as CANCELLED (waybills exist)' });
      }

      await query(`DELETE FROM transfer_order_lines WHERE transfer_order_id = $1`, [id]);
      await query(`DELETE FROM transfer_orders WHERE id = $1`, [id]);
      res.status(204).send();
    } catch (e) {
      console.error(e);
      res.status(500).json({ error: 'Delete failed' });
    }
  }
);

export default router;
