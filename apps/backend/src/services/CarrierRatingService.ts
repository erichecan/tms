// 承运商评分服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.3 承运商管理

import { DatabaseService } from './DatabaseService';
import { CarrierService } from './CarrierService';
import { logger } from '../utils/logger';

export interface CarrierRating {
  id: string;
  carrierId: string;
  tenantId: string;
  shipmentId?: string;
  ratingType: 'service' | 'punctuality' | 'safety' | 'communication' | 'overall';
  score: number;
  comment?: string;
  ratedBy?: string;
  ratedAt: Date | string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateCarrierRatingInput {
  carrierId: string;
  shipmentId?: string;
  ratingType: 'service' | 'punctuality' | 'safety' | 'communication' | 'overall';
  score: number;
  comment?: string;
  ratedBy?: string;
}

export class CarrierRatingService {
  private dbService: DatabaseService;
  private carrierService: CarrierService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.carrierService = new CarrierService(dbService);
  }

  /**
   * 创建评分记录
   */
  async createRating(
    tenantId: string,
    input: CreateCarrierRatingInput
  ): Promise<CarrierRating> {
    try {
      if (input.score < 0 || input.score > 5) {
        throw new Error('评分必须在0-5分之间');
      }

      const query = `
        INSERT INTO carrier_ratings (
          carrier_id, tenant_id, shipment_id, rating_type, score, comment, rated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.carrierId,
        tenantId,
        input.shipmentId || null,
        input.ratingType,
        input.score,
        input.comment || null,
        input.ratedBy || null
      ]);

      // 如果是总体评分，更新承运商的平均评分
      if (input.ratingType === 'overall') {
        await this.carrierService.updateCarrierRating(tenantId, input.carrierId);
      }

      return this.mapRatingFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create carrier rating:', error);
      throw error;
    }
  }

  /**
   * 获取承运商的所有评分
   */
  async getRatingsByCarrier(
    tenantId: string,
    carrierId: string,
    ratingType?: 'service' | 'punctuality' | 'safety' | 'communication' | 'overall'
  ): Promise<CarrierRating[]> {
    try {
      let query = `
        SELECT * FROM carrier_ratings
        WHERE tenant_id = $1 AND carrier_id = $2
      `;
      const values: any[] = [tenantId, carrierId];

      if (ratingType) {
        query += ` AND rating_type = $3`;
        values.push(ratingType);
      }

      query += ` ORDER BY rated_at DESC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapRatingFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get carrier ratings:', error);
      throw error;
    }
  }

  /**
   * 获取承运商的平均评分
   */
  async getAverageRating(
    tenantId: string,
    carrierId: string,
    ratingType?: 'service' | 'punctuality' | 'safety' | 'communication' | 'overall'
  ): Promise<number> {
    try {
      let query = `
        SELECT AVG(score) as avg_score
        FROM carrier_ratings
        WHERE tenant_id = $1 AND carrier_id = $2
      `;
      const values: any[] = [tenantId, carrierId];

      if (ratingType) {
        query += ` AND rating_type = $3`;
        values.push(ratingType);
      }

      const result = await this.dbService.query(query, values);
      return result[0]?.avg_score ? parseFloat(result[0].avg_score) : 0;
    } catch (error: any) {
      logger.error('Failed to get average rating:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapRatingFromDb(row: any): CarrierRating {
    return {
      id: row.id,
      carrierId: row.carrier_id,
      tenantId: row.tenant_id,
      shipmentId: row.shipment_id,
      ratingType: row.rating_type,
      score: parseFloat(row.score),
      comment: row.comment,
      ratedBy: row.rated_by,
      ratedAt: row.rated_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }
}

