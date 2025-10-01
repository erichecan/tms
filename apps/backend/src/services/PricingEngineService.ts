// 智能计费规则引擎核心服务
// 创建时间: 2025-09-29 02:25:00
// 作用: 实现运单智能计费规则引擎的核心业务逻辑

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';
import {
  PricingTemplate,
  PricingCalculation,
  ShipmentContext,
  PricingDetail,
  BusinessScenarioType,
  PricingErrorCode,
  DriverRule,
  PricingRule,
  CostAllocationRule
} from '@tms/shared-types';

export class PricingEngineService {
  private db: DatabaseService;

  constructor(databaseService: DatabaseService) {
    this.db = databaseService;
    logger.info('PricingEngineService 初始化完成');
  }

  // =====================================================
  // 1. 核心计费计算方法
  // =====================================================

  /**
   * 为运单执行计费计算
   * @param shipmentContext 运单上下文信息
   * @param templateId 可选的模板ID，如果不指定会尝试自动匹配
   * @returns 计费计算结果
   */
  async calculatePricing(
    shipmentContext: ShipmentContext, 
    templateId?: string
  ): Promise<PricingCalculation> {
    const startTime = Date.now();
    
    try {
      logger.info(`开始为运单 ${shipmentContext.shipmentId} 执行计费计算`, {
        shipmentId: shipmentContext.shipmentId,
        templateId: templateId || 'auto-detect'
      });

      // 1. 获取或自动选择计费模板
      const template = templateId 
        ? await this.getPricingTemplateById(templateId)
        : await this.findBestTemplate(shipmentContext);

      if (!template) {
        // 2025-10-01 14:53:05 抛出标准错误对象，附加 code 以便控制器识别
        const err: any = new Error('未找到合适的计费模板');
        err.code = PricingErrorCode.TEMPLATE_NOT_FOUND;
        err.context = shipmentContext;
        throw err;
      }

      // 2. 验证模板是否适用于当前运单
      await this.validateTemplateMatch(template, shipmentContext);

      // 3. 执行收入侧计费规则
      const revenueBreakdown = await this.executeRevenueRules(template.pricingRules, shipmentContext);

      // 4. 执行司机薪酬计算
      const driverBreakdown = await this.executeDriverRules(template.driverRules, shipmentContext, revenueBreakdown);

      // 5. 执行内部成本计算
      const costBreakdown = await this.executeCostAllocation(template.costAllocation, shipmentContext);

      // 6. 计算汇总数据
      const calculation = await this.aggregatePricingResults({
        shipmentContext,
        template,
        revenueBreakdown,
        driverBreakdown,
        costBreakdown,
        calculationTime: Date.now() - startTime
      });

      // 7. 保存计费明细到数据库
      await this.savePricingDetails(calculation);

      logger.info(`运单 ${shipmentContext.shipmentId} 计费计算完成`, {
        duration: calculation.calculationTime,
        totalRevenue: calculation.totalRevenue,
        totalDriverPay: calculation.totalDriverPay,
        netProfit: calculation.netProfit
      });

      return calculation;

    } catch (error) {
      logger.error(`运单 ${shipmentContext.shipmentId} 计费计算失败`, error);
      throw error;
    }
  }

  // =====================================================
  // 2. 模板管理方法
  // =====================================================

  /**
   * 获取计费模板列表
   */
  async getPricingTemplates(): Promise<PricingTemplate[]> {
    try {
      const query = `
        SELECT id, tenant_id, name, description, type, business_conditions, 
               pricing_rules, driver_rules, cost_allocation, status, version,
               created_at, created_by, updated_at, updated_by
        FROM pricing_templates 
        WHERE tenant_id = $1 AND status = 'active'
        ORDER BY created_at DESC
      `;
      
      const result = await this.db.query(query, [process.env.CURRENT_TENANT_ID]);
      
      return result.rows;
    } catch (error) {
      logger.error('获取计费模板失败', error);
      throw error;
    }
  }

  /**
   * 根据ID获取计费模板
   */
  async getPricingTemplateById(templateId: string): Promise<PricingTemplate | null> {
    try {
      const query = `
        SELECT * FROM pricing_templates WHERE id = $1 AND tenant_id = $2
      `;
      
      const result = await this.db.query(query, [templateId, process.env.CURRENT_TENANT_ID]);
      
      return result[0] || null;
    } catch (error) {
      logger.error(`获取计费模板 ${templateId} 失败`, error);
      throw error;
    }
  }

  /**
   * 自动匹配最佳计费模板
   */
  async findBestTemplate(shipmentContext: ShipmentContext): Promise<PricingTemplate | null> {
    return this.findBestTemplateInternal(shipmentContext);
  }

  /**
   * 自动匹配最佳计费模板的实际实现 - 优化匹配逻辑 // 2025-10-01 22:00:00
   */
  private async findBestTemplateInternal(shipmentContext: ShipmentContext): Promise<PricingTemplate | null> {
    try {
      // 基于业务场景自动匹配最佳模板
      const scenario = this.detectBusinessScenario(shipmentContext);
      logger.info(`检测到业务场景: ${scenario}`, { shipmentContext });

      // 1. 首先尝试精确匹配业务场景
      let query = `
        SELECT * FROM pricing_templates 
        WHERE tenant_id = $1 AND type = $2 AND status = 'active'
        ORDER BY version DESC
        LIMIT 1
      `;
      
      let result = await this.db.query(query, [shipmentContext.tenantId, scenario]);
      
      if (result && result.length > 0) {
        logger.info(`找到精确匹配的模板: ${result[0].name}`);
        return result[0];
      }

      // 2. 如果没有精确匹配，尝试通用模板
      query = `
        SELECT * FROM pricing_templates 
        WHERE tenant_id = $1 AND type = 'CUSTOM' AND status = 'active'
        ORDER BY version DESC
        LIMIT 1
      `;
      
      result = await this.db.query(query, [shipmentContext.tenantId]);
      
      if (result && result.length > 0) {
        logger.info(`使用通用模板: ${result[0].name}`);
        return result[0];
      }

      // 3. 如果仍然没有找到，返回默认模板
      logger.warn(`未找到匹配的计费模板，使用默认逻辑`);
      return this.createDefaultTemplate(shipmentContext);
      
    } catch (error) {
      logger.error('自动匹配模板失败', error);
      return this.createDefaultTemplate(shipmentContext);
    }
  }

  /**
   * 检测业务场景类型
   */
  private detectBusinessScenario(context: ShipmentContext): BusinessScenarioType {
    // 基于上下文信息智能判断业务场景
    
    if (this.isWasteCollection(context)) {
      return 'WASTE_COLLECTION';
    }
    
    if (this.isWarehouseTransfer(context)) {
      return 'WAREHOUSE_TRANSFER';
    }
    
    if (this.isClientDirect(context)) {
      return 'CLIENT_DIRECT';
    }
    
    return 'CUSTOM';
  }

  private isWasteCollection(context: ShipmentContext): boolean {
    const { deliveryLocation } = context;
    // 简单的关键词匹配，实际会更复杂
    return deliveryLocation.address.toLowerCase().includes('landfill') ||
           deliveryLocation.address.toLowerCase().includes('disposal') ||
           deliveryLocation.warehouseCode === 'LANDFILL_01';
  }

  private isWarehouseTransfer(context: ShipmentContext): boolean {
    const { pickupLocation, deliveryLocation } = context as any;
    return (
      pickupLocation.warehouseCode === 'WH_07' && 
      deliveryLocation.warehouseCode === 'AMZ_YYZ9'
    ) || (
      pickupLocation.warehouseType === 'OWN_WAREHOUSE' &&
      deliveryLocation.warehouseType === 'THIRD_PARTY_WAREHOUSE'
    );
  }

  private isClientDirect(context: ShipmentContext): boolean {
    const { pickupLocation } = context as any;
    return !pickupLocation.warehouseId || pickupLocation.warehouseType === 'CLIENT_LOCATION';
  }

  /**
   * 创建默认计费模板 - 当没有找到匹配模板时使用 // 2025-10-01 22:00:00
   */
  private createDefaultTemplate(shipmentContext: ShipmentContext): PricingTemplate {
    logger.info('创建默认计费模板', { shipmentId: shipmentContext.shipmentId });
    
    return {
      id: 'default-template-' + Date.now(),
      tenantId: shipmentContext.tenantId,
      name: '默认计费模板',
      description: '通用默认计费模板',
      type: 'CUSTOM',
      businessConditions: {
        pickupType: 'ANY',
        deliveryType: 'ANY',
        customerType: 'ANY'
      },
      pricingRules: [
        {
          ruleId: 'default_base_fee',
          name: '基础运费',
          component: 'BASE_FEE',
          formula: 100,
          priority: 100
        },
        {
          ruleId: 'default_distance_fee',
          name: '距离费用',
          component: 'DISTANCE_FEE',
          formula: 'distance * 2',
          priority: 110
        },
        {
          ruleId: 'default_weight_fee',
          name: '重量费用',
          component: 'WEIGHT_FEE',
          formula: 'weight * 0.5',
          priority: 120
        }
      ],
      driverRules: [
        {
          ruleId: 'default_driver_pay',
          name: '司机基础工资',
          component: 'BASE_DRIVER_PAY',
          formula: 50,
          priority: 100
        }
      ],
      costAllocation: {
        FLEET_COST: 'auto_calculated',
        WAREHOUSE_COST: 20
      },
      status: 'active',
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // =====================================================
  // 3. 规则执行方法
  // =====================================================

  /**
   * 执行收入侧计费规则
   */
  private async executeRevenueRules(
    rules: PricingRule[], 
    context: ShipmentContext
  ): Promise<PricingDetail[]> {
    const breakdown: PricingDetail[] = [];
    
    for (const rule of rules) {
      try {
        // 检查条件是否满足
        if (rule.condition && !this.evaluateCondition(rule.condition, context)) {
          continue;
        }

        // 计算费用
        const amount = await this.calculateRuleAmount(rule, context);
        
        // 获取组件信息
        const component = await this.getComponentByCode(rule.component);
        
        breakdown.push({
          componentCode: rule.component,
          componentName: component?.name || rule.name,
          amount: amount,
          currency: 'CAD',
          formula: typeof rule.formula === 'string' ? rule.formula : `${rule.formula}`,
          inputValues: this.extractInputValues(context),
          sequence: breakdown.length,
          ruleId: rule.ruleId
        });

        logger.debug(`执行收入规则 ${rule.ruleId}: ${amount} CAD`);
        
      } catch (error) {
        logger.error(`执行收入规则 ${rule.ruleId} 失败`, error);
        throw error;
      }
    }
    
    return breakdown;
  }

  /**
   * 执行司机薪酬规则
   */
  private async executeDriverRules(
    rules: DriverRule[], 
    context: ShipmentContext,
    revenueBreakdown: PricingDetail[]
  ): Promise<PricingDetail[]> {
    const breakdown: PricingDetail[] = [];
    
    for (const rule of rules) {
      try {
        // 检查条件
        if (rule.condition && !this.evaluateCondition(rule.condition, context)) {
          continue;
        }

        // 计算薪酬
        let amount = await this.calculateRuleAmount(rule, context);
        
        // 如果司机分成存在，优先从总收入中分配
        if (rule.driverSharing && rule.driverSharing > 0) {
          const sharedAmount = Math.min(amount, rule.driverSharing);
          amount = sharedAmount;
        }

        const component = await this.getComponentByCode(rule.component);
        
        breakdown.push({
          componentCode: rule.component,
          componentName: component?.name || rule.name,
          amount: amount,
          currency: 'CAD',
          formula: typeof rule.formula === 'string' ? rule.formula : `${rule.formula}`,
          inputValues: this.extractInputValues(context),
          sequence: breakdown.length,
          ruleId: rule.ruleId
        });

        logger.debug(`执行司机规则 ${rule.ruleId}: ${amount} CAD`);
        
      } catch (error) {
        logger.error(`执行司机规则 ${rule.ruleId} 失败`, error);
        throw error;
      }
    }
    
    return breakdown;
  }

  /**
   * 执行内部成本计算
   */
  private async executeCostAllocation(
    allocations: CostAllocationRule,
    context: ShipmentContext
  ): Promise<PricingDetail[]> {
    const breakdown: PricingDetail[] = [];
    
    for (const [key, value] of Object.entries(allocations)) {
      if (typeof value === 'number') {
        const component = await this.getComponentByCode(key);
        
        breakdown.push({
          componentCode: key,
          componentName: component?.name || key,
          amount: value,
          currency: 'CAD',
          formula: `${value}`,
          inputValues: {},
          sequence: breakdown.length
        });
      } else if (value === 'auto_calculated') {
        // 自动计算的成本（如燃油、车辆损耗等）
        const autoCost = await this.calculateAutomaticCost(key, context);
        
        breakdown.push({
          componentCode: key,
          componentName: key,
          amount: autoCost,
          currency: 'CAD',
          formula: 'auto_calculated',
          inputValues: this.extractInputValues(context),
          sequence: breakdown.length
        });
      }
    }
    
    return breakdown;
  }

  // =====================================================
  // 4. 辅助计算方法
  // =====================================================

  /**
   * 执行条件表达式
   */
  private evaluateCondition(condition: string, context: ShipmentContext): boolean {
    try {
      // 简单的条件解析，实际会更复杂
      const sanitizedCondition = condition.toLowerCase();
      
      if (sanitizedCondition.includes('distance') && sanitizedCondition.includes('<=')) {
        const value = parseInt(sanitizedCondition.match(/(\d+)/)?.[1] || '0');
        return context.distance <= value;
      }
      
      if (sanitizedCondition.includes('weight') && sanitizedCondition.includes('>')) {
        const value = parseInt(sanitizedCondition.match(/(\d+)/)?.[1] || '0');
        return context.weight > value;
      }
      
      if (sanitizedCondition.includes('waitingtime') && sanitizedCondition.includes('>')) {
        const value = parseInt(sanitizedCondition.match(/(\d+)/)?.[1] || '0');
        return (context.actualWaitingTime || 0) > value;
      }
      
      // 默认返回 true
      return true;
      
    } catch (error) {
      logger.error(`条件判断失败: ${condition}`, error);
      return false;
    }
  }

  /**
   * 计算规则金额
   */
  private async calculateRuleAmount(rule: PricingRule | DriverRule, context: ShipmentContext): Promise<number> {
    if (typeof rule.formula === 'number') {
      return rule.formula;
    }
    
    // 解析字符串公式
    const formula = rule.formula as string;
    
    // 简单的公式解析器
    if (formula.includes('distance') && formula.includes('floor')) {
      // 处理类似: "180 + floor((distance-25)/20) * 20"
      const baseDistance = 25;
      const baseRate = 180;
      const extraRate = 20;
      
      if (context.distance <= baseDistance) {
        return baseRate;
      } else {
        const extraDistance = context.distance - baseDistance;
        const extraTiers = Math.floor(extraDistance / 20);
        return baseRate + extraTiers * extraRate;
      }
    }
    
    // 如果需要更复杂的表达式解析，可以集成 math.js 等库
    try {
      return eval(formula.replace(/distance/g, `${context.distance}`).replace(/weight/g, `${context.weight}`));
    } catch (error) {
      logger.error(`公式计算失败: ${formula}`, error);
      return 0;
    }
  }

  /**
   * 自动计算成本
   */
  private async calculateAutomaticCost(costType: string, context: ShipmentContext): Promise<number> {
    switch (costType) {
      case 'FLEET_COST':
        // 基于距离和重量的车队成本
        return context.distance * 0.8 + context.weight * 0.1;
      
      case 'FUEL_COST':
        // 燃油成本估算
        return context.distance * 0.6;
      
      default:
        return 0;
    }
  }

  /**
   * 聚合计费结果
   */
  private async aggregatePricingResults(params: {
    shipmentContext: ShipmentContext;
    template: PricingTemplate;
    revenueBreakdown: PricingDetail[];
    driverBreakdown: PricingDetail[];
    costBreakdown: PricingDetail[];
    calculationTime: number;
  }): Promise<PricingCalculation> {
    const { shipmentContext, template, revenueBreakdown, driverBreakdown, costBreakdown, calculationTime } = params;

    const totalRevenue = revenueBreakdown.reduce((sum, detail) => sum + detail.amount, 0);
    const totalDriverPay = driverBreakdown.reduce((sum, detail) => sum + detail.amount, 0);
    const totalInternalCosts = costBreakdown.reduce((sum, detail) => sum + detail.amount, 0);
    
    const grossProfit = totalRevenue - totalInternalCosts;
    const netProfit = grossProfit - totalDriverPay;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    return {
      shipmentId: shipmentContext.shipmentId,
      templateId: template.id,
      templateName: template.name,
      totalRevenue,
      totalDriverPay,
      totalInternalCosts,
      grossProfit,
      netProfit,
      profitMargin,
      revenueBreakdown,
      driverBreakdown,
      costBreakdown,
      appliedRules: [...revenueBreakdown, ...driverBreakdown, ...costBreakdown].map(r => r.ruleId || ''),
      calculationTime,
      pricingVersion: template.version.toString(),
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * 提取输入值
   */
  private extractInputValues(context: ShipmentContext): Record<string, any> {
    return {
      distance: context.distance,
      weight: context.weight,
      volume: context.volume,
      waitingTime: context.actualWaitingTime,
      pallets: context.pallets,
      customerTier: context.customerTier,
      cargoType: context.cargoType,
      isHazardous: context.isHazardous
    };
  }

  /**
   * 获取组件信息
   */
  private async getComponentByCode(code: string): Promise<any> {
    try {
      const query = 'SELECT * FROM pricing_components WHERE code = $1 AND tenant_id = $2';
      const result = await this.db.query(query, [code, process.env.CURRENT_TENANT_ID]);
      return result[0];
    } catch (error) {
      logger.debug(`获取组件 ${code} 失败`, error);
      return null;
    }
  }

  /**
   * 保存计费明细
   */
  private async savePricingDetails(calculation: PricingCalculation): Promise<void> {
    try {
      // 2025-10-01 14:50:20 使用公开的 getConnection 进行事务
      const client = await this.db.getConnection();
      
      await client.query('BEGIN');
      
      try {
        // 清除历史计费明细
        await client.query(
          'DELETE FROM shipment_pricing_details WHERE shipment_id = $1',
          [calculation.shipmentId]
        );
        
        // 保存新的计费明细
        const allDetails = [
          ...calculation.revenueBreakdown,
          ...calculation.driverBreakdown,
          ...calculation.costBreakdown
        ];
        
        for (const detail of allDetails) {
          await client.query(`
            INSERT INTO shipment_pricing_details 
            (shipment_id, applied_component_code, input_values, calculated_amount, 
             currency, component_type, sequence, calculation_formula, execution_time, calculated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
          `, [
            calculation.shipmentId,
            detail.componentCode,
            JSON.stringify(detail.inputValues),
            detail.amount,
            detail.currency,
            this.getComponentTypeFromCode(detail.componentCode),
            detail.sequence,
            detail.formula,
            0, // execution_time
            calculation.calculatedAt
          ]);
        }
        
        // 更新运单的计费信息
        await client.query(`
          UPDATE shipments 
          SET pricing_template_id = $1, pricing_calculated_at = $2, 
              pricing_version = $3, pricing_trace = $4
          WHERE id = $5
        `, [
          calculation.templateId,
          calculation.calculatedAt,
          calculation.pricingVersion,
          JSON.stringify({ totalRevenue: calculation.totalRevenue, appliedRules: calculation.appliedRules }),
          calculation.shipmentId
        ]);
        
        await client.query('COMMIT');
        logger.debug(`运单 ${calculation.shipmentId} 计费明细已保存`);
        
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
      
    } catch (error) {
      logger.error(`保存计费明细失败`, error);
      throw error;
    }
  }

  /**
   * 验证模板是否匹配
   */
  private async validateTemplateMatch(template: PricingTemplate, context: ShipmentContext): Promise<void> {
    // 基础的模板匹配验证
    if (template.type === 'WASTE_COLLECTION' && !this.isWasteCollection(context)) {
      const err: any = new Error('模板类型与运单场景不匹配');
      err.code = PricingErrorCode.TEMPLATE_NOT_FOUND;
      err.context = context;
      throw err;
    }
  }

  /**
   * 根据代码获取组件类型
   */
  private getComponentTypeFromCode(code: string): string {
    if (code.includes('PAY') || code.includes('COMMISSION') || code.includes('BONUS')) {
      return 'DRIVER_COMPENSATION';
    }
    if (code.includes('COST') || code.includes('FLEET') || code.includes('WAREHOUSE')) {
      return 'INTERNAL_COST';
    }
    return 'REVENUE';
  }

  // =====================================================
  // 5. 公共API方法
  // =====================================================

  /**
   * 预览计费结果（不保存）
   */
  async previewPricing(shipmentContext: ShipmentContext): Promise<PricingCalculation> {
    return this.calculatePricing(shipmentContext);
  }

  /**
   * 重新计算运单费用
   */
  async recalculateShipmentPricing(shipmentId: string): Promise<PricingCalculation> {
    // 从数据库获取运单信息并构建上下文
    try {
      const shipment = await this.db.query('SELECT * FROM shipments WHERE id = $1', [shipmentId]);
      if (!shipment || shipment.length === 0) {
        throw new Error(`运单 ${shipmentId} 不存在`);
      }
      const shipmentData = shipment[0];

      const context: ShipmentContext = {
        shipmentId: shipmentData.id,
        tenantId: shipmentData.tenant_id,
        pickupLocation: {
          warehouseId: shipmentData.pickup_address?.warehouse_id,
          warehouseCode: shipmentData.pickup_address?.warehouse_code,
          address: shipmentData.pickup_address?.street || shipmentData.shipper_addr_line1,
          city: shipmentData.pickup_address?.city || shipmentData.shipper_city
        },
        deliveryLocation: {
          warehouseId: shipmentData.delivery_address?.warehouse_id,
          warehouseCode: shipmentData.delivery_address?.warehouse_code,
          address: shipmentData.delivery_address?.street || shipmentData.receiver_addr_line1,
          city: shipmentData.delivery_address?.city || shipmentData.receiver_city
        },
        distance: shipmentData.cargo_info?.distance || 0,
        weight: shipmentData.weight_kg || 0,
        volume: shipmentData.cargo_info?.volume,
        pallets: shipmentData.cargo_info?.pallets,
        customerTier: shipmentData.customer_tier,
        cargoType: shipmentData.cargo_info?.type
      };

    return this.calculatePricing(context, shipmentData.pricing_template_id);
    } catch (error) {
      logger.error(`重新计算运单费用失败: ${shipmentId}`, error);
      throw error;
    }
  }
}

// 2025-10-01 14:50:20 移除重复的错误类定义，使用 shared-types 中的类型接口并抛出标准 Error
