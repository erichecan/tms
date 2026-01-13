
import { Router } from 'express';
import * as RuleController from '../controllers/RuleController';

const router = Router();

router.get('/', RuleController.getRules);
router.get('/:id', RuleController.getRule);
router.post('/', RuleController.createRule);
router.put('/:id', RuleController.updateRule);
router.delete('/:id', RuleController.deleteRule);
router.post('/preview-pay', RuleController.previewDriverPay);

export default router;
