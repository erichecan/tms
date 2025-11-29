// 车辆设备管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { VehicleDeviceService, CreateVehicleDeviceInput, UpdateVehicleDeviceInput } from '../services/VehicleDeviceService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const deviceService = new VehicleDeviceService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/vehicles/:vehicleId/devices - 获取车辆的所有设备
router.get('/:vehicleId/devices', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId } = req.params;

    const devices = await deviceService.getDevicesByVehicle(tenantId, vehicleId);

    res.json({
      success: true,
      data: devices,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get vehicle devices error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/vehicles/devices/type/:type - 根据设备类型获取设备
router.get('/devices/type/:type', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { type } = req.params;

    if (!['gps', 'obd', 'temp_sensor', 'tire_pressure', 'camera', 'other'].includes(type)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid device type' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    const devices = await deviceService.getDevicesByType(tenantId, type as any);

    res.json({
      success: true,
      data: devices,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get devices by type error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/vehicles/:vehicleId/devices - 创建设备绑定
router.post('/:vehicleId/devices', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { vehicleId } = req.params;
    const input: CreateVehicleDeviceInput = {
      ...req.body,
      vehicleId
    };

    const device = await deviceService.createDevice(tenantId, input);

    res.status(201).json({
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create vehicle device error:', error);
    if (error.message.includes('已存在')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message },
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

// PUT /api/vehicles/devices/:id - 更新设备信息
router.put('/devices/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateVehicleDeviceInput = req.body;

    const device = await deviceService.updateDevice(tenantId, id, input);

    res.json({
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update vehicle device error:', error);
    if (error.message === 'Device not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else if (error.message.includes('已被其他设备使用')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message },
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

// DELETE /api/vehicles/devices/:id - 删除设备
router.delete('/devices/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await deviceService.deleteDevice(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Device not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Device deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete vehicle device error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/vehicles/devices/:id/signal - 更新设备信号时间
router.put('/devices/:id/signal', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const { signalTime } = req.body;

    const device = await deviceService.updateLastSignalTime(tenantId, id, signalTime);

    res.json({
      success: true,
      data: device,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update device signal time error:', error);
    if (error.message === 'Device not found') {
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

export default router;

