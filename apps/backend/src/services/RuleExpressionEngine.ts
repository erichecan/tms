// 规则表达式解析引擎
// 创建时间: 2025-09-29 03:10:00
// 作用: 解析复杂的计费规则条件表达式

import { logger } from '../utils/logger';

interface RuleFact {
  // 运单字段
  weight?: number;
  volume?: number;
  cargoType?: string;
  pickupCity?: string;
  deliveryCity?: string;
  distanceKm?: number;
  createdAt?: Date;
  
  // 客户字段
  customerId?: string;
  customerTier?: string;
  
  // 司机字段
  driverId?: string;
  driverLevel?: string;
  
  // 环境字段
  tenantId?: string;
  channel?: string;
  weekday?: string;
  timeOfDay?: string;
  
  // 等待时间字段
  waitingTime?: number;
  
  // 扩展字段
  [key: string]: any;
}

// 2025-10-01 14:51:05 导出以便其他模块可用
export interface ParsedCondition {
  field: string;
  operator: string;
  value: any;
}

// 2025-10-01 14:59:30 统一条件节点类型，避免泛型数组不匹配
export type ConditionNode = ParsedCondition | { op: string; children: ConditionNode[] };

export class RuleExpressionEngine {
  
  // 允许的字段白名单
  private readonly fieldWhitelist = [
    'weight', 'volume', 'cargoType', 'pickup.city', 'delivery.city', 'distanceKm',
    'customerId', 'customerTier', 'driverId', 'driverLevel', 'waitingTime',
    'tenantId', 'channel', 'weekday', 'timeOfDay', 'createdAt'
  ];
  
  // 允许的操作符
  private readonly operators = [
    '=', '!=', '>', '>=', '<', '<=', 'IN', 'NOT IN', 'STARTS_WITH', 'ENDS_WITH', 'CONTAINS'
  ];
  
  // 允许的函数
  private readonly functions = ['round', 'ceil', 'floor', 'min', 'max'];
  
  /**
   * 解析条件表达式
   * @param expression 条件表达式字符串，如："weight > 1000 AND pickup.city = 'Toronto'"
   * @returns 解析后的条件对象
   */
  // 2025-10-01 14:59:30 使用统一的 ConditionNode 类型
  parseCondition(expression: string): ConditionNode {
    try {
      // 移除多余空格
      const cleaned = expression.trim().replace(/\s+/g, ' ');
      
      // 如果是简单条件，直接解析
      if (!cleaned.includes(' AND ') && !cleaned.includes(' OR ')) {
        return this.parseSimpleCondition(cleaned);
      }
      
      // 解析复合条件
      return this.parseComplexCondition(cleaned);
      
    } catch (error) {
      logger.error('解析条件表达式失败', { expression, error });
      throw new Error(`Invalid condition expression: ${expression}`);
    }
  }
  
  /**
   * 解析简单条件
   * @param expression 简单条件表达式
   */
  private parseSimpleCondition(expression: string): ParsedCondition {
    const operators = ['>=', '<=', '!=', '=', '>', '<', 'IN', 'NOT IN', 'STARTS_WITH', 'ENDS_WITH', 'CONTAINS'];
    
    for (const op of operators) {
      if (expression.includes(` ${op} `)) {
        const parts = expression.split(` ${op} `);
        if (parts.length === 2) {
          const field = parts[0].trim();
          const value = this.parseValue(parts[1].trim());
          
          if (!this.fieldWhitelist.includes(field)) {
            throw new Error(`Field '${field}' is not allowed`);
          }
          
          return { field, operator: op, value };
        }
      }
    }
    
    throw new Error(`Cannot parse condition: ${expression}`);
  }
  
  /**
   * 解析复合条件
   * @param expression 复合条件表达式
   */
  private parseComplexCondition(expression: string): { op: string; children: ConditionNode[] } {
    // 支持的逻辑操作符
    const logicalOps = [' AND ', ' OR '];
    
    for (const op of logicalOps) {
      if (expression.includes(op)) {
        const parts = expression.split(op);
        if (parts.length >= 2) {
          // 递归解析每个部分
          const children: ConditionNode[] = parts.map(part => this.parseCondition(part.trim()));
          
          return {
            op: op.trim(),
            children: children
          };
        }
      }
    }
    
    throw new Error(`Cannot parse complex condition: ${expression}`);
  }
  
  /**
   * 解析值
   * @param valueStr 值的字符串形式
   */
  private parseValue(valueStr: string): any {
    // 移除字符串的引号
    if ((valueStr.startsWith('"') && valueStr.endsWith('"')) || 
        (valueStr.startsWith("'") && valueStr.endsWith("'"))) {
      return valueStr.slice(1, -1);
    }
    
    // 解析数字
    if (/^-?\d+\.?\d*$/.test(valueStr)) {
      return parseFloat(valueStr);
    }
    
    // 解析布尔值
    if (valueStr === 'true') return true;
    if (valueStr === 'false') return false;
    
    // 解析数组 (IN/NOT IN)
    if (valueStr.startsWith('(') && valueStr.endsWith(')')) {
      const arrayStr = valueStr.slice(1, -1);
      const items = arrayStr.split(',').map(item => this.parseValue(item.trim()));
      return items;
    }
    
    // 默认返回字符串
    return valueStr;
  }
  
  /**
   * 评估条件是否成立
   * @param condition 解析后的条件
   * @param facts 事实数据
   */
  evaluateCondition(condition: ConditionNode, facts: RuleFact): boolean {
    if ('op' in condition) {
      // 复合条件
      const result = condition.children.map(child => this.evaluateCondition(child, facts));
      
      if (condition.op === 'AND') {
        return result.every(r => r);
      } else if (condition.op === 'OR') {
        return result.some(r => r);
      }
      
      return false;
    } else {
      // 简单条件
      return this.evaluateSimpleCondition(condition, facts);
    }
  }
  
  /**
   * 评估简单条件
   * @param condition 简单条件
   * @param facts 事实数据
   */
  private evaluateSimpleCondition(condition: ParsedCondition, facts: RuleFact): boolean {
    const fieldValue = this.getFieldValue(facts, condition.field);
    
    switch (condition.operator) {
      case '=':
        return fieldValue === condition.value;
      case '!=':
        return fieldValue !== condition.value;
      case '>':
        return Number(fieldValue) > Number(condition.value);
      case '>=':
        return Number(fieldValue) >= Number(condition.value);
      case '<':
        return Number(fieldValue) < Number(condition.value);
      case '<=':
        return Number(fieldValue) <= Number(condition.value);
      case 'IN':
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case 'NOT IN':
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case 'STARTS_WITH':
        return String(fieldValue).startsWith(String(condition.value));
      case 'ENDS_WITH':
        return String(fieldValue).endsWith(String(condition.value));
      case 'CONTAINS':
        return String(fieldValue).includes(String(condition.value));
      default:
        throw new Error(`Unsupported operator: ${condition.operator}`);
    }
  }
  
  /**
   * 获取字段值
   * @param facts 事实数据
   * @param field 字段名，支持点号分割如：pickup.city
   */
  private getFieldValue(facts: RuleFact, field: string): any {
    const parts = field.split('.');
    let value = facts;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }
    
    return value;
  }
  
  /**
   * 验证表达式安全性
   * @param expression 表达式字符串
   */
  validateExpression(expression: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    try {
      // 检查是否有危险操作
      const dangerousPatterns = [
        /require\s*\(/,
        /import\s+/,
        /eval\s*\(/,
        /Function\s*\(/,
        /process\./,
        /global\./,
        /this\./,
        /window\./
      ];
      
      for (const pattern of dangerousPatterns) {
        if (pattern.test(expression)) {
          errors.push('Expression contains dangerous code');
        }
      }
      
      // 检查字段白名单
      const fieldPattern = /\b[a-zA-Z_][a-zA-Z0-9_.]*\b/g;
      const matches = expression.match(fieldPattern);
      
      if (matches) {
        const fields = matches
          .filter(match => !this.isOperator(match) && !this.isReservedWord(match))
          .map(match => match.split('.')[0]); // 只检查主字段名
          
        for (const field of fields) {
          if (!this.fieldWhitelist.some(whitelistField => whitelistField.startsWith(field + '.'))) {
            errors.push(`Field '${field}' is not in whitelist`);
          }
        }
      }
      
      // 尝试解析
      this.parseCondition(expression);
      
      return { valid: errors.length === 0, errors };
      
    } catch (error) {
      errors.push(`Parse error: ${error.message}`);
      return { valid: false, errors };
    }
  }
  
  /**
   * 检查是否是操作符
   */
  private isOperator(str: string): boolean {
    return this.operators.includes(str) || ['AND', 'OR'].includes(str);
  }
  
  /**
   * 检查是否是保留字
   */
  private isReservedWord(str: string): boolean {
    return this.functions.includes(str) || 
           ['true', 'false', 'null', 'undefined'].includes(str.toLowerCase());
  }
  
  /**
   * 格式化表达式（美化显示）
   * @param expression 表达式字符串
   */
  formatExpression(expression: string): string {
    try {
      const parsed = this.parseCondition(expression);
      return this.formatCondition(parsed, 0);
    } catch (error) {
      return expression;
    }
  }
  
  /**
   * 递归格式化条件
   * @param condition 条件对象
   * @param indent 缩进级别
   */
  private formatCondition(condition: ConditionNode, indent: number): string {
    const spaces = '  '.repeat(indent);
    
    if ('op' in condition) {
      const formattedChildren = condition.children
        .map((child: any) => this.formatCondition(child, indent + 1))
        .join(`\n${spaces}  ${condition.op}\n${spaces}  `);
      
      return `(\n${spaces}  ${formattedChildren}\n${spaces})`;
    } else {
      return `${condition.field} ${condition.operator} ${this.formatValue(condition.value)}`;
    }
  }
  
  /**
   * 格式化值显示
   * @param value 值
   */
  private formatValue(value: any): string {
    if (typeof value === 'string') {
      return `"${value}"`;
    } else if (Array.isArray(value)) {
      return `(${value.map(v => this.formatValue(v)).join(', ')})`;
    }
    return String(value);
  }
}

// 导出工具函数
export function parseRuleExpression(expression: string): ConditionNode {
  const engine = new RuleExpressionEngine();
  return engine.parseCondition(expression);
}

export function evaluateRuleExpression(expression: string, facts: RuleFact): boolean {
  const engine = new RuleExpressionEngine();
  const condition = engine.parseCondition(expression);
  return engine.evaluateCondition(condition, facts);
}

