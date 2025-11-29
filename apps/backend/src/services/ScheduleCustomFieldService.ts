// 排班自定义字段定义服务
// 创建时间: 2025-11-29T11:25:04Z
// 产品需求：排班管理支持自定义字段

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface ScheduleCustomFieldDefinition {
  id: string;
  tenantId: string;
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'time' | 'list' | 'phone' | 'textarea';
  fieldOptions?: string[];
  isRequired: boolean;
  defaultValue?: any;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateScheduleCustomFieldDefinitionInput {
  fieldKey: string;
  fieldLabel: string;
  fieldType: 'text' | 'number' | 'date' | 'time' | 'list' | 'phone' | 'textarea';
  fieldOptions?: string[];
  isRequired?: boolean;
  defaultValue?: any;
  sortOrder?: number;
  isActive?: boolean;
  createdBy?: string;
}

export interface UpdateScheduleCustomFieldDefinitionInput {
  fieldLabel?: string;
  fieldType?: 'text' | 'number' | 'date' | 'time' | 'list' | 'phone' | 'textarea';
  fieldOptions?: string[];
  isRequired?: boolean;
  defaultValue?: any;
  sortOrder?: number;
  isActive?: boolean;
  updatedBy?: string;
}

export class ScheduleCustomFieldService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 获取租户的所有自定义字段定义
   */
  async getFieldDefinitions(tenantId: string, activeOnly: boolean = false): Promise<ScheduleCustomFieldDefinition[]> {
    try {
      let query = `
        SELECT * FROM schedule_custom_field_definitions
        WHERE tenant_id = $1
      `;
      const values: any[] = [tenantId];

      if (activeOnly) {
        query += ` AND is_active = true`;
      }

      query += ` ORDER BY sort_order ASC, created_at ASC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get schedule custom field definitions:', error);
      throw error;
    }
  }

  /**
   * 获取单个字段定义
   */
  async getFieldDefinition(tenantId: string, fieldId: string): Promise<ScheduleCustomFieldDefinition | null> {
    try {
      const query = `
        SELECT * FROM schedule_custom_field_definitions
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, fieldId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to get schedule custom field definition:', error);
      throw error;
    }
  }

  /**
   * 根据字段键名获取字段定义
   */
  async getFieldDefinitionByKey(tenantId: string, fieldKey: string): Promise<ScheduleCustomFieldDefinition | null> {
    try {
      const query = `
        SELECT * FROM schedule_custom_field_definitions
        WHERE tenant_id = $1 AND field_key = $2
      `;

      const result = await this.dbService.query(query, [tenantId, fieldKey]);
      if (result.length === 0) {
        return null;
      }

      return this.mapFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to get schedule custom field definition by key:', error);
      throw error;
    }
  }

  /**
   * 创建字段定义
   */
  async createFieldDefinition(
    tenantId: string,
    input: CreateScheduleCustomFieldDefinitionInput
  ): Promise<ScheduleCustomFieldDefinition> {
    try {
      const query = `
        INSERT INTO schedule_custom_field_definitions (
          tenant_id, field_key, field_label, field_type, field_options,
          is_required, default_value, sort_order, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.fieldKey,
        input.fieldLabel,
        input.fieldType,
        input.fieldOptions ? JSON.stringify(input.fieldOptions) : null,
        input.isRequired || false,
        input.defaultValue ? JSON.stringify(input.defaultValue) : null,
        input.sortOrder || 0,
        input.isActive !== undefined ? input.isActive : true,
        input.createdBy || null
      ]);

      return this.mapFromDb(result[0]);
    } catch (error: any) {
      if (error.code === '23505') { // Unique violation
        throw new Error(`字段键名 "${input.fieldKey}" 已存在`);
      }
      logger.error('Failed to create schedule custom field definition:', error);
      throw error;
    }
  }

  /**
   * 更新字段定义
   */
  async updateFieldDefinition(
    tenantId: string,
    fieldId: string,
    input: UpdateScheduleCustomFieldDefinitionInput
  ): Promise<ScheduleCustomFieldDefinition> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.fieldLabel !== undefined) {
        updateFields.push(`field_label = $${paramIndex++}`);
        values.push(input.fieldLabel);
      }
      if (input.fieldType !== undefined) {
        updateFields.push(`field_type = $${paramIndex++}`);
        values.push(input.fieldType);
      }
      if (input.fieldOptions !== undefined) {
        updateFields.push(`field_options = $${paramIndex++}`);
        values.push(input.fieldOptions ? JSON.stringify(input.fieldOptions) : null);
      }
      if (input.isRequired !== undefined) {
        updateFields.push(`is_required = $${paramIndex++}`);
        values.push(input.isRequired);
      }
      if (input.defaultValue !== undefined) {
        updateFields.push(`default_value = $${paramIndex++}`);
        values.push(input.defaultValue ? JSON.stringify(input.defaultValue) : null);
      }
      if (input.sortOrder !== undefined) {
        updateFields.push(`sort_order = $${paramIndex++}`);
        values.push(input.sortOrder);
      }
      if (input.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
      }
      if (input.updatedBy !== undefined) {
        updateFields.push(`updated_by = $${paramIndex++}`);
        values.push(input.updatedBy || null);
      }

      if (updateFields.length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(tenantId, fieldId);

      const query = `
        UPDATE schedule_custom_field_definitions
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Field definition not found');
      }

      return this.mapFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update schedule custom field definition:', error);
      throw error;
    }
  }

  /**
   * 删除字段定义
   */
  async deleteFieldDefinition(tenantId: string, fieldId: string): Promise<boolean> {
    try {
      const query = `
        DELETE FROM schedule_custom_field_definitions
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, fieldId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete schedule custom field definition:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapFromDb(row: any): ScheduleCustomFieldDefinition {
    let fieldOptions: string[] | undefined;
    if (row.field_options) {
      if (typeof row.field_options === 'string') {
        try {
          fieldOptions = JSON.parse(row.field_options);
        } catch (e) {
          logger.warn('Failed to parse field_options JSON:', e);
        }
      } else {
        fieldOptions = row.field_options;
      }
    }

    let defaultValue: any;
    if (row.default_value) {
      if (typeof row.default_value === 'string') {
        try {
          defaultValue = JSON.parse(row.default_value);
        } catch (e) {
          defaultValue = row.default_value;
        }
      } else {
        defaultValue = row.default_value;
      }
    }

    return {
      id: row.id,
      tenantId: row.tenant_id,
      fieldKey: row.field_key,
      fieldLabel: row.field_label,
      fieldType: row.field_type,
      fieldOptions,
      isRequired: row.is_required,
      defaultValue,
      sortOrder: row.sort_order,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by
    };
  }
}

