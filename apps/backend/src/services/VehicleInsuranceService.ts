// 车辆保险管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface VehicleInsurance {
  id: string;
  vehicleId: string;
  tenantId: string;
  insuranceType: 'liability' | 'comprehensive' | 'collision' | 'cargo' | 'third_party' | 'other';
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount?: number;
  premiumAmount?: number;
  startDate: Date | string;
  expiryDate: Date | string;
  contactPerson?: string;
  contactPhone?: string;
  filePath?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateVehicleInsuranceInput {
  vehicleId: string;
  insuranceType: 'liability' | 'comprehensive' | 'collision' | 'cargo' | 'third_party' | 'other';
  insuranceCompany: string;
  policyNumber: string;
  coverageAmount?: number;
  premiumAmount?: number;
  startDate: Date | string;
  expiryDate: Date | string;
  contactPerson?: string;
  contactPhone?: string;
  filePath?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateVehicleInsuranceInput {
  insuranceType?: 'liability' | 'comprehensive' | 'collision' | 'cargo' | 'third_party' | 'other';
  insuranceCompany?: string;
  policyNumber?: string;
  coverageAmount?: number;
  premiumAmount?: number;
  startDate?: Date | string;
  expiryDate?: Date | string;
  contactPerson?: string;
  contactPhone?: string;
  filePath?: string;
  notes?: string;
  updatedBy?: string;
}

export class VehicleInsuranceService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建车辆保险
   */
  async createInsurance(
    tenantId: string,
    input: CreateVehicleInsuranceInput
  ): Promise<VehicleInsurance> {
    try {
      const query = `
        INSERT INTO vehicle_insurance (
          vehicle_id, tenant_id, insurance_type, insurance_company, policy_number,
          coverage_amount, premium_amount, start_date, expiry_date,
          contact_person, contact_phone, file_path, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.insuranceType,
        input.insuranceCompany,
        input.policyNumber,
        input.coverageAmount || null,
        input.premiumAmount || null,
        input.startDate,
        input.expiryDate,
        input.contactPerson || null,
        input.contactPhone || null,
        input.filePath || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapInsuranceFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create vehicle insurance:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有保险
   */
  async getInsurancesByVehicle(
    tenantId: string,
    vehicleId: string
  ): Promise<VehicleInsurance[]> {
    try {
      const query = `
        SELECT * FROM vehicle_insurance
        WHERE tenant_id = $1 AND vehicle_id = $2
        ORDER BY expiry_date ASC, created_at DESC
      `;

      const result = await this.dbService.query(query, [tenantId, vehicleId]);
      return result.map(row => this.mapInsuranceFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get vehicle insurances:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的保险
   */
  async getExpiringInsurances(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<VehicleInsurance[]> {
    try {
      const query = `
        SELECT vi.*, v.plate_number, v.type as vehicle_type
        FROM vehicle_insurance vi
        JOIN vehicles v ON vi.vehicle_id = v.id
        WHERE vi.tenant_id = $1
          AND vi.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysAhead} days'
        ORDER BY vi.expiry_date ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapInsuranceFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get expiring insurances:', error);
      throw error;
    }
  }

  /**
   * 更新保险信息
   */
  async updateInsurance(
    tenantId: string,
    insuranceId: string,
    input: UpdateVehicleInsuranceInput
  ): Promise<VehicleInsurance> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.insuranceType !== undefined) {
        updateFields.push(`insurance_type = $${paramIndex++}`);
        values.push(input.insuranceType);
      }
      if (input.insuranceCompany !== undefined) {
        updateFields.push(`insurance_company = $${paramIndex++}`);
        values.push(input.insuranceCompany);
      }
      if (input.policyNumber !== undefined) {
        updateFields.push(`policy_number = $${paramIndex++}`);
        values.push(input.policyNumber);
      }
      if (input.coverageAmount !== undefined) {
        updateFields.push(`coverage_amount = $${paramIndex++}`);
        values.push(input.coverageAmount || null);
      }
      if (input.premiumAmount !== undefined) {
        updateFields.push(`premium_amount = $${paramIndex++}`);
        values.push(input.premiumAmount || null);
      }
      if (input.startDate !== undefined) {
        updateFields.push(`start_date = $${paramIndex++}`);
        values.push(input.startDate);
      }
      if (input.expiryDate !== undefined) {
        updateFields.push(`expiry_date = $${paramIndex++}`);
        values.push(input.expiryDate);
      }
      if (input.contactPerson !== undefined) {
        updateFields.push(`contact_person = $${paramIndex++}`);
        values.push(input.contactPerson || null);
      }
      if (input.contactPhone !== undefined) {
        updateFields.push(`contact_phone = $${paramIndex++}`);
        values.push(input.contactPhone || null);
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
      values.push(tenantId, insuranceId);

      const query = `
        UPDATE vehicle_insurance
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Insurance not found');
      }

      return this.mapInsuranceFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update vehicle insurance:', error);
      throw error;
    }
  }

  /**
   * 删除保险
   */
  async deleteInsurance(
    tenantId: string,
    insuranceId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM vehicle_insurance
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, insuranceId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete vehicle insurance:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapInsuranceFromDb(row: any): VehicleInsurance {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      insuranceType: row.insurance_type,
      insuranceCompany: row.insurance_company,
      policyNumber: row.policy_number,
      coverageAmount: row.coverage_amount ? parseFloat(row.coverage_amount) : undefined,
      premiumAmount: row.premium_amount ? parseFloat(row.premium_amount) : undefined,
      startDate: row.start_date,
      expiryDate: row.expiry_date,
      contactPerson: row.contact_person,
      contactPhone: row.contact_phone,
      filePath: row.file_path,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

