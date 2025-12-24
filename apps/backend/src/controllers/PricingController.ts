// 报价控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { PricingService, QuoteRequest } from '../services/PricingService';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { CurrencyService } from '../services/CurrencyService';
import { logger } from '../utils/logger';

import { v4 as uuidv4 } from 'uuid';

// Helper to get request ID safely
const getRequestId = (req: Request): string => {
  const requestId = req.headers['x-request-id'];
  const id = (Array.isArray(requestId) ? requestId[0] : requestId) || uuidv4();
  // 设置到请求对象上，方便后续透传
  (req as any).requestId = id;
  return id;
};

export class PricingController {
  private pricingService: PricingService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService, currencyService: CurrencyService) {
    this.pricingService = new PricingService(ruleEngineService, dbService, currencyService);
  }

  /**
   * 生成报价
   * @param req 请求对象
   * @param res 响应对象
   */
  async generateQuote(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId
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
          requestId
        });
        return;
      }

      const quote = await this.pricingService.generateQuote(tenantId, quoteRequest);

      res.json({
        success: true,
        data: quote,
        message: 'Quote generated successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to generate quote:`, error);

      if (error.message.includes('Customer not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to generate quote' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
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
          requestId
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
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to add additional fee:`, error);

      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to add additional fee' },
          timestamp: new Date().toISOString(),
          requestId
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
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const customerId = req.query.customerId as string || '';
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const history = await this.pricingService.getQuoteHistory(tenantId, customerId, startDate, endDate);

      res.json({
        success: true,
        data: history,
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to get quote history:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get quote history' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }

  async confirmQuote(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const shipmentId = req.params.id;

      if (!tenantId || !shipmentId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Shipment ID not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const { finalCost } = req.body as { finalCost?: number };
      const shipment = await this.pricingService.confirmQuote(tenantId, shipmentId, { finalCost }); // 2025-11-11 14:50:05 调用转单

      res.json({
        success: true,
        data: shipment,
        message: 'Quote converted to shipment successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error: any) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Failed to confirm quote:`, error);
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Shipment not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else if (error.message.includes('converted')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to confirm quote' },
          timestamp: new Date().toISOString(),
          requestId
        });
      }
    }
  }
}
