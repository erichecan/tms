// 规则引擎服务
// 创建时间: 2025-01-27 15:30:45

import { Engine } from 'json-rules-engine';
import { Rule, RuleCondition, RuleAction, RuleExecution, RuleConflict } from '@tms/shared-types';
import { logger } from '../utils/logger';
import { DatabaseService } from './DatabaseService';

const ALLOWED_ACTION_TYPES = new Set([
  'applyDiscount',
  'addFee',
  'setBaseRate',
  'setDriverCommission',
  'setCustomerLevel',
  'sendNotification',
  'logEvent'
]); // 2025-11-11T15:40:16Z Added by Assistant: Rule action whitelist

const ALLOWED_OPERATORS = new Set([
  'equal',
  'notEqual',
  'greaterThan',
  'lessThan',
  'greaterThanInclusive',
  'lessThanInclusive',
  'contains',
  'doesNotContain',
  'startsWith',
  'endsWith',
  'in',
  'notIn',
  'isEmpty',
  'isNotEmpty'
]); // 2025-11-11T15:40:16Z Added by Assistant: Rule operator whitelist

const RULE_EXECUTION_TIMEOUT_MS = parseInt(process.env.RULE_EXECUTION_TIMEOUT_MS || '3000', 10);

export class RuleEngineService {
  private engines: Map<string, Engine> = new Map();
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 获取租户的规则引擎实例
   * @param tenantId 租户ID
   * @returns 规则引擎实例
   */
  private async getEngine(tenantId: string): Promise<Engine> {
    if (!this.engines.has(tenantId)) {
      const engine = new Engine();
      await this.loadRules(tenantId, engine);
      this.engines.set(tenantId, engine);
    }
    return this.engines.get(tenantId)!;
  }

  /**
   * 加载租户的所有规则到引擎中
   * @param tenantId 租户ID
   * @param engine 规则引擎实例
   */
  private async loadRules(tenantId: string, engine: Engine): Promise<void> {
    try {
      const rules = await this.dbService.getActiveRules(tenantId);
      
      for (const rule of rules) {
        const ruleConfig = this.convertRuleToEngineConfig(rule);
        engine.addRule(ruleConfig);
      }

      logger.info(`Loaded ${rules.length} rules for tenant ${tenantId}`);
    } catch (error) {
      logger.error(`Failed to load rules for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * 将数据库规则转换为引擎配置
   * @param rule 数据库规则
   * @returns 引擎规则配置
   */
  private convertRuleToEngineConfig(rule: Rule): any {
    const conditions = this.convertConditions(rule.conditions);
    const event = this.convertActions(rule.actions);

    return {
      name: rule.name,
      priority: rule.priority,
      conditions: {
        all: conditions
      },
      event: event
    };
  }

  /**
   * 转换条件为引擎格式
   * @param conditions 规则条件
   * @returns 引擎条件配置
   */
  private convertConditions(conditions: RuleCondition[]): any[] {
    return conditions.map(condition => ({
      fact: condition.fact,
      operator: condition.operator,
      value: condition.value
    }));
  }

  /**
   * 转换动作为引擎事件
   * @param actions 规则动作
   * @returns 引擎事件配置
   */
  private convertActions(actions: RuleAction[]): any {
    return {
      type: 'rule-executed',
      params: {
        ruleId: actions[0]?.params?.ruleId,
        actions: actions
      }
    };
  }

  /**
   * 执行规则引擎
   * @param tenantId 租户ID
   * @param facts 事实数据
   * @returns 执行结果
   */
  async executeRules(tenantId: string, facts: Record<string, any>): Promise<any> {
    const startTime = Date.now();
    
    try {
      const engine = await this.getEngine(tenantId);
      const execution = engine.run(facts);
      let timeoutId: NodeJS.Timeout;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error(`RULE_TIMEOUT_AFTER_${RULE_EXECUTION_TIMEOUT_MS}_MS`)), RULE_EXECUTION_TIMEOUT_MS);
      });
      const { events } = await Promise.race([execution, timeoutPromise]);
      clearTimeout(timeoutId!);
      
      const executionTime = Date.now() - startTime;
      
      // 记录执行日志
      await this.logRuleExecution(tenantId, facts, events, executionTime);
      
      return {
        events,
        executionTime,
        facts
      };
    } catch (error) {
      logger.error(`Rule execution failed for tenant ${tenantId}:`, error);
      throw error;
    }
  }

  /**
   * 记录规则执行日志
   * @param tenantId 租户ID
   * @param facts 事实数据
   * @param events 执行事件
   * @param executionTime 执行时间
   */
  private async logRuleExecution(
    tenantId: string, 
    facts: Record<string, any>, 
    events: any[], 
    executionTime: number
  ): Promise<void> {
    try {
      for (const event of events) {
        const execution: Omit<RuleExecution, 'id' | 'createdAt'> = {
          tenantId,
          ruleId: event.params?.ruleId || 'unknown',
          context: facts,
          result: event.params || {},
          executionTime
        };
        
        await this.dbService.createRuleExecution(execution);
      }
    } catch (error) {
      logger.error('Failed to log rule execution:', error);
    }
  }

  /**
   * 评估路程计费规则
   * 2025-12-10T19:00:00Z Added by Assistant: 按路程计费模式评估规则
   * @param tenantId 租户ID
   * @param params 计费参数
   * @returns 计费结果
   */
  async evaluateDistance(
    tenantId: string,
    params: {
      distanceKm: number;
      vehicleType?: string;
      regionCode?: string;
      timeWindow?: { start: string; end: string };
      priority?: string;
      [key: string]: any;
    }
  ): Promise<{
    ruleId?: string;
    ruleName?: string;
    amount: number;
    currency: string;
    breakdown: Record<string, any>;
    appliedAt: string;
  }> {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // 构建事实数据
      const facts: Record<string, any> = {
        type: 'distance',
        distanceKm: params.distanceKm,
        vehicleType: params.vehicleType || 'van',
        regionCode: params.regionCode || 'CA',
        priority: params.priority || 'standard',
        ...params,
      };

      // 如果有时间段，添加到事实中
      if (params.timeWindow) {
        facts.timeWindow = params.timeWindow;
        facts.pickupStart = params.timeWindow.start;
        facts.pickupEnd = params.timeWindow.end;
      }

      // 执行规则引擎
      const result = await this.executeRules(tenantId, facts);
      
      // 解析结果
      let totalAmount = 0;
      let matchedRuleId: string | undefined;
      let matchedRuleName: string | undefined;
      const breakdown: Record<string, any> = {};

      if (result.events && result.events.length > 0) {
        for (const event of result.events) {
          const ruleId = event.params?.ruleId || 'unknown';
          const ruleName = event.params?.ruleName || 'Unknown Rule';
          const amount = event.params?.amount || event.params?.baseRate || 0;
          
          if (event.type === 'setBaseRate' || event.type === 'addFee') {
            totalAmount += amount;
            breakdown[ruleId] = {
              ruleId,
              ruleName,
              amount,
              type: event.type,
            };
            
            if (!matchedRuleId) {
              matchedRuleId = ruleId;
              matchedRuleName = ruleName;
            }
          }
        }
      }

      // 如果没有匹配的规则，返回默认值
      if (totalAmount === 0) {
        logger.warn(`[${traceId}] No matching rule found for distance-based pricing`, {
          tenantId,
          params,
        });
        
        return {
          amount: 0,
          currency: 'CAD',
          breakdown: {},
          appliedAt: new Date().toISOString(),
        };
      }

      const executionTime = Date.now() - startTime;
      logger.info(`[${traceId}] Distance-based pricing evaluated`, {
        tenantId,
        ruleId: matchedRuleId,
        amount: totalAmount,
        executionTime,
      });

      return {
        ruleId: matchedRuleId,
        ruleName: matchedRuleName,
        amount: totalAmount,
        currency: 'CAD',
        breakdown,
        appliedAt: new Date().toISOString(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`[${traceId}] Failed to evaluate distance-based pricing`, {
        tenantId,
        params,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      });
      throw error;
    }
  }

  /**
   * 评估时间计费规则
   * 2025-12-10T19:00:00Z Added by Assistant: 按时间计费模式评估规则
   * @param tenantId 租户ID
   * @param params 计费参数
   * @returns 计费结果
   */
  async evaluateTime(
    tenantId: string,
    params: {
      serviceMinutes: number;
      vehicleType?: string;
      regionCode?: string;
      timeWindow?: { start: string; end: string };
      priority?: string;
      [key: string]: any;
    }
  ): Promise<{
    ruleId?: string;
    ruleName?: string;
    amount: number;
    currency: string;
    breakdown: Record<string, any>;
    appliedAt: string;
  }> {
    const traceId = `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();
    
    try {
      // 构建事实数据
      const facts: Record<string, any> = {
        type: 'time',
        serviceMinutes: params.serviceMinutes,
        serviceHours: params.serviceMinutes / 60,
        vehicleType: params.vehicleType || 'van',
        regionCode: params.regionCode || 'CA',
        priority: params.priority || 'standard',
        ...params,
      };

      // 如果有时间段，添加到事实中
      if (params.timeWindow) {
        facts.timeWindow = params.timeWindow;
        facts.pickupStart = params.timeWindow.start;
        facts.pickupEnd = params.timeWindow.end;
      }

      // 执行规则引擎
      const result = await this.executeRules(tenantId, facts);
      
      // 解析结果
      let totalAmount = 0;
      let matchedRuleId: string | undefined;
      let matchedRuleName: string | undefined;
      const breakdown: Record<string, any> = {};

      if (result.events && result.events.length > 0) {
        for (const event of result.events) {
          const ruleId = event.params?.ruleId || 'unknown';
          const ruleName = event.params?.ruleName || 'Unknown Rule';
          const amount = event.params?.amount || event.params?.baseRate || 0;
          
          if (event.type === 'setBaseRate' || event.type === 'addFee') {
            totalAmount += amount;
            breakdown[ruleId] = {
              ruleId,
              ruleName,
              amount,
              type: event.type,
            };
            
            if (!matchedRuleId) {
              matchedRuleId = ruleId;
              matchedRuleName = ruleName;
            }
          }
        }
      }

      // 如果没有匹配的规则，返回默认值
      if (totalAmount === 0) {
        logger.warn(`[${traceId}] No matching rule found for time-based pricing`, {
          tenantId,
          params,
        });
        
        return {
          amount: 0,
          currency: 'CAD',
          breakdown: {},
          appliedAt: new Date().toISOString(),
        };
      }

      const executionTime = Date.now() - startTime;
      logger.info(`[${traceId}] Time-based pricing evaluated`, {
        tenantId,
        ruleId: matchedRuleId,
        amount: totalAmount,
        executionTime,
      });

      return {
        ruleId: matchedRuleId,
        ruleName: matchedRuleName,
        amount: totalAmount,
        currency: 'CAD',
        breakdown,
        appliedAt: new Date().toISOString(),
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;
      logger.error(`[${traceId}] Failed to evaluate time-based pricing`, {
        tenantId,
        params,
        error: error instanceof Error ? error.message : String(error),
        executionTime,
      });
      throw error;
    }
  }

  /**
   * 创建新规则
   * @param tenantId 租户ID
   * @param rule 规则数据
   * @returns 创建的规则
   */
  async createRule(tenantId: string, rule: Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>): Promise<Rule> {
    try {
      // 验证规则
      await this.validateRule(tenantId, rule);
      
      // 检查冲突
      const conflicts = await this.detectConflicts(tenantId, rule);
      if (conflicts.length > 0) {
        throw new Error(`Rule conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
      }
      
      // 创建规则
      const newRule = await this.dbService.createRule(tenantId, rule);
      
      // 重新加载引擎
      await this.reloadEngine(tenantId);
      
      logger.info(`Rule created successfully: ${newRule.id}`);
      return newRule;
    } catch (error) {
      logger.error('Failed to create rule:', error);
      throw error;
    }
  }

  /**
   * 更新规则
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   * @param updates 更新数据
   * @returns 更新后的规则
   */
  async updateRule(
    tenantId: string, 
    ruleId: string, 
    updates: Partial<Omit<Rule, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>>
  ): Promise<Rule> {
    try {
      // 获取现有规则
      const existingRule = await this.dbService.getRule(tenantId, ruleId);
      if (!existingRule) {
        throw new Error('Rule not found');
      }
      
      // 合并更新数据
      const updatedRule = { ...existingRule, ...updates };
      
      // 验证规则
      await this.validateRule(tenantId, updatedRule);
      
      // 检查冲突
      const conflicts = await this.detectConflicts(tenantId, updatedRule, ruleId);
      if (conflicts.length > 0) {
        throw new Error(`Rule conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
      }
      
      // 更新规则
      const result = await this.dbService.updateRule(tenantId, ruleId, updates);
      
      // 重新加载引擎
      await this.reloadEngine(tenantId);
      
      logger.info(`Rule updated successfully: ${ruleId}`);
      return result;
    } catch (error) {
      logger.error('Failed to update rule:', error);
      throw error;
    }
  }

  /**
   * 删除规则
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   */
  async deleteRule(tenantId: string, ruleId: string): Promise<void> {
    try {
      await this.dbService.deleteRule(tenantId, ruleId);
      await this.reloadEngine(tenantId);
      
      logger.info(`Rule deleted successfully: ${ruleId}`);
    } catch (error) {
      logger.error('Failed to delete rule:', error);
      throw error;
    }
  }

  /**
   * 验证规则
   * @param tenantId 租户ID
   * @param rule 规则数据
   */
  private async validateRule(tenantId: string, rule: any): Promise<void> {
    // 基本验证
    if (!rule.name || !rule.type || !rule.conditions || !rule.actions) {
      throw new Error('Missing required rule fields');
    }
    
    if (rule.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }
    
    if (rule.actions.length === 0) {
      throw new Error('Rule must have at least one action');
    }
    
    // 验证条件
    for (const condition of rule.conditions) {
      if (!condition.fact || !condition.operator || condition.value === undefined) {
        throw new Error('Invalid condition format');
      }
      if (!ALLOWED_OPERATORS.has(condition.operator)) {
        throw new Error(`Operator "${condition.operator}" is not permitted`);
      }
      if (!/^[a-zA-Z0-9_.-]+$/.test(condition.fact)) {
        throw new Error(`Fact "${condition.fact}" contains invalid characters`);
      }
    }
    
    // 验证动作
    for (const action of rule.actions) {
      if (!action.type || !action.params) {
        throw new Error('Invalid action format');
      }
      if (!ALLOWED_ACTION_TYPES.has(action.type)) {
        throw new Error(`Action "${action.type}" is not permitted`);
      }
    }
  }

  /**
   * 检测规则冲突
   * @param tenantId 租户ID
   * @param rule 规则数据
   * @param excludeRuleId 排除的规则ID（用于更新时）
   * @returns 冲突列表
   */
  private async detectConflicts(
    tenantId: string, 
    rule: any, 
    excludeRuleId?: string
  ): Promise<RuleConflict[]> {
    const conflicts: RuleConflict[] = [];
    
    try {
      const existingRules = await this.dbService.getActiveRules(tenantId);
      
      for (const existingRule of existingRules) {
        if (excludeRuleId && existingRule.id === excludeRuleId) {
          continue;
        }
        
        // 检查条件相似度
        const similarity = this.calculateConditionSimilarity(rule.conditions, existingRule.conditions);
        
        if (similarity > 0.8) {
          // 检查动作是否冲突
          const actionConflict = this.checkActionConflict(rule.actions, existingRule.actions);
          
          if (actionConflict) {
            conflicts.push({
              type: 'contradiction',
              ruleId: existingRule.id,
              message: `Rule conflicts with existing rule "${existingRule.name}"`,
              severity: 'error'
            });
          } else if (similarity > 0.95) {
            conflicts.push({
              type: 'duplicate',
              ruleId: existingRule.id,
              message: `Rule is very similar to existing rule "${existingRule.name}"`,
              severity: 'warning'
            });
          }
        }
        
        // 检查优先级冲突
        if (rule.priority === existingRule.priority) {
          conflicts.push({
            type: 'priority',
            ruleId: existingRule.id,
            message: `Same priority as existing rule "${existingRule.name}"`,
            severity: 'warning'
          });
        }
      }
    } catch (error) {
      logger.error('Failed to detect rule conflicts:', error);
    }
    
    return conflicts;
  }

  /**
   * 计算条件相似度
   * @param conditions1 条件1
   * @param conditions2 条件2
   * @returns 相似度 (0-1)
   */
  private calculateConditionSimilarity(conditions1: RuleCondition[], conditions2: RuleCondition[]): number {
    if (conditions1.length === 0 || conditions2.length === 0) {
      return 0;
    }
    
    let matches = 0;
    const total = Math.max(conditions1.length, conditions2.length);
    
    for (const condition1 of conditions1) {
      for (const condition2 of conditions2) {
        if (this.conditionsEqual(condition1, condition2)) {
          matches++;
          break;
        }
      }
    }
    
    return matches / total;
  }

  /**
   * 检查两个条件是否相等
   * @param condition1 条件1
   * @param condition2 条件2
   * @returns 是否相等
   */
  private conditionsEqual(condition1: RuleCondition, condition2: RuleCondition): boolean {
    return condition1.fact === condition2.fact &&
           condition1.operator === condition2.operator &&
           JSON.stringify(condition1.value) === JSON.stringify(condition2.value);
  }

  /**
   * 检查动作冲突
   * @param actions1 动作1
   * @param actions2 动作2
   * @returns 是否有冲突
   */
  private checkActionConflict(actions1: RuleAction[], actions2: RuleAction[]): boolean {
    // 简化的冲突检测逻辑
    // 实际实现中可能需要更复杂的业务逻辑
    for (const action1 of actions1) {
      for (const action2 of actions2) {
        if (action1.type === action2.type) {
          // 检查参数是否冲突
          if (this.actionsContradict(action1, action2)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  /**
   * 检查两个动作是否矛盾
   * @param action1 动作1
   * @param action2 动作2
   * @returns 是否矛盾
   */
  private actionsContradict(action1: RuleAction, action2: RuleAction): boolean {
    // 简化的矛盾检测逻辑
    if (action1.type === 'applyDiscount' && action2.type === 'addFee') {
      return true;
    }
    
    if (action1.type === 'addFee' && action2.type === 'applyDiscount') {
      return true;
    }
    
    return false;
  }

  /**
   * 重新加载引擎
   * @param tenantId 租户ID
   */
  private async reloadEngine(tenantId: string): Promise<void> {
    this.engines.delete(tenantId);
    await this.getEngine(tenantId);
  }

  /**
   * 获取规则执行统计
   * @param tenantId 租户ID
   * @param ruleId 规则ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 执行统计
   */
  async getRuleExecutionStats(
    tenantId: string, 
    ruleId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<any> {
    return await this.dbService.getRuleExecutionStats(tenantId, ruleId, startDate, endDate);
  }
}
