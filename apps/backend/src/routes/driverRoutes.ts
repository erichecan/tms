import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest, driverCreateSchema, driverUpdateSchema } from '../middleware/validationMiddleware';

const router = Router();
const dbService = new DatabaseService();

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

      res.json({
        ...result,
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get drivers error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get drivers' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
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
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
      const driver = await dbService.getDriver(req.user!.tenantId, req.params.id!);
      
      if (!driver) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: driver,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get driver error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get driver' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
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
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
      const driver = await dbService.createDriver(req.user!.tenantId, req.body);

      res.status(201).json({
        success: true,
        data: driver,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Create driver error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create driver' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
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
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: driver,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Update driver error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update driver' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
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
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Driver not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        message: 'Driver deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Delete driver error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete driver' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

export default router;
