import { query } from '../db-postgres';

export interface PartnerCostInput {
  partnerId: number;
  origin?: string;
  destination: string;
  transportMode?: string;
  palletCount: number;
  cbm?: number;
  weightKg?: number;
}

export interface PartnerCostResult {
  baseCost: number;
  palletSurcharge: number;
  addonCosts: { name: string; amount: number }[];
  fuelSurcharge: number;
  totalCost: number;
  ruleId: number | null;
  ruleSource: string;
  unitType: string;
}

export async function calculatePartnerCost(params: PartnerCostInput): Promise<PartnerCostResult> {
  const result: PartnerCostResult = {
    baseCost: 0, palletSurcharge: 0, addonCosts: [], fuelSurcharge: 0,
    totalCost: 0, ruleId: null, ruleSource: 'none', unitType: 'per_trip'
  };

  // Find matching rule
  const ruleRes = await query(
    `SELECT * FROM partner_pricing_rules
     WHERE partner_id = $1
       AND destination_warehouse = $2
       AND status = 'ACTIVE'
       AND ($3 BETWEEN COALESCE(pallet_tier_min, 0) AND COALESCE(pallet_tier_max, 9999))
       AND (transport_mode IS NULL OR transport_mode = $4)
     ORDER BY
       CASE WHEN transport_mode IS NOT NULL THEN 0 ELSE 1 END,
       created_at DESC
     LIMIT 1`,
    [params.partnerId, params.destination, params.palletCount, params.transportMode || '']
  );

  if (ruleRes.rows.length === 0) return result;

  const rule = ruleRes.rows[0];
  result.ruleId = rule.id;
  result.ruleSource = rule.source_type || 'structured';
  result.unitType = rule.unit_type || 'per_trip';

  const basePrice = parseFloat(rule.base_price) || 0;
  const unitPrice = parseFloat(rule.unit_price) || 0;

  switch (rule.unit_type) {
    case 'per_trip':
      result.baseCost = basePrice;
      break;
    case 'per_pallet':
      result.baseCost = basePrice;
      result.palletSurcharge = unitPrice * params.palletCount;
      break;
    case 'per_cbm':
      result.baseCost = basePrice;
      result.palletSurcharge = unitPrice * (params.cbm || 0);
      break;
    case 'per_kg':
      result.baseCost = basePrice;
      result.palletSurcharge = unitPrice * (params.weightKg || 0);
      break;
    default:
      result.baseCost = basePrice;
  }

  // Surcharges from JSONB
  const surcharges = rule.surcharges || {};
  for (const [key, val] of Object.entries(surcharges)) {
    if (typeof val === 'number' && val > 0) {
      result.addonCosts.push({ name: key, amount: val });
    }
  }

  // Fuel surcharge
  const fuelRate = parseFloat(rule.fuel_surcharge_rate) || 0;
  const subtotal = result.baseCost + result.palletSurcharge + result.addonCosts.reduce((s, a) => s + a.amount, 0);
  result.fuelSurcharge = subtotal * fuelRate;
  result.totalCost = subtotal + result.fuelSurcharge;

  return result;
}
