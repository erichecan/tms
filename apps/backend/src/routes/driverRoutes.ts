import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest, driverCreateSchema, driverUpdateSchema } from '../middleware/validationMiddleware';
import { RuleEngineService } from '../services/RuleEngineService'; // 2025-11-11 14:56:20 驾驶员确认依赖
import { ShipmentService } from '../services/ShipmentService'; // 2025-11-11 14:56:20 驾驶员确认依赖
import { sendSuccess, handleApiError, sendError } from '../utils/apiUtils'; // 2025-12-24 Added

const router = Router();
const dbService = new DatabaseService();
const ruleEngineService = new RuleEngineService(dbService); // 2025-11-11 14:56:20
const shipmentService = new ShipmentService(dbService, ruleEngineService); // 2025-11-11 14:56:20

// 获取司机列表
router.get('/',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const params: any = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string || 'created_at',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        filters: {
          status: req.query.status as string,
        }
      };

      const result = await dbService.getDrivers(req.user!.tenantId, params);
      return sendSuccess(res, result);
    } catch (error) {
      return handleApiError(res, error, 'Failed to get drivers');
    }
  }
);

// 获取单个司机
router.get('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Tenant not found');
      }
      const driver = await dbService.getDriver(req.user!.tenantId, req.params.id!);

      if (!driver) {
        return sendError(res, 404, 'NOT_FOUND', 'Driver not found');
      }

      return sendSuccess(res, driver);
    } catch (error) {
      return handleApiError(res, error, 'Failed to get driver');
    }
  }
);

// 创建司机
router.post('/',
  authMiddleware,
  tenantMiddleware,
  validateRequest({ body: driverCreateSchema }),
  async (req, res) => {
    try {
      if (!req.user?.tenantId) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Tenant not found');
      }
      const driver = await dbService.createDriver(req.user!.tenantId, req.body);

      return sendSuccess(res, driver, 'Driver created successfully', 201);
    } catch (error) {
      return handleApiError(res, error, 'Failed to create driver');
    }
  }
);

// 更新司机
router.put('/:id',
  authMiddleware,
  tenantMiddleware,
  validateRequest({ body: driverUpdateSchema }),
  async (req, res) => {
    try {
      const driver = await dbService.updateDriver(req.user!.tenantId, req.params.id, req.body);

      if (!driver) {
        return sendError(res, 404, 'NOT_FOUND', 'Driver not found');
      }

      return sendSuccess(res, driver);
    } catch (error) {
      return handleApiError(res, error, 'Failed to update driver');
    }
  }
);

// 删除司机
router.delete('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const success = await dbService.deleteDriver(req.user!.tenantId, req.params.id);

      if (!success) {
        return sendError(res, 404, 'NOT_FOUND', 'Driver not found');
      }

      return sendSuccess(res, null, 'Driver deleted successfully');
    } catch (error) {
      return handleApiError(res, error, 'Failed to delete driver');
    }
  }
);

router.post(
  '/assignments/:shipmentId/acknowledge',
  authMiddleware,
  tenantMiddleware,
  validateRequest({
    body: {
      accepted: { type: 'boolean', required: true },
      note: { type: 'string', required: false }
    }
  }),
  async (req, res) => {
    try {
      if (!req.user?.tenantId || !req.user?.id) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Driver identity not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      if (req.user.role !== 'driver') {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Only drivers can acknowledge assignments' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      const shipment = await shipmentService.acknowledgeAssignment(
        req.user.tenantId,
        req.params.shipmentId,
        req.user.id,
        req.body.accepted,
        req.body.note
      ); // 2025-11-11 14:56:20

      res.json({
        success: true,
        data: shipment,
        message: req.body.accepted ? 'Assignment acknowledged' : 'Assignment declined',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error: any) {
      console.error('Driver acknowledgement error:', error);
      if (error.message.includes('not found') || error.message.includes('Driver not assigned')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to acknowledge assignment' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }
); // 2025-11-11 14:56:20 驾驶员确认接口

export default router;
