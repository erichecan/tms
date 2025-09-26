// 货币管理路由
// 创建时间: 2025-09-26 22:25:00

import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const dbService = new DatabaseService();

// 获取货币列表
router.get('/',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const currencies = await dbService.getCurrencies(req.user!.tenantId);
      
      res.json({
        success: true,
        data: currencies,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get currencies error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get currencies' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 获取单个货币
router.get('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const currency = await dbService.getCurrencyById(req.user!.tenantId, req.params.id);
      
      if (!currency) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Currency not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: currency,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Get currency error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get currency' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 创建货币
router.post('/',
  authMiddleware,
  tenantMiddleware,
  validateRequest({
    body: {
      code: { type: 'string', required: true, minLength: 3, maxLength: 3 },
      name: { type: 'string', required: true },
      symbol: { type: 'string', required: true },
      exchangeRate: { type: 'number', required: true, min: 0 },
      isDefault: { type: 'boolean', required: false },
      isActive: { type: 'boolean', required: false }
    }
  }),
  async (req, res) => {
    try {
      const { code, name, symbol, exchangeRate, isDefault = false, isActive = true } = req.body;

      // 如果设置为默认货币，先取消其他默认货币
      if (isDefault) {
        await dbService.updateDefaultCurrency(req.user!.tenantId, null);
      }

      const currency = await dbService.createCurrency(req.user!.tenantId, {
        code,
        name,
        symbol,
        exchangeRate,
        isDefault,
        isActive
      });

      res.status(201).json({
        success: true,
        data: currency,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Create currency error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to create currency' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 更新货币
router.put('/:id',
  authMiddleware,
  tenantMiddleware,
  validateRequest({
    body: {
      code: { type: 'string', required: false, minLength: 3, maxLength: 3 },
      name: { type: 'string', required: false },
      symbol: { type: 'string', required: false },
      exchangeRate: { type: 'number', required: false, min: 0 },
      isDefault: { type: 'boolean', required: false },
      isActive: { type: 'boolean', required: false }
    }
  }),
  async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // 如果设置为默认货币，先取消其他默认货币
      if (updates.isDefault) {
        await dbService.updateDefaultCurrency(req.user!.tenantId, null);
      }

      const currency = await dbService.updateCurrency(req.user!.tenantId, id, updates);

      if (!currency) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Currency not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      res.json({
        success: true,
        data: currency,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Update currency error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to update currency' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 删除货币
router.delete('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // 检查货币是否存在
      const currency = await dbService.getCurrencyById(req.user!.tenantId, id);
      if (!currency) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Currency not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      // 不能删除默认货币
      if (currency.isDefault) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Cannot delete default currency' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      await dbService.deleteCurrency(req.user!.tenantId, id);

      res.json({
        success: true,
        message: 'Currency deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Delete currency error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to delete currency' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

// 设置默认货币
router.post('/:id/set-default',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const { id } = req.params;

      // 检查货币是否存在
      const currency = await dbService.getCurrencyById(req.user!.tenantId, id);
      if (!currency) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Currency not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }

      // 先取消其他默认货币
      await dbService.updateDefaultCurrency(req.user!.tenantId, null);
      
      // 设置新的默认货币
      await dbService.updateCurrency(req.user!.tenantId, id, { isDefault: true });

      res.json({
        success: true,
        message: 'Default currency updated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      console.error('Set default currency error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to set default currency' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
);

export default router;
