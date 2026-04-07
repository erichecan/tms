import { Request, Response } from 'express';
import { query, pool } from '../db-postgres';

// ─── List ────────────────────────────────────────────────────────────────────
export const getTransferOrders = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const offset = (page - 1) * limit;

  try {
    const whereClauses: string[] = [];
    const params: any[] = [];

    if (req.query.status && req.query.status !== 'ALL') {
      params.push(req.query.status);
      whereClauses.push(`t.status = $${params.length}`);
    }
    if (req.query.container_no) {
      params.push(`%${req.query.container_no}%`);
      whereClauses.push(`t.container_no ILIKE $${params.length}`);
    }
    if (req.query.warehouse) {
      params.push(req.query.warehouse);
      whereClauses.push(`t.warehouse = $${params.length}`);
    }
    if (req.query.partner) {
      params.push(`%${req.query.partner}%`);
      whereClauses.push(`p.name ILIKE $${params.length}`);
    }
    if (req.query.main_dest) {
      params.push(req.query.main_dest);
      whereClauses.push(`t.main_dest_warehouse = $${params.length}`);
    }
    if (req.query.from_date) {
      params.push(req.query.from_date);
      whereClauses.push(`t.arrival_date >= $${params.length}`);
    }
    if (req.query.to_date) {
      params.push(req.query.to_date);
      whereClauses.push(`t.arrival_date <= $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countResult = await query(
      `SELECT COUNT(*) FROM transfer_orders t LEFT JOIN partners p ON t.partner_id = p.id ${whereStr}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT t.*, p.name AS partner_name, p.short_code AS partner_code
       FROM transfer_orders t
       LEFT JOIN partners p ON t.partner_id = p.id
       ${whereStr}
       ORDER BY t.created_at DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    // Map partner_name → partner for frontend compatibility
    const data = dataResult.rows.map((r: any) => ({ ...r, partner: r.partner_name || '' }));

    res.json({ data, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list transfer orders' });
  }
};

// ─── Get By ID ───────────────────────────────────────────────────────────────
export const getTransferOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const orderResult = await query(
      `SELECT t.*, p.name AS partner_name, p.short_code AS partner_code
       FROM transfer_orders t
       LEFT JOIN partners p ON t.partner_id = p.id
       WHERE t.id = $1`,
      [id]
    );
    if (orderResult.rows.length === 0) return res.status(404).json({ error: 'Transfer order not found' });

    const order = orderResult.rows[0];

    const linesResult = await query(
      `SELECT l.*, lp.name AS partner_name
       FROM transfer_order_lines l
       LEFT JOIN partners lp ON l.partner_id = lp.id
       WHERE l.transfer_order_id = $1
       ORDER BY l.line_no`,
      [id]
    );

    res.json({ ...order, partner: order.partner_name || '', lines: linesResult.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get transfer order' });
  }
};

// ─── Create ──────────────────────────────────────────────────────────────────
export const createTransferOrder = async (req: Request, res: Response) => {
  const { customer_id, partner, container_no, warehouse, entry_method, arrival_date, main_dest_warehouse, currency, notes } = req.body;

  try {
    // Resolve partner name → partner_id (auto-create if needed)
    let partnerId: number | null = null;
    if (partner) {
      const pRes = await query('SELECT id FROM partners WHERE name = $1', [partner]);
      if (pRes.rows.length > 0) {
        partnerId = pRes.rows[0].id;
      } else {
        const insertRes = await query(
          'INSERT INTO partners(name) VALUES($1) RETURNING id', [partner]
        );
        partnerId = insertRes.rows[0].id;
      }
    }

    // Generate order_no: TO-YYYYMMDD-XXXX
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const seq = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
    const orderNo = `TO-${dateStr}-${seq}`;

    const userId = (req as any).user?.id || null;

    const result = await query(
      `INSERT INTO transfer_orders
        (order_no, partner_id, customer_id, container_no, warehouse, entry_method, arrival_date, main_dest_warehouse, currency, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [orderNo, partnerId, customer_id || null, container_no, warehouse, entry_method, arrival_date || null, main_dest_warehouse || null, currency || 'CAD', notes || null, userId]
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create transfer order' });
  }
};

// ─── Update ──────────────────────────────────────────────────────────────────
export const updateTransferOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { partner, customer_id, container_no, warehouse, entry_method, arrival_date, main_dest_warehouse, currency, notes, status } = req.body;

  try {
    // Resolve partner
    let partnerId: number | null = null;
    if (partner) {
      const pRes = await query('SELECT id FROM partners WHERE name = $1', [partner]);
      if (pRes.rows.length > 0) {
        partnerId = pRes.rows[0].id;
      } else {
        const insertRes = await query('INSERT INTO partners(name) VALUES($1) RETURNING id', [partner]);
        partnerId = insertRes.rows[0].id;
      }
    }

    const userId = (req as any).user?.id || null;

    const result = await query(
      `UPDATE transfer_orders SET
        partner_id = COALESCE($1, partner_id),
        customer_id = COALESCE($2, customer_id),
        container_no = COALESCE($3, container_no),
        warehouse = COALESCE($4, warehouse),
        entry_method = COALESCE($5, entry_method),
        arrival_date = COALESCE($6, arrival_date),
        main_dest_warehouse = COALESCE($7, main_dest_warehouse),
        currency = COALESCE($8, currency),
        notes = COALESCE($9, notes),
        status = COALESCE($10, status),
        updated_by = $11,
        updated_at = NOW()
       WHERE id = $12 RETURNING *`,
      [partnerId, customer_id, container_no, warehouse, entry_method, arrival_date || null, main_dest_warehouse, currency, notes, status, userId, id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Transfer order not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update transfer order' });
  }
};

// ─── Delete ──────────────────────────────────────────────────────────────────
export const deleteTransferOrder = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const result = await query('DELETE FROM transfer_orders WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Transfer order not found' });
    res.json({ message: 'Transfer order deleted' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete transfer order' });
  }
};

// ─── Save Lines (create / update batch) ──────────────────────────────────────
export const saveTransferOrderLines = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { lines, create, update } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify order exists
    const orderCheck = await client.query('SELECT id FROM transfer_orders WHERE id = $1', [id]);
    if (orderCheck.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transfer order not found' });
    }

    const resultLines: any[] = [];

    // Handle bulk create (array of lines or create field)
    const toCreate = lines || create || [];
    for (const line of toCreate) {
      // Resolve line-level partner
      let linePartnerId: number | null = null;
      if (line.partner) {
        const pRes = await client.query('SELECT id FROM partners WHERE name = $1', [line.partner]);
        linePartnerId = pRes.rows.length > 0 ? pRes.rows[0].id : null;
      }

      // Auto line_no
      const maxLine = await client.query(
        'SELECT COALESCE(MAX(line_no), 0) + 1 AS next FROM transfer_order_lines WHERE transfer_order_id = $1', [id]
      );
      const lineNo = maxLine.rows[0].next;

      const ins = await client.query(
        `INSERT INTO transfer_order_lines
          (transfer_order_id, line_no, sku, fba_shipment_id, po_list, piece_count, pallet_count, cbm, weight_kg,
           dest_warehouse, delivery_type, partner_id, planned_depart_date, hold_status, hold_warehouse, hold_reason, hold_release_date,
           remaining_pallets, remaining_cbm)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$7,$8)
         RETURNING *`,
        [id, lineNo, line.sku || null, line.fba || null, line.po_list || null,
         line.piece_count || 0, line.pallet_count || 0, line.cbm || 0, line.weight_kg || 0,
         line.dest_warehouse || null, line.delivery_type || null, linePartnerId,
         line.planned_depart_date || null, line.hold_status || 'NORMAL',
         line.hold_warehouse || null, line.hold_reason || null, line.hold_release_date || null]
      );
      resultLines.push(ins.rows[0]);
    }

    // Handle updates
    if (update && Array.isArray(update)) {
      for (const u of update) {
        let linePartnerId: number | null = null;
        if (u.partner) {
          const pRes = await client.query('SELECT id FROM partners WHERE name = $1', [u.partner]);
          linePartnerId = pRes.rows.length > 0 ? pRes.rows[0].id : null;
        }

        const upd = await client.query(
          `UPDATE transfer_order_lines SET
            sku = COALESCE($1, sku),
            fba_shipment_id = COALESCE($2, fba_shipment_id),
            po_list = COALESCE($3, po_list),
            piece_count = COALESCE($4, piece_count),
            pallet_count = COALESCE($5, pallet_count),
            cbm = COALESCE($6, cbm),
            weight_kg = COALESCE($7, weight_kg),
            dest_warehouse = COALESCE($8, dest_warehouse),
            delivery_type = COALESCE($9, delivery_type),
            partner_id = COALESCE($10, partner_id),
            planned_depart_date = COALESCE($11, planned_depart_date),
            hold_status = COALESCE($12, hold_status),
            hold_warehouse = COALESCE($13, hold_warehouse),
            hold_reason = COALESCE($14, hold_reason),
            hold_release_date = COALESCE($15, hold_release_date),
            updated_at = NOW()
           WHERE id = $16 RETURNING *`,
          [u.sku, u.fba, u.po_list, u.piece_count, u.pallet_count, u.cbm, u.weight_kg,
           u.dest_warehouse, u.delivery_type, linePartnerId, u.planned_depart_date,
           u.hold_status, u.hold_warehouse, u.hold_reason, u.hold_release_date, u.id]
        );
        if (upd.rows.length > 0) resultLines.push(upd.rows[0]);
      }
    }

    // Recalculate totals
    await recalcOrderTotals(client, parseInt(id));

    await client.query('COMMIT');
    res.json({ lines: resultLines });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Failed to save lines' });
  } finally {
    client.release();
  }
};

// ─── Generate Waybills ───────────────────────────────────────────────────────
export const generateWaybills = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { line_ids, quantities } = req.body;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const orderRes = await client.query(
      `SELECT t.*, p.name AS partner_name FROM transfer_orders t LEFT JOIN partners p ON t.partner_id = p.id WHERE t.id = $1`, [id]
    );
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Transfer order not found' });
    }
    const order = orderRes.rows[0];

    const linesRes = await client.query(
      'SELECT * FROM transfer_order_lines WHERE transfer_order_id = $1 AND id = ANY($2)',
      [id, line_ids]
    );

    const waybillIds: string[] = [];

    for (const line of linesRes.rows) {
      const pallets = quantities?.[String(line.id)] || line.remaining_pallets || line.pallet_count || 0;
      if (pallets <= 0) continue;

      // Determine vehicle type from pallet count
      let vehicleType = 'STRAIGHT_26';
      if (pallets > 13) vehicleType = 'TRAILER_53';

      // Look up customer pricing
      let priceEstimated = 0;
      let pricingMatrixId: string | null = null;
      if (order.customer_id && line.dest_warehouse) {
        let tier = '1-4';
        if (pallets >= 14) tier = '14-28';
        else if (pallets >= 5) tier = '5-13';

        const pmRes = await client.query(
          `SELECT id, base_price, per_pallet_price FROM pricing_matrices
           WHERE customer_id = $1 AND destination_code = $2 AND pallet_tier = $3 AND status = 'ACTIVE'
           ORDER BY effective_date DESC NULLS LAST LIMIT 1`,
          [order.customer_id, line.dest_warehouse, tier]
        );
        if (pmRes.rows.length > 0) {
          const pm = pmRes.rows[0];
          pricingMatrixId = pm.id;
          priceEstimated = parseFloat(pm.base_price) || 0;
          if (pm.per_pallet_price) priceEstimated += parseFloat(pm.per_pallet_price) * pallets;
        }
      }

      // Look up partner cost
      let partnerCost = 0;
      const partnerId = line.partner_id || order.partner_id;
      if (partnerId && line.dest_warehouse) {
        const pcRes = await client.query(
          `SELECT base_price, unit_price, unit_type, fuel_surcharge_rate FROM partner_pricing_rules
           WHERE partner_id = $1 AND destination_warehouse = $2 AND status = 'ACTIVE'
             AND ($3 BETWEEN COALESCE(pallet_tier_min,0) AND COALESCE(pallet_tier_max,9999))
           ORDER BY created_at DESC LIMIT 1`,
          [partnerId, line.dest_warehouse, pallets]
        );
        if (pcRes.rows.length > 0) {
          const pr = pcRes.rows[0];
          if (pr.unit_type === 'per_trip') {
            partnerCost = parseFloat(pr.base_price) || 0;
          } else {
            partnerCost = (parseFloat(pr.base_price) || 0) + pallets * (parseFloat(pr.unit_price) || 0);
          }
          if (pr.fuel_surcharge_rate) {
            partnerCost *= (1 + parseFloat(pr.fuel_surcharge_rate));
          }
        }
      }

      const grossMargin = priceEstimated - partnerCost;

      // Create waybill
      const wbId = `WB-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const now = new Date();
      const yy = now.getFullYear().toString().slice(-2);
      const mm = (now.getMonth() + 1).toString().padStart(2, '0');
      const dd = now.getDate().toString().padStart(2, '0');
      const hh = now.getHours().toString().padStart(2, '0');
      const mi = now.getMinutes().toString().padStart(2, '0');
      const waybillNo = `Y${yy}${mm}-${dd}${hh}${mi}-${Math.random().toString(36).slice(2, 5)}`;

      await client.query(
        `INSERT INTO waybills
          (id, waybill_no, customer_id, origin, destination, cargo_desc, status,
           price_estimated, fulfillment_center, pallet_count, container_item_id,
           pricing_matrix_id, driver_cost, gross_margin, created_at)
         VALUES ($1,$2,$3,$4,$5,$6,'NEW',$7,$8,$9,$10,$11,$12,$13,NOW())`,
        [wbId, waybillNo, order.customer_id, order.warehouse || 'JWA', line.dest_warehouse || '',
         `${line.sku || '转运'} - ${pallets}板`, priceEstimated, line.dest_warehouse,
         pallets, null, pricingMatrixId, partnerCost, grossMargin]
      );

      // Update line
      const existingWbIds = line.waybill_ids || [];
      existingWbIds.push(wbId);
      await client.query(
        `UPDATE transfer_order_lines SET
          waybilled_pallets = waybilled_pallets + $1,
          remaining_pallets = remaining_pallets - $1,
          waybill_ids = $2,
          updated_at = NOW()
         WHERE id = $3`,
        [pallets, JSON.stringify(existingWbIds), line.id]
      );

      waybillIds.push(wbId);
    }

    // Recalculate order totals
    await recalcOrderTotals(client, parseInt(id));

    // Auto-update order status
    const totals = await client.query(
      'SELECT SUM(pallet_count) AS total, SUM(waybilled_pallets) AS waybilled FROM transfer_order_lines WHERE transfer_order_id = $1',
      [id]
    );
    const t = totals.rows[0];
    let newStatus = order.status;
    if (parseInt(t.waybilled) > 0 && parseInt(t.waybilled) < parseInt(t.total)) {
      newStatus = 'PARTIAL_WAYBILLED';
    } else if (parseInt(t.waybilled) >= parseInt(t.total)) {
      newStatus = 'COMPLETED';
    }
    if (newStatus !== order.status) {
      await client.query('UPDATE transfer_orders SET status = $1, updated_at = NOW() WHERE id = $2', [newStatus, id]);
    }

    await client.query('COMMIT');
    res.json({ waybill_ids: waybillIds });
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    res.status(500).json({ error: 'Failed to generate waybills' });
  } finally {
    client.release();
  }
};

// ─── Partners CRUD ───────────────────────────────────────────────────────────
export const getPartners = async (_req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM partners WHERE status = $1 ORDER BY name', ['ACTIVE']);
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list partners' });
  }
};

export const createPartner = async (req: Request, res: Response) => {
  const { name, short_code, type, contact_name, contact_phone, contact_email, notes } = req.body;
  try {
    const result = await query(
      `INSERT INTO partners(name, short_code, type, contact_name, contact_phone, contact_email, notes)
       VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [name, short_code || null, type || 'carrier', contact_name || null, contact_phone || null, contact_email || null, notes || null]
    );
    res.json(result.rows[0]);
  } catch (e: any) {
    if (e.code === '23505') return res.status(409).json({ error: 'Partner name already exists' });
    console.error(e);
    res.status(500).json({ error: 'Failed to create partner' });
  }
};

export const updatePartner = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, short_code, type, contact_name, contact_phone, contact_email, notes, status } = req.body;
  try {
    const result = await query(
      `UPDATE partners SET
        name = COALESCE($1, name), short_code = COALESCE($2, short_code), type = COALESCE($3, type),
        contact_name = COALESCE($4, contact_name), contact_phone = COALESCE($5, contact_phone),
        contact_email = COALESCE($6, contact_email), notes = COALESCE($7, notes),
        status = COALESCE($8, status), updated_at = NOW()
       WHERE id = $9 RETURNING *`,
      [name, short_code, type, contact_name, contact_phone, contact_email, notes, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Partner not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update partner' });
  }
};

// ─── Helper ──────────────────────────────────────────────────────────────────
async function recalcOrderTotals(client: any, orderId: number) {
  await client.query(`
    UPDATE transfer_orders SET
      total_pallets = COALESCE((SELECT SUM(pallet_count) FROM transfer_order_lines WHERE transfer_order_id = $1), 0),
      waybilled_pallets = COALESCE((SELECT SUM(waybilled_pallets) FROM transfer_order_lines WHERE transfer_order_id = $1), 0),
      hold_pallets = COALESCE((SELECT SUM(pallet_count) FROM transfer_order_lines WHERE transfer_order_id = $1 AND hold_status != 'NORMAL'), 0),
      updated_at = NOW()
    WHERE id = $1
  `, [orderId]);
}
