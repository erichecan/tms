// 司机培训管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface DriverTrainingRecord {
  id: string;
  driverId: string;
  tenantId: string;
  trainingType: 'safety' | 'regulation' | 'skill' | 'certification' | 'other';
  trainingDate: Date | string;
  trainingProvider?: string;
  instructorName?: string;
  durationHours?: number;
  score?: number;
  result: 'passed' | 'failed' | 'incomplete';
  certificateNumber?: string;
  expiryDate?: Date | string;
  filePath?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateDriverTrainingRecordInput {
  driverId: string;
  trainingType: 'safety' | 'regulation' | 'skill' | 'certification' | 'other';
  trainingDate: Date | string;
  trainingProvider?: string;
  instructorName?: string;
  durationHours?: number;
  score?: number;
  result: 'passed' | 'failed' | 'incomplete';
  certificateNumber?: string;
  expiryDate?: Date | string;
  filePath?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDriverTrainingRecordInput {
  trainingType?: 'safety' | 'regulation' | 'skill' | 'certification' | 'other';
  trainingDate?: Date | string;
  trainingProvider?: string;
  instructorName?: string;
  durationHours?: number;
  score?: number;
  result?: 'passed' | 'failed' | 'incomplete';
  certificateNumber?: string;
  expiryDate?: Date | string;
  filePath?: string;
  notes?: string;
  updatedBy?: string;
}

export class DriverTrainingService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建培训记录
   */
  async createTrainingRecord(
    tenantId: string,
    input: CreateDriverTrainingRecordInput
  ): Promise<DriverTrainingRecord> {
    try {
      const query = `
        INSERT INTO driver_training_records (
          driver_id, tenant_id, training_type, training_date, training_provider,
          instructor_name, duration_hours, score, result, certificate_number,
          expiry_date, file_path, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.driverId,
        tenantId,
        input.trainingType,
        input.trainingDate,
        input.trainingProvider || null,
        input.instructorName || null,
        input.durationHours || null,
        input.score || null,
        input.result,
        input.certificateNumber || null,
        input.expiryDate || null,
        input.filePath || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapTrainingRecordFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create driver training record:', error);
      throw error;
    }
  }

  /**
   * 获取司机的所有培训记录
   */
  async getTrainingRecordsByDriver(
    tenantId: string,
    driverId: string
  ): Promise<DriverTrainingRecord[]> {
    try {
      const query = `
        SELECT * FROM driver_training_records
        WHERE tenant_id = $1 AND driver_id = $2
        ORDER BY training_date DESC
      `;

      const result = await this.dbService.query(query, [tenantId, driverId]);
      return result.map(row => this.mapTrainingRecordFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get driver training records:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的培训证书
   */
  async getExpiringTrainingCertificates(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<DriverTrainingRecord[]> {
    try {
      const query = `
        SELECT dtr.*, d.name as driver_name, d.phone as driver_phone
        FROM driver_training_records dtr
        JOIN drivers d ON dtr.driver_id = d.id
        WHERE dtr.tenant_id = $1
          AND dtr.expiry_date IS NOT NULL
          AND dtr.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysAhead} days'
        ORDER BY dtr.expiry_date ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapTrainingRecordFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get expiring training certificates:', error);
      throw error;
    }
  }

  /**
   * 更新培训记录
   */
  async updateTrainingRecord(
    tenantId: string,
    recordId: string,
    input: UpdateDriverTrainingRecordInput
  ): Promise<DriverTrainingRecord> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.trainingType !== undefined) {
        updateFields.push(`training_type = $${paramIndex++}`);
        values.push(input.trainingType);
      }
      if (input.trainingDate !== undefined) {
        updateFields.push(`training_date = $${paramIndex++}`);
        values.push(input.trainingDate);
      }
      if (input.trainingProvider !== undefined) {
        updateFields.push(`training_provider = $${paramIndex++}`);
        values.push(input.trainingProvider || null);
      }
      if (input.instructorName !== undefined) {
        updateFields.push(`instructor_name = $${paramIndex++}`);
        values.push(input.instructorName || null);
      }
      if (input.durationHours !== undefined) {
        updateFields.push(`duration_hours = $${paramIndex++}`);
        values.push(input.durationHours || null);
      }
      if (input.score !== undefined) {
        updateFields.push(`score = $${paramIndex++}`);
        values.push(input.score || null);
      }
      if (input.result !== undefined) {
        updateFields.push(`result = $${paramIndex++}`);
        values.push(input.result);
      }
      if (input.certificateNumber !== undefined) {
        updateFields.push(`certificate_number = $${paramIndex++}`);
        values.push(input.certificateNumber || null);
      }
      if (input.expiryDate !== undefined) {
        updateFields.push(`expiry_date = $${paramIndex++}`);
        values.push(input.expiryDate || null);
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
      values.push(tenantId, recordId);

      const query = `
        UPDATE driver_training_records
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Training record not found');
      }

      return this.mapTrainingRecordFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update driver training record:', error);
      throw error;
    }
  }

  /**
   * 删除培训记录
   */
  async deleteTrainingRecord(
    tenantId: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM driver_training_records
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, recordId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete driver training record:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapTrainingRecordFromDb(row: any): DriverTrainingRecord {
    return {
      id: row.id,
      driverId: row.driver_id,
      tenantId: row.tenant_id,
      trainingType: row.training_type,
      trainingDate: row.training_date,
      trainingProvider: row.training_provider,
      instructorName: row.instructor_name,
      durationHours: row.duration_hours ? parseFloat(row.duration_hours) : undefined,
      score: row.score ? parseFloat(row.score) : undefined,
      result: row.result,
      certificateNumber: row.certificate_number,
      expiryDate: row.expiry_date,
      filePath: row.file_path,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

