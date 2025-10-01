// 计费规则引擎控制器
// 创建时间: 2025-09-29 02:30:00
// 作用: 处理计费规则引擎相关的HTTP请求

import { Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { PricingEngineService } from '../services/PricingEngineService';
import { logger } from '../utils/logger';
import {
  PricingTemplateCreateRequest,
  PricingTemplateUpdateRequest,
  PricingCalculationRequest,
  PricingPreviewResponse,
  PricingTemplateTestRequest,
  ShipmentContext
} from '@tms/shared-types';

export class PricingEngineController {
  private pricingService: PricingEngineService;

  constructor(dbService: DatabaseService) {
    this.pricingService = new PricingEngineService(dbService);
    logger.info('PricingEngineController 初始化完成');
  }

  // =====================================================
  // 1. 计费模板管理
  // =====================================================

  /**
   * 获取计费模板列表
   * GET /api/pricing/templates
   */
  async getTemplates(req: Request, res: Response): Promise<void> {
    try {
      logger.info('获取计费模板列表请求');
      
      const templates = await this.pricingService.getPricingTemplates();
      
      res.status(200).json({
        success: true,
        data: templates,
        count: templates.length,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取计费模板列表失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取计费模板列表失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 根据ID获取计费模板
   * GET /api/pricing/templates/:id
   */
  async getTemplateById(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      
      if (!templateId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '模板ID不能为空'
          }
        });
        return;
      }

      logger.info(`获取计费模板详情请求: ${templateId}`);
      
      const template = await this.pricingService.getPricingTemplateById(templateId);
      
      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `模板 ${templateId} 不存在`
          }
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: template,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`获取计费模板失败: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: '获取计费模板失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 创建计费模板
   * POST /api/pricing/templates
   */
  async createTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateData: PricingTemplateCreateRequest = req.body;
      
      logger.info('创建计费模板请求', {
        name: templateData.name,
        type: templateData.type
      });

      // 验证必要字段
      if (!templateData.name || !templateData.type) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '模板名称和类型不能为空'
          }
        });
        return;
      }

      // 创建模板 - 这里需要实现模板创建逻辑
      // 暂时返回模拟数据
      const newTemplate = {
        id: `TEMPLATE_${Date.now()}`,
        tenantId: process.env.CURRENT_TENANT_ID || 'default-tenant',
        name: templateData.name,
        description: templateData.description,
        type: templateData.type,
        businessConditions: templateData.businessConditions,
        pricingRules: templateData.pricingRules,
        driverRules: templateData.driverRules,
        costAllocation: templateData.costAllocation,
        status: 'active',
        version: 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: newTemplate,
        message: '计费模板创建成功',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('创建计费模板失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'CREATE_TEMPLATE_ERROR',
          message: '创建计费模板失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 更新计费模板
   * PUT /api/pricing/templates/:id
   */
  async updateTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      const updateData: PricingTemplateUpdateRequest = req.body;
      
      logger.info(`更新计费模板请求: ${templateId}`);

      if (!templateId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '模板ID不能为空'
          }
        });
        return;
      }

      // 更新模板逻辑
      // 暂时返回模拟数据
      res.status(200).json({
        success: true,
        data: { id: templateId, ...updateData, updatedAt: new Date().toISOString() },
        message: '计费模板更新成功',
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`更新计费模板失败: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_TEMPLATE_ERROR',
          message: '更新计费模板失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // =====================================================
  // 2. 计费计算
  // =====================================================

  /**
   * 执行计费计算
   * POST /api/pricing/calculate
   */
  async calculatePricing(req: Request, res: Response): Promise<void> {
    try {
      const calculationRequest: PricingCalculationRequest = req.body;
      
      logger.info('执行计费计算请求', {
        shipmentId: calculationRequest.shipmentContext.shipmentId,
        templateId: calculationRequest.templateId || 'auto-detect'
      });

      // 验证输入
      if (!calculationRequest.shipmentContext) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '运单上下文信息不能为空'
          }
        });
        return;
      }

      // 执行计费计算
      const calculation = await this.pricingService.calculatePricing(
        calculationRequest.shipmentContext,
        calculationRequest.templateId
      );

      res.status(200).json({
        success: true,
        data: calculation,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('计费计算失败', error);
      
      // 2025-10-01 14:52:45 使用通用错误形状判断，避免依赖具体类
      if ((error as any)?.code) {
        res.status(400).json({
          success: false,
          error: {
            code: (error as any).code,
            message: (error as Error).message,
            details: (error as any).details
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'CALCULATION_ERROR',
            message: '计费计算失败',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 预览计费结果（不保存）
   * POST /api/pricing/preview
   */
  async previewPricing(req: Request, res: Response): Promise<void> {
    try {
      const previewRequest: { shipmentContext: ShipmentContext } = req.body;
      
      logger.info('预览计费结果请求', {
        shipmentId: previewRequest.shipmentContext.shipmentId
      });

      if (!previewRequest.shipmentContext) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '运单上下文信息不能为空'
          }
        });
        return;
      }

      // 执行预览计算
      const preview: PricingPreviewResponse = {
        calculation: await this.pricingService.previewPricing(previewRequest.shipmentContext)
      };

      res.status(200).json({
        success: true,
        data: preview,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('预览计费结果失败', error);
      
      if ((error as any)?.code) {
        res.status(400).json({
          success: false,
          error: {
            code: (error as any).code,
            message: (error as Error).message,
            details: (error as any).details
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'PREVIEW_ERROR',
            message: '预览计费结果失败',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * 重新计算运单费用
   * POST /api/pricing/recalculate/:shipmentId
   */
  async recalculateShipment(req: Request, res: Response): Promise<void> {
    try {
      const shipmentId = req.params.shipmentId;
      
      logger.info(`重新计算运单费用请求: ${shipmentId}`);

      if (!shipmentId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '运单ID不能为空'
          }
        });
        return;
      }

      // 重新计算
      const calculation = await this.pricingService.recalculateShipmentPricing(shipmentId);

      res.status(200).json({
        success: true,
        data: calculation,
        message: `运单 ${shipmentId} 费用重新计算完成`,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`重新计算运单费用失败: ${req.params.shipmentId}`, error);
      
      if ((error as any)?.code) {
        res.status(400).json({
          success: false,
          error: {
            code: (error as any).code,
            message: (error as Error).message,
            details: (error as any).details
          },
          timestamp: new Date().toISOString()
        });
      } else {
        res.status(500).json({
          success: false,
          error: {
            code: 'RECALCULATE_ERROR',
            message: '重新计算运单费用失败',
            details: error instanceof Error ? error.message : 'Unknown error'
          },
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  // =====================================================
  // 3. 规则测试与验证
  // =====================================================

  /**
   * 测试计费模板
   * POST /api/pricing/templates/:id/test
   */
  async testTemplate(req: Request, res: Response): Promise<void> {
    try {
      const templateId = req.params.id;
      const testRequest: PricingTemplateTestRequest = req.body;
      
      logger.info(`测试计费模板请求: ${templateId}`);

      if (!templateId || !testRequest.testScenarios) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '模板ID和测试场景不能为空'
          }
        });
        return;
      }

      // 获取模板
      const template = await this.pricingService.getPricingTemplateById(templateId);
      if (!template) {
        res.status(404).json({
          success: false,
          error: {
            code: 'TEMPLATE_NOT_FOUND',
            message: `模板 ${templateId} 不存在`
          }
        });
        return;
      }

      // 执行测试
      const testResults = [];
      
      for (const scenario of testRequest.testScenarios) {
        try {
          // 2025-10-01 14:53:30 修复类型：将 Partial<ShipmentContext> 合并为完整上下文（填充必需字段）
          const context = {
            shipmentId: (scenario.context as any).shipmentId || 'TEMP',
            tenantId: (scenario.context as any).tenantId || 'TEMP',
            pickupLocation: (scenario.context as any).pickupLocation || { address: 'unknown', city: 'unknown' },
            deliveryLocation: (scenario.context as any).deliveryLocation || { address: 'unknown', city: 'unknown' },
            distance: (scenario.context as any).distance || 0,
            weight: (scenario.context as any).weight || 0,
            volume: (scenario.context as any).volume,
            pallets: (scenario.context as any).pallets,
            customerTier: (scenario.context as any).customerTier,
            cargoType: (scenario.context as any).cargoType
          } as ShipmentContext;
          const calculation = await this.pricingService.calculatePricing(context, templateId);
          testResults.push({
            scenario: scenario.context,
            result: calculation,
            success: true,
            errors: []
          });
        } catch (error) {
          testResults.push({
            scenario: scenario.context,
            result: null,
            success: false,
            errors: [error instanceof Error ? error.message : 'Unknown error']
          });
        }
      }

      res.status(200).json({
        success: true,
        data: {
          templateId,
          templateName: template.name,
          testResults,
          summary: {
            total: testRequest.testScenarios.length,
            passed: testResults.filter(r => r.success).length,
            failed: testResults.filter(r => !r.success).length
          }
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error(`测试计费模板失败: ${req.params.id}`, error);
      res.status(500).json({
        success: false,
        error: {
          code: 'TEST_TEMPLATE_ERROR',
          message: '测试计费模板失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // =====================================================
  // 4. 计费分析报告
  // =====================================================

  /**
   * 获取计费分析报告
   * GET /api/pricing/reports/analysis
   */
  async getAnalysisReport(req: Request, res: Response): Promise<void> {
    try {
      const { dateFrom, dateTo, templateId } = req.query;
      
      logger.info('获取计费分析报告请求', { dateFrom, dateTo, templateId });

      // 这里应该实现具体的分析报告逻辑
      // 暂时返回模拟数据
      const report = {
        period: {
          from: dateFrom || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          to: dateTo || new Date().toISOString()
        },
        templates: {
          total: 3,
          active: 2,
          inactive: 1
        },
        shipments: {
          total: 150,
          calculated: 145,
          pending: 5
        },
        revenue: {
          total: 18500.00,
          avgPerShipment: 123.33,
          trends: {
            growth: 12.5,
            period: 'this_month'
          }
        },
        cost_breakdown: {
          driver_pay: 8500.00,
          internal_costs: 4500.00,
          gross_profit: 5500.00,
          profit_margin: 29.73
        }
      };

      res.status(200).json({
        success: true,
        data: report,
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('获取计费分析报告失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'ANALYSIS_REPORT_ERROR',
          message: '获取计费分析报告失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }

  // =====================================================
  // 5. 业务场景检测
  // =====================================================

  /**
   * 检测业务场景类型
   * POST /api/pricing/detect-scenario
   */
  async detectScenario(req: Request, res: Response): Promise<void> {
    try {
      const { shipmentContext } = req.body;
      
      logger.info('检测业务场景类型请求', {
        shipmentId: shipmentContext?.shipmentId
      });

      if (!shipmentContext) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: '运单上下文信息不能为空'
          }
        });
        return;
      }

      // 创建服务实例来访问私有方法（这里需要重构）
      // 暂时返回模拟检测结果
      const scenarios = [
        {
          type: 'WASTE_COLLECTION',
          confidence: 0.85,
          description: '垃圾清运动场景',
          matchFactors: ['目的地包含垃圾场关键词', '返回路线标识']
        },
        {
          type: 'WAREHOUSE_TRANSFER',
          confidence: 0.95,
          description: '仓库转运场景',
          matchFactors: ['7号仓库起点', '亚马逊仓库终点', '需要预约']
        },
        {
          type: 'CLIENT_DIRECT',
          confidence: 0.7,
          description: '客户直运场景',
          matchFactors: ['客户地址起点', '直接送达']
        }
      ];

      // 2025-10-01 14:50:35 修复拼写错误：current-confidence 应为 current.confidence
      const bestMatch = scenarios.reduce((prev, current) => 
        current.confidence > prev.confidence ? current : prev
      );

      res.status(200).json({
        success: true,
        data: {
          detectedScenario: bestMatch,
          allScenarios: scenarios,
          recommendedTemplate: await this.pricingService.findBestTemplate(shipmentContext)
        },
        timestamp: new Date().toISOString()
      });
      
    } catch (error) {
      logger.error('检测业务场景失败', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'SCENARIO_DETECTION_ERROR',
          message: '检测业务场景失败',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        timestamp: new Date().toISOString()
      });
    }
  }
}
