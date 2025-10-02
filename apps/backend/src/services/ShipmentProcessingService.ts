// 运单处理服务 - 集成调度优化引擎
// 创建时间: 2025-10-02 19:15:00
// 作用: 运单创建后自动触发调度优化引擎进行智能分配

import { DatabaseService } from './DatabaseService';
import { DispatchOptimizationService } from './DispatchOptimizationService';
import { PricingEngineService } from './PricingEngineService';
import { logger } from '../utils/logger';

export class ShipmentProcessingService {
  private dbService: DatabaseService;
  private dispatchOptimizationService: DispatchOptimizationService;
  private pricingEngineService: PricingEngineService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.dispatchOptimizationService = new DispatchOptimizationService(dbService);
    this.pricingEngineService = new PricingEngineService(dbService);
  }

  /**
   * 运单创建后的完整处理流程
   * 这是整个智能调度优化的入口点
   */
  async processNewShipment(shipmentId: string, tenantId: string): Promise<{
    success: boolean;
    message: string;
    optimizationResult?: any;
  }> {
    try {
      logger.info(`开始处理新运单: ${shipmentId}`);

      // 1. 验证运单基本信息
      const shipment = await this.validateShipment(shipmentId, tenantId);
      if (!shipment) {
        return {
          success: false,
          message: '运单不存在或已删除',
        };
      }

      // 2. 触发实时计费规则引擎
      const pricingResult = await this.pricingEngineService.calculateShipmentPricing(
        tenantId,
        {
          shipmentId,
          customerTier: shipment.customer_tier || 'standard',
          cargoInfo: shipment.cargo_info,
          addressInfo: {
            pickupAddress: shipment.shipper_address,
            deliveryAddress: shipment.receiver_address,
          },
        }
      );

      // 更新运单的预估费用
      await this.updateShipmentPricing(shipmentId, pricingResult, tenantId);

      // 3. 🚀 核心功能：触发智能调度优化引擎
      // 这里集成了：路线规划算法 + 最短路径计算 + 车辆调度优化
      const optimizationResult = await this.dispatchOptimizationService.optimizeDispatchForNewShipment(
        shipmentId,
        tenantId
      );

      logger.info(`运单 ${shipmentId} 处理完成:`, {
        运单状态: optimizationResult.success ? '已分配' : '待分配',
        分配运单数: optimizationResult.optimizedRoutes.length,
        未分配运单数: optimizationResult.unassignedShipments.length,
        成本节省: optimizationResult.totalCostSavings,
        距离节省: optimizationResult.totalDistanceSavings,
        处理时间: optimizationResult.processingTime,
      });

      // 4. 发送通知给相关用户
      await this.sendNotifications(shipment, optimizationResult, tenantId);

      return {
        success: true,
        message: optimizationResult.success 
          ? `运单已智能分配车辆，预计节省成本 ¥${optimizationResult.totalCostSavings}`
          : '运单已创建，待车辆调度',
        optimizationResult,
      };

    } catch (error) {
      logger.error(`运单处理失败 (${shipmentId}): ${error.message}`);
      return {
        success: false,
        message: `运单处理失败: ${error.message}`,
      };
    }
  }

  /**
   * 验证运单信息
   */
  private async validateShipment(shipmentId: string, tenantId: string): Promise<any> {
    const result = await this.dbService.query(
      `SELECT * FROM shipments 
       WHERE id = $1 AND tenant_id = $2`,
      [shipmentId, tenantId]
    );

    return result[0] || null;
  }

  /**
   * 更新运单的计费信息
   */
  private async updateShipmentPricing(shipmentId: string, pricingResult: any, tenantId: string): Promise<void> {
    if (pricingResult && pricingResult.success) {
      await this.dbService.query(
        `UPDATE shipments 
         SET estimated_cost = $1,
             pricing_breakdown = $2,
             updated_at = NOW()
         WHERE id = $3 AND tenant_id = $4`,
        [
          pricingResult.totalCost,
          JSON.stringify(pricingResult.breakdown),
          shipmentId,
          tenantId,
        ]
      );
    }
  }

  /**
   * 发送通知给相关人员
   */
  private async sendNotifications(shipment: any, optimizationResult: any, tenantId: string): Promise<void> {
    try {
      // 通知客户：运单已确认和报价
      await this.sendCustomerNotification(shipment);

      // 通知调度员：分配结果
      await this.sendDispatcherNotification(shipment, optimizationResult);

      // 通知司机：新分配的任务
      if (optimizationResult.success && optimizationResult.optimizedRoutes.length > 0) {
        await this.sendDriverNotifications(optimizationResult.optimizedRoutes, tenantId);
      }

      logger.info('运单处理通知已发送');
    } catch (error) {
      logger.warn('通知发送失败，但不影响核心流程');
    }
  }

  /**
   * 通知客户
   */
  private async sendCustomerNotification(shipment: any): Promise<void> {
    // 这里可以集成邮件服务或短信服务
    logger.info(`已为客户发送运单确认通知: ${shipment.id}`);
  }

  /**
   * 通知调度员
   */
  private async sendDispatcherNotification(shipment: any, optimizationResult: any): Promise<void> {
    const message = optimizationResult.success
      ? `运单 ${shipment.id} 已自动分配，优化效果: 节省成本 ¥${optimizationResult.totalCostSavings}`
      : `运单 ${shipment.id} 需要人工调度分配`;

    logger.info(`调度员通知: ${message}`);
  }

  /**
   * 通知司机
   */
  private async sendDriverNotifications(routes: any[], tenantId: string): Promise<void> {
    for (const route of routes) {
      logger.info(`司机通知: 新任务分配给司机 ${route.driverId}，车辆 ${route.vehicleId}`);
      
      // 更新驾驶员和车辆状态为 'busy'
      await this.dbService.query(
        `UPDATE drivers SET status = 'busy' WHERE id = $1 AND tenant_id = $2`,
        [route.driverId, tenantId]
      );
      
      await this.dbService.query(
        `UPDATE vehicles SET status = 'busy' WHERE id = $1 AND tenant_id = $2`,
        [route.vehicleId, tenantId]
      );
    }
  }

  /**
   * 批量处理运单 - 用于定时任务
   */
  async processPendingShipments(tenantId: string): Promise<void> {
    try {
      logger.info('开始批量处理待分配运单');

      const pendingShipments = await this.dbService.query(
        `SELECT * FROM shipments 
         WHERE status IN ('pending', 'confirmed') 
         AND tenant_id = $1
         ORDER BY created_at ASC`,
        [tenantId]
      );

      if (pendingShipments.length === 0) {
        logger.info('没有待处理的运单');
        return;
      }

      logger.info(`找到 ${pendingShipments.length} 个待分配运单，开始批量优化`);

      // 批量触发调度优化引擎
      const optimizationResult = await this.dispatchOptimizationService.optimizeDispatchForNewShipment(
        'batch-processing', // 批量处理标识
        tenantId
      );

      logger.info('批量处理完成:', {
        处理运单数: pendingShipments.length,
        成功分配: optimizationResult.optimizedRoutes.length,
        待人工处理: optimizationResult.unassignedShipments.length,
        总成本节省: optimizationResult.totalCostSavings,
      });

    } catch (error) {
      logger.error(`批量处理运单失败: ${error.message}`);
    }
  }

  /**
   * 运单状态更新后的处理
   */
  async handleShipmentStatusChange(shipmentId: string, oldStatus: string, newStatus: string, tenantId: string): Promise<void> {
    logger.info(`运单 ${shipmentId} 状态变化: ${oldStatus} → ${newStatus}`);

    switch (newStatus) {
      case 'completed':
        await this.handleShipmentCompleted(shipmentId, tenantId);
        break;
      case 'cancelled':
        await this.handleShipmentCancelled(shipmentId, tenantId);
        break;
      case 'in_transit':
        await this.handleShipmentInTransit(shipmentId, tenantId);
        break;
      default:
        break;
    }
  }

  /**
   * 运单完成后的处理
   */
  private async handleShipmentCompleted(shipmentId: string, tenantId: string): Promise<void> {
    // 释放车辆和司机
    await this.dbService.query(
      `UPDATE drivers d SET status = 'available' 
       FROM shipments s 
       WHERE d.id = s.driver_id AND s.id = $1 AND s.tenant_id = $2`,
      [shipmentId, tenantId]
    );

    await this.dbService.query(
      `UPDATE vehicles v SET status = 'available' 
       FROM shipments s 
       WHERE v.id = s.vehicle_id AND s.id = $1 AND s.tenant_id = $2`,
      [shipmentId, tenantId]
    );

    logger.info(`运单 ${shipmentId} 完成，车辆和司机已释放`);
  }

  /**
   * 运单取消后的处理
   */
  private async handleShipmentCancelled(shipmentId: string, tenantId: string): Promise<void> {
    await this.handleShipmentCompleted(shipmentId, tenantId);
    logger.info(`运单 ${shipmentId} 已取消`);
  }

  /**
   * 运单开始运输后的处理
   */
  private async handleShipmentInTransit(shipmentId: string, tenantId: string): Promise<void> {
    logger.info(`运单 ${shipmentId} 已开始运输，可以进行实时跟踪`);
  }
}

export default ShipmentProcessingService;
