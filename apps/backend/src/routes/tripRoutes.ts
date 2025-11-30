import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import Joi from 'joi';

// 2025-10-01 14:50:50 临时补充行程验证Schema，避免缺失导出导致的构建失败
const tripCreateSchema = Joi.object({
  tripNo: Joi.string().optional(),
  driverId: Joi.string().uuid().optional(),
  vehicleId: Joi.string().uuid().optional(),
  status: Joi.string().valid('planned','in_progress','completed','cancelled').default('planned'),
  shipments: Joi.array().items(Joi.string().uuid()).default([])
});

const tripUpdateSchema = Joi.object({
  driverId: Joi.string().uuid().optional(),
  vehicleId: Joi.string().uuid().optional(),
  status: Joi.string().valid('planned','in_progress','completed','cancelled').optional(),
  shipments: Joi.array().items(Joi.string().uuid()).optional()
});

const router = Router();
const dbService = new DatabaseService();

// 获取行程列表
router.get('/',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      // 2025-11-30 02:40:00 修复：支持状态数组（用于查询多个状态的行程）
      // 处理查询参数：可能是单个状态字符串，也可能是状态数组
      let statusFilter: string | string[] | undefined = undefined;
      if (req.query.status) {
        if (Array.isArray(req.query.status)) {
          statusFilter = req.query.status as string[];
        } else {
          // 检查是否是逗号分隔的多个状态值
          const statusStr = req.query.status as string;
          if (statusStr.includes(',')) {
            statusFilter = statusStr.split(',').map(s => s.trim());
          } else {
            statusFilter = statusStr;
          }
        }
      }
      
      const params: any = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string || 'created_at',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        filters: {
          status: statusFilter,
          driverId: req.query.driver_id as string,
          vehicleId: req.query.vehicle_id as string,
        }
      };

      const result = await dbService.getTrips(req.user!.tenantId, params);

      res.json({
        ...result,
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get trips error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get trips' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 获取单个行程
router.get('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const trip = await dbService.getTrip(req.user!.tenantId, req.params.id);
      
      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trip not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: trip,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get trip error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get trip' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 创建行程
router.post('/',
  authMiddleware,
  tenantMiddleware,
  validateRequest({ body: tripCreateSchema }),
  async (req, res) => {
    try {
      const trip = await dbService.createTrip(req.user!.tenantId, req.body);

      res.status(201).json({
        success: true,
        data: trip,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Create trip error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create trip' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 更新行程
router.put('/:id',
  authMiddleware,
  tenantMiddleware,
  validateRequest({ body: tripUpdateSchema }),
  async (req, res) => {
    try {
      const trip = await dbService.updateTrip(req.user!.tenantId, req.params.id, req.body);

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trip not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: trip,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Update trip error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update trip' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 删除行程
router.delete('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const success = await dbService.deleteTrip(req.user!.tenantId, req.params.id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trip not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        message: 'Trip deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Delete trip error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete trip' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 将运单挂载到行程
router.post('/:id/shipments',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { shipmentIds } = req.body;
      
      if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Shipment IDs are required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      const result = await dbService.mountShipmentsToTrip(req.user!.tenantId, req.params.id, shipmentIds);

      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Mount shipments to trip error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to mount shipments to trip' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 更新行程状态
router.patch('/:id/status',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Status is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      const trip = await dbService.updateTripStatus(req.user!.tenantId, req.params.id, status);

      if (!trip) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Trip not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: trip,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Update trip status error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update trip status' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

export default router;
