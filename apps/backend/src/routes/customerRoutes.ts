import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest, customerCreateSchema, customerUpdateSchema } from '../middleware/validationMiddleware';

const router = Router();
const dbService = new DatabaseService();

// 获取客户列表
router.get('/',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { limit = 10, offset = 0, level, search } = req.query;
      const customers = await dbService.getCustomers({
        tenantId: req.user!.tenantId,
        limit: Number(limit),
        offset: Number(offset),
        level: level as string,
        search: search as string
      });

      res.json({
        success: true,
        data: customers,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get customers' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 获取单个客户
router.get('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const customer = await dbService.getCustomer(req.user!.tenantId, req.params.id);
      
      if (!customer) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: customer,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get customer' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 创建客户
router.post('/',
  authMiddleware,
  tenantMiddleware,
  validateRequest({ body: customerCreateSchema }),
  async (req, res) => {
    try {
      const customer = await dbService.createCustomer({
        ...req.body,
        tenantId: req.user!.tenantId
      });

      res.status(201).json({
        success: true,
        data: customer,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Create customer error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create customer' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 更新客户
router.put('/:id',
  authMiddleware,
  tenantMiddleware,
  validateRequest({ body: customerUpdateSchema }),
  async (req, res) => {
    try {
      const customer = await dbService.updateCustomer(req.user!.tenantId, req.params.id, req.body);

      if (!customer) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: customer,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Update customer error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update customer' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 删除客户
router.delete('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const success = await dbService.deleteCustomer(req.user!.tenantId, req.params.id);

      if (!success) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Customer not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        message: 'Customer deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete customer' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

export default router;
