
import { Router } from 'express';
import { calculatePrice } from '../controllers/PricingController';

const router = Router();

router.post('/calculate', calculatePrice);

export default router;
