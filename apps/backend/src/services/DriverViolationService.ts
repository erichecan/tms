// 司机违章管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface DriverViolation {
  id: string;
  driverId: string;
  tenantId: string;
  violationType: 'speeding' | 'overload' | 'red_light' | 'parking' | 'license' | 'other';
  violationDate: Date | string;
  location?: string;
  description?: string;
  fineAmount?: number;
  pointsDeducted: number;
  status: 'pending' | 'paid' | 'appealed' | 'dismissed';
  filePath?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateDriverViolationInput {
  driverId: string;
  violationType: 'speeding' | 'overload' | 'red_light' | 'parking' | 'license' | 'other';
  violationDate: Date | string;
  location?: string;
  description?: string;
  fineAmount?: number;
  pointsDeducted?: number;
  status?: 'pending' | 'paid' | 'appealed' | 'dismissed';
  filePath?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDriverViolationInput {
  violationType?: 'speeding' | 'overload' | 'red_light' | 'parking' | 'license' | 'other';
  violationDate?: Date | string;
  location?: string;
  description?: string;
  fineAmount?: number;
  pointsDeducted?: number;
  status?: 'pending' | 'paid' | 'appealed' | 'dismissed';
  filePath?: string;
  notes?: string;
  updatedBy?: string;
}

export class DriverViolationService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建违章记录
   */
  async createViolation(
    tenantId: string,
    input: CreateDriverViolationInput
  ): Promise<DriverViolation> {
    try {
      const query = `
        INSERT INTO driver_violations (
          driver_id, tenant_id, violation_type, violation_date, location,
          description, fine_amount, points_deducted, status, file_path, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.driverId,
        tenantId,
        input.violationType,
        input.violationDate,
        input.location || null,
        input.description || null,
        input.fineAmount || null,
        input.pointsDeducted || 0,
        input.status || 'pending',
        input.filePath || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapViolationFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create driver violation:', error);
      throw error;
    }
  }

  /**
   * 获取司机的所有违章记录
   */
  async getViolationsByDriver(
    tenantId: string,
    driverId: string
  ): Promise<DriverViolation[]> {
    try {
      const query = `
        SELECT * FROM driver_violations
        WHERE tenant_id = $1 AND driver_id = $2
        ORDER BY violation_date DESC
      `;

      const result = await this.dbService.query(query, [tenantId, driverId]);
      return result.map(row => this.mapViolationFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get driver violations:', error);
      throw error;
    }
  }

  /**
   * 更新违章记录
   */
  async updateViolation(
    tenantId: string,
    violationId: string,
    input: UpdateDriverViolationInput
  ): Promise<DriverViolation> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.violationType !== undefined) {
        updateFields.push(`violation_type = $${paramIndex++}`);
        values.push(input.violationType);
      }
      if (input.violationDate !== undefined) {
        updateFields.push(`violation_date = $${paramIndex++}`);
        values.push(input.violationDate);
      }
      if (input.location !== undefined) {
        updateFields.push(`location = $${paramIndex++}`);
        values.push(input.location || null);
      }
      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description || null);
      }
      if (input.fineAmount !== undefined) {
        updateFields.push(`fine_amount = $${paramIndex++}`);
        values.push(input.fineAmount || null);
      }
      if (input.pointsDeducted !== undefined) {
        updateFields.push(`points_deducted = $${paramIndex++}`);
        values.push(input.pointsDeducted);
      }
      if (input.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      if (input.filePath !== undefined) {
        updateFields.push(`file_path = $${paramIndex++}`);
        values.push(input.filePath || null);
      }
      if (input.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(input.notes || null);
      }
      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy || null);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(tenantId, violationId);

      const query = `
        UPDATE driver_violations
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Violation not found');
      }

      return this.mapViolationFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update driver violation:', error);
      throw error;
    }
  }

  /**
   * 删除违章记录
   */
  async deleteViolation(
    tenantId: string,
    violationId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM driver_violations
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, violationId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete driver violation:', error);
      throw error;
    }
  }

  /**
   * 获取司机的总扣分
   */
  async getTotalPointsDeducted(
    tenantId: string,
    driverId: string
  ): Promise<number> {
    try {
      const query = `
        SELECT COALESCE(SUM(points_deducted), 0) as total_points
        FROM driver_violations
        WHERE tenant_id = $1 AND driver_id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, driverId]);
      return parseInt(result[0]?.total_points || '0', 10);
    } catch (error: any) {
      logger.error('Failed to get total points deducted:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapViolationFromDb(row: any): DriverViolation {
    return {
      id: row.id,
      driverId: row.driver_id,
      tenantId: row.tenant_id,
      violationType: row.violation_type,
      violationDate: row.violation_date,
      location: row.location,
      description: row.description,
      fineAmount: row.fine_amount ? parseFloat(row.fine_amount) : undefined,
      pointsDeducted: parseInt(row.points_deducted || '0', 10),
      status: row.status,
      filePath: row.file_path,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

