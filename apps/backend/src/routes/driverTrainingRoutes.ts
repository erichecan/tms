// 司机培训管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { DriverTrainingService, CreateDriverTrainingRecordInput, UpdateDriverTrainingRecordInput } from '../services/DriverTrainingService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const trainingService = new DriverTrainingService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/drivers/:driverId/training-records - 获取司机的所有培训记录
router.get('/:driverId/training-records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;

    const records = await trainingService.getTrainingRecordsByDriver(tenantId, driverId);

    res.json({
      success: true,
      data: records,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get driver training records error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/drivers/:driverId/training-records - 创建培训记录
router.post('/:driverId/training-records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;
    const input: CreateDriverTrainingRecordInput = {
      ...req.body,
      driverId
    };

    const record = await trainingService.createTrainingRecord(tenantId, input);

    res.status(201).json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create driver training record error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/drivers/training-records/:id - 更新培训记录
router.put('/training-records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateDriverTrainingRecordInput = req.body;

    const record = await trainingService.updateTrainingRecord(tenantId, id, input);

    res.json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update driver training record error:', error);
    if (error.message === 'Training record not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
});

// DELETE /api/drivers/training-records/:id - 删除培训记录
router.delete('/training-records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await trainingService.deleteTrainingRecord(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Training record not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Training record deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete driver training record error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/drivers/training-records/expiring - 获取即将到期的培训证书
router.get('/training-records/expiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 30;

    const records = await trainingService.getExpiringTrainingCertificates(tenantId, daysAhead);

    res.json({
      success: true,
      data: records,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get expiring training certificates error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

