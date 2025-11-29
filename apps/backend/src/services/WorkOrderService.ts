// 维修工单管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.1 维护保养完整功能

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface WorkOrder {
  id: string;
  vehicleId: string;
  tenantId: string;
  workOrderNumber: string;
  maintenancePlanId?: string;
  maintenanceRecordId?: string;
  workOrderType: 'routine' | 'repair' | 'inspection' | 'emergency';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  description: string;
  reportedBy?: string;
  assignedTo?: string;
  scheduledDate?: Date | string;
  scheduledTime?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  estimatedDurationHours?: number;
  actualDurationHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  laborCost?: number;
  partsCost?: number;
  diagnosis?: string;
  workPerformed?: string;
  notes?: string;
  attachments?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateWorkOrderInput {
  vehicleId: string;
  maintenancePlanId?: string;
  workOrderType: 'routine' | 'repair' | 'inspection' | 'emergency';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  description: string;
  reportedBy?: string;
  assignedTo?: string;
  scheduledDate?: Date | string;
  scheduledTime?: string;
  estimatedDurationHours?: number;
  estimatedCost?: number;
  notes?: string;
  createdBy?: string;
}

export interface UpdateWorkOrderInput {
  workOrderType?: 'routine' | 'repair' | 'inspection' | 'emergency';
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  status?: 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  description?: string;
  assignedTo?: string;
  scheduledDate?: Date | string;
  scheduledTime?: string;
  startedAt?: Date | string;
  completedAt?: Date | string;
  estimatedDurationHours?: number;
  actualDurationHours?: number;
  estimatedCost?: number;
  actualCost?: number;
  laborCost?: number;
  partsCost?: number;
  diagnosis?: string;
  workPerformed?: string;
  notes?: string;
  attachments?: string[];
  updatedBy?: string;
}

export class WorkOrderService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 生成工单号
   */
  private async generateWorkOrderNumber(tenantId: string): Promise<string> {
    try {
      const year = new Date().getFullYear();
      const month = String(new Date().getMonth() + 1).padStart(2, '0');
      
      // 查询当月已有工单数量
      const query = `
        SELECT COUNT(*) as count FROM maintenance_work_orders
        WHERE tenant_id = $1 AND work_order_number LIKE $2
      `;
      const prefix = `WO${year}${month}`;
      const result = await this.dbService.query(query, [tenantId, `${prefix}%`]);
      const count = parseInt(result[0].count) + 1;
      
      return `${prefix}${String(count).padStart(4, '0')}`;
    } catch (error: any) {
      logger.error('生成工单号失败:', error);
      // 如果生成失败，使用时间戳作为后备方案
      return `WO${Date.now()}`;
    }
  }

  /**
   * 创建维修工单
   */
  async createWorkOrder(
    tenantId: string,
    input: CreateWorkOrderInput
  ): Promise<WorkOrder> {
    try {
      const workOrderNumber = await this.generateWorkOrderNumber(tenantId);

      const query = `
        INSERT INTO maintenance_work_orders (
          vehicle_id, tenant_id, work_order_number, maintenance_plan_id,
          work_order_type, priority, status, description, reported_by,
          assigned_to, scheduled_date, scheduled_time,
          estimated_duration_hours, estimated_cost, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.vehicleId,
        tenantId,
        workOrderNumber,
        input.maintenancePlanId || null,
        input.workOrderType,
        input.priority || 'normal',
        'pending',
        input.description,
        input.reportedBy || null,
        input.assignedTo || null,
        input.scheduledDate || null,
        input.scheduledTime || null,
        input.estimatedDurationHours || null,
        input.estimatedCost || null,
        input.notes || null,
        input.createdBy || null,
      ]);

      const workOrder = this.mapWorkOrderFromDb(result[0]);
      logger.info(`创建维修工单成功: ${workOrder.id} (${workOrder.workOrderNumber})`);
      return workOrder;
    } catch (error: any) {
      logger.error('创建维修工单失败:', error);
      throw error;
    }
  }

  /**
   * 获取车辆的所有工单
   */
  async getWorkOrdersByVehicle(
    tenantId: string,
    vehicleId: string
  ): Promise<WorkOrder[]> {
    try {
      const query = `
        SELECT * FROM maintenance_work_orders
        WHERE tenant_id = $1 AND vehicle_id = $2
        ORDER BY created_at DESC
      `;

      const result = await this.dbService.query(query, [tenantId, vehicleId]);
      return result.map(row => this.mapWorkOrderFromDb(row));
    } catch (error: any) {
      logger.error('获取工单失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有工单（支持筛选）
   */
  async getWorkOrders(
    tenantId: string,
    params?: {
      vehicleId?: string;
      status?: string;
      priority?: string;
      workOrderType?: string;
      assignedTo?: string;
      startDate?: string;
      endDate?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ workOrders: WorkOrder[]; total: number }> {
    try {
      const {
        vehicleId,
        status,
        priority,
        workOrderType,
        assignedTo,
        startDate,
        endDate,
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

      if (status) {
        whereClause += ` AND status = $${paramIndex++}`;
        queryParams.push(status);
      }

      if (priority) {
        whereClause += ` AND priority = $${paramIndex++}`;
        queryParams.push(priority);
      }

      if (workOrderType) {
        whereClause += ` AND work_order_type = $${paramIndex++}`;
        queryParams.push(workOrderType);
      }

      if (assignedTo) {
        whereClause += ` AND assigned_to = $${paramIndex++}`;
        queryParams.push(assignedTo);
      }

      if (startDate) {
        whereClause += ` AND scheduled_date >= $${paramIndex++}`;
        queryParams.push(startDate);
      }

      if (endDate) {
        whereClause += ` AND scheduled_date <= $${paramIndex++}`;
        queryParams.push(endDate);
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM maintenance_work_orders ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM maintenance_work_orders
        ${whereClause}
        ORDER BY 
          CASE priority
            WHEN 'urgent' THEN 1
            WHEN 'high' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'low' THEN 4
          END,
          created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        workOrders: result.map(row => this.mapWorkOrderFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取工单列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个工单
   */
  async getWorkOrderById(
    tenantId: string,
    workOrderId: string
  ): Promise<WorkOrder | null> {
    try {
      const query = `
        SELECT * FROM maintenance_work_orders
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, workOrderId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapWorkOrderFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取工单失败:', error);
      throw error;
    }
  }

  /**
   * 更新工单
   */
  async updateWorkOrder(
    tenantId: string,
    workOrderId: string,
    input: UpdateWorkOrderInput
  ): Promise<WorkOrder> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.workOrderType !== undefined) {
        updateFields.push(`work_order_type = $${paramIndex++}`);
        values.push(input.workOrderType);
      }

      if (input.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        values.push(input.priority);
      }

      if (input.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(input.status);

        // 如果状态变为进行中，记录开始时间
        if (input.status === 'in_progress' && !input.startedAt) {
          updateFields.push(`started_at = CURRENT_TIMESTAMP`);
        }

        // 如果状态变为已完成，记录完成时间
        if (input.status === 'completed' && !input.completedAt) {
          updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
        }
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
      }

      if (input.assignedTo !== undefined) {
        updateFields.push(`assigned_to = $${paramIndex++}`);
        values.push(input.assignedTo);
      }

      if (input.scheduledDate !== undefined) {
        updateFields.push(`scheduled_date = $${paramIndex++}`);
        values.push(input.scheduledDate);
      }

      if (input.scheduledTime !== undefined) {
        updateFields.push(`scheduled_time = $${paramIndex++}`);
        values.push(input.scheduledTime);
      }

      if (input.startedAt !== undefined) {
        updateFields.push(`started_at = $${paramIndex++}`);
        values.push(input.startedAt);
      }

      if (input.completedAt !== undefined) {
        updateFields.push(`completed_at = $${paramIndex++}`);
        values.push(input.completedAt);
      }

      if (input.estimatedDurationHours !== undefined) {
        updateFields.push(`estimated_duration_hours = $${paramIndex++}`);
        values.push(input.estimatedDurationHours);
      }

      if (input.actualDurationHours !== undefined) {
        updateFields.push(`actual_duration_hours = $${paramIndex++}`);
        values.push(input.actualDurationHours);
      }

      if (input.estimatedCost !== undefined) {
        updateFields.push(`estimated_cost = $${paramIndex++}`);
        values.push(input.estimatedCost);
      }

      if (input.actualCost !== undefined) {
        updateFields.push(`actual_cost = $${paramIndex++}`);
        values.push(input.actualCost);
      }

      if (input.laborCost !== undefined) {
        updateFields.push(`labor_cost = $${paramIndex++}`);
        values.push(input.laborCost);
      }

      if (input.partsCost !== undefined) {
        updateFields.push(`parts_cost = $${paramIndex++}`);
        values.push(input.partsCost);
      }

      if (input.diagnosis !== undefined) {
        updateFields.push(`diagnosis = $${paramIndex++}`);
        values.push(input.diagnosis);
      }

      if (input.workPerformed !== undefined) {
        updateFields.push(`work_performed = $${paramIndex++}`);
        values.push(input.workPerformed);
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
        UPDATE maintenance_work_orders
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, workOrderId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('工单不存在');
      }

      logger.info(`更新工单成功: ${workOrderId}`);
      return this.mapWorkOrderFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新工单失败:', error);
      throw error;
    }
  }

  /**
   * 删除工单
   */
  async deleteWorkOrder(
    tenantId: string,
    workOrderId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM maintenance_work_orders
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, workOrderId]);
      logger.info(`删除工单成功: ${workOrderId}`);
      return true;
    } catch (error: any) {
      logger.error('删除工单失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库行映射到 WorkOrder
   */
  private mapWorkOrderFromDb(row: any): WorkOrder {
    return {
      id: row.id,
      vehicleId: row.vehicle_id,
      tenantId: row.tenant_id,
      workOrderNumber: row.work_order_number,
      maintenancePlanId: row.maintenance_plan_id || undefined,
      maintenanceRecordId: row.maintenance_record_id || undefined,
      workOrderType: row.work_order_type,
      priority: row.priority,
      status: row.status,
      description: row.description,
      reportedBy: row.reported_by || undefined,
      assignedTo: row.assigned_to || undefined,
      scheduledDate: row.scheduled_date || undefined,
      scheduledTime: row.scheduled_time || undefined,
      startedAt: row.started_at || undefined,
      completedAt: row.completed_at || undefined,
      estimatedDurationHours: row.estimated_duration_hours
        ? parseFloat(row.estimated_duration_hours)
        : undefined,
      actualDurationHours: row.actual_duration_hours
        ? parseFloat(row.actual_duration_hours)
        : undefined,
      estimatedCost: row.estimated_cost ? parseFloat(row.estimated_cost) : undefined,
      actualCost: row.actual_cost ? parseFloat(row.actual_cost) : undefined,
      laborCost: row.labor_cost ? parseFloat(row.labor_cost) : undefined,
      partsCost: row.parts_cost ? parseFloat(row.parts_cost) : undefined,
      diagnosis: row.diagnosis || undefined,
      workPerformed: row.work_performed || undefined,
      notes: row.notes || undefined,
      attachments: row.attachments ? JSON.parse(row.attachments) : [],
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

