
import { Router } from 'express';
import { calculatePrice } from '../controllers/PricingController';
import * as PMC from '../controllers/PricingMatrixController';

const router = Router();

// Legacy pricing calculator
router.post('/calculate', calculatePrice);

// --- Phase 3: Pricing Management APIs ---

// Pricing Matrices
router.get('/matrices', PMC.getAllMatrices);
router.get('/matrices/:customerId', PMC.getMatricesByCustomer);
router.post('/matrices', PMC.upsertMatrix);
router.post('/matrices/batch', PMC.batchUpsertMatrix);
router.delete('/matrices/:id', PMC.deleteMatrix);

// Addon Services
router.get('/addons', PMC.getAddonServices);
router.post('/addons', PMC.upsertAddonService);

// Customer Addon Rates
router.get('/addon-rates/:customerId', PMC.getCustomerAddonRates);
router.post('/addon-rates', PMC.upsertCustomerAddonRate);

// Driver Cost Baselines
router.get('/driver-costs', PMC.getDriverCostBaselines);
router.post('/driver-costs', PMC.upsertDriverCostBaseline);

// FC Destinations
router.get('/fc-destinations', PMC.getFcDestinations);
router.post('/fc-destinations', PMC.upsertFcDestination);

// Container All-In Prices
router.get('/container-allins', PMC.getContainerAllins);
router.post('/container-allins', PMC.upsertContainerAllin);

// Quote Engine
router.post('/quote', PMC.calculateQuote);

export default router;
