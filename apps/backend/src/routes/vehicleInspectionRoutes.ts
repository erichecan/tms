// 车辆年检管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { VehicleInspectionService, CreateVehicleInspectionInput, UpdateVehicleInspectionInput } from '../services/VehicleInspectionService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const inspectionService = new VehicleInspectionService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/vehicles/:vehicleId/inspections - 获取车辆的所有年检记录
router.get('/:vehicleId/inspections', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId } = req.params;

    const inspections = await inspectionService.getInspectionsByVehicle(tenantId, vehicleId);

    res.json({
      success: true,
      data: inspections,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get vehicle inspections error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/vehicles/:vehicleId/inspections - 创建年检记录
router.post('/:vehicleId/inspections', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId } = req.params;
    const input: CreateVehicleInspectionInput = {
      ...req.body,
      vehicleId
    };

    const inspection = await inspectionService.createInspection(tenantId, input);

    res.status(201).json({
      success: true,
      data: inspection,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create vehicle inspection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/vehicles/inspections/:id - 更新年检记录
router.put('/inspections/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateVehicleInspectionInput = req.body;

    const inspection = await inspectionService.updateInspection(tenantId, id, input);

    res.json({
      success: true,
      data: inspection,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update vehicle inspection error:', error);
    if (error.message === 'Inspection not found') {
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

// DELETE /api/vehicles/inspections/:id - 删除年检记录
router.delete('/inspections/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await inspectionService.deleteInspection(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Inspection not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Inspection deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete vehicle inspection error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/vehicles/inspections/expiring - 获取即将到期的年检
router.get('/inspections/expiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 30;

    const inspections = await inspectionService.getExpiringInspections(tenantId, daysAhead);

    res.json({
      success: true,
      data: inspections,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get expiring inspections error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

