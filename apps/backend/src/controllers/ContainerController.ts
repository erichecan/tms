import { Request, Response } from 'express';
import { query } from '../db-postgres';

// --- Containers ---

export const getContainers = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const search = (req.query.search as string || '').toLowerCase();
    const status = req.query.status as string;

    let whereClauses: string[] = [];
    let params: any[] = [];

    if (status && status !== 'ALL') {
      params.push(status);
      whereClauses.push(`c.status = $${params.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      whereClauses.push(`(LOWER(c.container_no) LIKE $${params.length} OR LOWER(c.notes) LIKE $${params.length})`);
    }

    const whereStr = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

    const countRes = await query(
      `SELECT COUNT(*) FROM containers c ${whereStr}`, params
    );
    const total = parseInt(countRes.rows[0].count);

    const dataRes = await query(`
      SELECT c.*,
        COALESCE(cust.company, cust.name, c.customer_id) as customer_name,
        (SELECT COUNT(*) FROM container_items ci WHERE ci.container_id = c.id) as item_count,
        (SELECT COUNT(*) FROM container_items ci WHERE ci.container_id = c.id AND ci.waybill_id IS NOT NULL) as dispatched_count
      FROM containers c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      ${whereStr}
      ORDER BY c.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `, [...params, limit, offset]);

    res.json({
      data: dataRes.rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (e) {
    console.error('Error fetching containers:', e);
    res.status(500).json({ error: 'Failed to fetch containers' });
  }
};

export const getContainerById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const containerRes = await query(`
      SELECT c.*, COALESCE(cust.company, cust.name, c.customer_id) as customer_name
      FROM containers c
      LEFT JOIN customers cust ON c.customer_id = cust.id
      WHERE c.id = $1
    `, [id]);

    if (containerRes.rows.length === 0) {
      return res.status(404).json({ error: 'Container not found' });
    }

    // Get items with their appointments
    const itemsRes = await query(`
      SELECT ci.*,
        fc.name as dest_warehouse_name,
        fc.region as dest_region,
        (
          SELECT json_agg(da ORDER BY da.attempt_number DESC)
          FROM delivery_appointments da
          WHERE da.container_item_id = ci.id
        ) as appointments
      FROM container_items ci
      LEFT JOIN fc_destinations fc ON ci.dest_warehouse = fc.code
      WHERE ci.container_id = $1
      ORDER BY ci.created_at ASC
    `, [id]);

    res.json({
      ...containerRes.rows[0],
      items: itemsRes.rows
    });
  } catch (e) {
    console.error('Error fetching container:', e);
    res.status(500).json({ error: 'Failed to fetch container' });
  }
};

export const createContainer = async (req: Request, res: Response) => {
  const { container_no, warehouse_id, entry_method, arrival_date, customer_id, notes } = req.body;
  const id = `CTR-${Date.now()}`;
  try {
    const result = await query(
      `INSERT INTO containers (id, container_no, warehouse_id, entry_method, arrival_date, customer_id, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'NEW') RETURNING *`,
      [id, container_no, warehouse_id, entry_method, arrival_date || null, customer_id, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error('Error creating container:', e);
    res.status(500).json({ error: 'Failed to create container' });
  }
};

export const updateContainer = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { container_no, warehouse_id, entry_method, arrival_date, customer_id,
          unload_status, status, billing_amount, billing_status, notes } = req.body;
  try {
    const result = await query(`
      UPDATE containers SET
        container_no = COALESCE($1, container_no),
        warehouse_id = COALESCE($2, warehouse_id),
        entry_method = COALESCE($3, entry_method),
        arrival_date = COALESCE($4, arrival_date),
        customer_id = COALESCE($5, customer_id),
        unload_status = COALESCE($6, unload_status),
        status = COALESCE($7, status),
        billing_amount = COALESCE($8, billing_amount),
        billing_status = COALESCE($9, billing_status),
        notes = COALESCE($10, notes),
        updated_at = NOW()
      WHERE id = $11 RETURNING *`,
      [container_no, warehouse_id, entry_method, arrival_date || null,
       customer_id, unload_status, status, billing_amount, billing_status, notes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Container not found' });

    // Auto-recalculate totals
    await recalcContainerTotals(id);

    const updated = await query('SELECT * FROM containers WHERE id = $1', [id]);
    res.json(updated.rows[0]);
  } catch (e) {
    console.error('Error updating container:', e);
    res.status(500).json({ error: 'Failed to update container' });
  }
};

export const deleteContainer = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    // Soft delete - items cascade
    const result = await query(
      "UPDATE containers SET status = 'DELETED', updated_at = NOW() WHERE id = $1 RETURNING id", [id]
    );
    if (result.rows.length === 0) return res.status(404).send();
    res.status(204).send();
  } catch (e) {
    console.error('Error deleting container:', e);
    res.status(500).json({ error: 'Failed to delete container' });
  }
};

// --- Container Items ---

export const addContainerItem = async (req: Request, res: Response) => {
  const { id: containerId } = req.params;
  const { sku, fba_shipment_id, po_list, piece_count, cbm,
          dest_warehouse, delivery_address, pallet_count, notes } = req.body;
  const itemId = `CI-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Parse numeric pallet count from string like "5P"
  const palletCountNum = pallet_count ? parseInt(String(pallet_count).replace(/[^0-9]/g, '')) || 0 : 0;

  try {
    const result = await query(
      `INSERT INTO container_items (id, container_id, sku, fba_shipment_id, po_list,
        piece_count, cbm, dest_warehouse, delivery_address, pallet_count, pallet_count_num, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [itemId, containerId, sku, fba_shipment_id, po_list,
       piece_count || 0, cbm || null, dest_warehouse, delivery_address,
       pallet_count, palletCountNum, notes]
    );

    // Recalculate container totals
    await recalcContainerTotals(containerId);

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error('Error adding container item:', e);
    res.status(500).json({ error: 'Failed to add container item' });
  }
};

export const updateContainerItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { sku, fba_shipment_id, po_list, piece_count, cbm,
          dest_warehouse, delivery_address, pallet_count, notes, status } = req.body;

  const palletCountNum = pallet_count ? parseInt(String(pallet_count).replace(/[^0-9]/g, '')) || 0 : undefined;

  try {
    const result = await query(`
      UPDATE container_items SET
        sku = COALESCE($1, sku),
        fba_shipment_id = COALESCE($2, fba_shipment_id),
        po_list = COALESCE($3, po_list),
        piece_count = COALESCE($4, piece_count),
        cbm = COALESCE($5, cbm),
        dest_warehouse = COALESCE($6, dest_warehouse),
        delivery_address = COALESCE($7, delivery_address),
        pallet_count = COALESCE($8, pallet_count),
        pallet_count_num = COALESCE($9, pallet_count_num),
        notes = COALESCE($10, notes),
        status = COALESCE($11, status)
      WHERE id = $12 RETURNING *`,
      [sku, fba_shipment_id, po_list, piece_count, cbm,
       dest_warehouse, delivery_address, pallet_count, palletCountNum, notes, status, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Item not found' });

    // Recalculate parent container totals
    await recalcContainerTotals(result.rows[0].container_id);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Error updating container item:', e);
    res.status(500).json({ error: 'Failed to update container item' });
  }
};

export const deleteContainerItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const item = await query('SELECT container_id FROM container_items WHERE id = $1', [id]);
    if (item.rows.length === 0) return res.status(404).send();

    await query('DELETE FROM container_items WHERE id = $1', [id]);
    await recalcContainerTotals(item.rows[0].container_id);
    res.status(204).send();
  } catch (e) {
    console.error('Error deleting container item:', e);
    res.status(500).json({ error: 'Failed to delete container item' });
  }
};

// --- Delivery Appointments ---

export const createAppointment = async (req: Request, res: Response) => {
  const { itemId } = req.params;
  const { appointment_time, operator_code, notes } = req.body;
  const apptId = `APT-${Date.now()}`;

  try {
    // Get the next attempt number
    const maxAttempt = await query(
      'SELECT COALESCE(MAX(attempt_number), 0) as max_attempt FROM delivery_appointments WHERE container_item_id = $1',
      [itemId]
    );
    const attemptNumber = parseInt(maxAttempt.rows[0].max_attempt) + 1;

    const result = await query(
      `INSERT INTO delivery_appointments (id, container_item_id, appointment_time, operator_code, attempt_number, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [apptId, itemId, appointment_time || null, operator_code, attemptNumber, notes]
    );

    // Update item status to APPOINTED
    await query("UPDATE container_items SET status = 'APPOINTED' WHERE id = $1", [itemId]);

    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error('Error creating appointment:', e);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
};

export const updateAppointment = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { appointment_time, operator_code, status, rejection_reason, notes } = req.body;

  try {
    const result = await query(`
      UPDATE delivery_appointments SET
        appointment_time = COALESCE($1, appointment_time),
        operator_code = COALESCE($2, operator_code),
        status = COALESCE($3, status),
        rejection_reason = COALESCE($4, rejection_reason),
        notes = COALESCE($5, notes)
      WHERE id = $6 RETURNING *`,
      [appointment_time || null, operator_code, status, rejection_reason, notes, id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Appointment not found' });

    const appt = result.rows[0];

    // If rejected, update the container_item status back to PENDING for re-appointment
    if (status === 'REJECTED') {
      await query("UPDATE container_items SET status = 'PENDING' WHERE id = $1", [appt.container_item_id]);
    }

    // If completed, update the container_item status
    if (status === 'COMPLETED') {
      await query("UPDATE container_items SET status = 'DELIVERED' WHERE id = $1", [appt.container_item_id]);
    }

    res.json(appt);
  } catch (e) {
    console.error('Error updating appointment:', e);
    res.status(500).json({ error: 'Failed to update appointment' });
  }
};

// --- Batch Generate Waybills ---

export const generateWaybills = async (req: Request, res: Response) => {
  const { id: containerId } = req.params;
  const { vehicle_type } = req.body; // Optional: default vehicle type for pricing

  try {
    // Get container with customer
    const containerRes = await query('SELECT * FROM containers WHERE id = $1', [containerId]);
    if (containerRes.rows.length === 0) return res.status(404).json({ error: 'Container not found' });
    const container = containerRes.rows[0];

    // Get items that don't already have a waybill
    const itemsRes = await query(
      "SELECT * FROM container_items WHERE container_id = $1 AND waybill_id IS NULL",
      [containerId]
    );

    if (itemsRes.rows.length === 0) {
      return res.status(400).json({ error: 'No items without waybills to generate' });
    }

    const generatedWaybills: any[] = [];

    for (const item of itemsRes.rows) {
      const waybillId = `WB-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      const now = new Date();
      const waybillNo = `Y${now.getFullYear().toString().slice(-2)}${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${Math.floor(Math.random() * 100).toString().padStart(2, '0')}`;

      const palletCount = item.pallet_count_num || 0;
      const vType = vehicle_type || (palletCount > 14 ? 'TRAILER_53' : 'STRAIGHT_26');

      // Try to get price from pricing matrix
      let priceEstimated = 0;
      let pricingMatrixId: string | null = null;

      if (container.customer_id && item.dest_warehouse) {
        const palletTier = palletCount <= 4 ? '1-4' : palletCount <= 13 ? '5-13' : '14-28';
        const priceRes = await query(`
          SELECT id, base_price, per_pallet_price FROM pricing_matrices
          WHERE customer_id = $1 AND destination_code = $2 AND vehicle_type = $3
            AND pallet_tier = $4 AND status = 'ACTIVE'
          ORDER BY effective_date DESC NULLS LAST LIMIT 1
        `, [container.customer_id, item.dest_warehouse, vType, palletTier]);

        if (priceRes.rows.length > 0) {
          const pm = priceRes.rows[0];
          pricingMatrixId = pm.id;
          priceEstimated = parseFloat(pm.base_price) || 0;
          // For 5-13 tier, add per-pallet surcharge for pallets beyond 4
          if (palletTier === '5-13' && pm.per_pallet_price && palletCount > 4) {
            priceEstimated += (palletCount - 4) * parseFloat(pm.per_pallet_price);
          }
        }
      }

      await query(`
        INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc,
          status, price_estimated, created_at, fulfillment_center, pallet_count,
          container_item_id, pricing_matrix_id)
        VALUES ($1, $2, $3, $4, $5, $6, 'NEW', $7, $8, $9, $10, $11, $12)
      `, [
        waybillId, waybillNo, container.customer_id,
        container.warehouse_id || 'Warehouse', item.dest_warehouse || item.delivery_address || '',
        `FBA: ${item.fba_shipment_id || item.sku || 'N/A'} | ${item.piece_count}pcs`,
        priceEstimated, now.toISOString(), item.dest_warehouse,
        palletCount, item.id, pricingMatrixId
      ]);

      // Link waybill back to item
      await query("UPDATE container_items SET waybill_id = $1, status = 'DISPATCHED' WHERE id = $2",
        [waybillId, item.id]);

      generatedWaybills.push({ waybillId, waybillNo, destination: item.dest_warehouse, priceEstimated });
    }

    // Update container status
    await query("UPDATE containers SET status = 'DELIVERING', updated_at = NOW() WHERE id = $1", [containerId]);

    res.json({
      message: `Generated ${generatedWaybills.length} waybills`,
      waybills: generatedWaybills
    });
  } catch (e) {
    console.error('Error generating waybills:', e);
    res.status(500).json({ error: 'Failed to generate waybills' });
  }
};

// --- Helper: Recalculate container totals ---
async function recalcContainerTotals(containerId: string) {
  await query(`
    UPDATE containers SET
      total_cbm = COALESCE((SELECT SUM(cbm) FROM container_items WHERE container_id = $1), 0),
      total_pieces = COALESCE((SELECT SUM(piece_count) FROM container_items WHERE container_id = $1), 0),
      updated_at = NOW()
    WHERE id = $1
  `, [containerId]);
}
