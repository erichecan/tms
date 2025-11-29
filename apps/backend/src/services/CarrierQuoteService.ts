// 承运商报价服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.3 承运商管理

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface CarrierQuote {
  id: string;
  carrierId: string;
  tenantId: string;
  shipmentId?: string;
  routeFrom?: string;
  routeTo?: string;
  distanceKm?: number;
  cargoWeightKg?: number;
  cargoVolumeM3?: number;
  quotedPrice: number;
  currency: string;
  estimatedDays?: number;
  validityDays: number;
  quoteStatus: 'pending' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCarrierQuoteInput {
  carrierId: string;
  shipmentId?: string;
  routeFrom?: string;
  routeTo?: string;
  distanceKm?: number;
  cargoWeightKg?: number;
  cargoVolumeM3?: number;
  quotedPrice: number;
  currency?: string;
  estimatedDays?: number;
  validityDays?: number;
  quoteStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  createdBy?: string;
}

export interface UpdateCarrierQuoteInput {
  quotedPrice?: number;
  estimatedDays?: number;
  validityDays?: number;
  quoteStatus?: 'pending' | 'accepted' | 'rejected' | 'expired';
  notes?: string;
  updatedBy?: string;
}

export class CarrierQuoteService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建报价
   */
  async createQuote(
    tenantId: string,
    input: CreateCarrierQuoteInput
  ): Promise<CarrierQuote> {
    try {
      const query = `
        INSERT INTO carrier_quotes (
          carrier_id, tenant_id, shipment_id, route_from, route_to,
          distance_km, cargo_weight_kg, cargo_volume_m3, quoted_price, currency,
          estimated_days, validity_days, quote_status, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.carrierId,
        tenantId,
        input.shipmentId || null,
        input.routeFrom || null,
        input.routeTo || null,
        input.distanceKm || null,
        input.cargoWeightKg || null,
        input.cargoVolumeM3 || null,
        input.quotedPrice,
        input.currency || 'CNY',
        input.estimatedDays || null,
        input.validityDays || 7,
        input.quoteStatus || 'pending',
        input.notes || null,
        input.createdBy || null
      ]);

      return this.mapQuoteFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create carrier quote:', error);
      throw error;
    }
  }

  /**
   * 获取承运商的所有报价
   */
  async getQuotesByCarrier(
    tenantId: string,
    carrierId: string,
    status?: 'pending' | 'accepted' | 'rejected' | 'expired'
  ): Promise<CarrierQuote[]> {
    try {
      let query = `
        SELECT * FROM carrier_quotes
        WHERE tenant_id = $1 AND carrier_id = $2
      `;
      const values: any[] = [tenantId, carrierId];

      if (status) {
        query += ` AND quote_status = $3`;
        values.push(status);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapQuoteFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get carrier quotes:', error);
      throw error;
    }
  }

  /**
   * 获取运单的所有报价
   */
  async getQuotesByShipment(
    tenantId: string,
    shipmentId: string
  ): Promise<CarrierQuote[]> {
    try {
      const query = `
        SELECT cq.*, c.name as carrier_name, c.rating_score as carrier_rating
        FROM carrier_quotes cq
        JOIN carriers c ON cq.carrier_id = c.id
        WHERE cq.tenant_id = $1 AND cq.shipment_id = $2
        ORDER BY cq.quoted_price ASC, c.rating_score DESC
      `;

      const result = await this.dbService.query(query, [tenantId, shipmentId]);
      return result.map(row => this.mapQuoteFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get quotes by shipment:', error);
      throw error;
    }
  }

  /**
   * 更新报价
   */
  async updateQuote(
    tenantId: string,
    quoteId: string,
    input: UpdateCarrierQuoteInput
  ): Promise<CarrierQuote> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.quotedPrice !== undefined) {
        updateFields.push(`quoted_price = $${paramIndex++}`);
        values.push(input.quotedPrice);
      }
      if (input.estimatedDays !== undefined) {
        updateFields.push(`estimated_days = $${paramIndex++}`);
        values.push(input.estimatedDays || null);
      }
      if (input.validityDays !== undefined) {
        updateFields.push(`validity_days = $${paramIndex++}`);
        values.push(input.validityDays);
      }
      if (input.quoteStatus !== undefined) {
        updateFields.push(`quote_status = $${paramIndex++}`);
        values.push(input.quoteStatus);
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
      values.push(tenantId, quoteId);

      const query = `
        UPDATE carrier_quotes
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Quote not found');
      }

      return this.mapQuoteFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update carrier quote:', error);
      throw error;
    }
  }

  /**
   * 删除报价
   */
  async deleteQuote(
    tenantId: string,
    quoteId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM carrier_quotes
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, quoteId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete carrier quote:', error);
      throw error;
    }
  }

  /**
   * 检查并更新过期报价
   */
  async checkAndExpireQuotes(tenantId: string): Promise<number> {
    try {
      const query = `
        UPDATE carrier_quotes
        SET quote_status = 'expired', updated_at = CURRENT_TIMESTAMP
        WHERE tenant_id = $1
          AND quote_status = 'pending'
          AND created_at + (validity_days || INTERVAL '1 day') < CURRENT_TIMESTAMP
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.length;
    } catch (error: any) {
      logger.error('Failed to expire quotes:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapQuoteFromDb(row: any): CarrierQuote {
    return {
      id: row.id,
      carrierId: row.carrier_id,
      tenantId: row.tenant_id,
      shipmentId: row.shipment_id,
      routeFrom: row.route_from,
      routeTo: row.route_to,
      distanceKm: row.distance_km ? parseFloat(row.distance_km) : undefined,
      cargoWeightKg: row.cargo_weight_kg ? parseFloat(row.cargo_weight_kg) : undefined,
      cargoVolumeM3: row.cargo_volume_m3 ? parseFloat(row.cargo_volume_m3) : undefined,
      quotedPrice: parseFloat(row.quoted_price),
      currency: row.currency,
      estimatedDays: row.estimated_days ? parseInt(row.estimated_days, 10) : undefined,
      validityDays: parseInt(row.validity_days || '7', 10),
      quoteStatus: row.quote_status,
      notes: row.notes,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

