// 规则控制器测试
// 创建时间: 2025-01-27 15:31:45

import { Request, Response } from 'express';
import { RuleController } from '../../src/controllers/RuleController';
import { RuleEngineService } from '../../src/services/RuleEngineService';
import { Rule, RuleType, RuleStatus, CreateRuleRequest, UpdateRuleRequest } from '@tms/shared-types';

// Mock规则引擎服务
jest.mock('../../src/services/RuleEngineService');

describe('RuleController', () => {
  let ruleController: RuleController;
  let mockRuleEngineService: jest.Mocked<RuleEngineService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRuleEngineService = new RuleEngineService() as jest.Mocked<RuleEngineService>;
    ruleController = new RuleController(mockRuleEngineService);

    mockRequest = {
      body: {},
      params: {},
      query: {},
      headers: { 'x-request-id': 'test-request-id' }
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRule', () => {
    it('should create a rule successfully', async () => {
      const createRequest: CreateRuleRequest = {
        name: 'VIP客户折扣',
        description: 'VIP客户享受15%折扣',
        type: RuleType.Pricing,
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: RuleStatus.Active
      };

      const createdRule: Rule = {
        id: 'rule-id',
        tenantId: 'tenant-id',
        name: 'VIP客户折扣',
        description: 'VIP客户享受15%折扣',
        type: RuleType.Pricing,
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: RuleStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.body = createRequest;
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.createRule.mockResolvedValue(createdRule);

      await ruleController.createRule(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.createRule).toHaveBeenCalledWith('tenant-id', createRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: createdRule
        })
      );
    });

    it('should return error for invalid rule data', async () => {
      mockRequest.body = {
        // Missing required fields
        name: 'Test Rule'
      };

      await ruleController.createRule(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'VALIDATION_ERROR'
          })
        })
      );
    });
  });

  describe('getRules', () => {
    it('should return rules with pagination and filters', async () => {
      const mockRules: Rule[] = [
        {
          id: 'rule-1',
          tenantId: 'tenant-id',
          name: 'VIP客户折扣',
          description: 'VIP客户享受15%折扣',
          type: RuleType.Pricing,
          priority: 100,
          conditions: [
            { fact: 'customerLevel', operator: 'equal', value: 'vip' }
          ],
          actions: [
            { type: 'applyDiscount', params: { percentage: 15 } }
          ],
          status: RuleStatus.Active,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 'rule-2',
          tenantId: 'tenant-id',
          name: '司机基础提成',
          description: '所有司机基础提成30%',
          type: RuleType.Payroll,
          priority: 300,
          conditions: [
            { fact: 'driverId', operator: 'isNotEmpty', value: '' }
          ],
          actions: [
            { type: 'setDriverCommission', params: { percentage: 30 } }
          ],
          status: RuleStatus.Active,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockRequest.query = {
        type: 'pricing',
        status: 'active',
        page: '1',
        limit: '10'
      };
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.getRules.mockResolvedValue({
        data: mockRules,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1
        }
      });

      await ruleController.getRules(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.getRules).toHaveBeenCalledWith('tenant-id', {
        type: 'pricing',
        status: 'active',
        page: 1,
        limit: 10
      });
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            data: mockRules,
            pagination: expect.objectContaining({
              total: 2,
              page: 1,
              limit: 10,
              totalPages: 1
            })
          })
        })
      );
    });
  });

  describe('getRule', () => {
    it('should return a rule by ID', async () => {
      const rule: Rule = {
        id: 'rule-id',
        tenantId: 'tenant-id',
        name: 'VIP客户折扣',
        description: 'VIP客户享受15%折扣',
        type: RuleType.Pricing,
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: RuleStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'rule-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.getRule.mockResolvedValue(rule);

      await ruleController.getRule(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.getRule).toHaveBeenCalledWith('tenant-id', 'rule-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: rule
        })
      );
    });

    it('should return 404 for non-existent rule', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.getRule.mockResolvedValue(null);

      await ruleController.getRule(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RULE_NOT_FOUND'
          })
        })
      );
    });
  });

  describe('updateRule', () => {
    it('should update a rule successfully', async () => {
      const updateRequest: UpdateRuleRequest = {
        name: 'VIP客户折扣（更新）',
        description: 'VIP客户享受20%折扣',
        priority: 150,
        actions: [
          { type: 'applyDiscount', params: { percentage: 20 } }
        ]
      };

      const updatedRule: Rule = {
        id: 'rule-id',
        tenantId: 'tenant-id',
        name: 'VIP客户折扣（更新）',
        description: 'VIP客户享受20%折扣',
        type: RuleType.Pricing,
        priority: 150,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 20 } }
        ],
        status: RuleStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockRequest.params = { id: 'rule-id' };
      mockRequest.body = updateRequest;
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.updateRule.mockResolvedValue(updatedRule);

      await ruleController.updateRule(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.updateRule).toHaveBeenCalledWith('tenant-id', 'rule-id', updateRequest);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: updatedRule
        })
      );
    });
  });

  describe('deleteRule', () => {
    it('should delete a rule successfully', async () => {
      mockRequest.params = { id: 'rule-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.deleteRule.mockResolvedValue(true);

      await ruleController.deleteRule(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.deleteRule).toHaveBeenCalledWith('tenant-id', 'rule-id');
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Rule deleted successfully'
        })
      );
    });

    it('should return 404 for non-existent rule', async () => {
      mockRequest.params = { id: 'non-existent-id' };
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.deleteRule.mockResolvedValue(false);

      await ruleController.deleteRule(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          error: expect.objectContaining({
            code: 'RULE_NOT_FOUND'
          })
        })
      );
    });
  });

  describe('fuzzyMatchRules', () => {
    it('should return similar rules for fuzzy matching', async () => {
      const ruleData = {
        name: 'VIP客户折扣',
        description: 'VIP客户享受15%折扣',
        type: RuleType.Pricing,
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: RuleStatus.Active
      };

      const similarRules: Rule[] = [
        {
          id: 'similar-rule-id',
          tenantId: 'tenant-id',
          name: 'VIP客户特殊折扣',
          description: 'VIP客户享受10%折扣',
          type: RuleType.Pricing,
          priority: 120,
          conditions: [
            { fact: 'customerLevel', operator: 'equal', value: 'vip' }
          ],
          actions: [
            { type: 'applyDiscount', params: { percentage: 10 } }
          ],
          status: RuleStatus.Active,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];

      mockRequest.body = ruleData;
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.fuzzyMatchRules.mockResolvedValue(similarRules);

      await ruleController.fuzzyMatchRules(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.fuzzyMatchRules).toHaveBeenCalledWith('tenant-id', ruleData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: similarRules
        })
      );
    });
  });

  describe('detectRuleConflicts', () => {
    it('should detect rule conflicts', async () => {
      const ruleData = {
        name: '新规则',
        description: '新规则描述',
        type: RuleType.Pricing,
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: RuleStatus.Active
      };

      const conflicts = [
        {
          id: 'conflict-rule-id',
          reason: 'Same conditions and priority but different actions'
        }
      ];

      mockRequest.body = ruleData;
      mockRequest.tenant = { id: 'tenant-id' };

      mockRuleEngineService.detectRuleConflicts.mockResolvedValue(conflicts);

      await ruleController.detectRuleConflicts(mockRequest as Request, mockResponse as Response);

      expect(mockRuleEngineService.detectRuleConflicts).toHaveBeenCalledWith('tenant-id', ruleData);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: conflicts
        })
      );
    });
  });
});
