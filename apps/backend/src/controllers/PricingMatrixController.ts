import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { QuoteEngine } from '../services/QuoteEngine';

// --- Pricing Matrices ---

export const getMatricesByCustomer = async (req: Request, res: Response) => {
  try {
    const { customerId } = req.params;
    // 2026-03-13: 费率矩阵「显示已归档」支持 — includeArchived=true 时返回 ACTIVE + ARCHIVED
    const includeArchived = req.query.includeArchived === 'true';
    const statusCondition = includeArchived ? `IN ('ACTIVE','ARCHIVED')` : `= 'ACTIVE'`;

    const result = await query(`
      SELECT pm.*, fc.name as dest_name, fc.region
      FROM pricing_matrices pm
      LEFT JOIN fc_destinations fc ON pm.destination_code = fc.code
      WHERE pm.customer_id = $1 AND pm.status ${statusCondition}
      ORDER BY pm.destination_code, pm.vehicle_type, pm.pallet_tier
    `, [customerId]);
    res.json(result.rows);
  } catch (e) {
    console.error('Error fetching pricing matrices:', e);
    res.status(500).json({ error: 'Failed to fetch pricing matrices' });
  }
};

export const getAllMatrices = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT pm.customer_id,
        COALESCE(c.company, c.name, pm.customer_id) as customer_name,
        COUNT(*) as rate_count,
        MIN(pm.base_price) as min_price,
        MAX(pm.base_price) as max_price
      FROM pricing_matrices pm
      LEFT JOIN customers c ON pm.customer_id = c.id
      WHERE pm.status = 'ACTIVE'
      GROUP BY pm.customer_id, c.company, c.name
      ORDER BY customer_name
    `);
    res.json(result.rows);
  } catch (e) {
    console.error('Error fetching matrices:', e);
    res.status(500).json({ error: 'Failed to fetch matrices' });
  }
};

export const upsertMatrix = async (req: Request, res: Response) => {
  const { customer_id, destination_code, vehicle_type, pallet_tier,
          base_price, per_pallet_price, effective_date } = req.body;
  try {
    // Check if exists
    const existing = await query(`
      SELECT id FROM pricing_matrices
      WHERE customer_id = $1 AND destination_code = $2 AND vehicle_type = $3
        AND pallet_tier = $4 AND status = 'ACTIVE'
    `, [customer_id, destination_code, vehicle_type, pallet_tier]);

    let result;
    if (existing.rows.length > 0) {
      result = await query(`
        UPDATE pricing_matrices SET
          base_price = $1, per_pallet_price = $2, effective_date = $3, updated_at = NOW()
        WHERE id = $4 RETURNING *
      `, [base_price, per_pallet_price, effective_date || null, existing.rows[0].id]);
    } else {
      const id = `PM-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
      result = await query(`
        INSERT INTO pricing_matrices (id, customer_id, destination_code, vehicle_type, pallet_tier,
          base_price, per_pallet_price, effective_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
      `, [id, customer_id, destination_code, vehicle_type, pallet_tier,
          base_price, per_pallet_price, effective_date || null]);
    }
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Error upserting matrix:', e);
    res.status(500).json({ error: 'Failed to save pricing matrix' });
  }
};

export const batchUpsertMatrix = async (req: Request, res: Response) => {
  const { customer_id, rates } = req.body;
  // rates: Array<{ destination_code, vehicle_type, pallet_tier, base_price, per_pallet_price }>
  if (!customer_id || !Array.isArray(rates)) {
    return res.status(400).json({ error: 'customer_id and rates[] required' });
  }

  try {
    let upserted = 0;
    for (const rate of rates) {
      const existing = await query(`
        SELECT id FROM pricing_matrices
        WHERE customer_id = $1 AND destination_code = $2 AND vehicle_type = $3
          AND pallet_tier = $4 AND status = 'ACTIVE'
      `, [customer_id, rate.destination_code, rate.vehicle_type, rate.pallet_tier]);

      if (existing.rows.length > 0) {
        await query(`
          UPDATE pricing_matrices SET base_price = $1, per_pallet_price = $2, updated_at = NOW()
          WHERE id = $3
        `, [rate.base_price, rate.per_pallet_price || null, existing.rows[0].id]);
      } else {
        const id = `PM-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
        await query(`
          INSERT INTO pricing_matrices (id, customer_id, destination_code, vehicle_type, pallet_tier, base_price, per_pallet_price)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [id, customer_id, rate.destination_code, rate.vehicle_type, rate.pallet_tier,
            rate.base_price, rate.per_pallet_price || null]);
      }
      upserted++;
    }
    res.json({ message: `Upserted ${upserted} rates for customer ${customer_id}` });
  } catch (e) {
    console.error('Error batch upserting:', e);
    res.status(500).json({ error: 'Failed to batch upsert' });
  }
};

export const deleteMatrix = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    await query("UPDATE pricing_matrices SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1", [id]);
    res.status(204).send();
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete matrix' });
  }
};

// --- Addon Services ---

export const getAddonServices = async (req: Request, res: Response) => {
  try {
    const result = await query("SELECT * FROM addon_services WHERE status = 'ACTIVE' ORDER BY code");
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch addon services' });
  }
};

export const upsertAddonService = async (req: Request, res: Response) => {
  const { id: existingId, code, name, name_en, unit, default_price, description } = req.body;
  try {
    if (existingId) {
      const result = await query(`
        UPDATE addon_services SET
          name = COALESCE($1, name), name_en = COALESCE($2, name_en),
          unit = COALESCE($3, unit), default_price = COALESCE($4, default_price),
          description = COALESCE($5, description)
        WHERE id = $6 RETURNING *
      `, [name, name_en, unit, default_price, description, existingId]);
      return res.json(result.rows[0]);
    }
    const id = `AS-${Date.now()}`;
    const result = await query(`
      INSERT INTO addon_services (id, code, name, name_en, unit, default_price, description)
      VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *
    `, [id, code, name, name_en, unit, default_price, description]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    console.error('Error upserting addon service:', e);
    res.status(500).json({ error: 'Failed to save addon service' });
  }
};

// --- Customer Addon Rates ---

export const getCustomerAddonRates = async (req: Request, res: Response) => {
  const { customerId } = req.params;
  try {
    const result = await query(`
      SELECT car.*, a.code, a.name, a.name_en, a.unit, a.default_price
      FROM customer_addon_rates car
      JOIN addon_services a ON car.service_id = a.id
      WHERE car.customer_id = $1
      ORDER BY a.code
    `, [customerId]);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch customer addon rates' });
  }
};

export const upsertCustomerAddonRate = async (req: Request, res: Response) => {
  const { customer_id, service_id, custom_price } = req.body;
  try {
    const existing = await query(
      'SELECT id FROM customer_addon_rates WHERE customer_id = $1 AND service_id = $2',
      [customer_id, service_id]
    );
    if (existing.rows.length > 0) {
      const result = await query(
        'UPDATE customer_addon_rates SET custom_price = $1 WHERE id = $2 RETURNING *',
        [custom_price, existing.rows[0].id]
      );
      return res.json(result.rows[0]);
    }
    const id = `CAR-${Date.now()}`;
    const result = await query(
      'INSERT INTO customer_addon_rates (id, customer_id, service_id, custom_price) VALUES ($1, $2, $3, $4) RETURNING *',
      [id, customer_id, service_id, custom_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save customer addon rate' });
  }
};

// --- Driver Cost Baselines ---

export const getDriverCostBaselines = async (req: Request, res: Response) => {
  try {
    const result = await query(`
      SELECT dcb.*, fc.name as dest_name, fc.region
      FROM driver_cost_baselines dcb
      LEFT JOIN fc_destinations fc ON dcb.destination_code = fc.code
      ORDER BY dcb.destination_code, dcb.vehicle_type
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch driver cost baselines' });
  }
};

export const upsertDriverCostBaseline = async (req: Request, res: Response) => {
  const { destination_code, vehicle_type, driver_pay, fuel_cost,
          waiting_free_hours, waiting_rate_hourly, notes } = req.body;
  try {
    const existing = await query(
      'SELECT id FROM driver_cost_baselines WHERE destination_code = $1 AND vehicle_type = $2',
      [destination_code, vehicle_type]
    );
    const totalCost = (parseFloat(driver_pay) || 0) + (parseFloat(fuel_cost) || 0);

    if (existing.rows.length > 0) {
      const result = await query(`
        UPDATE driver_cost_baselines SET
          driver_pay = $1, fuel_cost = $2, waiting_free_hours = $3,
          waiting_rate_hourly = $4, total_cost = $5, notes = $6
        WHERE id = $7 RETURNING *
      `, [driver_pay, fuel_cost || 0, waiting_free_hours || 1, waiting_rate_hourly || 25,
          totalCost, notes, existing.rows[0].id]);
      return res.json(result.rows[0]);
    }
    const id = `DCB-${Date.now()}`;
    const result = await query(`
      INSERT INTO driver_cost_baselines (id, destination_code, vehicle_type, driver_pay, fuel_cost,
        waiting_free_hours, waiting_rate_hourly, total_cost, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [id, destination_code, vehicle_type, driver_pay, fuel_cost || 0,
        waiting_free_hours || 1, waiting_rate_hourly || 25, totalCost, notes]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save driver cost baseline' });
  }
};

// --- FC Destinations ---

export const getFcDestinations = async (req: Request, res: Response) => {
  try {
    const result = await query('SELECT * FROM fc_destinations ORDER BY code');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch FC destinations' });
  }
};

export const upsertFcDestination = async (req: Request, res: Response) => {
  const { code, name, type, address, city, province, postal_code, region, notes } = req.body;
  try {
    const result = await query(`
      INSERT INTO fc_destinations (code, name, type, address, city, province, postal_code, region, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (code) DO UPDATE SET
        name = COALESCE($2, fc_destinations.name),
        type = COALESCE($3, fc_destinations.type),
        address = COALESCE($4, fc_destinations.address),
        city = COALESCE($5, fc_destinations.city),
        province = COALESCE($6, fc_destinations.province),
        postal_code = COALESCE($7, fc_destinations.postal_code),
        region = COALESCE($8, fc_destinations.region),
        notes = COALESCE($9, fc_destinations.notes)
      RETURNING *
    `, [code, name, type, address, city, province, postal_code, region, notes]);
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save FC destination' });
  }
};

// --- Container All-In Prices ---

export const getContainerAllins = async (req: Request, res: Response) => {
  try {
    const customerId = req.query.customer_id as string;
    let sqlQuery = "SELECT * FROM container_allins WHERE status = 'ACTIVE'";
    const params: any[] = [];
    if (customerId) {
      params.push(customerId);
      sqlQuery += ` AND customer_id = $${params.length}`;
    }
    sqlQuery += ' ORDER BY customer_id, dest_group';
    const result = await query(sqlQuery, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch container allins' });
  }
};

export const upsertContainerAllin = async (req: Request, res: Response) => {
  const { id: existingId, customer_id, dest_group, container_type, price, includes, notes, effective_date } = req.body;
  try {
    if (existingId) {
      const result = await query(`
        UPDATE container_allins SET
          customer_id = COALESCE($1, customer_id), dest_group = COALESCE($2, dest_group),
          container_type = COALESCE($3, container_type), price = COALESCE($4, price),
          includes = COALESCE($5, includes), notes = COALESCE($6, notes),
          effective_date = COALESCE($7, effective_date)
        WHERE id = $8 RETURNING *
      `, [customer_id, dest_group, container_type, price, includes ? JSON.stringify(includes) : null,
          notes, effective_date || null, existingId]);
      return res.json(result.rows[0]);
    }
    const id = `CAI-${Date.now()}`;
    const result = await query(`
      INSERT INTO container_allins (id, customer_id, dest_group, container_type, price, includes, notes, effective_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *
    `, [id, customer_id, dest_group, container_type, price,
        includes ? JSON.stringify(includes) : null, notes, effective_date || null]);
    res.status(201).json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Failed to save container allin' });
  }
};

// --- Quote Engine API ---

export const calculateQuote = async (req: Request, res: Response) => {
  const { customer_id, destination_code, vehicle_type, pallet_count, addons } = req.body;
  if (!customer_id || !destination_code || !vehicle_type) {
    return res.status(400).json({ error: 'customer_id, destination_code, and vehicle_type are required' });
  }
  try {
    const result = await QuoteEngine.calculateQuote({
      customer_id, destination_code, vehicle_type,
      pallet_count: parseInt(pallet_count) || 0,
      addons
    });
    res.json(result);
  } catch (e) {
    console.error('Quote calculation error:', e);
    res.status(500).json({ error: 'Failed to calculate quote' });
  }
};
