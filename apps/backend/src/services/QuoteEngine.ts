import { query } from '../db-postgres';
import { QuoteRequest, QuoteResult, AddonServiceLineItem } from '../types';
import { calculatePartnerCost } from './PartnerCostEngine';

/**
 * QuoteEngine - Core pricing calculation engine
 * Matches customer rates from pricing_matrices and calculates total quotes
 * including addon services and driver cost for margin analysis.
 */
export class QuoteEngine {

  /**
   * Calculate a quote based on customer, destination, vehicle type, pallet count, and addons.
   */
  static async calculateQuote(req: QuoteRequest): Promise<QuoteResult> {
    const { customer_id, destination_code, vehicle_type, pallet_count, addons, partner_id, transport_mode } = req;

    // 1. Determine pallet tier
    const palletTier = this.getPalletTier(pallet_count);

    // 2. Look up pricing matrix
    const priceRes = await query(`
      SELECT id, base_price, per_pallet_price FROM pricing_matrices
      WHERE customer_id = $1 AND destination_code = $2 AND vehicle_type = $3
        AND pallet_tier = $4 AND status = 'ACTIVE'
      ORDER BY effective_date DESC NULLS LAST LIMIT 1
    `, [customer_id, destination_code, vehicle_type, palletTier]);

    let basePrice = 0;
    let palletSurcharge = 0;
    let pricingMatrixId: string | undefined;

    if (priceRes.rows.length > 0) {
      const pm = priceRes.rows[0];
      pricingMatrixId = pm.id;
      basePrice = parseFloat(pm.base_price) || 0;

      // For 5-13 tier, add per-pallet surcharge for pallets beyond base (4)
      if (palletTier === '5-13' && pm.per_pallet_price && pallet_count > 4) {
        palletSurcharge = (pallet_count - 4) * (parseFloat(pm.per_pallet_price) || 0);
      }
    }

    // 3. Calculate addon services
    let addonTotal = 0;
    const addonBreakdown: AddonServiceLineItem[] = [];

    if (addons && addons.length > 0) {
      for (const addon of addons) {
        // First check customer-specific rate, then default
        const rateRes = await query(`
          SELECT COALESCE(
            (SELECT custom_price FROM customer_addon_rates car
             JOIN addon_services a ON car.service_id = a.id
             WHERE car.customer_id = $1 AND a.code = $2),
            (SELECT default_price FROM addon_services WHERE code = $2)
          ) as price
        `, [customer_id, addon.code]);

        if (rateRes.rows.length > 0 && rateRes.rows[0].price !== null) {
          const unitPrice = parseFloat(rateRes.rows[0].price);
          const total = unitPrice * addon.qty;
          addonTotal += total;
          addonBreakdown.push({
            code: addon.code,
            qty: addon.qty,
            unit_price: unitPrice,
            total
          });
        }
      }
    }

    // 4. Get driver cost baseline
    let driverCost = 0;
    const costRes = await query(`
      SELECT driver_pay FROM driver_cost_baselines
      WHERE destination_code = $1 AND vehicle_type = $2
    `, [destination_code, vehicle_type]);

    if (costRes.rows.length > 0) {
      driverCost = parseFloat(costRes.rows[0].driver_pay) || 0;
    }

    // 5. Partner cost (毛利闭环)
    let partnerCost: number | undefined;
    let partnerCostRuleId: number | undefined;
    let partnerCostSource: string | undefined;

    if (partner_id) {
      const pc = await calculatePartnerCost({
        partnerId: partner_id,
        destination: destination_code,
        transportMode: transport_mode,
        palletCount: pallet_count,
      });
      if (pc.ruleId !== null) {
        partnerCost = pc.totalCost;
        partnerCostRuleId = pc.ruleId ?? undefined;
        partnerCostSource = pc.ruleSource;
      }
    }

    // 6. Calculate totals — 优先用 partner_cost 计算毛利，否则用 driver_cost
    const grandTotal = basePrice + palletSurcharge + addonTotal;
    const costForMargin = partnerCost !== undefined ? partnerCost : driverCost;
    const grossMargin = grandTotal - costForMargin;
    const marginRate = grandTotal > 0 ? ((grossMargin / grandTotal) * 100).toFixed(1) : '0.0';

    return {
      base_price: basePrice,
      pallet_surcharge: palletSurcharge,
      addon_total: addonTotal,
      addon_breakdown: addonBreakdown,
      grand_total: grandTotal,
      driver_cost: driverCost,
      partner_cost: partnerCost,
      partner_cost_rule_id: partnerCostRuleId,
      partner_cost_source: partnerCostSource,
      gross_margin: grossMargin,
      margin_rate: `${marginRate}%`,
      pricing_matrix_id: pricingMatrixId
    };
  }

  /**
   * Determine the pallet tier from a pallet count number.
   */
  static getPalletTier(palletCount: number): string {
    if (palletCount <= 0) return '1-4';
    if (palletCount <= 4) return '1-4';
    if (palletCount <= 13) return '5-13';
    if (palletCount <= 28) return '14-28';
    return '14-28'; // Treat >28 as the largest tier
  }

  /**
   * Batch calculate quotes for multiple items (used in container waybill generation).
   */
  static async batchCalculateQuotes(
    customerId: string,
    items: { destination_code: string; pallet_count: number; vehicle_type?: string }[]
  ): Promise<QuoteResult[]> {
    const results: QuoteResult[] = [];
    for (const item of items) {
      const vType = item.vehicle_type || (item.pallet_count > 14 ? 'TRAILER_53' : 'STRAIGHT_26');
      const quote = await this.calculateQuote({
        customer_id: customerId,
        destination_code: item.destination_code,
        vehicle_type: vType,
        pallet_count: item.pallet_count
      });
      results.push(quote);
    }
    return results;
  }
}
