import { Request, Response } from 'express';
import { query } from '../db-postgres';
import { calculatePartnerCost } from '../services/PartnerCostEngine';

// ─── List Rules ──────────────────────────────────────────────────────────────
export const getPartnerPricingRules = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  try {
    const whereClauses: string[] = ["r.status = 'ACTIVE'"];
    const params: any[] = [];

    if (req.query.partner_id) {
      params.push(req.query.partner_id);
      whereClauses.push(`r.partner_id = $${params.length}`);
    }
    if (req.query.destination) {
      params.push(req.query.destination);
      whereClauses.push(`r.destination_warehouse = $${params.length}`);
    }
    if (req.query.transport_mode) {
      params.push(req.query.transport_mode);
      whereClauses.push(`r.transport_mode = $${params.length}`);
    }

    const whereStr = `WHERE ${whereClauses.join(' AND ')}`;

    const countResult = await query(
      `SELECT COUNT(*) FROM partner_pricing_rules r ${whereStr}`, params
    );
    const total = parseInt(countResult.rows[0].count);

    const dataResult = await query(
      `SELECT r.*, p.name AS partner_name, p.short_code AS partner_code
       FROM partner_pricing_rules r
       LEFT JOIN partners p ON r.partner_id = p.id
       ${whereStr}
       ORDER BY p.name, r.destination_warehouse
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, limit, offset]
    );

    res.json({ data: dataResult.rows, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to list pricing rules' });
  }
};

// ─── Get Rules by Partner ────────────────────────────────────────────────────
export const getPartnerPricingByPartner = async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT r.*, p.name AS partner_name FROM partner_pricing_rules r
       LEFT JOIN partners p ON r.partner_id = p.id
       WHERE r.partner_id = $1 AND r.status = 'ACTIVE'
       ORDER BY r.destination_warehouse, r.pallet_tier_min`,
      [req.params.partnerId]
    );
    res.json(result.rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get partner pricing' });
  }
};

// ─── Create Rule ─────────────────────────────────────────────────────────────
export const createPricingRule = async (req: Request, res: Response) => {
  const {
    partner_id, pricing_type, origin_warehouse, destination_warehouse, transport_mode,
    pallet_tier_min, pallet_tier_max, weight_min, weight_max, unit_type,
    base_price, unit_price, surcharges, fuel_surcharge_rate,
    effective_from, effective_to, source_sheet, source_type, notes
  } = req.body;

  try {
    const result = await query(
      `INSERT INTO partner_pricing_rules
        (partner_id, pricing_type, origin_warehouse, destination_warehouse, transport_mode,
         pallet_tier_min, pallet_tier_max, weight_min, weight_max, unit_type,
         base_price, unit_price, surcharges, fuel_surcharge_rate,
         effective_from, effective_to, source_sheet, source_type, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19)
       RETURNING *`,
      [partner_id, pricing_type, origin_warehouse || null, destination_warehouse, transport_mode || null,
       pallet_tier_min || null, pallet_tier_max || null, weight_min || null, weight_max || null,
       unit_type || 'per_trip', base_price || 0, unit_price || 0,
       JSON.stringify(surcharges || {}), fuel_surcharge_rate || null,
       effective_from || null, effective_to || null, source_sheet || null, source_type || 'manual', notes || null]
    );
    res.json(result.rows[0]);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create pricing rule' });
  }
};

// ─── Batch Create ────────────────────────────────────────────────────────────
export const batchCreatePricingRules = async (req: Request, res: Response) => {
  const { rules } = req.body;
  if (!Array.isArray(rules) || rules.length === 0) {
    return res.status(400).json({ error: 'rules array required' });
  }

  try {
    const inserted: any[] = [];
    for (const r of rules) {
      const result = await query(
        `INSERT INTO partner_pricing_rules
          (partner_id, pricing_type, origin_warehouse, destination_warehouse, transport_mode,
           pallet_tier_min, pallet_tier_max, weight_min, weight_max, unit_type,
           base_price, unit_price, surcharges, fuel_surcharge_rate,
           effective_from, effective_to, source_sheet, source_type, ocr_confidence, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20)
         RETURNING *`,
        [r.partner_id, r.pricing_type, r.origin_warehouse || null, r.destination_warehouse,
         r.transport_mode || null, r.pallet_tier_min || null, r.pallet_tier_max || null,
         r.weight_min || null, r.weight_max || null, r.unit_type || 'per_trip',
         r.base_price || 0, r.unit_price || 0, JSON.stringify(r.surcharges || {}),
         r.fuel_surcharge_rate || null, r.effective_from || null, r.effective_to || null,
         r.source_sheet || null, r.source_type || 'structured', r.ocr_confidence || null, r.notes || null]
      );
      inserted.push(result.rows[0]);
    }
    res.json({ inserted: inserted.length, rules: inserted });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to batch create pricing rules' });
  }
};

// ─── Archive Rule ────────────────────────────────────────────────────────────
export const archivePricingRule = async (req: Request, res: Response) => {
  try {
    const result = await query(
      "UPDATE partner_pricing_rules SET status = 'ARCHIVED', updated_at = NOW() WHERE id = $1 RETURNING id",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Rule not found' });
    res.json({ message: 'Rule archived' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to archive rule' });
  }
};

// ─── Calculate Cost ──────────────────────────────────────────────────────────
export const calculateCost = async (req: Request, res: Response) => {
  const { partner_id, origin, destination, transport_mode, pallet_count, cbm, weight_kg } = req.body;
  try {
    const result = await calculatePartnerCost({
      partnerId: partner_id,
      origin,
      destination,
      transportMode: transport_mode,
      palletCount: pallet_count || 0,
      cbm, weightKg: weight_kg
    });
    res.json(result);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to calculate cost' });
  }
};

// ─── Compare Multiple Partners ───────────────────────────────────────────────
export const compareCosts = async (req: Request, res: Response) => {
  const { partner_ids, destination, transport_mode, pallet_count, cbm, weight_kg } = req.body;

  if (!Array.isArray(partner_ids) || partner_ids.length === 0) {
    return res.status(400).json({ error: 'partner_ids array required' });
  }

  try {
    const results: any[] = [];
    for (const pid of partner_ids) {
      const cost = await calculatePartnerCost({
        partnerId: pid,
        destination,
        transportMode: transport_mode,
        palletCount: pallet_count || 0,
        cbm, weightKg: weight_kg
      });

      // Get partner name
      const pRes = await query('SELECT name FROM partners WHERE id = $1', [pid]);
      results.push({
        partner_id: pid,
        partner_name: pRes.rows[0]?.name || '',
        ...cost
      });
    }

    results.sort((a, b) => a.totalCost - b.totalCost);
    res.json({ comparisons: results });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to compare costs' });
  }
};

// ─── Transfer Pricing Preview ────────────────────────────────────────────────
export const previewTransferPricing = async (req: Request, res: Response) => {
  const { dest_warehouse, pallet_count, partner, customer_id } = req.body;
  try {
    let customerPrice: number | undefined;
    let costPrice: number | undefined;
    let ruleId: string | undefined;

    // Customer price lookup
    if (customer_id && dest_warehouse) {
      const pallets = pallet_count || 0;
      let tier = '1-4';
      if (pallets >= 14) tier = '14-28';
      else if (pallets >= 5) tier = '5-13';

      const pmRes = await query(
        `SELECT base_price, per_pallet_price FROM pricing_matrices
         WHERE customer_id = $1 AND destination_code = $2 AND pallet_tier = $3 AND status = 'ACTIVE'
         ORDER BY effective_date DESC NULLS LAST LIMIT 1`,
        [customer_id, dest_warehouse, tier]
      );
      if (pmRes.rows.length > 0) {
        customerPrice = parseFloat(pmRes.rows[0].base_price) || 0;
        if (pmRes.rows[0].per_pallet_price) customerPrice += parseFloat(pmRes.rows[0].per_pallet_price) * pallets;
      }
    }

    // Partner pricing lookup — 合作单位报价即向客户收取的价格
    if (partner && dest_warehouse) {
      const pRes = await query('SELECT id FROM partners WHERE name = $1', [partner]);
      if (pRes.rows.length > 0) {
        const cost = await calculatePartnerCost({
          partnerId: pRes.rows[0].id,
          destination: dest_warehouse,
          palletCount: pallet_count || 0
        });
        // 合作单位报价 = 客户应付价格（收入），覆盖 pricing_matrices 查出来的值
        if (cost.totalCost > 0) {
          customerPrice = cost.totalCost;
          ruleId = cost.ruleId ? String(cost.ruleId) : undefined;
        }
      }
    }

    res.json({ customer_price: customerPrice, cost_price: costPrice, rule_id: ruleId });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to preview pricing' });
  }
};

// ─── Get Partner Rules by Customer ID (name-based match) ─────────────────────
export const getPartnerRulesForCustomer = async (req: Request, res: Response) => {
  try {
    const custRes = await query('SELECT name FROM customers WHERE id = $1', [req.params.customerId]);
    if (custRes.rows.length === 0) return res.json({ partner: null, rules: [] });

    const customerName = custRes.rows[0].name;
    const partnerRes = await query(
      `SELECT id, name, short_code FROM partners WHERE name ILIKE $1 LIMIT 1`,
      [customerName]
    );
    if (partnerRes.rows.length === 0) return res.json({ partner: null, rules: [] });

    const partner = partnerRes.rows[0];
    const rulesRes = await query(
      `SELECT * FROM partner_pricing_rules
       WHERE partner_id = $1 AND status = 'ACTIVE'
       ORDER BY destination_warehouse, pallet_tier_min`,
      [partner.id]
    );
    res.json({ partner, rules: rulesRes.rows });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to get partner rules for customer' });
  }
};
