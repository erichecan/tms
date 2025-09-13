// 规则引擎服务测试
// 创建时间: 2025-01-27 15:30:45

import { RuleEngineService } from '../../src/services/RuleEngineService';
import { DatabaseService } from '../../src/services/DatabaseService';
import { Rule, RuleCondition, RuleAction } from '@tms/shared-types';

// Mock数据库服务
jest.mock('../../src/services/DatabaseService');

describe('RuleEngineService', () => {
  let ruleEngineService: RuleEngineService;
  let mockDbService: jest.Mocked<DatabaseService>;

  beforeEach(() => {
    mockDbService = new DatabaseService() as jest.Mocked<DatabaseService>;
    ruleEngineService = new RuleEngineService(mockDbService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createRule', () => {
    it('should create a rule successfully', async () => {
      const tenantId = 'test-tenant-id';
      const ruleData: Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Rule',
        description: 'Test rule description',
        type: 'pricing',
        priority: 100,
        conditions: [
          {
            fact: 'customerLevel',
            operator: 'equal',
            value: 'vip'
          }
        ],
        actions: [
          {
            type: 'applyDiscount',
            params: { percentage: 10 }
          }
        ],
        status: 'active'
      };

      const expectedRule: Rule = {
        id: 'rule-id',
        tenantId,
        ...ruleData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbService.getActiveRules.mockResolvedValue([]);
      mockDbService.createRule.mockResolvedValue(expectedRule);

      const result = await ruleEngineService.createRule(tenantId, ruleData);

      expect(result).toEqual(expectedRule);
      expect(mockDbService.createRule).toHaveBeenCalledWith(tenantId, ruleData);
    });

    it('should throw error when rule conflicts are detected', async () => {
      const tenantId = 'test-tenant-id';
      const ruleData: Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
        name: 'Test Rule',
        description: 'Test rule description',
        type: 'pricing',
        priority: 100,
        conditions: [
          {
            fact: 'customerLevel',
            operator: 'equal',
            value: 'vip'
          }
        ],
        actions: [
          {
            type: 'applyDiscount',
            params: { percentage: 10 }
          }
        ],
        status: 'active'
      };

      const existingRule: Rule = {
        id: 'existing-rule-id',
        tenantId,
        name: 'Existing Rule',
        description: 'Existing rule',
        type: 'pricing',
        priority: 100,
        conditions: [
          {
            fact: 'customerLevel',
            operator: 'equal',
            value: 'vip'
          }
        ],
        actions: [
          {
            type: 'applyDiscount',
            params: { percentage: 15 }
          }
        ],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbService.getActiveRules.mockResolvedValue([existingRule]);

      await expect(ruleEngineService.createRule(tenantId, ruleData))
        .rejects
        .toThrow('Rule conflicts detected');
    });
  });

  describe('executeRules', () => {
    it('should execute rules successfully', async () => {
      const tenantId = 'test-tenant-id';
      const facts = {
        customerLevel: 'vip',
        transportDistance: 600,
        cargoWeight: 1000
      };

      const mockRule: Rule = {
        id: 'rule-id',
        tenantId,
        name: 'VIP Discount Rule',
        description: 'VIP customer discount',
        type: 'pricing',
        priority: 100,
        conditions: [
          {
            fact: 'customerLevel',
            operator: 'equal',
            value: 'vip'
          }
        ],
        actions: [
          {
            type: 'applyDiscount',
            params: { percentage: 15 }
          }
        ],
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockDbService.getActiveRules.mockResolvedValue([mockRule]);
      mockDbService.createRuleExecution.mockResolvedValue({
        id: 'execution-id',
        tenantId,
        ruleId: 'rule-id',
        context: facts,
        result: { discount: 15 },
        executionTime: 10,
        createdAt: new Date()
      });

      const result = await ruleEngineService.executeRules(tenantId, facts);

      expect(result).toHaveProperty('events');
      expect(result).toHaveProperty('executionTime');
      expect(result).toHaveProperty('facts');
      expect(mockDbService.createRuleExecution).toHaveBeenCalled();
    });
  });

  describe('validateRule', () => {
    it('should validate rule successfully', async () => {
      const tenantId = 'test-tenant-id';
      const ruleData: Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
        name: 'Valid Rule',
        description: 'Valid rule description',
        type: 'pricing',
        priority: 100,
        conditions: [
          {
            fact: 'customerLevel',
            operator: 'equal',
            value: 'vip'
          }
        ],
        actions: [
          {
            type: 'applyDiscount',
            params: { percentage: 10 }
          }
        ],
        status: 'active'
      };

      mockDbService.getActiveRules.mockResolvedValue([]);

      // 这个测试验证规则验证不会抛出错误
      await expect(ruleEngineService.createRule(tenantId, ruleData))
        .resolves
        .toBeDefined();
    });

    it('should throw error for invalid rule', async () => {
      const tenantId = 'test-tenant-id';
      const invalidRuleData = {
        name: '',
        type: 'pricing',
        priority: 100,
        conditions: [],
        actions: [],
        status: 'active'
      } as any;

      await expect(ruleEngineService.createRule(tenantId, invalidRuleData))
        .rejects
        .toThrow();
    });
  });
});
