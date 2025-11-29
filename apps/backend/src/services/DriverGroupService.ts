// 司机班组管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface DriverGroup {
  id: string;
  tenantId: string;
  name: string;
  code?: string;
  groupType?: 'region' | 'route' | 'cargo_type' | 'shift' | 'other';
  leaderId?: string;
  region?: string;
  description?: string;
  status: 'active' | 'inactive';
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
  memberCount?: number; // 成员数量（计算字段）
}

export interface DriverGroupMember {
  id: string;
  driverId: string;
  groupId: string;
  role: 'leader' | 'deputy' | 'member';
  joinedDate: Date | string;
  leftDate?: Date | string;
  status: 'active' | 'inactive';
  createdAt: Date | string;
  updatedAt: Date | string;
  driverName?: string; // 关联查询字段
}

export interface CreateDriverGroupInput {
  name: string;
  code?: string;
  groupType?: 'region' | 'route' | 'cargo_type' | 'shift' | 'other';
  leaderId?: string;
  region?: string;
  description?: string;
  status?: 'active' | 'inactive';
  createdBy?: string;
}

export interface UpdateDriverGroupInput {
  name?: string;
  code?: string;
  groupType?: 'region' | 'route' | 'cargo_type' | 'shift' | 'other';
  leaderId?: string;
  region?: string;
  description?: string;
  status?: 'active' | 'inactive';
  updatedBy?: string;
}

export class DriverGroupService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建班组
   */
  async createGroup(
    tenantId: string,
    input: CreateDriverGroupInput
  ): Promise<DriverGroup> {
    try {
      // 检查班组名称是否已存在
      const existing = await this.dbService.query(
        'SELECT id FROM driver_groups WHERE tenant_id = $1 AND name = $2',
        [tenantId, input.name]
      );

      if (existing.length > 0) {
        throw new Error(`班组名称 "${input.name}" 已存在`);
      }

      const query = `
        INSERT INTO driver_groups (
          tenant_id, name, code, group_type, leader_id, region, description, status, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.name,
        input.code || null,
        input.groupType || null,
        input.leaderId || null,
        input.region || null,
        input.description || null,
        input.status || 'active',
        input.createdBy || null
      ]);

      return this.mapGroupFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to create driver group:', error);
      throw error;
    }
  }

  /**
   * 获取所有班组
   */
  async getGroups(
    tenantId: string,
    status?: 'active' | 'inactive'
  ): Promise<DriverGroup[]> {
    try {
      let query = `
        SELECT dg.*, COUNT(dgm.id) as member_count
        FROM driver_groups dg
        LEFT JOIN driver_group_members dgm ON dg.id = dgm.group_id AND dgm.status = 'active'
        WHERE dg.tenant_id = $1
      `;
      const values: any[] = [tenantId];

      if (status) {
        query += ` AND dg.status = $2`;
        values.push(status);
      }

      query += ` GROUP BY dg.id ORDER BY dg.created_at DESC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapGroupFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get driver groups:', error);
      throw error;
    }
  }

  /**
   * 获取单个班组详情
   */
  async getGroupById(
    tenantId: string,
    groupId: string
  ): Promise<DriverGroup | null> {
    try {
      const query = `
        SELECT dg.*, COUNT(dgm.id) as member_count
        FROM driver_groups dg
        LEFT JOIN driver_group_members dgm ON dg.id = dgm.group_id AND dgm.status = 'active'
        WHERE dg.tenant_id = $1 AND dg.id = $2
        GROUP BY dg.id
      `;

      const result = await this.dbService.query(query, [tenantId, groupId]);
      return result.length > 0 ? this.mapGroupFromDb(result[0]) : null;
    } catch (error: any) {
      logger.error('Failed to get driver group:', error);
      throw error;
    }
  }

  /**
   * 更新班组信息
   */
  async updateGroup(
    tenantId: string,
    groupId: string,
    input: UpdateDriverGroupInput
  ): Promise<DriverGroup> {
    try {
      // 如果更新名称，检查是否冲突
      if (input.name !== undefined) {
        const existing = await this.dbService.query(
          'SELECT id FROM driver_groups WHERE tenant_id = $1 AND name = $2 AND id != $3',
          [tenantId, input.name, groupId]
        );

        if (existing.length > 0) {
          throw new Error(`班组名称 "${input.name}" 已被其他班组使用`);
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
      if (input.groupType !== undefined) {
        updateFields.push(`group_type = $${paramIndex++}`);
        values.push(input.groupType || null);
      }
      if (input.leaderId !== undefined) {
        updateFields.push(`leader_id = $${paramIndex++}`);
        values.push(input.leaderId || null);
      }
      if (input.region !== undefined) {
        updateFields.push(`region = $${paramIndex++}`);
        values.push(input.region || null);
      }
      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description || null);
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
      values.push(tenantId, groupId);

      const query = `
        UPDATE driver_groups
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('Group not found');
      }

      return this.mapGroupFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to update driver group:', error);
      throw error;
    }
  }

  /**
   * 删除班组
   */
  async deleteGroup(
    tenantId: string,
    groupId: string
  ): Promise<boolean> {
    try {
      // 检查是否有活跃成员
      const members = await this.dbService.query(
        'SELECT id FROM driver_group_members WHERE group_id = $1 AND status = $2',
        [groupId, 'active']
      );

      if (members.length > 0) {
        throw new Error('班组中还有活跃成员，无法删除');
      }

      const query = `
        DELETE FROM driver_groups
        WHERE tenant_id = $1 AND id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [tenantId, groupId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to delete driver group:', error);
      throw error;
    }
  }

  /**
   * 添加司机到班组
   */
  async addMember(
    tenantId: string,
    groupId: string,
    driverId: string,
    role: 'leader' | 'deputy' | 'member' = 'member'
  ): Promise<DriverGroupMember> {
    try {
      // 检查司机是否已在其他活跃班组中
      const existing = await this.dbService.query(
        `SELECT id FROM driver_group_members 
         WHERE driver_id = $1 AND status = 'active' AND group_id != $2`,
        [driverId, groupId]
      );

      if (existing.length > 0) {
        throw new Error('司机已在其他班组中，请先移除');
      }

      // 如果设置为班长，检查是否已有班长
      if (role === 'leader') {
        const existingLeader = await this.dbService.query(
          'SELECT id FROM driver_group_members WHERE group_id = $1 AND role = $2 AND status = $3',
          [groupId, 'leader', 'active']
        );

        if (existingLeader.length > 0) {
          throw new Error('班组中已有班长，请先移除或更改角色');
        }
      }

      const query = `
        INSERT INTO driver_group_members (driver_id, group_id, role, status)
        VALUES ($1, $2, $3, 'active')
        ON CONFLICT (driver_id, group_id) 
        DO UPDATE SET role = $3, status = 'active', joined_date = CURRENT_DATE, left_date = NULL
        RETURNING *
      `;

      const result = await this.dbService.query(query, [driverId, groupId, role]);
      return this.mapMemberFromDb(result[0]);
    } catch (error: any) {
      logger.error('Failed to add group member:', error);
      throw error;
    }
  }

  /**
   * 从班组移除司机
   */
  async removeMember(
    tenantId: string,
    groupId: string,
    driverId: string
  ): Promise<boolean> {
    try {
      const query = `
        UPDATE driver_group_members
        SET status = 'inactive', left_date = CURRENT_DATE
        WHERE group_id = $1 AND driver_id = $2
        RETURNING id
      `;

      const result = await this.dbService.query(query, [groupId, driverId]);
      return result.length > 0;
    } catch (error: any) {
      logger.error('Failed to remove group member:', error);
      throw error;
    }
  }

  /**
   * 获取班组成员列表
   */
  async getGroupMembers(
    tenantId: string,
    groupId: string,
    status?: 'active' | 'inactive'
  ): Promise<DriverGroupMember[]> {
    try {
      let query = `
        SELECT dgm.*, d.name as driver_name
        FROM driver_group_members dgm
        JOIN drivers d ON dgm.driver_id = d.id
        WHERE dgm.group_id = $1 AND d.tenant_id = $2
      `;
      const values: any[] = [groupId, tenantId];

      if (status) {
        query += ` AND dgm.status = $3`;
        values.push(status);
      }

      query += ` ORDER BY dgm.role, dgm.joined_date DESC`;

      const result = await this.dbService.query(query, values);
      return result.map(row => this.mapMemberFromDb(row));
    } catch (error: any) {
      logger.error('Failed to get group members:', error);
      throw error;
    }
  }

  /**
   * 映射数据库记录到接口
   */
  private mapGroupFromDb(row: any): DriverGroup {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      name: row.name,
      code: row.code,
      groupType: row.group_type,
      leaderId: row.leader_id,
      region: row.region,
      description: row.description,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      memberCount: row.member_count ? parseInt(row.member_count, 10) : 0
    };
  }

  private mapMemberFromDb(row: any): DriverGroupMember {
    return {
      id: row.id,
      driverId: row.driver_id,
      groupId: row.group_id,
      role: row.role,
      joinedDate: row.joined_date,
      leftDate: row.left_date,
      status: row.status,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      driverName: row.driver_name
    };
  }
}

