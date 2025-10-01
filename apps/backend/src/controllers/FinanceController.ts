// 财务控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { FinanceService } from '../services/FinanceService';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { CurrencyService } from '../services/CurrencyService';
import { logger } from '../utils/logger';
import { QueryParams } from '@tms/shared-types';

// Helper to get request ID safely
const getRequestId = (req: Request): string => {
  const requestId = req.headers['x-request-id'];
  return (Array.isArray(requestId) ? requestId[0] : requestId) || '';
};

export class FinanceController {
  private financeService: FinanceService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService, currencyService: CurrencyService) {
    this.financeService = new FinanceService(dbService, ruleEngineService, currencyService);
  }

  /**
   * 获取应收账款汇总
   * @param req 请求对象
   * @param res 响应对象
   */
  async getReceivablesSummary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const customerId = req.query.customerId as string;
      const summary = await this.financeService.getReceivablesSummary(tenantId, customerId);
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get receivables summary:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get receivables summary' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 获取应付账款汇总
   * @param req 请求对象
   * @param res 响应对象
   */
  async getPayablesSummary(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const driverId = req.query.driverId as string || '';
      const summary = await this.financeService.getPayablesSummary(tenantId, driverId);
      
      res.json({
        success: true,
        data: summary,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get payables summary:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get payables summary' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 生成客户对账单
   * @param req 请求对象
   * @param res 响应对象
   */
  async generateCustomerStatement(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const { customerId, startDate, endDate } = req.body;
      
      if (!customerId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: customerId, startDate, endDate' 
          },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const statement = await this.financeService.generateCustomerStatement(
        tenantId, 
        customerId, 
        new Date(startDate), 
        new Date(endDate), 
        req.user?.id || ''
      );
      
      res.json({
        success: true,
        data: statement,
        message: 'Customer statement generated successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to generate customer statement:', error);
      
      if (error.message.includes('Customer not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'CUSTOMER_NOT_FOUND', message: 'Customer not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('No completed shipments found')) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_DATA', message: 'No completed shipments found for the specified period' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to generate customer statement' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 生成司机结算单
   * @param req 请求对象
   * @param res 响应对象
   */
  async generateDriverStatement(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const { driverId, startDate, endDate } = req.body;
      
      if (!driverId || !startDate || !endDate) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: driverId, startDate, endDate' 
          },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const statement = await this.financeService.generateDriverStatement(
        tenantId, 
        driverId, 
        new Date(startDate), 
        new Date(endDate), 
        req.user?.id || ''
      );
      
      res.json({
        success: true,
        data: statement,
        message: 'Driver statement generated successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to generate driver statement:', error);
      
      if (error.message.includes('Driver not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'DRIVER_NOT_FOUND', message: 'Driver not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('No completed shipments found')) {
        res.status(400).json({
          success: false,
          error: { code: 'NO_DATA', message: 'No completed shipments found for the specified period' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to generate driver statement' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 标记对账单为已发送
   * @param req 请求对象
   * @param res 响应对象
   */
  async markStatementAsSent(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const statementId = req.params.id;

      if (!tenantId || !statementId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Statement ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const statement = await this.financeService.markStatementAsSent(tenantId, statementId);
      
      res.json({
        success: true,
        data: statement,
        message: 'Statement marked as sent successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to mark statement as sent:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Statement not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('cannot be marked as sent')) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_STATUS', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to mark statement as sent' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 标记对账单为已支付
   * @param req 请求对象
   * @param res 响应对象
   */
  async markStatementAsPaid(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const statementId = req.params.id;

      if (!tenantId || !statementId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Statement ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const { paidAmount, paymentDate } = req.body;
      
      if (!paidAmount) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Paid amount is required' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const statement = await this.financeService.markStatementAsPaid(
        tenantId, 
        statementId, 
        paidAmount, 
        paymentDate ? new Date(paymentDate) : new Date()
      );
      
      res.json({
        success: true,
        data: statement,
        message: 'Statement marked as paid successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to mark statement as paid:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Statement not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('already paid')) {
        res.status(400).json({
          success: false,
          error: { code: 'ALREADY_PAID', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to mark statement as paid' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 获取财务报告
   * @param req 请求对象
   * @param res 响应对象
   */
  async getFinancialReport(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();

      const report = await this.financeService.getFinancialReport(tenantId, startDate, endDate);
      
      res.json({
        success: true,
        data: report,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get financial report:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get financial report' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 获取对账单列表
   * @param req 请求对象
   * @param res 响应对象
   */
  async getStatements(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const params: QueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string || 'created_at',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        filters: {
          type: req.query.type as string,
          status: req.query.status as string,
          referenceId: req.query.referenceId as string
        }
      };

      const result = await this.financeService.getStatements(tenantId, params);
      
      res.json({
        ...result,
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get statements:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get statements' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 获取财务记录列表
   * @param req 请求对象
   * @param res 响应对象
   */
  async getFinancialRecords(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const params: QueryParams = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: req.query.sort as string || 'created_at',
        order: (req.query.order as 'asc' | 'desc') || 'desc',
        search: req.query.search as string,
        filters: {
          type: req.query.type as string,
          status: req.query.status as string,
          referenceId: req.query.referenceId as string,
          startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
          endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined
        }
      };

      const result = await this.financeService.getFinancialRecords(tenantId, params);
      
      res.json({
        ...result,
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get financial records:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get financial records' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }
}
