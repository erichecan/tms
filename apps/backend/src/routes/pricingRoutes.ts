// 2026-03-13: 报价路由权限按 PRD_Pricing_Management_Full 表「所需权限」挂载

import { Router } from 'express';
import { requirePermission, requireAnyPermission } from '../middleware/AuthMiddleware';
import { calculatePrice } from '../controllers/PricingController';
import * as PMC from '../controllers/PricingMatrixController';

const router = Router();

// Legacy pricing calculator — 同 pricing，需报价查看或快速报价权限
router.post('/calculate', requireAnyPermission(['P-QUOTE-CALC', 'P-PRICING-VIEW']), calculatePrice);

// --- Phase 3: Pricing Management APIs (PRD 7.2 权限) ---

// Pricing Matrices: GET P-PRICING-VIEW, POST/DELETE P-PRICING-MANAGE
router.get('/matrices', requirePermission('P-PRICING-VIEW'), PMC.getAllMatrices);
router.get('/matrices/:customerId', requirePermission('P-PRICING-VIEW'), PMC.getMatricesByCustomer);
router.post('/matrices', requirePermission('P-PRICING-MANAGE'), PMC.upsertMatrix);
router.post('/matrices/batch', requirePermission('P-PRICING-MANAGE'), PMC.batchUpsertMatrix);
router.delete('/matrices/:id', requirePermission('P-PRICING-MANAGE'), PMC.deleteMatrix);

// Addon Services
router.get('/addons', requirePermission('P-PRICING-VIEW'), PMC.getAddonServices);
router.post('/addons', requirePermission('P-PRICING-MANAGE'), PMC.upsertAddonService);

// Customer Addon Rates
router.get('/addon-rates/:customerId', requirePermission('P-PRICING-VIEW'), PMC.getCustomerAddonRates);
router.post('/addon-rates', requirePermission('P-PRICING-MANAGE'), PMC.upsertCustomerAddonRate);

// Driver Cost Baselines
router.get('/driver-costs', requirePermission('P-PRICING-VIEW'), PMC.getDriverCostBaselines);
router.post('/driver-costs', requirePermission('P-PRICING-MANAGE'), PMC.upsertDriverCostBaseline);

// FC Destinations
router.get('/fc-destinations', requirePermission('P-PRICING-VIEW'), PMC.getFcDestinations);
router.post('/fc-destinations', requirePermission('P-PRICING-MANAGE'), PMC.upsertFcDestination);

// Container All-In Prices
router.get('/container-allins', requirePermission('P-PRICING-VIEW'), PMC.getContainerAllins);
router.post('/container-allins', requirePermission('P-PRICING-MANAGE'), PMC.upsertContainerAllin);

// Quote Engine: P-QUOTE-CALC 或 P-PRICING-VIEW
router.post('/quote', requireAnyPermission(['P-QUOTE-CALC', 'P-PRICING-VIEW']), PMC.calculateQuote);

export default router;
