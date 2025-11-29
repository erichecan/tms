// 司机排班管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface DriverSchedule {
  id: string;
  driverId: string;
  tenantId: string;
  scheduleDate: Date | string;
  shiftType: 'day' | 'night' | 'overtime' | 'on_call' | 'off';
  startTime: string; // TIME 格式
  endTime: string; // TIME 格式
  plannedHours?: number;
  actualHours?: number;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'absent';
  notes?: string;
  customFields?: Record<string, any>; // 2025-11-29T11:25:04Z 自定义字段
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateDriverScheduleInput {
  driverId: string;
  scheduleDate: Date | string;
  shiftType: 'day' | 'night' | 'overtime' | 'on_call' | 'off';
  startTime: string;
  endTime: string;
  plannedHours?: number;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'absent';
  notes?: string;
  customFields?: Record<string, any>; // 2025-11-29T11:25:04Z 自定义字段
  createdBy?: string;
}

export interface UpdateDriverScheduleInput {
  scheduleDate?: Date | string;
  shiftType?: 'day' | 'night' | 'overtime' | 'on_call' | 'off';
  startTime?: string;
  endTime?: string;
  plannedHours?: number;
  actualHours?: number;
  status?: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'absent';
  notes?: string;
  customFields?: Record<string, any>; // 2025-11-29T11:25:04Z 自定义字段
  updatedBy?: string;
}

export class DriverScheduleService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建排班记录
   */
  async createSchedule(
    tenantId: string,
    input: CreateDriverScheduleInput
  ): Promise<DriverSchedule> {
    try {
      const query = `
        INSERT INTO driver_schedules (
          driver_id, tenant_id, schedule_date, shift_type, start_time, end_time,
          planned_hours, status, notes, custom_fields, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        input.driverId,
        tenantId,
        input.scheduleDate,
        input.shiftType,
        input.startTime,
        input.endTime,
        input.plannedHours || null,
        input.status || 'scheduled',
        input.notes || null,
        input.customFields ? JSON.stringify(input.customFields) : '{}',
        input.createdBy || null
      ]);

      return this.mapScheduleFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create driver schedule:', error);
      throw error;
    }
  }

  /**
   * 获取司机的排班记录
   */
  async getSchedulesByDriver(
    tenantId: string,
    driverId: string,
    startDate?: Date | string,
    endDate?: Date | string
  ): Promise<DriverSchedule[]> {
    try {
      let query = `
        SELECT * FROM driver_schedules
        WHERE tenant_id = $1 AND driver_id = $2
      `;
      const values: any[] = [tenantId, driverId];

      if (startDate) {
        query += ` AND schedule_date >= $${values.length + 1}`;
        values.push(startDate);
      }
      if (endDate) {
        query += ` AND schedule_date <= $${values.length + 1}`;
        values.push(endDate);
      }

      query += ` ORDER BY schedule_date DESC, start_time ASC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapScheduleFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get driver schedules:', error);
      throw error;
    }
  }

  /**
   * 获取某日期的所有排班
   */
  async getSchedulesByDate(
    tenantId: string,
    scheduleDate: Date | string
  ): Promise<DriverSchedule[]> {
    try {
      const query = `
        SELECT ds.*, d.name as driver_name, d.phone as driver_phone
        FROM driver_schedules ds
        JOIN drivers d ON ds.driver_id = d.id
        WHERE ds.tenant_id = $1 AND ds.schedule_date = $2
        ORDER BY ds.start_time ASC
      `;

      const result = await this.dbService.query(query, [tenantId, scheduleDate]);
      return result.map(row => this.mapScheduleFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get schedules by date:', error);
      throw error;
    }
  }

  /**
   * 更新排班记录
   */
  async updateSchedule(
    tenantId: string,
    scheduleId: string,
    input: UpdateDriverScheduleInput
  ): Promise<DriverSchedule> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.scheduleDate !== undefined) {
        updateFields.push(`schedule_date = $${paramIndex++}`);
        values.push(input.scheduleDate);
      }
      if (input.shiftType !== undefined) {
        updateFields.push(`shift_type = $${paramIndex++}`);
        values.push(input.shiftType);
      }
      if (input.startTime !== undefined) {
        updateFields.push(`start_time = $${paramIndex++}`);
        values.push(input.startTime);
      }
      if (input.endTime !== undefined) {
        updateFields.push(`end_time = $${paramIndex++}`);
        values.push(input.endTime);
      }
      if (input.plannedHours !== undefined) {
        updateFields.push(`planned_hours = $${paramIndex++}`);
        values.push(input.plannedHours || null);
      }
      if (input.actualHours !== undefined) {
        updateFields.push(`actual_hours = $${paramIndex++}`);
        values.push(input.actualHours || null);
      }
      if (input.status !== undefined) {
        updateFields.push(`status = $${paramIndex++}`);
        values.push(input.status);
      }
      if (input.notes !== undefined) {
        updateFields.push(`notes = $${paramIndex++}`);
        values.push(input.notes || null);
      }
      if (input.customFields !== undefined) {
        updateFields.push(`custom_fields = $${paramIndex++}`);
        values.push(JSON.stringify(input.customFields || {}));
      }
      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy || null);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(tenantId, scheduleId);

      const query = `
        UPDATE driver_schedules
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Schedule not found');
      }

      return this.mapScheduleFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update driver schedule:', error);
      throw error;
    }
  }

  /**
   * 删除排班记录
   */
  async deleteSchedule(
    tenantId: string,
    scheduleId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM driver_schedules
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, scheduleId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete driver schedule:', error);
      throw error;
    }
  }

  /**
   * 检查司机工时是否超限（疲劳驾驶预警）
   */
  async checkWorkHoursLimit(
    tenantId: string,
    driverId: string,
    date: Date | string
  ): Promise<{ withinLimit: boolean; totalHours: number; limit: number }> {
    try {
      // 获取当天的所有排班
      const schedules = await this.getSchedulesByDriver(tenantId, driverId, date, date);
      
      // 计算总工时（使用实际工时或计划工时）
      const totalHours = schedules.reduce((sum, schedule) => {
        return sum + (schedule.actualHours || schedule.plannedHours || 0);
      }, 0);

      // 默认工时上限为12小时（可根据租户配置调整）
      const limit = 12;

      return {
        withinLimit: totalHours <= limit,
        totalHours,
        limit
      };
    } catch (error: any) {
      logger.error('Failed to check work hours limit:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapScheduleFromDb(row: any): DriverSchedule {
    // 解析 custom_fields JSONB 字段
    let customFields: Record<string, any> = {};
    if (row.custom_fields) {
      if (typeof row.custom_fields === 'string') {
        try {
          customFields = JSON.parse(row.custom_fields);
        } catch (e) {
          logger.warn('Failed to parse custom_fields JSON:', e);
        }
      } else {
        customFields = row.custom_fields;
      }
    }

    return {
      id: row.id,
      driverId: row.driver_id,
      tenantId: row.tenant_id,
      scheduleDate: row.schedule_date,
      shiftType: row.shift_type,
      startTime: row.start_time,
      endTime: row.end_time,
      plannedHours: row.planned_hours ? parseFloat(row.planned_hours) : undefined,
      actualHours: row.actual_hours ? parseFloat(row.actual_hours) : undefined,
      status: row.status,
      notes: row.notes,
      customFields, // 2025-11-29T11:25:04Z 自定义字段
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

