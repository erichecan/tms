// 车辆年检管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.1 车辆档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface VehicleInspection {
  id: string;
  vehicleId: string;
  tenantId: string;
  inspectionType: 'annual' | 'safety' | 'emission' | 'roadworthiness' | 'other';
  inspectionDate: Date | string;
  expiryDate: Date | string;
  inspectionStation?: string;
  inspectorName?: string;
  result: 'passed' | 'failed' | 'conditional';
  mileageAtInspection?: number;
  nextInspectionDate?: Date | string;
  filePath?: string;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateVehicleInspectionInput {
  vehicleId: string;
  inspectionType: 'annual' | 'safety' | 'emission' | 'roadworthiness' | 'other';
  inspectionDate: Date | string;
  expiryDate: Date | string;
  inspectionStation?: string;
  inspectorName?: string;
  result: 'passed' | 'failed' | 'conditional';
  mileageAtInspection?: number;
  nextInspectionDate?: Date | string;
  filePath?: string;
  notes?: string;
  createdBy?: string;
}

export interface UpdateVehicleInspectionInput {
  inspectionType?: 'annual' | 'safety' | 'emission' | 'roadworthiness' | 'other';
  inspectionDate?: Date | string;
  expiryDate?: Date | string;
  inspectionStation?: string;
  inspectorName?: string;
  result?: 'passed' | 'failed' | 'conditional';
  mileageAtInspection?: number;
  nextInspectionDate?: Date | string;
  filePath?: string;
  notes?: string;
  updatedBy?: string;
}

export class VehicleInspectionService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建年检记录
   */
  async createInspection(
    tenantId: string,
    input: CreateVehicleInspectionInput
  ): Promise<VehicleInspection> {
    try {
      const query = `
        INSERT INTO vehicle_inspections (
          vehicle_id, tenant_id, inspection_type, inspection_date, expiry_date,
          inspection_station, inspector_name, result, mileage_at_inspection,
          next_inspection_date, file_path, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.inspectionType,
        input.inspectionDate,
        input.expiryDate,
        input.inspectionStation || null,
        input.inspectorName || null,
        input.result,
        input.mileageAtInspection || null,
        input.nextInspectionDate || null,
        input.filePath || null,
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapInspectionFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create vehicle inspection:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有年检记录
   */
  async getInspectionsByVehicle(
    tenantId: string,
    vehicleId: string
  ): Promise<VehicleInspection[]> {
    try {
      const query = `
        SELECT * FROM vehicle_inspections
        WHERE tenant_id = $1 AND vehicle_id = $2
        ORDER BY inspection_date DESC
      `;

      const result = await this.dbService.query(query, [tenantId, vehicleId]);
      return result.map(row => this.mapInspectionFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get vehicle inspections:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的年检
   */
  async getExpiringInspections(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<VehicleInspection[]> {
    try {
      const query = `
        SELECT vi.*, v.plate_number, v.type as vehicle_type
        FROM vehicle_inspections vi
        JOIN vehicles v ON vi.vehicle_id = v.id
        WHERE vi.tenant_id = $1
          AND vi.expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '${daysAhead} days'
        ORDER BY vi.expiry_date ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapInspectionFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get expiring inspections:', error);
      throw error;
    }
  }

  /**
   * 更新年检记录
   */
  async updateInspection(
    tenantId: string,
    inspectionId: string,
    input: UpdateVehicleInspectionInput
  ): Promise<VehicleInspection> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.inspectionType !== undefined) {
        updateFields.push(`inspection_type = $${paramIndex++}`);
        values.push(input.inspectionType);
      }
      if (input.inspectionDate !== undefined) {
        updateFields.push(`inspection_date = $${paramIndex++}`);
        values.push(input.inspectionDate);
      }
      if (input.expiryDate !== undefined) {
        updateFields.push(`expiry_date = $${paramIndex++}`);
        values.push(input.expiryDate);
      }
      if (input.inspectionStation !== undefined) {
        updateFields.push(`inspection_station = $${paramIndex++}`);
        values.push(input.inspectionStation || null);
      }
      if (input.inspectorName !== undefined) {
        updateFields.push(`inspector_name = $${paramIndex++}`);
        values.push(input.inspectorName || null);
      }
      if (input.result !== undefined) {
        updateFields.push(`result = $${paramIndex++}`);
        values.push(input.result);
      }
      if (input.mileageAtInspection !== undefined) {
        updateFields.push(`mileage_at_inspection = $${paramIndex++}`);
        values.push(input.mileageAtInspection || null);
      }
      if (input.nextInspectionDate !== undefined) {
        updateFields.push(`next_inspection_date = $${paramIndex++}`);
        values.push(input.nextInspectionDate || null);
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
      values.push(tenantId, inspectionId);

      const query = `
        UPDATE vehicle_inspections
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Inspection not found');
      }

      return this.mapInspectionFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update vehicle inspection:', error);
      throw error;
    }
  }

  /**
   * 删除年检记录
   */
  async deleteInspection(
    tenantId: string,
    inspectionId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM vehicle_inspections
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, inspectionId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete vehicle inspection:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapInspectionFromDb(row: any): VehicleInspection {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      inspectionType: row.inspection_type,
      inspectionDate: row.inspection_date,
      expiryDate: row.expiry_date,
      inspectionStation: row.inspection_station,
      inspectorName: row.inspector_name,
      result: row.result,
      mileageAtInspection: row.mileage_at_inspection ? parseFloat(row.mileage_at_inspection) : undefined,
      nextInspectionDate: row.next_inspection_date,
      filePath: row.file_path,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

