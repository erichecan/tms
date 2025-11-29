// 司机体检管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface DriverMedicalRecord {
  id: string;
  driverId: string;
  tenantId: string;
  examinationDate: Date | string;
  examinationType: 'annual' | 'pre_employment' | 'periodic' | 'special';
  medicalInstitution?: string;
  doctorName?: string;
  result: 'passed' | 'failed' | 'conditional';
  expiryDate?: Date | string;
  filePath?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateDriverMedicalRecordInput {
  driverId: string;
  examinationDate: Date | string;
  examinationType: 'annual' | 'pre_employment' | 'periodic' | 'special';
  medicalInstitution?: string;
  doctorName?: string;
  result: 'passed' | 'failed' | 'conditional';
  expiryDate?: Date | string;
  filePath?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateDriverMedicalRecordInput {
  examinationDate?: Date | string;
  examinationType?: 'annual' | 'pre_employment' | 'periodic' | 'special';
  medicalInstitution?: string;
  doctorName?: string;
  result?: 'passed' | 'failed' | 'conditional';
  expiryDate?: Date | string;
  filePath?: string;
  notes?: string;
  updatedBy?: string;
}

export class DriverMedicalService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建体检记录
   */
  async createMedicalRecord(
    tenantId: string,
    input: CreateDriverMedicalRecordInput
  ): Promise<DriverMedicalRecord> {
    try {
      const query = `
        INSERT INTO driver_medical_records (
          driver_id, tenant_id, examination_date, examination_type,
          medical_institution, doctor_name, result, expiry_date, file_path, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.driverId,
        tenantId,
        input.examinationDate,
        input.examinationType,
        input.medicalInstitution || null,
        input.doctorName || null,
        input.result,
        input.expiryDate || null,
        input.filePath || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapMedicalRecordFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create driver medical record:', error);
      throw error;
    }
  }

  /**
   * 获取司机的所有体检记录
   */
  async getMedicalRecordsByDriver(
    tenantId: string,
    driverId: string
  ): Promise<DriverMedicalRecord[]> {
    try {
      const query = `
        SELECT * FROM driver_medical_records
        WHERE tenant_id = $1 AND driver_id = $2
        ORDER BY examination_date DESC
      `;

      const result = await this.dbService.query(query, [tenantId, driverId]);
      return result.map(row => this.mapMedicalRecordFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get driver medical records:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的体检
   */
  async getExpiringMedicalRecords(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<DriverMedicalRecord[]> {
    try {
      const query = `
        SELECT dmr.*, d.name as driver_name, d.phone as driver_phone
        FROM driver_medical_records dmr
        JOIN drivers d ON dmr.driver_id = d.id
        WHERE dmr.tenant_id = $1
          AND dmr.expiry_date IS NOT NULL
          AND dmr.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysAhead} days'
        ORDER BY dmr.expiry_date ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapMedicalRecordFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get expiring medical records:', error);
      throw error;
    }
  }

  /**
   * 更新体检记录
   */
  async updateMedicalRecord(
    tenantId: string,
    recordId: string,
    input: UpdateDriverMedicalRecordInput
  ): Promise<DriverMedicalRecord> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.examinationDate !== undefined) {
        updateFields.push(`examination_date = $${paramIndex++}`);
        values.push(input.examinationDate);
      }
      if (input.examinationType !== undefined) {
        updateFields.push(`examination_type = $${paramIndex++}`);
        values.push(input.examinationType);
      }
      if (input.medicalInstitution !== undefined) {
        updateFields.push(`medical_institution = $${paramIndex++}`);
        values.push(input.medicalInstitution || null);
      }
      if (input.doctorName !== undefined) {
        updateFields.push(`doctor_name = $${paramIndex++}`);
        values.push(input.doctorName || null);
      }
      if (input.result !== undefined) {
        updateFields.push(`result = $${paramIndex++}`);
        values.push(input.result);
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
        UPDATE driver_medical_records
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Medical record not found');
      }

      return this.mapMedicalRecordFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update driver medical record:', error);
      throw error;
    }
  }

  /**
   * 删除体检记录
   */
  async deleteMedicalRecord(
    tenantId: string,
    recordId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM driver_medical_records
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, recordId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete driver medical record:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapMedicalRecordFromDb(row: any): DriverMedicalRecord {
    return {
      id: row.id,
      driverId: row.driver_id,
      tenantId: row.tenant_id,
      examinationDate: row.examination_date,
      examinationType: row.examination_type,
      medicalInstitution: row.medical_institution,
      doctorName: row.doctor_name,
      result: row.result,
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

