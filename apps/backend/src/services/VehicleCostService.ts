// 车辆成本核算服务
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.3 成本核算

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface CostCategory {
  id: string;
  tenantId: string;
  categoryCode: string;
  categoryName: string;
  categoryType: 'fuel' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other'; // 2025-11-29T11:25:04Z 移除维护成本类型
  parentCategoryId?: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface VehicleCost {
  id: string;
  vehicleId: string;
  tenantId: string;
  costCategoryId: string;
  costDate: Date | string;
  costAmount: number;
  currency: string;
  costType: 'fuel' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other'; // 2025-11-29T11:25:04Z 移除维护成本类型
  description?: string;
  referenceId?: string;
  referenceType?: string;
  mileageAtCost?: number;
  quantity?: number;
  unitPrice?: number;
  unit?: string;
  provider?: string;
  invoiceNumber?: string;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  paymentDate?: Date | string;
  notes?: string;
  attachments?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateCostCategoryInput {
  categoryCode: string;
  categoryName: string;
  categoryType: 'fuel' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other'; // 2025-11-29T11:25:04Z 移除维护成本类型
  parentCategoryId?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdBy?: string;
}

export interface UpdateCostCategoryInput {
  categoryName?: string;
  categoryType?: 'fuel' | 'maintenance' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other';
  parentCategoryId?: string;
  description?: string;
  isActive?: boolean;
  sortOrder?: number;
  updatedBy?: string;
}

export interface CreateVehicleCostInput {
  vehicleId: string;
  costCategoryId: string;
  costDate: Date | string;
  costAmount: number;
  currency?: string;
  costType: 'fuel' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other'; // 2025-11-29T11:25:04Z 移除维护成本类型
  description?: string;
  referenceId?: string;
  referenceType?: string;
  mileageAtCost?: number;
  quantity?: number;
  unitPrice?: number;
  unit?: string;
  provider?: string;
  invoiceNumber?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentDate?: Date | string;
  notes?: string;
  attachments?: string[];
  createdBy?: string;
}

export interface UpdateVehicleCostInput {
  costCategoryId?: string;
  costDate?: Date | string;
  costAmount?: number;
  currency?: string;
  costType?: 'fuel' | 'maintenance' | 'toll' | 'labor' | 'insurance' | 'depreciation' | 'other';
  description?: string;
  referenceId?: string;
  referenceType?: string;
  mileageAtCost?: number;
  quantity?: number;
  unitPrice?: number;
  unit?: string;
  provider?: string;
  invoiceNumber?: string;
  paymentStatus?: 'unpaid' | 'partial' | 'paid';
  paymentDate?: Date | string;
  notes?: string;
  attachments?: string[];
  updatedBy?: string;
}

export interface CostSummary {
  totalCost: number;
  costByType: Record<string, number>;
  costByCategory: Record<string, number>;
  costByVehicle: Record<string, number>;
  costByMonth: Record<string, number>;
}

export class VehicleCostService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  // ==================== 成本分类管理 ====================

  /**
   * 创建成本分类
   */
  async createCostCategory(
    tenantId: string,
    input: CreateCostCategoryInput
  ): Promise<CostCategory> {
    try {
      const query = `
        INSERT INTO cost_categories (
          tenant_id, category_code, category_name, category_type,
          parent_category_id, description, is_active, sort_order, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.categoryCode,
        input.categoryName,
        input.categoryType,
        input.parentCategoryId || null,
        input.description || null,
        input.isActive !== false,
        input.sortOrder || 0,
        input.createdBy || null,
      ]);

      const category = this.mapCategoryFromDb(result[0]);
      logger.info(`创建成本分类成功: ${category.id} (${category.categoryCode})`);
      return category;
    } catch (error: any) {
      logger.error('创建成本分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有成本分类
   */
  async getCostCategories(
    tenantId: string,
    params?: {
      categoryType?: string;
      isActive?: boolean;
      parentCategoryId?: string;
    }
  ): Promise<CostCategory[]> {
    try {
      const { categoryType, isActive, parentCategoryId } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (categoryType) {
        whereClause += ` AND category_type = $${paramIndex++}`;
        queryParams.push(categoryType);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      if (parentCategoryId !== undefined) {
        if (parentCategoryId === null) {
          whereClause += ` AND parent_category_id IS NULL`;
        } else {
          whereClause += ` AND parent_category_id = $${paramIndex++}`;
          queryParams.push(parentCategoryId);
        }
      }

      const query = `
        SELECT * FROM cost_categories
        ${whereClause}
        ORDER BY sort_order ASC, category_name ASC
      `;

      const result = await this.dbService.query(query, queryParams);
      return result.map(row => this.mapCategoryFromDb(row));
    } catch (error: any) {
      logger.error('获取成本分类失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个成本分类
   */
  async getCostCategoryById(
    tenantId: string,
    categoryId: string
  ): Promise<CostCategory | null> {
    try {
      const query = `
        SELECT * FROM cost_categories
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, categoryId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapCategoryFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取成本分类失败:', error);
      throw error;
    }
  }

  /**
   * 更新成本分类
   */
  async updateCostCategory(
    tenantId: string,
    categoryId: string,
    input: UpdateCostCategoryInput
  ): Promise<CostCategory> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.categoryName !== undefined) {
        updateFields.push(`category_name = $${paramIndex++}`);
        values.push(input.categoryName);
      }

      if (input.categoryType !== undefined) {
        updateFields.push(`category_type = $${paramIndex++}`);
        values.push(input.categoryType);
      }

      if (input.parentCategoryId !== undefined) {
        updateFields.push(`parent_category_id = $${paramIndex++}`);
        values.push(input.parentCategoryId || null);
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (input.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
      }

      if (input.sortOrder !== undefined) {
        updateFields.push(`sort_order = $${paramIndex++}`);
        values.push(input.sortOrder);
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
        UPDATE cost_categories
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, categoryId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('成本分类不存在');
      }

      logger.info(`更新成本分类成功: ${categoryId}`);
      return this.mapCategoryFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新成本分类失败:', error);
      throw error;
    }
  }

  /**
   * 删除成本分类
   */
  async deleteCostCategory(
    tenantId: string,
    categoryId: string
  ): Promise<boolean> {
    try {
      // 检查是否有子分类
      const children = await this.dbService.query(
        'SELECT COUNT(*) as count FROM cost_categories WHERE parent_category_id = $1 AND tenant_id = $2',
        [categoryId, tenantId]
      );

      if (parseInt(children[0].count) > 0) {
        throw new Error('该分类下存在子分类，无法删除');
      }

      // 检查是否有成本记录使用此分类
      const costs = await this.dbService.query(
        'SELECT COUNT(*) as count FROM vehicle_costs WHERE cost_category_id = $1 AND tenant_id = $2',
        [categoryId, tenantId]
      );

      if (parseInt(costs[0].count) > 0) {
        throw new Error('该分类下存在成本记录，无法删除');
      }

      const query = `
        DELETE FROM cost_categories
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, categoryId]);
      logger.info(`删除成本分类成功: ${categoryId}`);
      return true;
    } catch (error: any) {
      logger.error('删除成本分类失败:', error);
      throw error;
    }
  }

  // ==================== 车辆成本管理 ====================

  /**
   * 创建车辆成本记录
   */
  async createVehicleCost(
    tenantId: string,
    input: CreateVehicleCostInput
  ): Promise<VehicleCost> {
    try {
      const query = `
        INSERT INTO vehicle_costs (
          vehicle_id, tenant_id, cost_category_id, cost_date, cost_amount, currency,
          cost_type, description, reference_id, reference_type, mileage_at_cost,
          quantity, unit_price, unit, provider, invoice_number,
          payment_status, payment_date, notes, attachments, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.costCategoryId,
        input.costDate,
        input.costAmount,
        input.currency || 'CAD',
        input.costType,
        input.description || null,
        input.referenceId || null,
        input.referenceType || null,
        input.mileageAtCost || null,
        input.quantity || null,
        input.unitPrice || null,
        input.unit || null,
        input.provider || null,
        input.invoiceNumber || null,
        input.paymentStatus || 'unpaid',
        input.paymentDate || null,
        input.notes || null,
        input.attachments ? JSON.stringify(input.attachments) : '[]',
        input.createdBy || null,
      ]);

      const cost = this.mapCostFromDb(result[0]);
      logger.info(`创建车辆成本记录成功: ${cost.id}`);
      return cost;
    } catch (error: any) {
      logger.error('创建车辆成本记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有成本记录
   */
  async getVehicleCosts(
    tenantId: string,
    params?: {
      vehicleId?: string;
      costType?: string;
      costCategoryId?: string;
      startDate?: string;
      endDate?: string;
      paymentStatus?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ costs: VehicleCost[]; total: number }> {
    try {
      const {
        vehicleId,
        costType,
        costCategoryId,
        startDate,
        endDate,
        paymentStatus,
        page = 1,
        limit = 20,
      } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (vehicleId) {
        whereClause += ` AND vehicle_id = $${paramIndex++}`;
        queryParams.push(vehicleId);
      }

      if (costType) {
        whereClause += ` AND cost_type = $${paramIndex++}`;
        queryParams.push(costType);
      }

      if (costCategoryId) {
        whereClause += ` AND cost_category_id = $${paramIndex++}`;
        queryParams.push(costCategoryId);
      }

      if (startDate) {
        whereClause += ` AND cost_date >= $${paramIndex++}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND cost_date <= $${paramIndex++}`;
        queryParams.push(endDate);
      }

      if (paymentStatus) {
        whereClause += ` AND payment_status = $${paramIndex++}`;
        queryParams.push(paymentStatus);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM vehicle_costs ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM vehicle_costs
        ${whereClause}
        ORDER BY cost_date DESC, created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        costs: result.map(row => this.mapCostFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取车辆成本记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个成本记录
   */
  async getVehicleCostById(
    tenantId: string,
    costId: string
  ): Promise<VehicleCost | null> {
    try {
      const query = `
        SELECT * FROM vehicle_costs
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, costId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapCostFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取车辆成本记录失败:', error);
      throw error;
    }
  }

  /**
   * 更新车辆成本记录
   */
  async updateVehicleCost(
    tenantId: string,
    costId: string,
    input: UpdateVehicleCostInput
  ): Promise<VehicleCost> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.costCategoryId !== undefined) {
        updateFields.push(`cost_category_id = $${paramIndex++}`);
        values.push(input.costCategoryId);
      }

      if (input.costDate !== undefined) {
        updateFields.push(`cost_date = $${paramIndex++}`);
        values.push(input.costDate);
      }

      if (input.costAmount !== undefined) {
        updateFields.push(`cost_amount = $${paramIndex++}`);
        values.push(input.costAmount);
      }

      if (input.currency !== undefined) {
        updateFields.push(`currency = $${paramIndex++}`);
        values.push(input.currency);
      }

      if (input.costType !== undefined) {
        updateFields.push(`cost_type = $${paramIndex++}`);
        values.push(input.costType);
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (input.mileageAtCost !== undefined) {
        updateFields.push(`mileage_at_cost = $${paramIndex++}`);
        values.push(input.mileageAtCost);
      }

      if (input.quantity !== undefined) {
        updateFields.push(`quantity = $${paramIndex++}`);
        values.push(input.quantity);
      }

      if (input.unitPrice !== undefined) {
        updateFields.push(`unit_price = $${paramIndex++}`);
        values.push(input.unitPrice);
      }

      if (input.unit !== undefined) {
        updateFields.push(`unit = $${paramIndex++}`);
        values.push(input.unit);
      }

      if (input.provider !== undefined) {
        updateFields.push(`provider = $${paramIndex++}`);
        values.push(input.provider);
      }

      if (input.invoiceNumber !== undefined) {
        updateFields.push(`invoice_number = $${paramIndex++}`);
        values.push(input.invoiceNumber);
      }

      if (input.paymentStatus !== undefined) {
        updateFields.push(`payment_status = $${paramIndex++}`);
        values.push(input.paymentStatus);
      }

      if (input.paymentDate !== undefined) {
        updateFields.push(`payment_date = $${paramIndex++}`);
        values.push(input.paymentDate);
      }

      if (input.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(input.notes);
      }

      if (input.attachments !== undefined) {
        updateFields.push(`attachments = $${paramIndex++}`);
        values.push(JSON.stringify(input.attachments));
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
        UPDATE vehicle_costs
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, costId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('成本记录不存在');
      }

      logger.info(`更新车辆成本记录成功: ${costId}`);
      return this.mapCostFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新车辆成本记录失败:', error);
      throw error;
    }
  }

  /**
   * 删除车辆成本记录
   */
  async deleteVehicleCost(
    tenantId: string,
    costId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM vehicle_costs
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, costId]);
      logger.info(`删除车辆成本记录成功: ${costId}`);
      return true;
    } catch (error: any) {
      logger.error('删除车辆成本记录失败:', error);
      throw error;
    }
  }

  /**
   * 获取成本汇总统计
   */
  async getCostSummary(
    tenantId: string,
    params?: {
      vehicleId?: string;
      startDate?: string;
      endDate?: string;
      costType?: string;
    }
  ): Promise<CostSummary> {
    try {
      const { vehicleId, startDate, endDate, costType } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (vehicleId) {
        whereClause += ` AND vehicle_id = $${paramIndex++}`;
        queryParams.push(vehicleId);
      }

      if (startDate) {
        whereClause += ` AND cost_date >= $${paramIndex++}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND cost_date <= $${paramIndex++}`;
        queryParams.push(endDate);
      }

      if (costType) {
        whereClause += ` AND cost_type = $${paramIndex++}`;
        queryParams.push(costType);
      }

      // 总成本
      const totalQuery = `
        SELECT COALESCE(SUM(cost_amount), 0) as total
        FROM vehicle_costs
        ${whereClause}
      `;
      const totalResult = await this.dbService.query(totalQuery, queryParams);
      const totalCost = parseFloat(totalResult[0].total || 0);

      // 按类型汇总
      const typeQuery = `
        SELECT cost_type, COALESCE(SUM(cost_amount), 0) as total
        FROM vehicle_costs
        ${whereClause}
        GROUP BY cost_type
      `;
      const typeResult = await this.dbService.query(typeQuery, queryParams);
      const costByType: Record<string, number> = {};
      typeResult.forEach((row: any) => {
        costByType[row.cost_type] = parseFloat(row.total || 0);
      });

      // 按分类汇总
      const categoryQuery = `
        SELECT cc.category_name, COALESCE(SUM(vc.cost_amount), 0) as total
        FROM vehicle_costs vc
        JOIN cost_categories cc ON vc.cost_category_id = cc.id
        ${whereClause.replace('tenant_id = $1', 'vc.tenant_id = $1')}
        GROUP BY cc.category_name
      `;
      const categoryResult = await this.dbService.query(categoryQuery, queryParams);
      const costByCategory: Record<string, number> = {};
      categoryResult.forEach((row: any) => {
        costByCategory[row.category_name] = parseFloat(row.total || 0);
      });

      // 按车辆汇总
      const vehicleQuery = `
        SELECT vehicle_id, COALESCE(SUM(cost_amount), 0) as total
        FROM vehicle_costs
        ${whereClause}
        GROUP BY vehicle_id
      `;
      const vehicleResult = await this.dbService.query(vehicleQuery, queryParams);
      const costByVehicle: Record<string, number> = {};
      vehicleResult.forEach((row: any) => {
        costByVehicle[row.vehicle_id] = parseFloat(row.total || 0);
      });

      // 按月汇总
      const monthQuery = `
        SELECT TO_CHAR(cost_date, 'YYYY-MM') as month, COALESCE(SUM(cost_amount), 0) as total
        FROM vehicle_costs
        ${whereClause}
        GROUP BY TO_CHAR(cost_date, 'YYYY-MM')
        ORDER BY month ASC
      `;
      const monthResult = await this.dbService.query(monthQuery, queryParams);
      const costByMonth: Record<string, number> = {};
      monthResult.forEach((row: any) => {
        costByMonth[row.month] = parseFloat(row.total || 0);
      });

      return {
        totalCost,
        costByType,
        costByCategory,
        costByVehicle,
        costByMonth,
      };
    } catch (error: any) {
      logger.error('获取成本汇总失败:', error);
      throw error;
    }
  }

  /**
   * 成本对比分析（多车辆对比）
   */
  async compareVehicleCosts(
    tenantId: string,
    vehicleIds: string[],
    startDate?: string,
    endDate?: string
  ): Promise<Record<string, any>> {
    try {
      if (vehicleIds.length === 0) {
        return {};
      }

      let whereClause = 'WHERE tenant_id = $1 AND vehicle_id = ANY($2::uuid[])';
      const queryParams: any[] = [tenantId, vehicleIds];
      let paramIndex = 3;

      if (startDate) {
        whereClause += ` AND cost_date >= $${paramIndex++}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND cost_date <= $${paramIndex++}`;
        queryParams.push(endDate);
      }

      const query = `
        SELECT 
          vehicle_id,
          cost_type,
          COALESCE(SUM(cost_amount), 0) as total_cost,
          COUNT(*) as cost_count
        FROM vehicle_costs
        ${whereClause}
        GROUP BY vehicle_id, cost_type
        ORDER BY vehicle_id, cost_type
      `;

      const result = await this.dbService.query(query, queryParams);
      const comparison: Record<string, any> = {};

      result.forEach((row: any) => {
        const vehicleId = row.vehicle_id;
        if (!comparison[vehicleId]) {
          comparison[vehicleId] = {
            vehicleId,
            totalCost: 0,
            costByType: {},
          };
        }
        comparison[vehicleId].costByType[row.cost_type] = parseFloat(row.total_cost || 0);
        comparison[vehicleId].totalCost += parseFloat(row.total_cost || 0);
      });

      return comparison;
    } catch (error: any) {
      logger.error('成本对比分析失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库行映射到 CostCategory
   */
  private mapCategoryFromDb(row: any): CostCategory {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      categoryCode: row.category_code,
      categoryName: row.category_name,
      categoryType: row.category_type,
      parentCategoryId: row.parent_category_id || undefined,
      description: row.description || undefined,
      isActive: row.is_active,
      sortOrder: row.sort_order,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }

  /**
   * 从数据库行映射到 VehicleCost
   */
  private mapCostFromDb(row: any): VehicleCost {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      costCategoryId: row.cost_category_id,
      costDate: row.cost_date,
      costAmount: parseFloat(row.cost_amount),
      currency: row.currency,
      costType: row.cost_type,
      description: row.description || undefined,
      referenceId: row.reference_id || undefined,
      referenceType: row.reference_type || undefined,
      mileageAtCost: row.mileage_at_cost ? parseFloat(row.mileage_at_cost) : undefined,
      quantity: row.quantity ? parseFloat(row.quantity) : undefined,
      unitPrice: row.unit_price ? parseFloat(row.unit_price) : undefined,
      unit: row.unit || undefined,
      provider: row.provider || undefined,
      invoiceNumber: row.invoice_number || undefined,
      paymentStatus: row.payment_status,
      paymentDate: row.payment_date || undefined,
      notes: row.notes || undefined,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

