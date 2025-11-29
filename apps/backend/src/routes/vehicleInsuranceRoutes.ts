// 车辆保险管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { VehicleInsuranceService, CreateVehicleInsuranceInput, UpdateVehicleInsuranceInput } from '../services/VehicleInsuranceService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const insuranceService = new VehicleInsuranceService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/vehicles/:vehicleId/insurances - 获取车辆的所有保险
router.get('/:vehicleId/insurances', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId } = req.params;

    const insurances = await insuranceService.getInsurancesByVehicle(tenantId, vehicleId);

    res.json({
      success: true,
      data: insurances,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get vehicle insurances error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/vehicles/:vehicleId/insurances - 创建车辆保险
router.post('/:vehicleId/insurances', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId } = req.params;
    const input: CreateVehicleInsuranceInput = {
      ...req.body,
      vehicleId
    };

    const insurance = await insuranceService.createInsurance(tenantId, input);

    res.status(201).json({
      success: true,
      data: insurance,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create vehicle insurance error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/vehicles/insurances/:id - 更新保险信息
router.put('/insurances/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateVehicleInsuranceInput = req.body;

    const insurance = await insuranceService.updateInsurance(tenantId, id, input);

    res.json({
      success: true,
      data: insurance,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update vehicle insurance error:', error);
    if (error.message === 'Insurance not found') {
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

// DELETE /api/vehicles/insurances/:id - 删除保险
router.delete('/insurances/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await insuranceService.deleteInsurance(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Insurance not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Insurance deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete vehicle insurance error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/vehicles/insurances/expiring - 获取即将到期的保险
router.get('/insurances/expiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 30;

    const insurances = await insuranceService.getExpiringInsurances(tenantId, daysAhead);

    res.json({
      success: true,
      data: insurances,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get expiring insurances error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

