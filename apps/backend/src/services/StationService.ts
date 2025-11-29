// 站点管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.2 站点与仓库管理

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface Station {
  id: string;
  tenantId: string;
  stationCode: string;
  stationName: string;
  stationType: 'pickup' | 'delivery' | 'transit' | 'warehouse' | 'hub';
  address: string;
  city?: string;
  province?: string;
  country: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: string;
  capacityVolume?: number;
  capacityWeight?: number;
  facilities?: string[];
  isActive: boolean;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateStationInput {
  stationCode: string;
  stationName: string;
  stationType: 'pickup' | 'delivery' | 'transit' | 'warehouse' | 'hub';
  address: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: string;
  capacityVolume?: number;
  capacityWeight?: number;
  facilities?: string[];
  isActive?: boolean;
  description?: string;
  createdBy?: string;
}

export interface UpdateStationInput {
  stationName?: string;
  stationType?: 'pickup' | 'delivery' | 'transit' | 'warehouse' | 'hub';
  address?: string;
  city?: string;
  province?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  operatingHours?: string;
  capacityVolume?: number;
  capacityWeight?: number;
  facilities?: string[];
  isActive?: boolean;
  description?: string;
  updatedBy?: string;
}

export class StationService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建站点
   */
  async createStation(
    tenantId: string,
    input: CreateStationInput
  ): Promise<Station> {
    try {
      const query = `
        INSERT INTO stations (
          tenant_id, station_code, station_name, station_type,
          address, city, province, country, postal_code,
          latitude, longitude, contact_person, contact_phone, contact_email,
          operating_hours, capacity_volume, capacity_weight,
          facilities, is_active, description, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.stationCode,
        input.stationName,
        input.stationType,
        input.address,
        input.city || null,
        input.province || null,
        input.country || 'Canada',
        input.postalCode || null,
        input.latitude || null,
        input.longitude || null,
        input.contactPerson || null,
        input.contactPhone || null,
        input.contactEmail || null,
        input.operatingHours || null,
        input.capacityVolume || null,
        input.capacityWeight || null,
        input.facilities ? JSON.stringify(input.facilities) : '[]',
        input.isActive !== false,
        input.description || null,
        input.createdBy || null,
      ]);

      const station = this.mapStationFromDb(result[0]);
      logger.info(`创建站点成功: ${station.id} (${station.stationCode})`);
      return station;
    } catch (error: any) {
      logger.error('创建站点失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有站点
   */
  async getStations(
    tenantId: string,
    params?: {
      stationType?: string;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ stations: Station[]; total: number }> {
    try {
      const { stationType, isActive, search, page = 1, limit = 20 } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (stationType) {
        whereClause += ` AND station_type = $${paramIndex++}`;
        queryParams.push(stationType);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      if (search) {
        whereClause += ` AND (station_code ILIKE $${paramIndex} OR station_name ILIKE $${paramIndex} OR address ILIKE $${paramIndex} OR city ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM stations ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM stations
        ${whereClause}
        ORDER BY station_name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        stations: result.map(row => this.mapStationFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取站点列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个站点
   */
  async getStationById(
    tenantId: string,
    stationId: string
  ): Promise<Station | null> {
    try {
      const query = `
        SELECT * FROM stations
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, stationId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapStationFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取站点失败:', error);
      throw error;
    }
  }

  /**
   * 更新站点
   */
  async updateStation(
    tenantId: string,
    stationId: string,
    input: UpdateStationInput
  ): Promise<Station> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.stationName !== undefined) {
        updateFields.push(`station_name = $${paramIndex++}`);
        values.push(input.stationName);
      }

      if (input.stationType !== undefined) {
        updateFields.push(`station_type = $${paramIndex++}`);
        values.push(input.stationType);
      }

      if (input.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        values.push(input.address);
      }

      if (input.city !== undefined) {
        updateFields.push(`city = $${paramIndex++}`);
        values.push(input.city);
      }

      if (input.province !== undefined) {
        updateFields.push(`province = $${paramIndex++}`);
        values.push(input.province);
      }

      if (input.country !== undefined) {
        updateFields.push(`country = $${paramIndex++}`);
        values.push(input.country);
      }

      if (input.postalCode !== undefined) {
        updateFields.push(`postal_code = $${paramIndex++}`);
        values.push(input.postalCode);
      }

      if (input.latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex++}`);
        values.push(input.latitude);
      }

      if (input.longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex++}`);
        values.push(input.longitude);
      }

      if (input.contactPerson !== undefined) {
        updateFields.push(`contact_person = $${paramIndex++}`);
        values.push(input.contactPerson);
      }

      if (input.contactPhone !== undefined) {
        updateFields.push(`contact_phone = $${paramIndex++}`);
        values.push(input.contactPhone);
      }

      if (input.contactEmail !== undefined) {
        updateFields.push(`contact_email = $${paramIndex++}`);
        values.push(input.contactEmail);
      }

      if (input.operatingHours !== undefined) {
        updateFields.push(`operating_hours = $${paramIndex++}`);
        values.push(input.operatingHours);
      }

      if (input.capacityVolume !== undefined) {
        updateFields.push(`capacity_volume = $${paramIndex++}`);
        values.push(input.capacityVolume);
      }

      if (input.capacityWeight !== undefined) {
        updateFields.push(`capacity_weight = $${paramIndex++}`);
        values.push(input.capacityWeight);
      }

      if (input.facilities !== undefined) {
        updateFields.push(`facilities = $${paramIndex++}`);
        values.push(JSON.stringify(input.facilities));
      }

      if (input.isActive !== undefined) {
        updateFields.push(`is_active = $${paramIndex++}`);
        values.push(input.isActive);
      }

      if (input.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(input.description);
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
        UPDATE stations
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, stationId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('站点不存在');
      }

      logger.info(`更新站点成功: ${stationId}`);
      return this.mapStationFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新站点失败:', error);
      throw error;
    }
  }

  /**
   * 删除站点
   */
  async deleteStation(
    tenantId: string,
    stationId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM stations
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, stationId]);
      logger.info(`删除站点成功: ${stationId}`);
      return true;
    } catch (error: any) {
      logger.error('删除站点失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库行映射到 Station
   */
  private mapStationFromDb(row: any): Station {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      stationCode: row.station_code,
      stationName: row.station_name,
      stationType: row.station_type,
      address: row.address,
      city: row.city || undefined,
      province: row.province || undefined,
      country: row.country || 'Canada',
      postalCode: row.postal_code || undefined,
      latitude: row.latitude ? parseFloat(row.latitude) : undefined,
      longitude: row.longitude ? parseFloat(row.longitude) : undefined,
      contactPerson: row.contact_person || undefined,
      contactPhone: row.contact_phone || undefined,
      contactEmail: row.contact_email || undefined,
      operatingHours: row.operating_hours || undefined,
      capacityVolume: row.capacity_volume ? parseFloat(row.capacity_volume) : undefined,
      capacityWeight: row.capacity_weight ? parseFloat(row.capacity_weight) : undefined,
      facilities: row.facilities ? JSON.parse(row.facilities) : [],
      isActive: row.is_active,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

