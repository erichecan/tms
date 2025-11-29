// 备件管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.1 维护保养完整功能

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface SparePart {
  id: string;
  tenantId: string;
  partNumber: string;
  partName: string;
  partCategory?: string;
  manufacturer?: string;
  supplier?: string;
  unitPrice: number;
  quantityInStock: number;
  minStockLevel: number;
  maxStockLevel?: number;
  unit: string;
  location?: string;
  description?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateSparePartInput {
  partNumber: string;
  partName: string;
  partCategory?: string;
  manufacturer?: string;
  supplier?: string;
  unitPrice: number;
  quantityInStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unit?: string;
  location?: string;
  description?: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface UpdateSparePartInput {
  partName?: string;
  partCategory?: string;
  manufacturer?: string;
  supplier?: string;
  unitPrice?: number;
  quantityInStock?: number;
  minStockLevel?: number;
  maxStockLevel?: number;
  unit?: string;
  location?: string;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface StockAdjustmentInput {
  adjustmentType: 'in' | 'out' | 'adjust';
  quantity: number;
  reason?: string;
  workOrderId?: string;
  updatedBy?: string;
}

export class SparePartsService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建备件
   */
  async createSparePart(
    tenantId: string,
    input: CreateSparePartInput
  ): Promise<SparePart> {
    try {
      const query = `
        INSERT INTO spare_parts (
          tenant_id, part_number, part_name, part_category, manufacturer,
          supplier, unit_price, quantity_in_stock, min_stock_level, max_stock_level,
          unit, location, description, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.partNumber,
        input.partName,
        input.partCategory || null,
        input.manufacturer || null,
        input.supplier || null,
        input.unitPrice,
        input.quantityInStock || 0,
        input.minStockLevel || 0,
        input.maxStockLevel || null,
        input.unit || 'piece',
        input.location || null,
        input.description || null,
        input.isActive !== false,
        input.createdBy || null,
      ]);

      const part = this.mapPartFromDb(result[0]);
      logger.info(`创建备件成功: ${part.id} (${part.partNumber})`);
      return part;
    } catch (error: any) {
      logger.error('创建备件失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有备件（支持筛选）
   */
  async getSpareParts(
    tenantId: string,
    params?: {
      partCategory?: string;
      isActive?: boolean;
      lowStock?: boolean; // 是否只显示低库存
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ parts: SparePart[]; total: number }> {
    try {
      const {
        partCategory,
        isActive,
        lowStock,
        search,
        page = 1,
        limit = 20,
      } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (partCategory) {
        whereClause += ` AND part_category = $${paramIndex++}`;
        queryParams.push(partCategory);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      if (lowStock) {
        whereClause += ` AND quantity_in_stock <= min_stock_level`;
      }

      if (search) {
        whereClause += ` AND (part_number ILIKE $${paramIndex} OR part_name ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM spare_parts ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM spare_parts
        ${whereClause}
        ORDER BY part_name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        parts: result.map(row => this.mapPartFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取备件列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个备件
   */
  async getSparePartById(
    tenantId: string,
    partId: string
  ): Promise<SparePart | null> {
    try {
      const query = `
        SELECT * FROM spare_parts
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, partId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapPartFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取备件失败:', error);
      throw error;
    }
  }

  /**
   * 根据配件编号获取备件
   */
  async getSparePartByNumber(
    tenantId: string,
    partNumber: string
  ): Promise<SparePart | null> {
    try {
      const query = `
        SELECT * FROM spare_parts
        WHERE tenant_id = $1 AND part_number = $2
      `;

      const result = await this.dbService.query(query, [tenantId, partNumber]);
      if (result.length === 0) {
        return null;
      }

      return this.mapPartFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取备件失败:', error);
      throw error;
    }
  }

  /**
   * 更新备件
   */
  async updateSparePart(
    tenantId: string,
    partId: string,
    input: UpdateSparePartInput
  ): Promise<SparePart> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.partName !== undefined) {
        updateFields.push(`part_name = $${paramIndex++}`);
        values.push(input.partName);
      }

      if (input.partCategory !== undefined) {
        updateFields.push(`part_category = $${paramIndex++}`);
        values.push(input.partCategory);
      }

      if (input.manufacturer !== undefined) {
        updateFields.push(`manufacturer = $${paramIndex++}`);
        values.push(input.manufacturer);
      }

      if (input.supplier !== undefined) {
        updateFields.push(`supplier = $${paramIndex++}`);
        values.push(input.supplier);
      }

      if (input.unitPrice !== undefined) {
        updateFields.push(`unit_price = $${paramIndex++}`);
        values.push(input.unitPrice);
      }

      if (input.quantityInStock !== undefined) {
        updateFields.push(`quantity_in_stock = $${paramIndex++}`);
        values.push(input.quantityInStock);
      }

      if (input.minStockLevel !== undefined) {
        updateFields.push(`min_stock_level = $${paramIndex++}`);
        values.push(input.minStockLevel);
      }

      if (input.maxStockLevel !== undefined) {
        updateFields.push(`max_stock_level = $${paramIndex++}`);
        values.push(input.maxStockLevel);
      }

      if (input.unit !== undefined) {
        updateFields.push(`unit = $${paramIndex++}`);
        values.push(input.unit);
      }

      if (input.location !== undefined) {
        updateFields.push(`location = $${paramIndex++}`);
        values.push(input.location);
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (input.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
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
        UPDATE spare_parts
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, partId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('备件不存在');
      }

      logger.info(`更新备件成功: ${partId}`);
      return this.mapPartFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新备件失败:', error);
      throw error;
    }
  }

  /**
   * 删除备件
   */
  async deleteSparePart(
    tenantId: string,
    partId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM spare_parts
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, partId]);
      logger.info(`删除备件成功: ${partId}`);
      return true;
    } catch (error: any) {
      logger.error('删除备件失败:', error);
      throw error;
    }
  }

  /**
   * 库存调整（入库、出库、调整）
   */
  async adjustStock(
    tenantId: string,
    partId: string,
    input: StockAdjustmentInput
  ): Promise<SparePart> {
    try {
      const part = await this.getSparePartById(tenantId, partId);
      if (!part) {
        throw new Error('备件不存在');
      }

      let newQuantity = part.quantityInStock;
      if (input.adjustmentType === 'in') {
        newQuantity += input.quantity;
      } else if (input.adjustmentType === 'out') {
        newQuantity -= input.quantity;
        if (newQuantity < 0) {
          throw new Error('库存不足');
        }
      } else if (input.adjustmentType === 'adjust') {
        newQuantity = input.quantity;
      }

      return await this.updateSparePart(tenantId, partId, {
        quantityInStock: newQuantity,
        updatedBy: input.updatedBy,
      });
    } catch (error: any) {
      logger.error('库存调整失败:', error);
      throw error;
    }
  }

  /**
   * 获取低库存备件
   */
  async getLowStockParts(
    tenantId: string
  ): Promise<SparePart[]> {
    try {
      const query = `
        SELECT * FROM spare_parts
        WHERE tenant_id = $1
          AND is_active = TRUE
          AND quantity_in_stock <= min_stock_level
        ORDER BY (quantity_in_stock - min_stock_level) ASC
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapPartFromDb(row));
    } catch (error: any) {
      logger.error('获取低库存备件失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库行映射到 SparePart
   */
  private mapPartFromDb(row: any): SparePart {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      partNumber: row.part_number,
      partName: row.part_name,
      partCategory: row.part_category || undefined,
      manufacturer: row.manufacturer || undefined,
      supplier: row.supplier || undefined,
      unitPrice: parseFloat(row.unit_price),
      quantityInStock: parseInt(row.quantity_in_stock),
      minStockLevel: parseInt(row.min_stock_level),
      maxStockLevel: row.max_stock_level ? parseInt(row.max_stock_level) : undefined,
      unit: row.unit,
      location: row.location || undefined,
      description: row.description || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

