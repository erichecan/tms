// 维护记录管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.1 维护保养完整功能

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface MaintenanceRecord {
  id: string;
  vehicleId: string;
  tenantId: string;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost: number;
  mileage?: number;
  maintenanceDate: Date | string;
  nextMaintenanceDate?: Date | string;
  nextMaintenanceMileage?: number;
  status: 'completed' | 'scheduled' | 'in_progress' | 'cancelled' | 'overdue';
  provider?: string;
  technicianName?: string;
  workOrderId?: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateMaintenanceRecordInput {
  vehicleId: string;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'emergency';
  description: string;
  cost?: number;
  mileage?: number;
  maintenanceDate: Date | string;
  nextMaintenanceDate?: Date | string;
  nextMaintenanceMileage?: number;
  status?: 'completed' | 'scheduled' | 'in_progress' | 'cancelled' | 'overdue';
  provider?: string;
  technicianName?: string;
  workOrderId?: string;
  notes?: string;
  attachments?: string[];
  createdBy?: string;
}

export interface UpdateMaintenanceRecordInput {
  maintenanceType?: 'routine' | 'repair' | 'inspection' | 'emergency';
  description?: string;
  cost?: number;
  mileage?: number;
  maintenanceDate?: Date | string;
  nextMaintenanceDate?: Date | string;
  nextMaintenanceMileage?: number;
  status?: 'completed' | 'scheduled' | 'in_progress' | 'cancelled' | 'overdue';
  provider?: string;
  technicianName?: string;
  workOrderId?: string;
  notes?: string;
  attachments?: string[];
  updatedBy?: string;
}

export class MaintenanceService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建维护记录
   */
  async createMaintenanceRecord(
    tenantId: string,
    input: CreateMaintenanceRecordInput
  ): Promise<MaintenanceRecord> {
    try {
      const query = `
        INSERT INTO maintenance_records (
          vehicle_id, tenant_id, maintenance_type, description, cost, mileage,
          maintenance_date, next_maintenance_date, next_maintenance_mileage,
          status, provider, technician_name, work_order_id, notes, attachments, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.maintenanceType,
        input.description,
        input.cost || 0,
        input.mileage || null,
        input.maintenanceDate,
        input.nextMaintenanceDate || null,
        input.nextMaintenanceMileage || null,
        input.status || 'completed',
        input.provider || null,
        input.technicianName || null,
        input.workOrderId || null,
        input.notes || null,
        input.attachments ? JSON.stringify(input.attachments) : '[]',
        input.createdBy || null,
      ]);

      const record = this.mapRecordFromDb(result[0]);

      // 更新车辆的最后维护日期和里程
      if (input.maintenanceDate && input.mileage) {
        await this.updateVehicleMaintenanceInfo(
          tenantId,
          input.vehicleId,
          input.maintenanceDate,
          input.mileage
        );
      }

      logger.info(`创建维护记录成功: ${record.id}`);
      return record;
    } catch (error: any) {
      logger.error('创建维护记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有维护记录
   */
  async getMaintenanceRecordsByVehicle(
    tenantId: string,
    vehicleId: string
  ): Promise<MaintenanceRecord[]> {
    try {
      const query = `
        SELECT * FROM maintenance_records
        WHERE tenant_id = $1 AND vehicle_id = $2
        ORDER BY maintenance_date DESC
      `;

      const result = await this.dbService.query(query, [tenantId, vehicleId]);
      return result.map(row => this.mapRecordFromDb(row));
    } catch (error: any) {
      logger.error('获取维护记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有维护记录（支持筛选）
   */
  async getMaintenanceRecords(
    tenantId: string,
    params?: {
      vehicleId?: string;
      status?: string;
      maintenanceType?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ records: MaintenanceRecord[]; total: number }> {
    try {
      const {
        vehicleId,
        status,
        maintenanceType,
        startDate,
        endDate,
        page = 1,
        limit = 20,
      } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (vehicleId) {
        whereClause += ` AND vehicle_id = $${paramIndex++}`;
        queryParams.push(vehicleId);
      }

      if (status) {
        whereClause += ` AND status = $${paramIndex++}`;
        queryParams.push(status);
      }

      if (maintenanceType) {
        whereClause += ` AND maintenance_type = $${paramIndex++}`;
        queryParams.push(maintenanceType);
      }

      if (startDate) {
        whereClause += ` AND maintenance_date >= $${paramIndex++}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND maintenance_date <= $${paramIndex++}`;
        queryParams.push(endDate);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM maintenance_records ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM maintenance_records
        ${whereClause}
        ORDER BY maintenance_date DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        records: result.map(row => this.mapRecordFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取维护记录列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个维护记录
   */
  async getMaintenanceRecordById(
    tenantId: string,
    recordId: string
  ): Promise<MaintenanceRecord | null> {
    try {
      const query = `
        SELECT * FROM maintenance_records
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, recordId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapRecordFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取维护记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新维护记录
   */
  async updateMaintenanceRecord(
    tenantId: string,
    recordId: string,
    input: UpdateMaintenanceRecordInput
  ): Promise<MaintenanceRecord> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.maintenanceType !== undefined) {
        updateFields.push(`maintenance_type = $${paramIndex++}`);
        values.push(input.maintenanceType);
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (input.cost !== undefined) {
        updateFields.push(`cost = $${paramIndex++}`);
        values.push(input.cost);
      }

      if (input.mileage !== undefined) {
        updateFields.push(`mileage = $${paramIndex++}`);
        values.push(input.mileage);
      }

      if (input.maintenanceDate !== undefined) {
        updateFields.push(`maintenance_date = $${paramIndex++}`);
        values.push(input.maintenanceDate);
      }

      if (input.nextMaintenanceDate !== undefined) {
        updateFields.push(`next_maintenance_date = $${paramIndex++}`);
        values.push(input.nextMaintenanceDate);
      }

      if (input.nextMaintenanceMileage !== undefined) {
        updateFields.push(`next_maintenance_mileage = $${paramIndex++}`);
        values.push(input.nextMaintenanceMileage);
      }

      if (input.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }

      if (input.provider !== undefined) {
        updateFields.push(`provider = $${paramIndex++}`);
        values.push(input.provider);
      }

      if (input.technicianName !== undefined) {
        updateFields.push(`technician_name = $${paramIndex++}`);
        values.push(input.technicianName);
      }

      if (input.workOrderId !== undefined) {
        updateFields.push(`work_order_id = $${paramIndex++}`);
        values.push(input.workOrderId);
      }

      if (input.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(input.notes);
      }

      if (input.attachments !== undefined) {
        updateFields.push(`attachments = $${paramIndex++}`);
        values.push(JSON.stringify(input.attachments));
      }

      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy);
      }

      if (updateFields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE maintenance_records
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, recordId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('维护记录不存在');
      }

      logger.info(`更新维护记录成功: ${recordId}`);
      return this.mapRecordFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新维护记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除维护记录
   */
  async deleteMaintenanceRecord(
    tenantId: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM maintenance_records
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, recordId]);
      logger.info(`删除维护记录成功: ${recordId}`);
      return true;
    } catch (error: any) {
      logger.error('删除维护记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的维护提醒
   */
  async getUpcomingMaintenance(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<MaintenanceRecord[]> {
    try {
      const query = `
        SELECT mr.* FROM maintenance_records mr
        WHERE mr.tenant_id = $1
          AND mr.next_maintenance_date IS NOT NULL
          AND mr.next_maintenance_date <= CURRENT_DATE + INTERVAL '${daysAhead} days'
          AND mr.status IN ('scheduled', 'in_progress')
        ORDER BY mr.next_maintenance_date ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapRecordFromDb(row));
    } catch (error: any) {
      logger.error('获取即将到期维护失败:', error);
      throw error;
    }
  }

  /**
   * 更新车辆的维护信息
   */
  private async updateVehicleMaintenanceInfo(
    tenantId: string,
    vehicleId: string,
    maintenanceDate: Date | string,
    mileage: number
  ): Promise<void> {
    try {
      const query = `
        UPDATE vehicles
        SET last_service_date = $1,
            last_service_km = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $3 AND id = $4
      `;

      await this.dbService.query(query, [
        maintenanceDate,
        mileage,
        tenantId,
        vehicleId,
      ]);
    } catch (error: any) {
      logger.warn('更新车辆维护信息失败:', error);
      // 不抛出错误，因为这不是关键操作
    }
  }

  /**
   * 从数据库行映射到 MaintenanceRecord
   */
  private mapRecordFromDb(row: any): MaintenanceRecord {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      maintenanceType: row.maintenance_type,
      description: row.description,
      cost: parseFloat(row.cost || 0),
      mileage: row.mileage ? parseFloat(row.mileage) : undefined,
      maintenanceDate: row.maintenance_date,
      nextMaintenanceDate: row.next_maintenance_date || undefined,
      nextMaintenanceMileage: row.next_maintenance_mileage
        ? parseFloat(row.next_maintenance_mileage)
        : undefined,
      status: row.status,
      provider: row.provider || undefined,
      technicianName: row.technician_name || undefined,
      workOrderId: row.work_order_id || undefined,
      notes: row.notes || undefined,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

