// 保养计划管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.1 维护保养完整功能

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface MaintenancePlan {
  id: string;
  vehicleId: string;
  tenantId: string;
  planName: string;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'emergency';
  intervalType: 'mileage' | 'time' | 'both';
  intervalMileage?: number;
  intervalMonths?: number;
  estimatedCost?: number;
  description?: string;
  isActive: boolean;
  lastMaintenanceDate?: Date | string;
  lastMaintenanceMileage?: number;
  nextMaintenanceDate?: Date | string;
  nextMaintenanceMileage?: number;
  autoCreateWorkOrder: boolean;
  reminderDaysAhead: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateMaintenancePlanInput {
  vehicleId: string;
  planName: string;
  maintenanceType: 'routine' | 'repair' | 'inspection' | 'emergency';
  intervalType: 'mileage' | 'time' | 'both';
  intervalMileage?: number;
  intervalMonths?: number;
  estimatedCost?: number;
  description?: string;
  isActive?: boolean;
  lastMaintenanceDate?: Date | string;
  lastMaintenanceMileage?: number;
  autoCreateWorkOrder?: boolean;
  reminderDaysAhead?: number;
  notes?: string;
  createdBy?: string;
}

export interface UpdateMaintenancePlanInput {
  planName?: string;
  maintenanceType?: 'routine' | 'repair' | 'inspection' | 'emergency';
  intervalType?: 'mileage' | 'time' | 'both';
  intervalMileage?: number;
  intervalMonths?: number;
  estimatedCost?: number;
  description?: string;
  isActive?: boolean;
  lastMaintenanceDate?: Date | string;
  lastMaintenanceMileage?: number;
  nextMaintenanceDate?: Date | string;
  nextMaintenanceMileage?: number;
  autoCreateWorkOrder?: boolean;
  reminderDaysAhead?: number;
  notes?: string;
  updatedBy?: string;
}

export class MaintenancePlanService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建保养计划
   */
  async createMaintenancePlan(
    tenantId: string,
    input: CreateMaintenancePlanInput
  ): Promise<MaintenancePlan> {
    try {
      // 计算下次维护日期和里程
      const nextMaintenance = this.calculateNextMaintenance(input);

      const query = `
        INSERT INTO maintenance_plans (
          vehicle_id, tenant_id, plan_name, maintenance_type, interval_type,
          interval_mileage, interval_months, estimated_cost, description,
          is_active, last_maintenance_date, last_maintenance_mileage,
          next_maintenance_date, next_maintenance_mileage,
          auto_create_work_order, reminder_days_ahead, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        input.planName,
        input.maintenanceType,
        input.intervalType,
        input.intervalMileage || null,
        input.intervalMonths || null,
        input.estimatedCost || null,
        input.description || null,
        input.isActive !== false,
        input.lastMaintenanceDate || null,
        input.lastMaintenanceMileage || null,
        nextMaintenance.nextMaintenanceDate || null,
        nextMaintenance.nextMaintenanceMileage || null,
        input.autoCreateWorkOrder || false,
        input.reminderDaysAhead || 7,
        input.notes || null,
        input.createdBy || null,
      ]);

      const plan = this.mapPlanFromDb(result[0]);
      logger.info(`创建保养计划成功: ${plan.id}`);
      return plan;
    } catch (error: any) {
      logger.error('创建保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有保养计划
   */
  async getMaintenancePlansByVehicle(
    tenantId: string,
    vehicleId: string,
    isActive?: boolean
  ): Promise<MaintenancePlan[]> {
    try {
      let query = `
        SELECT * FROM maintenance_plans
        WHERE tenant_id = $1 AND vehicle_id = $2
      `;
      const params: any[] = [tenantId, vehicleId];

      if (isActive !== undefined) {
        query += ` AND is_active = $3`;
        params.push(isActive);
      }

      query += ` ORDER BY created_at DESC`;

      const result = await this.dbService.query(query, params);
      return result.map(row => this.mapPlanFromDb(row));
    } catch (error: any) {
      logger.error('获取保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有保养计划
   */
  async getMaintenancePlans(
    tenantId: string,
    params?: {
      vehicleId?: string;
      isActive?: boolean;
      page?: number;
      limit?: number;
    }
  ): Promise<{ plans: MaintenancePlan[]; total: number }> {
    try {
      const { vehicleId, isActive, page = 1, limit = 20 } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (vehicleId) {
        whereClause += ` AND vehicle_id = $${paramIndex++}`;
        queryParams.push(vehicleId);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM maintenance_plans ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM maintenance_plans
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        plans: result.map(row => this.mapPlanFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取保养计划列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个保养计划
   */
  async getMaintenancePlanById(
    tenantId: string,
    planId: string
  ): Promise<MaintenancePlan | null> {
    try {
      const query = `
        SELECT * FROM maintenance_plans
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, planId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapPlanFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 更新保养计划
   */
  async updateMaintenancePlan(
    tenantId: string,
    planId: string,
    input: UpdateMaintenancePlanInput
  ): Promise<MaintenancePlan> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.planName !== undefined) {
        updateFields.push(`plan_name = $${paramIndex++}`);
        values.push(input.planName);
      }

      if (input.maintenanceType !== undefined) {
        updateFields.push(`maintenance_type = $${paramIndex++}`);
        values.push(input.maintenanceType);
      }

      if (input.intervalType !== undefined) {
        updateFields.push(`interval_type = $${paramIndex++}`);
        values.push(input.intervalType);
      }

      if (input.intervalMileage !== undefined) {
        updateFields.push(`interval_mileage = $${paramIndex++}`);
        values.push(input.intervalMileage);
      }

      if (input.intervalMonths !== undefined) {
        updateFields.push(`interval_months = $${paramIndex++}`);
        values.push(input.intervalMonths);
      }

      if (input.estimatedCost !== undefined) {
        updateFields.push(`estimated_cost = $${paramIndex++}`);
        values.push(input.estimatedCost);
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (input.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
      }

      if (input.lastMaintenanceDate !== undefined) {
        updateFields.push(`last_maintenance_date = $${paramIndex++}`);
        values.push(input.lastMaintenanceDate);
      }

      if (input.lastMaintenanceMileage !== undefined) {
        updateFields.push(`last_maintenance_mileage = $${paramIndex++}`);
        values.push(input.lastMaintenanceMileage);
      }

      if (input.nextMaintenanceDate !== undefined) {
        updateFields.push(`next_maintenance_date = $${paramIndex++}`);
        values.push(input.nextMaintenanceDate);
      }

      if (input.nextMaintenanceMileage !== undefined) {
        updateFields.push(`next_maintenance_mileage = $${paramIndex++}`);
        values.push(input.nextMaintenanceMileage);
      }

      if (input.autoCreateWorkOrder !== undefined) {
        updateFields.push(`auto_create_work_order = $${paramIndex++}`);
        values.push(input.autoCreateWorkOrder);
      }

      if (input.reminderDaysAhead !== undefined) {
        updateFields.push(`reminder_days_ahead = $${paramIndex++}`);
        values.push(input.reminderDaysAhead);
      }

      if (input.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(input.notes);
      }

      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy);
      }

      if (updateFields.length === 0) {
        throw new Error('没有要更新的字段');
      }

      // 如果更新了间隔设置，重新计算下次维护
      if (input.intervalType !== undefined || input.intervalMileage !== undefined || input.intervalMonths !== undefined) {
        const currentPlan = await this.getMaintenancePlanById(tenantId, planId);
        if (currentPlan) {
          const nextMaintenance = this.calculateNextMaintenance({
            ...currentPlan,
            ...input,
          });
          if (nextMaintenance.nextMaintenanceDate) {
            updateFields.push(`next_maintenance_date = $${paramIndex++}`);
            values.push(nextMaintenance.nextMaintenanceDate);
          }
          if (nextMaintenance.nextMaintenanceMileage) {
            updateFields.push(`next_maintenance_mileage = $${paramIndex++}`);
            values.push(nextMaintenance.nextMaintenanceMileage);
          }
        }
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE maintenance_plans
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, planId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('保养计划不存在');
      }

      logger.info(`更新保养计划成功: ${planId}`);
      return this.mapPlanFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 删除保养计划
   */
  async deleteMaintenancePlan(
    tenantId: string,
    planId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM maintenance_plans
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, planId]);
      logger.info(`删除保养计划成功: ${planId}`);
      return true;
    } catch (error: any) {
      logger.error('删除保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 获取即将到期的保养计划
   */
  async getUpcomingMaintenancePlans(
    tenantId: string,
    daysAhead: number = 30
  ): Promise<MaintenancePlan[]> {
    try {
      const query = `
        SELECT * FROM maintenance_plans
        WHERE tenant_id = $1
          AND is_active = TRUE
          AND (
            (next_maintenance_date IS NOT NULL AND next_maintenance_date <= CURRENT_DATE + INTERVAL '${daysAhead} days')
            OR (next_maintenance_mileage IS NOT NULL)
          )
        ORDER BY next_maintenance_date ASC NULLS LAST
      `;

      const result = await this.dbService.query(query, [tenantId]);
      return result.map(row => this.mapPlanFromDb(row));
    } catch (error: any) {
      logger.error('获取即将到期保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 执行保养计划（更新最后执行时间和计算下次维护）
   */
  async executeMaintenancePlan(
    tenantId: string,
    planId: string,
    executionDate: Date | string,
    executionMileage?: number
  ): Promise<MaintenancePlan> {
    try {
      const plan = await this.getMaintenancePlanById(tenantId, planId);
      if (!plan) {
        throw new Error('保养计划不存在');
      }

      // 计算下次维护
      const nextMaintenance = this.calculateNextMaintenance({
        ...plan,
        lastMaintenanceDate: executionDate,
        lastMaintenanceMileage: executionMileage,
      });

      return await this.updateMaintenancePlan(tenantId, planId, {
        lastMaintenanceDate: executionDate,
        lastMaintenanceMileage: executionMileage,
        nextMaintenanceDate: nextMaintenance.nextMaintenanceDate,
        nextMaintenanceMileage: nextMaintenance.nextMaintenanceMileage,
      });
    } catch (error: any) {
      logger.error('执行保养计划失败:', error);
      throw error;
    }
  }

  /**
   * 计算下次维护日期和里程
   */
  private calculateNextMaintenance(input: {
    intervalType: 'mileage' | 'time' | 'both';
    intervalMileage?: number;
    intervalMonths?: number;
    lastMaintenanceDate?: Date | string;
    lastMaintenanceMileage?: number;
  }): {
    nextMaintenanceDate?: Date | string;
    nextMaintenanceMileage?: number;
  } {
    const result: {
      nextMaintenanceDate?: Date | string;
      nextMaintenanceMileage?: number;
    } = {};

    if (input.intervalType === 'mileage' || input.intervalType === 'both') {
      if (input.intervalMileage && input.lastMaintenanceMileage !== undefined) {
        result.nextMaintenanceMileage = input.lastMaintenanceMileage + input.intervalMileage;
      }
    }

    if (input.intervalType === 'time' || input.intervalType === 'both') {
      if (input.intervalMonths && input.lastMaintenanceDate) {
        const lastDate = new Date(input.lastMaintenanceDate);
        const nextDate = new Date(lastDate);
        nextDate.setMonth(nextDate.getMonth() + input.intervalMonths);
        result.nextMaintenanceDate = nextDate.toISOString().split('T')[0];
      }
    }

    return result;
  }

  /**
   * 从数据库行映射到 MaintenancePlan
   */
  private mapPlanFromDb(row: any): MaintenancePlan {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      planName: row.plan_name,
      maintenanceType: row.maintenance_type,
      intervalType: row.interval_type,
      intervalMileage: row.interval_mileage ? parseFloat(row.interval_mileage) : undefined,
      intervalMonths: row.interval_months || undefined,
      estimatedCost: row.estimated_cost ? parseFloat(row.estimated_cost) : undefined,
      description: row.description || undefined,
      isActive: row.is_active,
      lastMaintenanceDate: row.last_maintenance_date || undefined,
      lastMaintenanceMileage: row.last_maintenance_mileage
        ? parseFloat(row.last_maintenance_mileage)
        : undefined,
      nextMaintenanceDate: row.next_maintenance_date || undefined,
      nextMaintenanceMileage: row.next_maintenance_mileage
        ? parseFloat(row.next_maintenance_mileage)
        : undefined,
      autoCreateWorkOrder: row.auto_create_work_order,
      reminderDaysAhead: row.reminder_days_ahead,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

