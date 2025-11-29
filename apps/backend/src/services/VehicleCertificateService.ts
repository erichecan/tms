// 车辆证照管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface VehicleCertificate {
  id: string;
  vehicleId: string;
  tenantId: string;
  certificateType: 'driving_license' | 'operation_permit' | 'etc' | 'hazardous_permit' | 'other';
  certificateNumber: string;
  issueDate?: Date | string;
  expiryDate: Date | string;
  issuingAuthority?: string;
  filePath?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateVehicleCertificateInput {
  vehicleId: string;
  certificateType: 'driving_license' | 'operation_permit' | 'etc' | 'hazardous_permit' | 'other';
  certificateNumber: string;
  issueDate?: Date | string;
  expiryDate: Date | string;
  issuingAuthority?: string;
  filePath?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateVehicleCertificateInput {
  certificateType?: 'driving_license' | 'operation_permit' | 'etc' | 'hazardous_permit' | 'other';
  certificateNumber?: string;
  issueDate?: Date | string;
  expiryDate?: Date | string;
  issuingAuthority?: string;
  filePath?: string;
  notes?: string;
  updatedBy?: string;
}

export class VehicleCertificateService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建车辆证照
   */
  async createCertificate(
    tenantId: string,
    input: CreateVehicleCertificateInput
  ): Promise<VehicleCertificate> {
    try {
      const query = `
        INSERT INTO vehicle_certificates (
          vehicle_id, tenant_id, certificate_type, certificate_number,
          issue_date, expiry_date, issuing_authority, file_path, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.certificateType,
        input.certificateNumber,
        input.issueDate || null,
        input.expiryDate,
        input.issuingAuthority || null,
        input.filePath || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapCertificateFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create vehicle certificate:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有证照
   */
  async getCertificatesByVehicle(
    tenantId: string,
    vehicleId: string
  ): Promise<VehicleCertificate[]> {
    try {
      const query = `
        SELECT * FROM vehicle_certificates
        WHERE tenant_id = $1 AND vehicle_id = $2
        ORDER BY expiry_date ASC, created_at DESC
      `;

      const result = await this.dbService.query(query, [tenantId, vehicleId]);
      return result.map(row => this.mapCertificateFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get vehicle certificates:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的证照
   */
  async getExpiringCertificates(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<VehicleCertificate[]> {
    try {
      const query = `
        SELECT vc.*, v.plate_number, v.type as vehicle_type
        FROM vehicle_certificates vc
        JOIN vehicles v ON vc.vehicle_id = v.id
        WHERE vc.tenant_id = $1
          AND vc.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysAhead} days'
        ORDER BY vc.expiry_date ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapCertificateFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get expiring certificates:', error);
      throw error;
    }
  }

  /**
   * 更新证照信息
   */
  async updateCertificate(
    tenantId: string,
    certificateId: string,
    input: UpdateVehicleCertificateInput
  ): Promise<VehicleCertificate> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.certificateType !== undefined) {
        updateFields.push(`certificate_type = $${paramIndex++}`);
        values.push(input.certificateType);
      }
      if (input.certificateNumber !== undefined) {
        updateFields.push(`certificate_number = $${paramIndex++}`);
        values.push(input.certificateNumber);
      }
      if (input.issueDate !== undefined) {
        updateFields.push(`issue_date = $${paramIndex++}`);
        values.push(input.issueDate || null);
      }
      if (input.expiryDate !== undefined) {
        updateFields.push(`expiry_date = $${paramIndex++}`);
        values.push(input.expiryDate);
      }
      if (input.issuingAuthority !== undefined) {
        updateFields.push(`issuing_authority = $${paramIndex++}`);
        values.push(input.issuingAuthority || null);
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
      values.push(tenantId, certificateId);

      const query = `
        UPDATE vehicle_certificates
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Certificate not found');
      }

      return this.mapCertificateFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update vehicle certificate:', error);
      throw error;
    }
  }

  /**
   * 删除证照
   */
  async deleteCertificate(
    tenantId: string,
    certificateId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM vehicle_certificates
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, certificateId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete vehicle certificate:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapCertificateFromDb(row: any): VehicleCertificate {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      certificateType: row.certificate_type,
      certificateNumber: row.certificate_number,
      issueDate: row.issue_date,
      expiryDate: row.expiry_date,
      issuingAuthority: row.issuing_authority,
      filePath: row.file_path,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

