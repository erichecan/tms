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
  AdditionalFee,
  ShipmentTimeline
} from '@tms/shared-types';

export interface ShipmentAssignment {
  shipmentId: string;
  driverId: string;
  vehicleId?: string; // 2025-10-29 10:25:30 新增：可选车辆
  assignedBy: string;
  notes?: string;
}

export interface ShipmentUpdate {
  status?: ShipmentStatus;
  driverId?: string;
  vehicleId?: string;
  actualCost?: number;
  additionalFees?: AdditionalFee[];
  timeline?: ShipmentTimeline;
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

const TIMELINE_FIELD_MAP: Record<ShipmentStatus, keyof ShipmentTimeline | null> = {
  [ShipmentStatus.DRAFT]: 'draft', // 2025-11-11 14:22:10 状态到时间线字段映射
  [ShipmentStatus.PENDING_CONFIRMATION]: 'pendingConfirmation', // 2025-11-11 14:22:10
  [ShipmentStatus.CONFIRMED]: 'confirmed', // 2025-11-11 14:22:10
  [ShipmentStatus.SCHEDULED]: 'scheduled', // 2025-11-11 14:22:10
  [ShipmentStatus.PICKUP_IN_PROGRESS]: 'pickupInProgress', // 2025-11-11 14:22:10
  [ShipmentStatus.IN_TRANSIT]: 'inTransit', // 2025-11-11 14:22:10
  [ShipmentStatus.DELIVERED]: 'delivered', // 2025-11-11 14:22:10
  [ShipmentStatus.POD_PENDING_REVIEW]: 'podPendingReview', // 2025-11-11 14:22:10
  [ShipmentStatus.COMPLETED]: 'completed', // 2025-11-11 14:22:10
  [ShipmentStatus.CANCELLED]: 'cancelled', // 2025-11-11 14:22:10
  [ShipmentStatus.EXCEPTION]: null // 2025-11-11 14:22:10 异常状态不记录专属时间线
};

export class ShipmentService {
  private dbService: DatabaseService;
  private ruleEngineService: RuleEngineService;

  constructor(dbService: DatabaseService, ruleEngineService: RuleEngineService) {
    this.dbService = dbService;
    this.ruleEngineService = ruleEngineService;
  }

  private stampTimeline(timeline: ShipmentTimeline | undefined, status: ShipmentStatus): ShipmentTimeline {
    // 2025-11-11 14:23:45 统一记录运单状态时间线
    const nextTimeline: ShipmentTimeline = { ...(timeline || {}) };
    const isoNow = new Date().toISOString();
    if (!nextTimeline.created) {
      nextTimeline.created = isoNow; // 2025-11-11 14:23:45
    }
    const fieldKey = TIMELINE_FIELD_MAP[status];
    if (fieldKey) {
      nextTimeline[fieldKey] = isoNow; // 2025-11-11 14:23:45
    }
    return nextTimeline;
  }

  /**
   * 创建运单
   * @param tenantId 租户ID
   * @param shipmentData 运单数据
   * @returns 创建的运单
   */
  async createShipment(
    tenantId: string,
    shipmentData: Omit<Shipment, 'id' | 'tenantId' | 'createdAt' | 'updatedAt'>,
    options?: { initialStatus?: ShipmentStatus }
  ): Promise<Shipment> {
    try {
      const shipmentNumber = await this.generateShipmentNumber(tenantId); // 2025-11-11 14:25:10 生成运单号
      const sanitizedShipmentData = { ...shipmentData } as any; // 2025-11-11 14:25:10 拷贝避免污染
      delete sanitizedShipmentData.timeline; // 2025-11-11 14:25:10
      delete sanitizedShipmentData.status; // 2025-11-11 14:25:10
      const initialStatus = options?.initialStatus || shipmentData.status || ShipmentStatus.PENDING_CONFIRMATION; // 2025-11-11 14:25:10 计算初始状态
      const initialStatuses: ShipmentStatus[] =
        initialStatus === ShipmentStatus.DRAFT
          ? [ShipmentStatus.DRAFT]
          : [ShipmentStatus.DRAFT, initialStatus as ShipmentStatus]; // 2025-11-11 14:25:10 初始化时间线序列
      let timelineSnapshot: ShipmentTimeline | undefined; // 2025-11-11 14:25:10
      initialStatuses.forEach(status => {
        timelineSnapshot = this.stampTimeline(timelineSnapshot, status); // 2025-11-11 14:25:10
      });
      const newShipment = {
        ...sanitizedShipmentData,
        shipmentNumber,
        status: initialStatus as ShipmentStatus,
        timeline: timelineSnapshot
      }; // 2025-11-11 14:25:10

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

      if (updates.status && updates.status !== shipment.status) {
        updates.timeline = this.stampTimeline(shipment.timeline, updates.status); // 2025-11-11 14:27:05 更新时间线
      }

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates as any);
      
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
      if (!driver || !['active', 'available'].includes(driver.status)) { // 2025-10-31 09:20:00 修复：支持两种可用状态
        throw new Error('Driver not available');
      }

      // 检查运单状态
      const shipment = await this.dbService.getShipment(tenantId, assignment.shipmentId);
      if (!shipment) {
        throw new Error('Shipment not found');
      }

      const assignableStatuses: ShipmentStatus[] = [
        ShipmentStatus.PENDING_CONFIRMATION,
        ShipmentStatus.CONFIRMED,
        ShipmentStatus.SCHEDULED
      ]; // 2025-11-11 14:28:40 可指派状态
      if (!assignableStatuses.includes(shipment.status as ShipmentStatus)) {
        throw new Error(`Shipment cannot be assigned in current status: ${shipment.status}`);
      }

      const updates: ShipmentUpdate = {
        driverId: assignment.driverId,
        vehicleId: assignment.vehicleId,
        status: ShipmentStatus.SCHEDULED,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.SCHEDULED)
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

      if (shipment.status !== ShipmentStatus.PENDING_CONFIRMATION) {
        throw new Error('Only pending confirmation shipments can be confirmed'); // 2025-11-11 14:30:05
      }

      const updates: ShipmentUpdate = {
        status: ShipmentStatus.CONFIRMED,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.CONFIRMED)
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates as any);
      
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

      if (shipment.status !== ShipmentStatus.SCHEDULED) {
        throw new Error('Shipment must be scheduled before pickup'); // 2025-11-11 14:31:00
      }

      const updates: ShipmentUpdate = {
        status: ShipmentStatus.PICKUP_IN_PROGRESS,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.PICKUP_IN_PROGRESS)
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates as any);
      
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

      if (shipment.status !== ShipmentStatus.PICKUP_IN_PROGRESS) {
        throw new Error('Shipment must be in pickup progress before transit'); // 2025-11-11 14:31:45
      }

      const updates: ShipmentUpdate = {
        status: ShipmentStatus.IN_TRANSIT,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.IN_TRANSIT)
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates as any);
      
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

      if (shipment.status !== ShipmentStatus.IN_TRANSIT) {
        throw new Error('Shipment must be in transit before delivery'); // 2025-11-11 14:32:35
      }

      const updates: ShipmentUpdate = {
        status: ShipmentStatus.DELIVERED,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.DELIVERED),
        notes: deliveryNotes
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates as any);
      
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

      const completableStatuses: ShipmentStatus[] = [
        ShipmentStatus.DELIVERED,
        ShipmentStatus.POD_PENDING_REVIEW
      ]; // 2025-11-11 14:33:25 可完结状态
      if (!completableStatuses.includes(shipment.status as ShipmentStatus)) {
        throw new Error('Shipment must be delivered before completion'); // 2025-11-11 14:33:25
      }

      const updates: ShipmentUpdate = {
        status: ShipmentStatus.COMPLETED,
        actualCost: finalCost || shipment.actualCost || shipment.estimatedCost,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.COMPLETED)
      };

      const updatedShipment = await this.dbService.updateShipment(tenantId, shipmentId, updates);
      
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

      if ([ShipmentStatus.COMPLETED, ShipmentStatus.CANCELLED].includes(shipment.status as ShipmentStatus)) {
        throw new Error('Shipment cannot be cancelled in current status');
      }

      const updates: ShipmentUpdate = {
        status: ShipmentStatus.CANCELLED,
        notes: reason,
        timeline: this.stampTimeline(shipment.timeline, ShipmentStatus.CANCELLED)
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

      const pickupTimestamp = shipment.timeline?.pickupInProgress; // 2025-11-11 14:34:20
      const deliveredTimestamp = shipment.timeline?.delivered; // 2025-11-11 14:34:20
      const deliveryTime = (deliveredTimestamp && pickupTimestamp)
        ? new Date(deliveredTimestamp).getTime() - new Date(pickupTimestamp).getTime()
        : 0; // 2025-11-11 14:34:20

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
        currency: 'CAD',
        status: 'pending',
        description: `运单 ${shipment.shipmentNumber} 司机薪酬`
      });

      logger.info(`Driver commission calculated: ${shipment.driverId} - ${commission} CAD`);
    } catch (error) {
      logger.error('Failed to calculate driver commission:', error);
    }
  }

  async convertQuoteToShipment(
    tenantId: string,
    shipmentId: string,
    options?: { finalCost?: number }
  ): Promise<Shipment> {
    const client = await this.dbService.getConnection(); // 2025-11-11 14:49:10 获取事务连接
    try {
      await client.query('BEGIN'); // 2025-11-11 14:49:10 开启事务
      const quoteResult = await client.query(
        'SELECT * FROM shipments WHERE id = $1 AND tenant_id = $2 FOR UPDATE',
        [shipmentId, tenantId]
      ); // 2025-11-11 14:49:10 加锁读取

      if (quoteResult.rows.length === 0) {
        throw new Error('Shipment not found');
      }

      const quoteRow = quoteResult.rows[0];
      if (quoteRow.status !== ShipmentStatus.PENDING_CONFIRMATION) {
        throw new Error('Only pending confirmation shipments can be converted'); // 2025-11-11 14:49:10 状态校验
      }

      const timelineSource =
        typeof quoteRow.timeline === 'string' ? JSON.parse(quoteRow.timeline) : quoteRow.timeline; // 2025-11-11 14:49:10 解析时间线
      const timelineSnapshot = this.stampTimeline(timelineSource, ShipmentStatus.CONFIRMED); // 2025-11-11 14:49:10 标记确认时间

      const requiresNewNumber =
        typeof quoteRow.shipment_number === 'string' && quoteRow.shipment_number.startsWith('TMP'); // 2025-11-11 14:49:10 判断是否需要新编号
      const finalShipmentNumber = requiresNewNumber
        ? await this.generateShipmentNumber(tenantId)
        : quoteRow.shipment_number; // 2025-11-11 14:49:10 决定最终编号

      const resolvedActualCost =
        options?.finalCost ??
        quoteRow.actual_cost ??
        quoteRow.estimated_cost ??
        0; // 2025-11-11 14:49:10 计算确认费用

      await client.query(
        `UPDATE shipments 
         SET status = $3,
             shipment_number = $4,
             timeline = $5::jsonb,
             actual_cost = $6,
             updated_at = NOW()
         WHERE id = $1 AND tenant_id = $2`,
        [
          shipmentId,
          tenantId,
          ShipmentStatus.CONFIRMED,
          finalShipmentNumber,
          JSON.stringify(timelineSnapshot),
          resolvedActualCost
        ]
      ); // 2025-11-11 14:49:10 提交确认更新

      await client.query('COMMIT'); // 2025-11-11 14:49:10 提交事务
      const updatedShipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!updatedShipment) {
        throw new Error('Converted shipment not found after update'); // 2025-11-11 14:49:10 二次校验
      }
      return updatedShipment;
    } catch (error) {
      await client
        .query('ROLLBACK')
        .catch(rollbackError =>
          logger.error('Failed to rollback quote conversion transaction', rollbackError)
        ); // 2025-11-11 14:49:10 事务回滚
      logger.error('Failed to convert quote to shipment:', error);
      throw error;
    } finally {
      client.release(); // 2025-11-11 14:49:10 释放连接
    }
  }

  async acknowledgeAssignment(
    tenantId: string,
    shipmentId: string,
    driverId: string,
    accepted: boolean,
    note?: string
  ): Promise<Shipment> {
    const shipment = await this.dbService.getShipment(tenantId, shipmentId);
    if (!shipment) {
      throw new Error('Shipment not found'); // 2025-11-11 14:53:15
    }
    if (shipment.driverId !== driverId) {
      throw new Error('Driver not assigned to this shipment'); // 2025-11-11 14:53:15
    }

    const client = await this.dbService.getConnection(); // 2025-11-11 14:53:15
    try {
      await client.query('BEGIN'); // 2025-11-11 14:53:15
      const currentTimeline =
        typeof shipment.timeline === 'string'
          ? JSON.parse(shipment.timeline)
          : shipment.timeline || {}; // 2025-11-11 14:53:15

      if (accepted) {
        currentTimeline.assignmentAcknowledged = new Date().toISOString(); // 2025-11-11 14:53:15
        await client.query(
          `UPDATE shipments 
           SET timeline = $3::jsonb,
               updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [shipmentId, tenantId, JSON.stringify(currentTimeline)]
        ); // 2025-11-11 14:53:15
      } else {
        currentTimeline.assignmentDeclined = new Date().toISOString(); // 2025-11-11 14:53:15
        await client.query(
          `UPDATE shipments 
           SET status = $3,
               driver_id = NULL,
               vehicle_id = NULL,
               timeline = $4::jsonb,
               updated_at = NOW()
           WHERE id = $1 AND tenant_id = $2`,
          [
            shipmentId,
            tenantId,
            ShipmentStatus.CONFIRMED,
            JSON.stringify(currentTimeline)
          ]
        ); // 2025-11-11 14:53:15
        await client.query('DELETE FROM assignments WHERE shipment_id = $1', [shipmentId]); // 2025-11-11 14:53:15
      }

      await client.query(
        'UPDATE drivers SET status = $3, updated_at = NOW() WHERE id = $1 AND tenant_id = $2',
        [driverId, tenantId, accepted ? 'busy' : 'available']
      ); // 2025-11-11 14:53:15 同步司机状态

      await client.query(
        `INSERT INTO timeline_events (shipment_id, event_type, actor_type, extra)
         VALUES ($1, $2, 'driver', $3)`,
        [
          shipmentId,
          accepted ? 'DRIVER_ACKNOWLEDGED' : 'DRIVER_DECLINED',
          JSON.stringify({ driverId, note })
        ]
      ); // 2025-11-11 14:53:15

      await client.query('COMMIT'); // 2025-11-11 14:53:15
      const updatedShipment = await this.dbService.getShipment(tenantId, shipmentId);
      if (!updatedShipment) {
        throw new Error('Shipment not found after acknowledgement'); // 2025-11-11 14:53:15
      }
      return updatedShipment;
    } catch (error) {
      await client
        .query('ROLLBACK')
        .catch(rollbackError =>
          logger.error('Failed to rollback driver acknowledgement transaction', rollbackError)
        ); // 2025-11-11 14:53:15
      logger.error('Failed to acknowledge assignment:', error);
      throw error;
    } finally {
      client.release(); // 2025-11-11 14:53:15
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
      filters: { startDate: todayStart, endDate: todayEnd }
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
        sort: 'created_at',
        order: 'desc',
        filters: { driverId, status }
      };
      
      const result = await this.dbService.getShipments(tenantId, params);
      return result.data || [];
    } catch (error) {
      logger.error('Failed to get driver shipments:', error);
      throw error;
    }
  }
}
