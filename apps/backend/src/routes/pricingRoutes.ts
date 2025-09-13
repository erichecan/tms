// 报价路由
// 创建时间: 2025-01-27 15:30:45

import { Router } from 'express';
import { PricingController } from '../controllers/PricingController';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();

// 初始化服务
const dbService = new DatabaseService();
const ruleEngineService = new RuleEngineService(dbService);
const pricingController = new PricingController(dbService, ruleEngineService);

// 应用中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @route POST /api/v1/pricing/quote
 * @desc 生成报价
 * @access Private
 */
router.post('/quote',
  validateRequest({
    body: {
      customerId: { type: 'string', required: true },
      pickupAddress: {
        type: 'object',
        required: true,
        properties: {
          street: { type: 'string', required: true },
          city: { type: 'string', required: true },
          state: { type: 'string', required: true },
          postalCode: { type: 'string', required: true },
          country: { type: 'string', required: true },
          coordinates: {
            type: 'object',
            required: false,
            properties: {
              lat: { type: 'number', required: true },
              lng: { type: 'number', required: true }
            }
          }
        }
      },
      deliveryAddress: {
        type: 'object',
        required: true,
        properties: {
          street: { type: 'string', required: true },
          city: { type: 'string', required: true },
          state: { type: 'string', required: true },
          postalCode: { type: 'string', required: true },
          country: { type: 'string', required: true },
          coordinates: {
            type: 'object',
            required: false,
            properties: {
              lat: { type: 'number', required: true },
              lng: { type: 'number', required: true }
            }
          }
        }
      },
      cargoInfo: {
        type: 'object',
        required: true,
        properties: {
          description: { type: 'string', required: true },
          weight: { type: 'number', required: true },
          volume: { type: 'number', required: true },
          dimensions: {
            type: 'object',
            required: true,
            properties: {
              length: { type: 'number', required: true },
              width: { type: 'number', required: true },
              height: { type: 'number', required: true }
            }
          },
          value: { type: 'number', required: true },
          specialRequirements: { type: 'array', required: false },
          hazardous: { type: 'boolean', required: true }
        }
      },
      deliveryTime: { type: 'string', required: false },
      weekendDelivery: { type: 'boolean', required: false },
      needsTailgate: { type: 'boolean', required: false }
    }
  }),
  pricingController.generateQuote.bind(pricingController)
);

/**
 * @route POST /api/v1/pricing/shipments/:id/additional-fee
 * @desc 添加追加费用
 * @access Private
 */
router.post('/shipments/:id/additional-fee',
  validateRequest({
    body: {
      type: { type: 'string', enum: ['fuel', 'toll', 'waiting', 'overtime', 'special', 'other'], required: true },
      description: { type: 'string', required: true },
      amount: { type: 'number', required: true },
      appliedBy: { type: 'string', required: true }
    }
  }),
  pricingController.addAdditionalFee.bind(pricingController)
);

/**
 * @route GET /api/v1/pricing/history
 * @desc 获取报价历史
 * @access Private
 */
router.get('/history', pricingController.getQuoteHistory.bind(pricingController));

export default router;
