// 规则引擎控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import { RuleEngineService } from '../services/RuleEngineService';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';
import { QueryParams } from '@tms/shared-types';

// Helper to get request ID safely
const getRequestId = (req: Request): string => {
  const requestId = req.headers['x-request-id'];
  return (Array.isArray(requestId) ? requestId[0] : requestId) || '';
};

export class RuleController {
  private ruleEngineService: RuleEngineService;
  private dbService: DatabaseService;

  constructor(ruleEngineService: RuleEngineService, dbService: DatabaseService) {
    this.ruleEngineService = ruleEngineService;
    this.dbService = dbService;
  }

  /**
   * 获取规则列表
   * @param req 请求对象
   * @param res 响应对象
   */
  async getRules(req: Request, res: Response): Promise<void> {
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
          status: req.query.status as string
        }
      };

      const result = await this.dbService.getRules(tenantId, params);
      
      res.json({
        ...result,
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get rules:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get rules' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 获取单个规则
   * @param req 请求对象
   * @param res 响应对象
   */
  async getRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const ruleId = req.params.id;

      if (!tenantId || !ruleId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Rule ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const rule = await this.dbService.getRule(tenantId, ruleId);
      
      if (!rule) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rule not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      res.json({
        success: true,
        data: rule,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get rule:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get rule' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 创建规则
   * @param req 请求对象
   * @param res 响应对象
   */
  async createRule(req: Request, res: Response): Promise<void> {
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

      const ruleData = req.body;
      
      // 验证必需字段
      if (!ruleData.name || !ruleData.type || !ruleData.conditions || !ruleData.actions) {
        res.status(400).json({
          success: false,
          error: { 
            code: 'VALIDATION_ERROR', 
            message: 'Missing required fields: name, type, conditions, actions' 
          },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const rule = await this.ruleEngineService.createRule(tenantId, ruleData);
      
      res.status(201).json({
        success: true,
        data: rule,
        message: 'Rule created successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to create rule:', error);
      
      if (error.message.includes('conflicts detected')) {
        res.status(409).json({
          success: false,
          error: { code: 'RULE_CONFLICT', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to create rule' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 更新规则
   * @param req 请求对象
   * @param res 响应对象
   */
  async updateRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const ruleId = req.params.id;

      if (!tenantId || !ruleId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant or Rule ID not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const updates = req.body;
      const rule = await this.ruleEngineService.updateRule(tenantId, ruleId, updates);
      
      res.json({
        success: true,
        data: rule,
        message: 'Rule updated successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to update rule:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rule not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else if (error.message.includes('conflicts detected')) {
        res.status(409).json({
          success: false,
          error: { code: 'RULE_CONFLICT', message: error.message },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to update rule' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 删除规则
   * @param req 请求对象
   * @param res 响应对象
   */
  async deleteRule(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const ruleId = req.params.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      await this.ruleEngineService.deleteRule(tenantId, ruleId!);
      
      res.json({
        success: true,
        message: 'Rule deleted successfully',
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to delete rule:', error);
      
      if (error.message.includes('not found')) {
        res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Rule not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Failed to delete rule' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
      }
    }
  }

  /**
   * 验证规则
   * @param req 请求对象
   * @param res 响应对象
   */
  async validateRule(req: Request, res: Response): Promise<void> {
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

      const ruleData = req.body;
      
      
      // 这里可以添加更详细的验证逻辑
      const validationResult = {
        isValid: true,
        errors: [] as string[],
        warnings: [] as string[]
      };

      // 基本验证
      if (!ruleData.name) {
        validationResult.errors.push('Rule name is required');
        validationResult.isValid = false;
      }

      if (!ruleData.type || !['pricing', 'payroll'].includes(ruleData.type)) {
        validationResult.errors.push('Rule type must be either "pricing" or "payroll"');
        validationResult.isValid = false;
      }

      if (!ruleData.conditions || ruleData.conditions.length === 0) {
        validationResult.errors.push('At least one condition is required');
        validationResult.isValid = false;
      }

      if (!ruleData.actions || ruleData.actions.length === 0) {
        validationResult.errors.push('At least one action is required');
        validationResult.isValid = false;
      }

      // 检查冲突（这里简化处理，实际应该调用规则引擎服务）
      if (validationResult.isValid) {
        // 可以在这里添加冲突检测逻辑
        validationResult.warnings.push('Conflict detection not implemented yet');
      }

      res.json({
        success: true,
        data: validationResult,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to validate rule:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to validate rule' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 执行规则测试
   * @param req 请求对象
   * @param res 响应对象
   */
  async testRule(req: Request, res: Response): Promise<void> {
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

      const { facts } = req.body;
      
      if (!facts) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Facts are required for testing' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const result = await this.ruleEngineService.executeRules(tenantId, facts);
      
      res.json({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to test rule:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to test rule' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }

  /**
   * 获取规则执行统计
   * @param req 请求对象
   * @param res 响应对象
   */
  async getRuleStats(req: Request, res: Response): Promise<void> {
    try {
      const tenantId = req.tenant?.id;
      const ruleId = req.params.id;

      if (!tenantId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
          timestamp: new Date().toISOString(),
          requestId: getRequestId(req)
        });
        return;
      }

      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

      const stats = await this.ruleEngineService.getRuleExecutionStats(tenantId, ruleId!, startDate, endDate);
      
      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    } catch (error) {
      logger.error('Failed to get rule stats:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get rule stats' },
        timestamp: new Date().toISOString(),
        requestId: getRequestId(req)
      });
    }
  }
}
