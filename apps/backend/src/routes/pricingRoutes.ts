
import { Router } from 'express';
import { calculatePrice, getTemplates, createTemplate, updateTemplate, deleteTemplate } from '../controllers/PricingController';

const router = Router();

router.post('/calculate', calculatePrice);

// Template Routes
router.get('/templates', getTemplates);
router.post('/templates', createTemplate);
router.put('/templates/:id', updateTemplate);
router.delete('/templates/:id', deleteTemplate);

export default router;
