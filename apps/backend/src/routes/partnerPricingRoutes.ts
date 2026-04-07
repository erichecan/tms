import { Router } from 'express';
import * as PartnerPricingController from '../controllers/PartnerPricingController';

const router = Router();

// Pricing rules CRUD
router.get('/', PartnerPricingController.getPartnerPricingRules);
router.get('/:partnerId', PartnerPricingController.getPartnerPricingByPartner);
router.post('/', PartnerPricingController.createPricingRule);
router.post('/batch', PartnerPricingController.batchCreatePricingRules);
router.delete('/:id', PartnerPricingController.archivePricingRule);

// Cost calculation
router.post('/calculate', PartnerPricingController.calculateCost);
router.post('/compare', PartnerPricingController.compareCosts);

export default router;
