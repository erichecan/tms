// 计费规则引擎API路由
// 创建时间: 2025-09-29 02:35:00
// 作用: 定义计费规则引擎的RESTful API接口

import { Router } from 'express';
import Joi from 'joi';
import { PricingEngineController } from '../controllers/PricingEngineController';
import { DatabaseService } from '../services/DatabaseService';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const dbService = new DatabaseService();
const controller = new PricingEngineController(dbService);

// =====================================================
// 请求验证Schema
// =====================================================

const businessConditionsSchema = Joi.object({
  pickupType: Joi.string().valid('OWN_WAREHOUSE', 'CLIENT_LOCATION', 'INTERNAL').optional(),
  deliveryType: Joi.string().valid('THIRD_PARTY_WAREHOUSE', 'DISPOSAL_SITE', 'CLIENT_ADDRESS').optional(),
  isReturnTrip: Joi.boolean().optional(),
  requiresAppointment: Joi.boolean().optional(),
  customerType: Joi.string().valid('INTERNAL', 'EXTERNAL').optional(),
  customerTier: Joi.string().valid('VIP', 'STANDARD', 'PREMIUM').optional(),
  destinationWarehouse: Joi.string().valid('AMAZON', 'CUSTOM_WAREHOUSE').optional(),
  warehouseType: Joi.string().valid('OWN_WAREHOUSE', 'THIRD_PARTY_WAREHOUSE', 'DISPOSAL_SITE').optional(),
  cargoType: Joi.string().valid('GENERAL_MERCHANDISE', 'WASTE', 'FRAGILE').optional(),
  hazardousMaterials: Joi.boolean().optional(),
  requiresColdChain: Joi.boolean().optional()
});

const pricingRuleSchema = Joi.object({
  name: Joi.string().required(),
  component: Joi.string().required(),
  condition: Joi.string().optional(),
  formula: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  priority: Joi.number().required(),
  description: Joi.string().optional()
});

const driverRuleSchema = Joi.object({
  name: Joi.string().required(),
  component: Joi.string().required(),
  condition: Joi.string().optional(),
  formula: Joi.alternatives().try(Joi.number(), Joi.string()).required(),
  priority: Joi.number().required(),
  driverSharing: Joi.number().optional()
});

const costAllocationSchema = Joi.object().pattern(
  Joi.string(),
  Joi.alternatives().try(Joi.number(), Joi.string().valid('auto_calculated'))
);

const shipmentLocationSchema = Joi.object({
  warehouseId: Joi.string().uuid().optional(),
  warehouseCode: Joi.string().optional(),
  warehouseType: Joi.string().optional(),
  address: Joi.string().required(),
  city: Joi.string().required()
});

const shipmentContextSchema = Joi.object({
  shipmentId: Joi.alternatives().try(Joi.string().uuid(), Joi.string()).required(), // 2025-11-29T22:25:00 允许非UUID字符串用于预览计算
  tenantId: Joi.string().required(),
  pickupLocation: shipmentLocationSchema.required(),
  deliveryLocation: shipmentLocationSchema.required(),
  distance: Joi.number().positive().required(),
  estimatedDrivingMinutes: Joi.number().positive().optional(),
  weight: Joi.number().positive().required(),
  volume: Joi.number().positive().optional(),
  pallets: Joi.number().integer().positive().optional(),
  dimensions: Joi.object({
    length: Joi.number().positive(),
    width: Joi.number().positive(),
    height: Joi.number().positive(),
    unit: Joi.string()
  }).optional(),
  pickupTime: Joi.string().isoDate().optional(),
  deliveryTime: Joi.string().isoDate().optional(),
  appointmentTime: Joi.string().optional(),
  actualWaitingTime: Joi.number().positive().optional(),
  customerId: Joi.string().uuid().optional(),
  customerTier: Joi.string().valid('VIP', 'STANDARD', 'PREMIUM').optional(),
  driverId: Joi.string().uuid().optional(),
  vehicleId: Joi.string().uuid().optional(),
  cargoType: Joi.string().optional(),
  isHazardous: Joi.boolean().optional(),
  isColdChain: Joi.boolean().optional(),
  requiresInsulated: Joi.boolean().optional()
});

// =====================================================
// 1. 计费模板管理
// =====================================================

// GET /api/pricing/templates - 获取模板列表
router.get('/templates', controller.getTemplates.bind(controller));

// GET /api/pricing/templates/:id - 获取模板详情
router.get('/templates/:id', controller.getTemplateById.bind(controller));

// POST /api/pricing/templates - 创建新模板
router.post(
  '/templates',
  validateRequest({
    body: Joi.object({
      name: Joi.string().required(),
      description: Joi.string().optional(),
      type: Joi.string().valid('WASTE_COLLECTION', 'WAREHOUSE_TRANSFER', 'CLIENT_DIRECT', 'CUSTOM').required(),
      businessConditions: businessConditionsSchema.required(),
      pricingRules: Joi.array().items(pricingRuleSchema).min(1).required(),
      driverRules: Joi.array().items(driverRuleSchema).min(1).required(),
      costAllocation: costAllocationSchema.required()
    })
  }),
  controller.createTemplate.bind(controller)
);

// PUT /api/pricing/templates/:id - 更新模板
router.put(
  '/templates/:id',
  validateRequest({
    body: Joi.object({
      name: Joi.string().optional(),
      description: Joi.string().optional(),
      type: Joi.string().valid('WASTE_COLLECTION', 'WAREHOUSE_TRANSFER', 'CLIENT_DIRECT', 'CUSTOM').optional(),
      businessConditions: businessConditionsSchema.optional(),
      pricingRules: Joi.array().items(pricingRuleSchema).optional(),
      driverRules: Joi.array().items(driverRuleSchema).optional(),
      costAllocation: costAllocationSchema.optional(),
      status: Joi.string().valid('active', 'inactive').optional()
    })
  }),
  controller.updateTemplate.bind(controller)
);

// =====================================================
// 2. 计费计算
// =====================================================

// POST /api/pricing/calculate - 执行计费计算
router.post(
  '/calculate',
  validateRequest({
    body: Joi.object({
      shipmentContext: shipmentContextSchema.required(),
      templateId: Joi.string().uuid().optional(),
      forceRecalculate: Joi.boolean().optional()
    })
  }),
  controller.calculatePricing.bind(controller)
);

// POST /api/pricing/preview - 预览计费结果（不保存）
router.post(
  '/preview',
  validateRequest({
    body: Joi.object({
      shipmentContext: shipmentContextSchema.required()
    })
  }),
  controller.previewPricing.bind(controller)
);

// POST /api/pricing/recalculate/:shipmentId - 重新计算运单费用
router.post(
  '/recalculate/:shipmentId',
  validateRequest({
    params: Joi.object({
      shipmentId: Joi.string().required()
    })
  }),
  controller.recalculateShipment.bind(controller)
);

// =====================================================
// 3. 规则测试与验证
// =====================================================

// POST /api/pricing/templates/:id/test - 测试模板
router.post(
  '/templates/:id/test',
  validateRequest({
    params: Joi.object({
      id: Joi.string().required()
    }),
    body: Joi.object({
      testScenarios: Joi.array().items(
        Joi.object({
          context: shipmentContextSchema.required(),
          expectedResult: Joi.object({
            totalRevenue: Joi.number().optional(),
            totalDriverPay: Joi.number().optional(),
            totalInternalCosts: Joi.number().optional(),
            netProfit: Joi.number().optional()
          }).optional()
        })
      ).min(1).required()
    })
  }),
  controller.testTemplate.bind(controller)
);

// =====================================================
// 4. 业务场景检测
// =====================================================

// POST /api/pricing/detect-scenario - 检测业务场景
router.post(
  '/detect-scenario',
  validateRequest({
    body: Joi.object({
      shipmentContext: shipmentContextSchema.required()
    })
  }),
  controller.detectScenario.bind(controller)
);

// =====================================================
// 5. 计费分析报告
// =====================================================

// GET /api/pricing/reports/analysis - 获取分析报告
router.get(
  '/reports/analysis',
  validateRequest({
    query: Joi.object({
      dateFrom: Joi.string().isoDate().optional(),
      dateTo: Joi.string().isoDate().optional(),
      templateId: Joi.string().uuid().optional(),
      customerTier: Joi.string().valid('VIP', 'STANDARD', 'PREMIUM').optional(),
      costType: Joi.string().valid('REVENUE', 'DRIVER_COMPENSATION', 'INTERNAL_COST').optional(),
      limit: Joi.number().integer().min(1).max(100).default(50).optional(),
      offset: Joi.number().integer().min(0).default(0).optional()
    })
  }),
  controller.getAnalysisReport.bind(controller)
);

// =====================================================
// 6. 计费组件管理（预留）
// =====================================================

// GET /api/pricing/components - 获取计费组件列表
router.get('/components', (req, res) => {
  // TODO: 实现组件管理
  res.json({
    success: true,
    message: '计费组件管理功能开发中',
    data: []
  });
});

// POST /api/pricing/components - 创建新组件
router.post('/components', (req, res) => {
  // TODO: 实现组件创建
  res.json({
    success: true,
    message: '组件创建功能开发中'
  });
});

// =====================================================
// 导出路由
// =====================================================

export default router;
