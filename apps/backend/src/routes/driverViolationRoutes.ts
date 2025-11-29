// 司机违章管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { DriverViolationService, CreateDriverViolationInput, UpdateDriverViolationInput } from '../services/DriverViolationService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const violationService = new DriverViolationService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/drivers/:driverId/violations - 获取司机的所有违章记录
router.get('/:driverId/violations', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;

    const violations = await violationService.getViolationsByDriver(tenantId, driverId);

    res.json({
      success: true,
      data: violations,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get driver violations error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/drivers/:driverId/violations - 创建违章记录
router.post('/:driverId/violations', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;
    const input: CreateDriverViolationInput = {
      ...req.body,
      driverId
    };

    const violation = await violationService.createViolation(tenantId, input);

    res.status(201).json({
      success: true,
      data: violation,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create driver violation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/drivers/violations/:id - 更新违章记录
router.put('/violations/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateDriverViolationInput = req.body;

    const violation = await violationService.updateViolation(tenantId, id, input);

    res.json({
      success: true,
      data: violation,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update driver violation error:', error);
    if (error.message === 'Violation not found') {
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

// DELETE /api/drivers/violations/:id - 删除违章记录
router.delete('/violations/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await violationService.deleteViolation(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Violation not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Violation deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete driver violation error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/drivers/:driverId/violations/total-points - 获取司机总扣分
router.get('/:driverId/violations/total-points', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;

    const totalPoints = await violationService.getTotalPointsDeducted(tenantId, driverId);

    res.json({
      success: true,
      data: { totalPoints },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get total points error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

