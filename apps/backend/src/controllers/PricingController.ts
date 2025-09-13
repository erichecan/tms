// 报价控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { PricingService, QuoteRequest } from '../services/PricingService';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { logger } from '../utils/logger';

export class PricingController {
  private pricingService: PricingService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService) {
    this.pricingService = new PricingService(ruleEngineService, dbService);
  }

  /**
   * 生成报价
   * @param req 请求对象
   * @param res 响应对象
   */
  async generateQuote(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const quoteRequest: QuoteRequest = req.body;
      
      // 验证必需字段
      if (!quoteRequest.customerId || !quoteRequest.pickupAddress || !quoteRequest.deliveryAddress || !quoteRequest.cargoInfo) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: customerId, pickupAddress, deliveryAddress, cargoInfo' 
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const quote = await this.pricingService.generateQuote(tenantId, quoteRequest);
      
      res.json({
        success: true,
        data: quote,
        message: 'Quote generated successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to generate quote:', error);
      
      if (error.message.includes('Customer not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to generate quote' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 添加追加费用
   * @param req 请求对象
   * @param res 响应对象
   */
  async addAdditionalFee(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const { type, description, amount, appliedBy } = req.body;
      
      if (!type || !description || !amount || !appliedBy) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: type, description, amount, appliedBy' 
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const shipment = await this.pricingService.addAdditionalFee(tenantId, shipmentId, {
        type,
        description,
        amount,
        appliedBy
      });
      
      res.json({
        success: true,
        data: shipment,
        message: 'Additional fee added successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to add additional fee:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to add additional fee' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      }
    }
  }

  /**
   * 获取报价历史
   * @param req 请求对象
   * @param res 响应对象
   */
  async getQuoteHistory(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const customerId = req.query.customerId as string;
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const history = await this.pricingService.getQuoteHistory(tenantId, customerId, startDate, endDate);
      
      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Failed to get quote history:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get quote history' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
}
