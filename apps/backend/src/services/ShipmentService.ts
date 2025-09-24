// 运单管理服务
// 创建时间: 2025-01-27 15:30:45

import { DatabaseService } from './DatabaseService';
import { RuleEngineService } from './RuleEngineService';
import { logger } from '../utils/logger';
import { 
  Shipment, 
  Driver, 
  ShipmentStatus, 
  QueryParams,
  PaginatedResponse,
  AdditionalFee
} from '@shared/index';

export interface ShipmentAssignment {
  shipmentId: string;
  driverId: string;
  assignedBy: string;
  notes?: string;
}

export interface ShipmentUpdate {
  status?: ShipmentStatus;
  driverId?: string;
  actualCost?: number;
  additionalFees?: AdditionalFee[];
  timeline?: Partial<Record<ShipmentStatus, Date>>;
  notes?: string;
}

export interface ShipmentStats {
  total: number;
  byStatus: Record<ShipmentStatus, number>;
  byDriver: Record<string, number>;
  totalRevenue: number;
  averageDeliveryTime: number;
  onTimeRate: number;
}

export class ShipmentService {
  private dbService: DatabaseService;
  private ruleEngineService: RuleEngineService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService) {
    this.dbService = dbService;
    this.ruleEngineService = ruleEngineService;
  }

  /**
   * 创建运单
   * @param tenantId 租户ID
   * @param shipmentData 运单数据
   * @returns 创建的运单
   */
  async createShipment(
    tenantId: string, 
    shipmentData: Omit<Shipment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>
  ): Promise<Shipment> {
    try {
      // 生成运单号
      const shipmentNumber = await this.generateShipmentNumber(tenantId);
      
      const newShipment = {
        ...shipmentData,
        shipmentNumber,
        status: 'pending' as ShipmentStatus,
        timeline: {
          created: new Date()
        }
      };

      const shipment = await this.dbService.createShipment(tenantId, newShipment);
      
      logger.info(`Shipment created: ${shipment.id} (${shipmentNumber})`);
      return shipment;
    } catch (error) {
      logger.error('Failed to create shipment:', error);
      throw error;
    }
  }

  /**
   * 获取运单列表
   * @param tenantId 租户ID
   * @param params 查询参数
   * @returns 分页运单列表
   */
  async getShipments(tenantId: string, params: QueryParams): Promise<PaginatedResponse<Shipment>> {
    try {
      return await this.dbService.getShipments(tenantId, params);
    } catch (error) {
      logger.error('Failed to get shipments:', error);
      throw error;
    }
  }

  /**
   * 获取单个运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @returns 运单信息
   */
  async getShipment(tenantId: string, shipmentId: string): Promise<Shipment | null> {
    try {
      return await this.dbService.getShipment(tenantId, shipmentId);
    } catch (error) {
      logger.error('Failed to get shipment:', error);
      throw error;
    }
  }

  /**
   * 更新运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param updates 更新数据
   * @returns 更新后的运单
   */
  async updateShipment(
    tenantId: string, 
    shipmentId: string, 
    updates: ShipmentUpdate
  ): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      // 更新状态时间线
      if (updates.status && updates.status !== shipment.status) {
        const timeline = { ...shipment.timeline };
        timeline[updates.status] = new Date();
        updates.timeline = timeline;
      }

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      logger.info(`Shipment updated: ${shipmentId} - Status: ${updates.status || shipment.status}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to update shipment:', error);
      throw error;
    }
  }

  /**
   * 分配司机
   * @param tenantId 租户ID
   * @param assignment 分配信息
   * @returns 更新后的运单
   */
  async assignDriver(tenantId: string, assignment: ShipmentAssignment): Promise<Shipment> {
    try {
      // 检查司机是否可用
      const driver = await this.dbService.getDriver(tenantId, assignment.driverId);
      if (!driver || driver.status !== 'active') {
        throw new Error('Driver not available');
      }

      // 检查运单状态
      const shipment = await this.dbService.getShipment(tenantId, assignment.shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status !== 'quoted' && shipment.status !== 'confirmed') {
        throw new Error('Shipment cannot be assigned in current status');
      }

      // 更新运单
      const updates: ShipmentUpdate = {
        driverId: assignment.driverId,
        status: 'assigned',
        timeline: {
          ...shipment.timeline,
          assigned: new Date()
        }
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, assignment.shipmentId, updates);
      
      logger.info(`Driver assigned to shipment: ${assignment.shipmentId} -> ${assignment.driverId}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to assign driver:', error);
      throw error;
    }
  }

  /**
   * 确认运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @returns 更新后的运单
   */
  async confirmShipment(tenantId: string, shipmentId: string): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status !== 'quoted') {
        throw new Error('Only quoted shipments can be confirmed');
      }

      const updates: ShipmentUpdate = {
        status: 'confirmed',
        timeline: {
          ...shipment.timeline,
          confirmed: new Date()
        }
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      logger.info(`Shipment confirmed: ${shipmentId}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to confirm shipment:', error);
      throw error;
    }
  }

  /**
   * 开始取货
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param driverId 司机ID
   * @returns 更新后的运单
   */
  async startPickup(tenantId: string, shipmentId: string, driverId: string): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.driverId !== driverId) {
        throw new Error('Driver not assigned to this shipment');
      }

      if (shipment.status !== 'assigned') {
        throw new Error('Shipment must be assigned before pickup');
      }

      const updates: ShipmentUpdate = {
        status: 'picked_up',
        timeline: {
          ...shipment.timeline,
          pickedUp: new Date()
        }
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      logger.info(`Pickup started for shipment: ${shipmentId}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to start pickup:', error);
      throw error;
    }
  }

  /**
   * 开始运输
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param driverId 司机ID
   * @returns 更新后的运单
   */
  async startTransit(tenantId: string, shipmentId: string, driverId: string): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.driverId !== driverId) {
        throw new Error('Driver not assigned to this shipment');
      }

      if (shipment.status !== 'picked_up') {
        throw new Error('Shipment must be picked up before transit');
      }

      const updates: ShipmentUpdate = {
        status: 'in_transit',
        timeline: {
          ...shipment.timeline,
          inTransit: new Date()
        }
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      logger.info(`Transit started for shipment: ${shipmentId}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to start transit:', error);
      throw error;
    }
  }

  /**
   * 完成配送
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param driverId 司机ID
   * @param deliveryNotes 配送备注
   * @returns 更新后的运单
   */
  async completeDelivery(
    tenantId: string, 
    shipmentId: string, 
    driverId: string, 
    deliveryNotes?: string
  ): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.driverId !== driverId) {
        throw new Error('Driver not assigned to this shipment');
      }

      if (shipment.status !== 'in_transit') {
        throw new Error('Shipment must be in transit before delivery');
      }

      const updates: ShipmentUpdate = {
        status: 'delivered',
        timeline: {
          ...shipment.timeline,
          delivered: new Date()
        },
        notes: deliveryNotes
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      logger.info(`Delivery completed for shipment: ${shipmentId}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to complete delivery:', error);
      throw error;
    }
  }

  /**
   * 完成运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param finalCost 最终费用
   * @returns 更新后的运单
   */
  async completeShipment(tenantId: string, shipmentId: string, finalCost?: number): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (shipment.status !== 'delivered') {
        throw new Error('Shipment must be delivered before completion');
      }

      const updates: ShipmentUpdate = {
        status: 'completed',
        actualCost: finalCost || shipment.actualCost || shipment.estimatedCost,
        timeline: {
          ...shipment.timeline,
          completed: new Date()
        }
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      // 计算司机薪酬
      await this.calculateDriverCommission(tenantId, shipmentId);
      
      logger.info(`Shipment completed: ${shipmentId}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to complete shipment:', error);
      throw error;
    }
  }

  /**
   * 取消运单
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   * @param reason 取消原因
   * @returns 更新后的运单
   */
  async cancelShipment(tenantId: string, shipmentId: string, reason: string): Promise<Shipment> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      if (['completed', 'cancelled'].includes(shipment.status)) {
        throw new Error('Shipment cannot be cancelled in current status');
      }

      const updates: ShipmentUpdate = {
        status: 'cancelled',
        notes: reason
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
      logger.info(`Shipment cancelled: ${shipmentId} - Reason: ${reason}`);
      return updatedShipment;
    } catch (error) {
      logger.error('Failed to cancel shipment:', error);
      throw error;
    }
  }

  /**
   * 计算司机薪酬
   * @param tenantId 租户ID
   * @param shipmentId 运单ID
   */
  private async calculateDriverCommission(tenantId: string, shipmentId: string): Promise<void> {
    try {
      const shipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!shipment || !shipment.driverId) {
        return;
      }

      const deliveryTime = (shipment.timeline?.delivered && shipment.timeline?.pickedUp)
        ? shipment.timeline.delivered.getTime() - shipment.timeline.pickedUp.getTime()
        : 0;

      // 构建薪酬计算事实
      const facts = {
        shipmentId: shipment.id,
        driverId: shipment.driverId,
        finalCost: shipment.actualCost || shipment.estimatedCost,
        distance: shipment.transportDistance || 0,
        weight: shipment.cargoInfo.weight,
        volume: shipment.cargoInfo.volume,
        deliveryTime: deliveryTime,
        customerLevel: shipment.customer?.level || 'standard'
      };

      // 执行薪酬规则
      const ruleResult = await this.ruleEngineService.executeRules(tenantId, facts);
      
      // 计算薪酬
      let commission = 0;
      if (facts.finalCost) {
        for (const event of ruleResult.events) {
          if (event.type === 'rule-executed') {
            const actions = event.params?.actions || [];
            for (const action of actions) {
              if (action.type === 'setDriverCommission') {
                commission = facts.finalCost * (action.params.percentage / 100);
                break;
              }
            }
          }
        }
      }

      // 保存薪酬记录
      await this.dbService.createFinancialRecord(tenantId, {
        type: 'payable',
        referenceId: shipment.driverId,
        amount: commission,
        status: 'pending',
        description: `运单 ${shipment.shipmentNumber} 司机薪酬`
      });

      logger.info(`Driver commission calculated: ${shipment.driverId} - ${commission} CNY`);
    } catch (error) {
      logger.error('Failed to calculate driver commission:', error);
    }
  }

  /**
   * 生成运单号
   * @param tenantId 租户ID
   * @returns 运单号
   */
  private async generateShipmentNumber(tenantId: string): Promise<string> {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // 获取当日运单数量
    const todayStart = new Date(year, date.getMonth(), date.getDate());
    const todayEnd = new Date(year, date.getMonth(), date.getDate() + 1);
    
    const shipments = await this.dbService.getShipments(tenantId, {
      startDate: todayStart,
      endDate: todayEnd
    });
    
    const sequence = (shipments.data?.length || 0) + 1;
    const sequenceStr = String(sequence).padStart(4, '0');
    
    return `TMS${year}${month}${day}${sequenceStr}`;
  }

  /**
   * 获取运单统计
   * @param tenantId 租户ID
   * @param startDate 开始日期
   * @param endDate 结束日期
   * @returns 运单统计
   */
  async getShipmentStats(
    tenantId: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<ShipmentStats> {
    try {
      return await this.dbService.getShipmentStats(tenantId, startDate, endDate);
    } catch (error) {
      logger.error('Failed to get shipment stats:', error);
      throw error;
    }
  }

  /**
   * 获取司机运单列表
   * @param tenantId 租户ID
   * @param driverId 司机ID
   * @param status 运单状态
   * @returns 运单列表
   */
  async getDriverShipments(
    tenantId: string, 
    driverId: string, 
    status?: ShipmentStatus
  ): Promise<Shipment[]> {
    try {
      const params: QueryParams = {
        driverId,
        status,
        sort: 'created_at',
        order: 'desc'
      };
      
      const result = await this.dbService.getShipments(tenantId, params);
      return result.data || [];
    } catch (error) {
      logger.error('Failed to get driver shipments:', error);
      throw error;
    }
  }
}
