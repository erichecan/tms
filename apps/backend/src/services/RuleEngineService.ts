// 规则引擎服务
// 创建时间: 2025-01-27 15:30:45

import { Engine } from 'json-rules-engine';
import { Rule, RuleCondition, RuleAction, RuleExecution, RuleConflict } from '@shared/index';
import { logger } from '../utils/logger';
import { DatabaseService } from './DatabaseService';

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
      const { events } = await engine.run(facts);
      
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
    }
    
    // 验证动作
    for (const action of rule.actions) {
      if (!action.type || !action.params) {
        throw new Error('Invalid action format');
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
