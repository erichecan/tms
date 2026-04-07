import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';

const router = Router();

router.get('/profit', AnalyticsController.getProfitAnalytics);
router.get('/benchmarks', AnalyticsController.getMarketBenchmarks);
router.post('/benchmarks', AnalyticsController.upsertMarketBenchmark);
router.delete('/benchmarks/:id', AnalyticsController.deleteMarketBenchmark);

export default router;
