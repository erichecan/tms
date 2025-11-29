// 到期提醒通知服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 到期提醒通知

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface ExpiryNotification {
  id: string;
  tenantId: string;
  notificationType: 'vehicle_certificate' | 'vehicle_insurance' | 'vehicle_inspection' | 
                    'driver_certificate' | 'driver_medical' | 'driver_training' | 
                    'carrier_certificate';
  entityType: string; // 'vehicle', 'driver', 'carrier'
  entityId: string;
  entityName: string; // 车辆车牌、司机姓名、承运商名称
  itemName: string; // 证照名称、保险类型等
  expiryDate: Date | string;
  daysUntilExpiry: number;
  status: 'pending' | 'sent' | 'acknowledged';
  createdAt: Date | string;
  sentAt?: Date | string;
}

export class ExpiryNotificationService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建到期提醒通知
   */
  async createExpiryNotification(
    tenantId: string,
    notificationType: ExpiryNotification['notificationType'],
    entityType: string,
    entityId: string,
    entityName: string,
    itemName: string,
    expiryDate: Date | string,
    daysUntilExpiry: number
  ): Promise<ExpiryNotification> {
    try {
      // 检查是否已存在相同的通知（避免重复）
      const existing = await this.dbService.query(
        `SELECT id FROM notifications 
         WHERE tenant_id = $1 AND type = $2 AND payload->>'entityId' = $3 
         AND payload->>'expiryDate' = $4 AND created_at > CURRENT_DATE - INTERVAL '1 day'`,
        [tenantId, 'EXPIRY_REMINDER', entityId, expiryDate.toString()]
      );

      if (existing.length > 0) {
        // 已存在今天的通知，返回现有记录
        const existingNotification = await this.dbService.query(
          'SELECT * FROM notifications WHERE id = $1',
          [existing[0].id]
        );
        return this.mapNotificationFromDb(existingNotification[0]);
      }

      // 创建新通知
      const payload = {
        notificationType,
        entityType,
        entityId,
        entityName,
        itemName,
        expiryDate: expiryDate.toString(),
        daysUntilExpiry
      };

      const query = `
        INSERT INTO notifications (
          tenant_id, type, target_role, payload, delivered, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        'EXPIRY_REMINDER',
        'FLEET_MANAGER', // 默认发送给车队管理员
        JSON.stringify(payload),
        false
      ]);

      logger.info(`创建到期提醒通知: ${itemName} (${entityName}), ${daysUntilExpiry}天后到期`);

      return this.mapNotificationFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create expiry notification:', error);
      throw error;
    }
  }

  /**
   * 批量创建到期提醒通知
   */
  async createBatchExpiryNotifications(
    tenantId: string,
    items: Array<{
      notificationType: ExpiryNotification['notificationType'];
      entityType: string;
      entityId: string;
      entityName: string;
      itemName: string;
      expiryDate: Date | string;
      daysUntilExpiry: number;
    }>
  ): Promise<number> {
    let createdCount = 0;

    for (const item of items) {
      try {
        await this.createExpiryNotification(
          tenantId,
          item.notificationType,
          item.entityType,
          item.entityId,
          item.entityName,
          item.itemName,
          item.expiryDate,
          item.daysUntilExpiry
        );
        createdCount++;
      } catch (error: any) {
        logger.error(`Failed to create notification for ${item.itemName}:`, error);
        // 继续处理其他项目
      }
    }

    return createdCount;
  }

  /**
   * 获取租户的待发送到期提醒
   */
  async getPendingExpiryNotifications(
    tenantId: string,
    limit: number = 100
  ): Promise<ExpiryNotification[]> {
    try {
      const query = `
        SELECT * FROM notifications
        WHERE tenant_id = $1 
          AND type = 'EXPIRY_REMINDER'
          AND delivered = false
        ORDER BY created_at ASC
        LIMIT $2
      `;

      const result = await this.dbService.query(query, [tenantId, limit]);
      return result.map(row => this.mapNotificationFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get pending expiry notifications:', error);
      throw error;
    }
  }

  /**
   * 标记通知为已发送
   */
  async markAsSent(notificationId: string): Promise<void> {
    try {
      const query = `
        UPDATE notifications
        SET delivered = true, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      await this.dbService.query(query, [notificationId]);
    } catch (error: any) {
      logger.error('Failed to mark notification as sent:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapNotificationFromDb(row: any): ExpiryNotification {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    
    return {
      id: row.id,
      tenantId: row.tenant_id,
      notificationType: payload.notificationType,
      entityType: payload.entityType,
      entityId: payload.entityId,
      entityName: payload.entityName,
      itemName: payload.itemName,
      expiryDate: payload.expiryDate,
      daysUntilExpiry: payload.daysUntilExpiry,
      status: row.delivered ? 'sent' : 'pending',
      createdAt: row.created_at,
      sentAt: row.delivered ? row.updated_at : undefined
    };
  }
}

