// 规则路由测试
// 创建时间: 2025-01-27 15:33:00

import request from 'supertest';
import express from 'express';
import { ruleRoutes } from '../../src/routes/ruleRoutes';
import { RuleController } from '../../src/controllers/RuleController';
import { RuleEngineService } from '../../src/services/RuleEngineService';
import { Rule, RuleType, RuleStatus } from '@tms/shared-types';

// Mock规则控制器
jest.mock('../../src/controllers/RuleController');

describe('Rule Routes', () => {
  let app: express.Application;
  let mockRuleController: jest.Mocked<RuleController>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/v1/rules', ruleRoutes);

    mockRuleController = new RuleController(new RuleEngineService(new DatabaseService())) as jest.Mocked<RuleController>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/v1/rules', () => {
    it('should return rules with pagination', async () => {
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
        }
      ];

      const mockResponse = {
        success: true,
        data: {
          data: mockRules,
          pagination: {
            total: 1,
            page: 1,
            limit: 10,
            totalPages: 1
          }
        }
      };

      // Mock the controller method
      (RuleController.prototype.getRules as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/rules?type=pricing&page=1&limit=10')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('POST /api/v1/rules', () => {
    it('should create a new rule', async () => {
      const ruleData = {
        name: '新规则',
        description: '新规则描述',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: 'active'
      };

      const createdRule: Rule = {
        id: 'new-rule-id',
        tenantId: 'tenant-id',
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
        status: RuleStatus.Active,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse = {
        success: true,
        data: createdRule
      };

      // Mock the controller method
      (RuleController.prototype.createRule as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(201).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/rules')
        .send(ruleData)
        .expect(201);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return validation error for invalid rule data', async () => {
      const invalidRuleData = {
        name: '新规则'
        // Missing required fields
      };

      const mockErrorResponse = {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: [
            {
              field: 'type',
              message: 'Type is required'
            }
          ]
        }
      };

      // Mock the controller method to return validation error
      (RuleController.prototype.createRule as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(400).json(mockErrorResponse);
      });

      const response = await request(app)
        .post('/api/v1/rules')
        .send(invalidRuleData)
        .expect(400);

      expect(response.body).toEqual(mockErrorResponse);
    });
  });

  describe('GET /api/v1/rules/:id', () => {
    it('should return a specific rule', async () => {
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

      const mockResponse = {
        success: true,
        data: rule
      };

      // Mock the controller method
      (RuleController.prototype.getRule as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .get('/api/v1/rules/rule-id')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });

    it('should return 404 for non-existent rule', async () => {
      const mockErrorResponse = {
        success: false,
        error: {
          code: 'RULE_NOT_FOUND',
          message: 'Rule not found'
        }
      };

      // Mock the controller method to return 404
      (RuleController.prototype.getRule as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(404).json(mockErrorResponse);
      });

      const response = await request(app)
        .get('/api/v1/rules/non-existent-id')
        .expect(404);

      expect(response.body).toEqual(mockErrorResponse);
    });
  });

  describe('PUT /api/v1/rules/:id', () => {
    it('should update a rule', async () => {
      const updateData = {
        name: '更新的规则',
        description: '更新的规则描述',
        priority: 150
      };

      const updatedRule: Rule = {
        id: 'rule-id',
        tenantId: 'tenant-id',
        name: '更新的规则',
        description: '更新的规则描述',
        type: RuleType.Pricing,
        priority: 150,
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

      const mockResponse = {
        success: true,
        data: updatedRule
      };

      // Mock the controller method
      (RuleController.prototype.updateRule as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .put('/api/v1/rules/rule-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('DELETE /api/v1/rules/:id', () => {
    it('should delete a rule', async () => {
      const mockResponse = {
        success: true,
        message: 'Rule deleted successfully'
      };

      // Mock the controller method
      (RuleController.prototype.deleteRule as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .delete('/api/v1/rules/rule-id')
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('POST /api/v1/rules/fuzzy-match', () => {
    it('should find similar rules', async () => {
      const ruleData = {
        name: '新规则',
        description: '新规则描述',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: 'active'
      };

      const similarRules: Rule[] = [
        {
          id: 'similar-rule-id',
          tenantId: 'tenant-id',
          name: '相似规则',
          description: '相似规则描述',
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

      const mockResponse = {
        success: true,
        data: similarRules
      };

      // Mock the controller method
      (RuleController.prototype.fuzzyMatchRules as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/rules/fuzzy-match')
        .send(ruleData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });

  describe('POST /api/v1/rules/conflicts', () => {
    it('should detect rule conflicts', async () => {
      const ruleData = {
        name: '新规则',
        description: '新规则描述',
        type: 'pricing',
        priority: 100,
        conditions: [
          { fact: 'customerLevel', operator: 'equal', value: 'vip' }
        ],
        actions: [
          { type: 'applyDiscount', params: { percentage: 15 } }
        ],
        status: 'active'
      };

      const conflicts = [
        {
          id: 'conflict-rule-id',
          reason: 'Same conditions and priority but different actions'
        }
      ];

      const mockResponse = {
        success: true,
        data: conflicts
      };

      // Mock the controller method
      (RuleController.prototype.detectRuleConflicts as jest.Mock) = jest.fn().mockImplementation((req, res) => {
        res.status(200).json(mockResponse);
      });

      const response = await request(app)
        .post('/api/v1/rules/conflicts')
        .send(ruleData)
        .expect(200);

      expect(response.body).toEqual(mockResponse);
    });
  });
});
