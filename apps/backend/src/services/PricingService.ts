// 智能报价服务
// 创建时间: 2025-01-27 15:30:45

import { RuleEngineService } from './RuleEngineService';
import { DatabaseService } from './DatabaseService';
import { CurrencyService } from './CurrencyService';
import { logger } from '../utils/logger';
import { 
  Shipment, 
  Customer, 
  Driver, 
  AdditionalFee, 
  FeeType,
  CustomerLevel,
  DEFAULT_CURRENCY
} from '@tms/shared-types';

export interface QuoteRequest {
  customerId: string;
  pickupAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    coordinates?: { lat: number; lng: number };
  };
  cargoInfo: {
    description: string;
    weight: number;
    volume: number;
    dimensions: { length: number; width: number; height: number };
    value: number;
    specialRequirements?: string[];
    hazardous: boolean;
  };
  currency?: string;
  deliveryTime?: string;
  weekendDelivery?: boolean;
  needsTailgate?: boolean;
}

export interface QuoteResponse {
  shipmentId: string;
  baseRate: number;
  distance: number;
  estimatedCost: number;
  currency: string;
  breakdown: {
    baseFee: number;
    distanceFee: number;
    weightFee: number;
    volumeFee: number;
    specialFees: number;
    discounts: number;
  };
  appliedRules: string[];
  validUntil: Date;
  additionalFees?: AdditionalFee[];
}

export class PricingService {
  private ruleEngineService: RuleEngineService;
  private dbService: DatabaseService;
  private currencyService: CurrencyService;

  // 基础费率配置
  private readonly BASE_RATES = {
    van: 2.5,      // 元/公里
    truck: 3.0,    // 元/公里
    trailer: 4.0,  // 元/公里
    refrigerated: 5.0 // 元/公里
  };

  // 重量费率配置
  private readonly WEIGHT_RATES = {
    light: { max: 1000, rate: 0 },      // 1吨以下免费
    medium: { max: 5000, rate: 0.5 },   // 1-5吨 0.5元/公斤
    heavy: { max: 15000, rate: 0.3 },   // 5-15吨 0.3元/公斤
    extraHeavy: { max: 50000, rate: 0.2 } // 15吨以上 0.2元/公斤
  };

  // 体积费率配置
  private readonly VOLUME_RATES = {
    small: { max: 10, rate: 0 },        // 10立方米以下免费
    medium: { max: 30, rate: 5 },       // 10-30立方米 5元/立方米
    large: { max: 60, rate: 3 },        // 30-60立方米 3元/立方米
    extraLarge: { max: 100, rate: 2 }   // 60立方米以上 2元/立方米
  };

  constructor(ruleEngineService: RuleEngineService, dbService: DatabaseService, currencyService: CurrencyService) {
    this.ruleEngineService = ruleEngineService;
    this.dbService = dbService;
    this.currencyService = currencyService;
  }

  /**
   * 生成报价
   * @param tenantId 租户ID
   * @param request 报价请求
   * @returns 报价响应
   */
  async generateQuote(tenantId: string, request: QuoteRequest): Promise<QuoteResponse> {
    try {
      // 获取客户信息
      const customer = await this.dbService.getCustomer(tenantId, request.customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // 确定币种
      const currency = request.currency || DEFAULT_CURRENCY;

      // 计算基础信息
      const distance = await this.calculateDistance(request.pickupAddress, request.deliveryAddress);
      const vehicleType = this.determineVehicleType(request.cargoInfo);
      const baseRate = this.BASE_RATES[vehicleType];

      // 构建规则引擎事实
      const facts = this.buildFacts(request, customer, distance, vehicleType);

      // 执行计费规则
      const ruleResult = await this.ruleEngineService.executeRules(tenantId, facts);

      // 计算基础费用
      const baseFee = this.calculateBaseFee(distance, baseRate);
      const distanceFee = this.calculateDistanceFee(distance, baseRate);
      const weightFee = this.calculateWeightFee(request.cargoInfo.weight);
      const volumeFee = this.calculateVolumeFee(request.cargoInfo.volume);
      const specialFees = this.calculateSpecialFees(request);

      // 应用规则结果
      const { finalCost, appliedRules, discounts } = this.applyRuleResults(
        baseFee + distanceFee + weightFee + volumeFee + specialFees,
        ruleResult
      );

      // 创建运单记录
      const shipment = await this.createShipment(tenantId, request, finalCost, appliedRules, currency);

      // 生成报价响应
      const response: QuoteResponse = {
        shipmentId: shipment.id,
        baseRate,
        distance,
        estimatedCost: finalCost,
        currency,
        breakdown: {
          baseFee,
          distanceFee,
          weightFee,
          volumeFee,
          specialFees,
          discounts
        },
        appliedRules,
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时有效
        additionalFees: []
      };

      logger.info(`Quote generated for shipment ${shipment.id}: ${finalCost} CAD`);
      return response;
    } catch (error) {
      logger.error('Failed to generate quote:', error);
      throw error;
    }
  }

  /**
   * 计算距离
   * @param pickup 取货地址
   * @param delivery 送货地址
   * @returns 距离（公里）
   */
  private async calculateDistance(pickup: any, delivery: any): Promise<number> {
    // 如果有坐标，使用Haversine公式计算
    if (pickup.coordinates && delivery.coordinates) {
      return this.calculateHaversineDistance(
        pickup.coordinates.lat,
        pickup.coordinates.lng,
        delivery.coordinates.lat,
        delivery.coordinates.lng
      );
    }

    // 否则使用邮编估算距离（简化处理）
    return this.estimateDistanceByPostalCode(pickup.postalCode, delivery.postalCode);
  }

  /**
   * 使用Haversine公式计算两点间距离
   * @param lat1 纬度1
   * @param lng1 经度1
   * @param lat2 纬度2
   * @param lng2 经度2
   * @returns 距离（公里）
   */
  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 地球半径（公里）
    const dLat = this.toRadians(lat2 - lat1);
    const dLng = this.toRadians(lng2 - lng1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
              Math.sin(dLng / 2) * Math.sin(dLng / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * 角度转弧度
   * @param degrees 角度
   * @returns 弧度
   */
  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 根据邮编估算距离
   * @param postalCode1 邮编1
   * @param postalCode2 邮编2
   * @returns 估算距离（公里）
   */
  private estimateDistanceByPostalCode(postalCode1: string, postalCode2: string): number {
    // 简化的距离估算逻辑
    // 实际应用中应该使用更精确的地理编码服务
    const code1 = parseInt(postalCode1.substring(0, 2));
    const code2 = parseInt(postalCode2.substring(0, 2));
    
    const diff = Math.abs(code1 - code2);
    return Math.max(10, diff * 50); // 最小10公里，每个邮编差异约50公里
  }

  /**
   * 确定车辆类型
   * @param cargoInfo 货物信息
   * @returns 车辆类型
   */
  private determineVehicleType(cargoInfo: any): 'van' | 'truck' | 'trailer' | 'refrigerated' {
    if (cargoInfo.specialRequirements?.includes('冷藏')) {
      return 'refrigerated';
    }
    
    if (cargoInfo.weight > 15000 || cargoInfo.volume > 60) {
      return 'trailer';
    }
    
    if (cargoInfo.weight > 5000 || cargoInfo.volume > 30) {
      return 'truck';
    }
    
    return 'van';
  }

  /**
   * 构建规则引擎事实
   * @param request 报价请求
   * @param customer 客户信息
   * @param distance 距离
   * @param vehicleType 车辆类型
   * @returns 事实对象
   */
  private buildFacts(request: QuoteRequest, customer: Customer, distance: number, vehicleType: string): Record<string, any> {
    return {
      customerLevel: customer.level,
      cargoWeight: request.cargoInfo.weight,
      transportDistance: distance,
      destinationPostalCode: request.deliveryAddress.postalCode,
      needsTailgate: request.needsTailgate || false,
      vehicleType,
      isHazardous: request.cargoInfo.hazardous,
      deliveryTime: request.deliveryTime || 'standard',
      weekendDelivery: request.weekendDelivery || false,
      cargoValue: request.cargoInfo.value,
      cargoVolume: request.cargoInfo.volume,
      specialRequirements: request.cargoInfo.specialRequirements || []
    };
  }

  /**
   * 计算基础费用
   * @param distance 距离
   * @param baseRate 基础费率
   * @returns 基础费用
   */
  private calculateBaseFee(distance: number, baseRate: number): number {
    return Math.max(50, distance * baseRate); // 最低50元
  }

  /**
   * 计算距离费用
   * @param distance 距离
   * @param baseRate 基础费率
   * @returns 距离费用
   */
  private calculateDistanceFee(distance: number, baseRate: number): number {
    if (distance <= 50) {
      return distance * baseRate;
    } else if (distance <= 200) {
      return 50 * baseRate + (distance - 50) * baseRate * 0.8;
    } else {
      return 50 * baseRate + 150 * baseRate * 0.8 + (distance - 200) * baseRate * 0.6;
    }
  }

  /**
   * 计算重量费用
   * @param weight 重量（公斤）
   * @returns 重量费用
   */
  private calculateWeightFee(weight: number): number {
    if (weight <= this.WEIGHT_RATES.light.max) {
      return 0;
    } else if (weight <= this.WEIGHT_RATES.medium.max) {
      return (weight - this.WEIGHT_RATES.light.max) * this.WEIGHT_RATES.medium.rate;
    } else if (weight <= this.WEIGHT_RATES.heavy.max) {
      return (this.WEIGHT_RATES.medium.max - this.WEIGHT_RATES.light.max) * this.WEIGHT_RATES.medium.rate +
             (weight - this.WEIGHT_RATES.medium.max) * this.WEIGHT_RATES.heavy.rate;
    } else {
      return (this.WEIGHT_RATES.medium.max - this.WEIGHT_RATES.light.max) * this.WEIGHT_RATES.medium.rate +
             (this.WEIGHT_RATES.heavy.max - this.WEIGHT_RATES.medium.max) * this.WEIGHT_RATES.heavy.rate +
             (weight - this.WEIGHT_RATES.heavy.max) * this.WEIGHT_RATES.extraHeavy.rate;
    }
  }

  /**
   * 计算体积费用
   * @param volume 体积（立方米）
   * @returns 体积费用
   */
  private calculateVolumeFee(volume: number): number {
    if (volume <= this.VOLUME_RATES.small.max) {
      return 0;
    } else if (volume <= this.VOLUME_RATES.medium.max) {
      return (volume - this.VOLUME_RATES.small.max) * this.VOLUME_RATES.medium.rate;
    } else if (volume <= this.VOLUME_RATES.large.max) {
      return (this.VOLUME_RATES.medium.max - this.VOLUME_RATES.small.max) * this.VOLUME_RATES.medium.rate +
             (volume - this.VOLUME_RATES.medium.max) * this.VOLUME_RATES.large.rate;
    } else {
      return (this.VOLUME_RATES.medium.max - this.VOLUME_RATES.small.max) * this.VOLUME_RATES.medium.rate +
             (this.VOLUME_RATES.large.max - this.VOLUME_RATES.medium.max) * this.VOLUME_RATES.large.rate +
             (volume - this.VOLUME_RATES.large.max) * this.VOLUME_RATES.extraLarge.rate;
    }
  }

  /**
   * 计算特殊费用
   * @param request 报价请求
   * @returns 特殊费用
   */
  private calculateSpecialFees(request: QuoteRequest): number {
    let specialFees = 0;

    // 危险品费用
    if (request.cargoInfo.hazardous) {
      specialFees += 200;
    }

    // 尾板费用
    if (request.needsTailgate) {
      specialFees += 100;
    }

    // 周末配送费用
    if (request.weekendDelivery) {
      specialFees += 150;
    }

    // 紧急配送费用
    if (request.deliveryTime === 'urgent') {
      specialFees += 300;
    }

    return specialFees;
  }

  /**
   * 应用规则结果
   * @param baseCost 基础费用
   * @param ruleResult 规则执行结果
   * @returns 最终费用和应用的规则
   */
  private applyRuleResults(baseCost: number, ruleResult: any): {
    finalCost: number;
    appliedRules: string[];
    discounts: number;
  } {
    let finalCost = baseCost;
    let discounts = 0;
    const appliedRules: string[] = [];

    // 处理规则执行结果
    for (const event of ruleResult.events) {
      if (event.type === 'rule-executed') {
        const actions = event.params?.actions || [];
        
        for (const action of actions) {
          appliedRules.push(action.type);
          
          switch (action.type) {
            case 'applyDiscount':
              const discountAmount = baseCost * (action.params.percentage / 100);
              finalCost -= discountAmount;
              discounts += discountAmount;
              break;
              
            case 'addFee':
              finalCost += action.params.amount;
              break;
              
            case 'setBaseRate':
              // 基础费率调整在计算阶段处理
              break;
              
            case 'setCustomerLevel':
              // 客户等级调整
              break;
          }
        }
      }
    }

    return {
      finalCost: Math.max(0, finalCost),
      appliedRules,
      discounts
    };
  }

  /**
   * 创建运单
   * @param tenantId 租户ID
   * @param request 报价请求
   * @param estimatedCost 预估费用
   * @param appliedRules 应用的规则
   * @returns 创建的运单
   */
  private async createShipment(
    tenantId: string, 
    request: QuoteRequest, 
    estimatedCost: number, 
    appliedRules: string[],
    currency: string
  ): Promise<Shipment> {
    const shipmentData: Omit<Shipment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'> = {
      customerId: request.customerId,
      pickupAddress: request.pickupAddress,
      deliveryAddress: request.deliveryAddress,
      cargoInfo: {
        ...request.cargoInfo,
        specialRequirements: request.cargoInfo.specialRequirements || []
      },
      estimatedCost,
      currency,
      appliedRules,
      status: 'quoted' as const,
      shipmentNumber: `TMP${Date.now()}`,
      additionalFees: [],
      timeline: { created: new Date() }
    };

    return await this.dbService.createShipment(tenantId, shipmentData);
  }

  /**
   * 添加追加费用
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param fee 追加费用
   * @returns 更新后的运单
   */
  async addAdditionalFee(
    tenantId: string, 
    shipmentId: string, 
    fee: Omit<AdditionalFee, 'id' | 'appliedAt'>
  ): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const additionalFee: AdditionalFee = {
        id: `fee_${Date.now()}`,
        type: fee.type,
        description: fee.description,
        amount: fee.amount,
        appliedAt: new Date(),
        appliedBy: fee.appliedBy
      };

      const updatedFees = [...(shipment.additionalFees || []), additionalFee];
      const newTotalCost = shipment.estimatedCost + fee.amount;

      return await this.dbService.updateShipment(tenantId, shipmentId, {
        additionalFees: updatedFees,
        actualCost: newTotalCost
      });
    } catch (error) {
      logger.error('Failed to add additional fee:', error);
      throw error;
    }
  }

  /**
   * 获取报价历史
   * @param tenantId 租户ID
   * @param customerId 客户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 报价历史
   */
  async getQuoteHistory(
    tenantId: string, 
    customerId?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<Shipment[]> {
    try {
      const result = await this.dbService.getShipments(tenantId, {
        filters: { customerId, startDate, endDate, status: 'quoted' }
      });
      return result.data || [];
    } catch (error) {
      logger.error('Failed to get quote history:', error);
      throw error;
    }
  }
}
