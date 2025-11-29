// 司机体检管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { DriverMedicalService, CreateDriverMedicalRecordInput, UpdateDriverMedicalRecordInput } from '../services/DriverMedicalService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const medicalService = new DriverMedicalService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/drivers/:driverId/medical-records - 获取司机的所有体检记录
router.get('/:driverId/medical-records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;

    const records = await medicalService.getMedicalRecordsByDriver(tenantId, driverId);

    res.json({
      success: true,
      data: records,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get driver medical records error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/drivers/:driverId/medical-records - 创建体检记录
router.post('/:driverId/medical-records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;
    const input: CreateDriverMedicalRecordInput = {
      ...req.body,
      driverId
    };

    const record = await medicalService.createMedicalRecord(tenantId, input);

    res.status(201).json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create driver medical record error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/drivers/medical-records/:id - 更新体检记录
router.put('/medical-records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateDriverMedicalRecordInput = req.body;

    const record = await medicalService.updateMedicalRecord(tenantId, id, input);

    res.json({
      success: true,
      data: record,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update driver medical record error:', error);
    if (error.message === 'Medical record not found') {
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

// DELETE /api/drivers/medical-records/:id - 删除体检记录
router.delete('/medical-records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await medicalService.deleteMedicalRecord(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Medical record not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Medical record deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete driver medical record error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/drivers/medical-records/expiring - 获取即将到期的体检
router.get('/medical-records/expiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 30;

    const records = await medicalService.getExpiringMedicalRecords(tenantId, daysAhead);

    res.json({
      success: true,
      data: records,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get expiring medical records error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

