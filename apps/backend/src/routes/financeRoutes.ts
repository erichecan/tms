
import * as express from 'express';
import { FinanceController } from '../controllers/FinanceController';

const router = express.Router();

router.get('/dashboard', FinanceController.getDashboardMetrics);
router.get('/records', FinanceController.getFinancialRecords);
router.get('/statements', FinanceController.getStatements);
router.post('/statements', FinanceController.generateStatement);
router.put('/statements/:id/status', FinanceController.updateStatementStatus);

export default router;
