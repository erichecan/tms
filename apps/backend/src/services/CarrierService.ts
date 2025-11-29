// 承运商管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.3 承运商管理

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface Carrier {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  companyType?: 'individual' | 'company' | 'cooperative' | 'other';
  registrationNumber?: string;
  taxId?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: any; // JSONB
  businessScope?: string;
  serviceLevel: 'standard' | 'premium' | 'vip';
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  ratingScore: number;
  totalShipments: number;
  onTimeRate: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCarrierInput {
  name: string;
  code?: string;
  companyType?: 'individual' | 'company' | 'cooperative' | 'other';
  registrationNumber?: string;
  taxId?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: any;
  businessScope?: string;
  serviceLevel?: 'standard' | 'premium' | 'vip';
  status?: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  createdBy?: string;
}

export interface UpdateCarrierInput {
  name?: string;
  code?: string;
  companyType?: 'individual' | 'company' | 'cooperative' | 'other';
  registrationNumber?: string;
  taxId?: string;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  address?: any;
  businessScope?: string;
  serviceLevel?: 'standard' | 'premium' | 'vip';
  status?: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  updatedBy?: string;
}

export class CarrierService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建承运商
   */
  async createCarrier(
    tenantId: string,
    input: CreateCarrierInput
  ): Promise<Carrier> {
    try {
      // 检查承运商名称是否已存在
      const existing = await this.dbService.query(
        'SELECT id FROM carriers WHERE tenant_id = $1 AND name = $2',
        [tenantId, input.name]
      );

      if (existing.length > 0) {
        throw new Error(`承运商名称 "${input.name}" 已存在`);
      }

      const query = `
        INSERT INTO carriers (
          tenant_id, name, code, company_type, registration_number, tax_id,
          contact_person, contact_phone, contact_email, address, business_scope,
          service_level, status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.name,
        input.code || null,
        input.companyType || null,
        input.registrationNumber || null,
        input.taxId || null,
        input.contactPerson || null,
        input.contactPhone || null,
        input.contactEmail || null,
        input.address ? JSON.stringify(input.address) : null,
        input.businessScope || null,
        input.serviceLevel || 'standard',
        input.status || 'active',
        input.createdBy || null
      ]);

      return this.mapCarrierFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create carrier:', error);
      throw error;
    }
  }

  /**
   * 获取所有承运商
   */
  async getCarriers(
    tenantId: string,
    status?: 'active' | 'inactive' | 'suspended' | 'blacklisted',
    serviceLevel?: 'standard' | 'premium' | 'vip'
  ): Promise<Carrier[]> {
    try {
      let query = `
        SELECT * FROM carriers
        WHERE tenant_id = $1
      `;
      const values: any[] = [tenantId];

      if (status) {
        query += ` AND status = $${values.length + 1}`;
        values.push(status);
      }
      if (serviceLevel) {
        query += ` AND service_level = $${values.length + 1}`;
        values.push(serviceLevel);
      }

      query += ` ORDER BY rating_score DESC, created_at DESC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapCarrierFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get carriers:', error);
      throw error;
    }
  }

  /**
   * 获取单个承运商
   */
  async getCarrierById(
    tenantId: string,
    carrierId: string
  ): Promise<Carrier | null> {
    try {
      const query = `
        SELECT * FROM carriers
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, carrierId]);
      return result.length > 0 ? this.mapCarrierFromDb(result[0]) : null;
    } catch (error: any) {
      logger.error('Failed to get carrier:', error);
      throw error;
    }
  }

  /**
   * 更新承运商信息
   */
  async updateCarrier(
    tenantId: string,
    carrierId: string,
    input: UpdateCarrierInput
  ): Promise<Carrier> {
    try {
      // 如果更新名称，检查是否冲突
      if (input.name !== undefined) {
        const existing = await this.dbService.query(
          'SELECT id FROM carriers WHERE tenant_id = $1 AND name = $2 AND id != $3',
          [tenantId, input.name, carrierId]
        );

        if (existing.length > 0) {
          throw new Error(`承运商名称 "${input.name}" 已被其他承运商使用`);
        }
      }

      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        values.push(input.name);
      }
      if (input.code !== undefined) {
        updateFields.push(`code = $${paramIndex++}`);
        values.push(input.code || null);
      }
      if (input.companyType !== undefined) {
        updateFields.push(`company_type = $${paramIndex++}`);
        values.push(input.companyType || null);
      }
      if (input.registrationNumber !== undefined) {
        updateFields.push(`registration_number = $${paramIndex++}`);
        values.push(input.registrationNumber || null);
      }
      if (input.taxId !== undefined) {
        updateFields.push(`tax_id = $${paramIndex++}`);
        values.push(input.taxId || null);
      }
      if (input.contactPerson !== undefined) {
        updateFields.push(`contact_person = $${paramIndex++}`);
        values.push(input.contactPerson || null);
      }
      if (input.contactPhone !== undefined) {
        updateFields.push(`contact_phone = $${paramIndex++}`);
        values.push(input.contactPhone || null);
      }
      if (input.contactEmail !== undefined) {
        updateFields.push(`contact_email = $${paramIndex++}`);
        values.push(input.contactEmail || null);
      }
      if (input.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        values.push(input.address ? JSON.stringify(input.address) : null);
      }
      if (input.businessScope !== undefined) {
        updateFields.push(`business_scope = $${paramIndex++}`);
        values.push(input.businessScope || null);
      }
      if (input.serviceLevel !== undefined) {
        updateFields.push(`service_level = $${paramIndex++}`);
        values.push(input.serviceLevel);
      }
      if (input.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy || null);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(tenantId, carrierId);

      const query = `
        UPDATE carriers
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Carrier not found');
      }

      return this.mapCarrierFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update carrier:', error);
      throw error;
    }
  }

  /**
   * 删除承运商
   */
  async deleteCarrier(
    tenantId: string,
    carrierId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM carriers
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, carrierId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete carrier:', error);
      throw error;
    }
  }

  /**
   * 更新承运商评分（根据评分记录自动计算）
   */
  async updateCarrierRating(
    tenantId: string,
    carrierId: string
  ): Promise<Carrier> {
    try {
      // 计算平均评分
      const ratingQuery = `
        SELECT AVG(score) as avg_score
        FROM carrier_ratings
        WHERE tenant_id = $1 AND carrier_id = $2 AND rating_type = 'overall'
      `;
      const ratingResult = await this.dbService.query(ratingQuery, [tenantId, carrierId]);
      const avgScore = ratingResult[0]?.avg_score ? parseFloat(ratingResult[0].avg_score) : 0;

      // 更新承运商评分
      const updateQuery = `
        UPDATE carriers
        SET rating_score = $1, updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $2 AND id = $3
        RETURNING *
      `;

      const result = await this.dbService.query(updateQuery, [avgScore, tenantId, carrierId]);
      return this.mapCarrierFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update carrier rating:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapCarrierFromDb(row: any): Carrier {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      code: row.code,
      companyType: row.company_type,
      registrationNumber: row.registration_number,
      taxId: row.tax_id,
      contactPerson: row.contact_person,
      contactPhone: row.contact_phone,
      contactEmail: row.contact_email,
      address: row.address ? (typeof row.address === 'string' ? JSON.parse(row.address) : row.address) : undefined,
      businessScope: row.business_scope,
      serviceLevel: row.service_level,
      status: row.status,
      ratingScore: row.rating_score ? parseFloat(row.rating_score) : 0,
      totalShipments: parseInt(row.total_shipments || '0', 10),
      onTimeRate: row.on_time_rate ? parseFloat(row.on_time_rate) : 0,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

