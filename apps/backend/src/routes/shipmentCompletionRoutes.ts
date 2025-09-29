// 运单完成和财务生成API路由
// 创建时间: 2025-09-29 03:30:00
// 作用: 处理运单完成时的财务记录自动生成

import { Router } from 'express';
import Joi from 'joi';
import { PricingFinancialIntegration } from '../services/PricingFinancialIntegration';
import { PricingEngineService } from '../services/PricingEngineService';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

export const shipmentCompletionRoutes = Router();

// 初始化服务
const dbService = new DatabaseService();
const pricingService = new PricingEngineService(dbService);
const financeIntegration = new PricingFinancialIntegration(dbService, pricingService);

// =====================================================
// API路由处理程序
// =====================================================

/**
 * POST /api/shipments/:id/complete - 完成运单并生成财务记录
 */
shipmentCompletionRoutes.post('/:id/complete', async (req, res) => {
  const { id: shipmentId } = req.params;
  
  try {
    // 验证请求体
    const schema = Joi.object({
      finalCost: Joi.number().positive().required(),
      currency: Joi.string().length(3).default('CAD'),
      adjustmentReason: Joi.string().optional(),
      components: Joi.array().items(
        Joi.object({
          code: Joi.string().required(),
          label: Joi.string().required(),
          amount: Joi.number().required()
        })
      ).optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: error.details[0].message
        },
        timestamp: new Date().toISOString()
      });
    }

    const { finalCost, currency, adjustmentReason, components } = value;

    // 验证运单状态
    const shipment = await dbService.query(
      'SELECT * FROM shipments WHERE id = $1',
      [shipmentId]
    );

    if (shipment.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHIPMENT_NOT_FOUND',
          message: '运单不存在'
        },
        timestamp: new Date().toISOString()
      });
    }

    if (shipment.rows[0].status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATUS',
          message: '运单状态必须为delivered才能完成'
        },
        timestamp: new Date().toISOString()
      });
    }

    // 触发财务记录生成
    await financeIntegration.generateFinancialRecordsOnCompletion(shipmentId, finalCost);

    logger.info(`运单 ${shipmentId} 已完成`, {
      finalCost,
      currency,
      components: components?.length || 0
    });

    res.json({
      success: true,
      data: {
        shipmentId,
        status: 'completed',
        finalCost,
        currency,
        financialRecordsGenerated: true,
        completedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`完成运单失败`, { shipmentId, error });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'COMPLETION_ERROR',
        message: error.message || '完成运单时发生内部错误'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/shipments/:id/pricing-preview - 运单计费预览
 */
shipmentCompletionRoutes.get('/:id/pricing-preview', async (req, res) => {
  const { id: shipmentId } = req.params;
  
  try {
    // 获取运数详情
    const shipment = await dbService.query(`
      SELECT shipment_id, id, customer_id, driver_id, tenant_id,
              pickup_address, delivery_address, cargo_info, weight_kg,
              pricing_template_id, created_at
      FROM shipments 
      WHERE id = $1
    `, [shipmentId]);

    if (shipment.rowCount === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SHIPMENT_NOT_FOUND',
          message: '运单不存在'
        },
        timestamp: new Date().toISOString()
      });
    }

    const shipmentData = shipment.rows[0];

    // 如果没有定价模板，返回基础费用结构
    if (!shipmentData.pricing_template_id) {
      const basePreview = {
        success: true,
        data: {
          shipmentId,
          previewType: 'basic_estimation',
          estimatedCost: null,
          pricingData: {
            description: '运单暂无定价规则，请配置模板后重新预览',
            components: [],
            driverCompensation: null,
            netRevenue: null
          },
          note: '需要选择合适的定价模板才能提供准确的计费预览'
        },
        timestamp: new Date().toISOString()
      };

      return res.json(basePreview);
    }

    // 构建运单上下文
    const contexts = {
      shipmentId: shipmentData.id,
      tenantId: shipmentData.tenant_id,
      customerId: shipmentData.customer_id,
      driverId: shipmentData.driver_id,
      pickupLocation: {
        address: shipmentData.pickup_address?.street || '未知地址',
        city: shipmentData.pickup_address?.city || '未知城市'
      },
      deliveryLocation: {
        address: shipmentData.delivery_address?.street || '未知地址', 
        city: shipmentData.delivery_address?.city || '未知城市'
      },
      distance: shipmentData.cargo_info?.distance || 25,
      weight: shipmentData.weight_kg || 0,
      volume: shipmentData.cargo_info?.volume,
      pallets: shipmentData.cargo_info?.pallets || 1,
      cargoType: shipmentData.cargo_info?.type || 'GENERAL_MERCHANDISE'
    };

    // 调用定价引擎
    const pricingCalculation = await pricingService.calculatePricing(
      contexts,
      shipmentData.pricing_template_id
    );

    res.json({
      success: true,
      data: {
        shipmentId,
        previewType: 'rule_engine_calculation',
        templateUsed: shipmentData.pricing_template_id,
        calculatedAt: pricingCalculation.calculatedAt,
        pricingData: pricingCalculation,
        confidence: 'high'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`运单计费预览失败`, { shipmentId, error });

    // 如果是定价引擎错误，返回友好提示
    if (error.message?.includes('TEMPLATE_NOT_FOUND')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'PRICING_TEMPLATE_NOT_FOUND',
          message: '定价模板不存在或已被删除，请重新选择模板'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(500).json({
      success: false,
      error: {
        code: 'PRICING_PREVIEW_ERROR',
        message: '计费预览时发生错误，请稍后重试'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/shipments/bulk-complete - 批量完成运单
 */
shipmentCompletionRoutes.post('/bulk-complete', async (req, res) => {
  try {
    const schema = Joi.object({
      shipments: Joi.array().items(
        Joi.object({
          shipmentId: Joi.string().uuid().required(),
          finalCost: Joi.number().positive().required(),
          currency: Joi.string().length(3).default('CAD')
        })
      ).min(1).max(50).required(),
      batchId: Joi.string().optional()
    });

    const { error, value } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR', 
          message: error.details[0].message
        },
        timestamp: new Date().toISOString()
      });
    }

    const { shipments, batchId } = value;
    const results = [];
    const errors = [];

    // 异步并发处理每个运单
    const promises = shipments.map(async (shipment: any) => {
      try {
        await financeIntegration.generateFinancialRecordsOnCompletion(
          shipment.shipmentId, 
          shipment.finalCost
        );
        
        results.push({
          shipmentId: shipment.shipmentId,
          status: 'completed',
          finalCost: shipment.finalCost
        });

      } catch (error) {
        errors.push({
          shipmentId: shipment.shipmentId,
          error: error.message,
          finalCost: shipment.finalCost
        });
      }
    });

    await Promise.all(promises);

    logger.info(`批量完成运单任务`, {
      batchId,
      total: shipments.length,
      success: results.length,
      failed: errors.length
    });

    res.json({
      success: true,
      data: {
        batchId: batchId || `batch_${Date.now()}`,
        summary: {
          total: shipments.length,
          completed: results.length,
          failed: errors.length
        },
        results,
        errors
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`批量完成运单失败`, error);
    
    res.status(500).json({
      success: false,
      error: {
        code: 'BULK_COMPLETION_ERROR',
        message: '批量完成运单时发生错误'
      },
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/shipments/:id/financial-sync-status - 检查财务记录同步状态
 */
shipmentCompletionRoutes.get('/:id/financial-sync-status', async (req, res) => {
  const { id: shipmentId } = req.params;

  try {
    const syncStatus = await financeIntegration.checkFinancialRecordSync(shipmentId);

    res.json({
      success: true,
      data: {
        shipmentId,
        ...syncStatus,
        checkedAt: new Date().toISOString()
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    logger.error(`检查财务同步状态失败`, { shipmentId, error });
    
    res.status(500).json({
      success: false,
      error: {
        code: 'SYNC_CHECK_ERROR',
        message: '检查财务同步状态时发生错误'
      },
      timestamp: new Date().toISOString()
    });
  }
});

export default shipmentCompletionRoutes;
