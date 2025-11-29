// 仓库管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.2 站点与仓库管理

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface Warehouse {
  id: string;
  tenantId: string;
  warehouseCode: string;
  warehouseName: string;
  warehouseType: 'distribution' | 'storage' | 'cross_dock' | 'cold_storage';
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
  totalAreaSqm?: number;
  storageCapacityVolume?: number;
  storageCapacityWeight?: number;
  temperatureControlled: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  loadingDocks?: number;
  facilities?: string[];
  isActive: boolean;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface Hub {
  id: string;
  tenantId: string;
  hubCode: string;
  hubName: string;
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
  totalCapacityVolume?: number;
  totalCapacityWeight?: number;
  parkingSpaces?: number;
  loadingDocks?: number;
  facilities?: string[];
  isActive: boolean;
  description?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateWarehouseInput {
  warehouseCode: string;
  warehouseName: string;
  warehouseType: 'distribution' | 'storage' | 'cross_dock' | 'cold_storage';
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
  totalAreaSqm?: number;
  storageCapacityVolume?: number;
  storageCapacityWeight?: number;
  temperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  loadingDocks?: number;
  facilities?: string[];
  isActive?: boolean;
  description?: string;
  createdBy?: string;
}

export interface UpdateWarehouseInput {
  warehouseName?: string;
  warehouseType?: 'distribution' | 'storage' | 'cross_dock' | 'cold_storage';
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
  totalAreaSqm?: number;
  storageCapacityVolume?: number;
  storageCapacityWeight?: number;
  temperatureControlled?: boolean;
  minTemperature?: number;
  maxTemperature?: number;
  loadingDocks?: number;
  facilities?: string[];
  isActive?: boolean;
  description?: string;
  updatedBy?: string;
}

export interface CreateHubInput {
  hubCode: string;
  hubName: string;
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
  totalCapacityVolume?: number;
  totalCapacityWeight?: number;
  parkingSpaces?: number;
  loadingDocks?: number;
  facilities?: string[];
  isActive?: boolean;
  description?: string;
  createdBy?: string;
}

export interface UpdateHubInput {
  hubName?: string;
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
  totalCapacityVolume?: number;
  totalCapacityWeight?: number;
  parkingSpaces?: number;
  loadingDocks?: number;
  facilities?: string[];
  isActive?: boolean;
  description?: string;
  updatedBy?: string;
}

export class WarehouseService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  // ==================== 仓库管理 ====================

  /**
   * 创建仓库
   */
  async createWarehouse(
    tenantId: string,
    input: CreateWarehouseInput
  ): Promise<Warehouse> {
    try {
      const query = `
        INSERT INTO warehouses (
          tenant_id, warehouse_code, warehouse_name, warehouse_type,
          address, city, province, country, postal_code,
          latitude, longitude, contact_person, contact_phone, contact_email,
          operating_hours, total_area_sqm, storage_capacity_volume, storage_capacity_weight,
          temperature_controlled, min_temperature, max_temperature,
          loading_docks, facilities, is_active, description, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.warehouseCode,
        input.warehouseName,
        input.warehouseType,
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
        input.totalAreaSqm || null,
        input.storageCapacityVolume || null,
        input.storageCapacityWeight || null,
        input.temperatureControlled || false,
        input.minTemperature || null,
        input.maxTemperature || null,
        input.loadingDocks || null,
        input.facilities ? JSON.stringify(input.facilities) : '[]',
        input.isActive !== false,
        input.description || null,
        input.createdBy || null,
      ]);

      const warehouse = this.mapWarehouseFromDb(result[0]);
      logger.info(`创建仓库成功: ${warehouse.id} (${warehouse.warehouseCode})`);
      return warehouse;
    } catch (error: any) {
      logger.error('创建仓库失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有仓库
   */
  async getWarehouses(
    tenantId: string,
    params?: {
      warehouseType?: string;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ warehouses: Warehouse[]; total: number }> {
    try {
      const { warehouseType, isActive, search, page = 1, limit = 20 } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (warehouseType) {
        whereClause += ` AND warehouse_type = $${paramIndex++}`;
        queryParams.push(warehouseType);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      if (search) {
        whereClause += ` AND (warehouse_code ILIKE $${paramIndex} OR warehouse_name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM warehouses ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM warehouses
        ${whereClause}
        ORDER BY warehouse_name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        warehouses: result.map(row => this.mapWarehouseFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取仓库列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个仓库
   */
  async getWarehouseById(
    tenantId: string,
    warehouseId: string
  ): Promise<Warehouse | null> {
    try {
      const query = `
        SELECT * FROM warehouses
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, warehouseId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapWarehouseFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取仓库失败:', error);
      throw error;
    }
  }

  /**
   * 更新仓库
   */
  async updateWarehouse(
    tenantId: string,
    warehouseId: string,
    input: UpdateWarehouseInput
  ): Promise<Warehouse> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 类似 StationService 的更新逻辑，但包含仓库特有字段
      if (input.warehouseName !== undefined) {
        updateFields.push(`warehouse_name = $${paramIndex++}`);
        values.push(input.warehouseName);
      }

      if (input.warehouseType !== undefined) {
        updateFields.push(`warehouse_type = $${paramIndex++}`);
        values.push(input.warehouseType);
      }

      if (input.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        values.push(input.address);
      }

      if (input.latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex++}`);
        values.push(input.latitude);
      }

      if (input.longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex++}`);
        values.push(input.longitude);
      }

      if (input.totalAreaSqm !== undefined) {
        updateFields.push(`total_area_sqm = $${paramIndex++}`);
        values.push(input.totalAreaSqm);
      }

      if (input.storageCapacityVolume !== undefined) {
        updateFields.push(`storage_capacity_volume = $${paramIndex++}`);
        values.push(input.storageCapacityVolume);
      }

      if (input.storageCapacityWeight !== undefined) {
        updateFields.push(`storage_capacity_weight = $${paramIndex++}`);
        values.push(input.storageCapacityWeight);
      }

      if (input.temperatureControlled !== undefined) {
        updateFields.push(`temperature_controlled = $${paramIndex++}`);
        values.push(input.temperatureControlled);
      }

      if (input.minTemperature !== undefined) {
        updateFields.push(`min_temperature = $${paramIndex++}`);
        values.push(input.minTemperature);
      }

      if (input.maxTemperature !== undefined) {
        updateFields.push(`max_temperature = $${paramIndex++}`);
        values.push(input.maxTemperature);
      }

      if (input.loadingDocks !== undefined) {
        updateFields.push(`loading_docks = $${paramIndex++}`);
        values.push(input.loadingDocks);
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
        UPDATE warehouses
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, warehouseId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('仓库不存在');
      }

      logger.info(`更新仓库成功: ${warehouseId}`);
      return this.mapWarehouseFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新仓库失败:', error);
      throw error;
    }
  }

  /**
   * 删除仓库
   */
  async deleteWarehouse(
    tenantId: string,
    warehouseId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM warehouses
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, warehouseId]);
      logger.info(`删除仓库成功: ${warehouseId}`);
      return true;
    } catch (error: any) {
      logger.error('删除仓库失败:', error);
      throw error;
    }
  }

  // ==================== 枢纽管理 ====================

  /**
   * 创建枢纽
   */
  async createHub(
    tenantId: string,
    input: CreateHubInput
  ): Promise<Hub> {
    try {
      const query = `
        INSERT INTO hubs (
          tenant_id, hub_code, hub_name, address, city, province, country, postal_code,
          latitude, longitude, contact_person, contact_phone, contact_email,
          operating_hours, total_capacity_volume, total_capacity_weight,
          parking_spaces, loading_docks, facilities, is_active, description, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.hubCode,
        input.hubName,
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
        input.totalCapacityVolume || null,
        input.totalCapacityWeight || null,
        input.parkingSpaces || null,
        input.loadingDocks || null,
        input.facilities ? JSON.stringify(input.facilities) : '[]',
        input.isActive !== false,
        input.description || null,
        input.createdBy || null,
      ]);

      const hub = this.mapHubFromDb(result[0]);
      logger.info(`创建枢纽成功: ${hub.id} (${hub.hubCode})`);
      return hub;
    } catch (error: any) {
      logger.error('创建枢纽失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有枢纽
   */
  async getHubs(
    tenantId: string,
    params?: {
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ hubs: Hub[]; total: number }> {
    try {
      const { isActive, search, page = 1, limit = 20 } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      if (search) {
        whereClause += ` AND (hub_code ILIKE $${paramIndex} OR hub_name ILIKE $${paramIndex} OR address ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM hubs ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM hubs
        ${whereClause}
        ORDER BY hub_name ASC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        hubs: result.map(row => this.mapHubFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取枢纽列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个枢纽
   */
  async getHubById(
    tenantId: string,
    hubId: string
  ): Promise<Hub | null> {
    try {
      const query = `
        SELECT * FROM hubs
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, hubId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapHubFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取枢纽失败:', error);
      throw error;
    }
  }

  /**
   * 更新枢纽
   */
  async updateHub(
    tenantId: string,
    hubId: string,
    input: UpdateHubInput
  ): Promise<Hub> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      // 类似仓库的更新逻辑
      if (input.hubName !== undefined) {
        updateFields.push(`hub_name = $${paramIndex++}`);
        values.push(input.hubName);
      }

      if (input.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        values.push(input.address);
      }

      if (input.latitude !== undefined) {
        updateFields.push(`latitude = $${paramIndex++}`);
        values.push(input.latitude);
      }

      if (input.longitude !== undefined) {
        updateFields.push(`longitude = $${paramIndex++}`);
        values.push(input.longitude);
      }

      if (input.totalCapacityVolume !== undefined) {
        updateFields.push(`total_capacity_volume = $${paramIndex++}`);
        values.push(input.totalCapacityVolume);
      }

      if (input.totalCapacityWeight !== undefined) {
        updateFields.push(`total_capacity_weight = $${paramIndex++}`);
        values.push(input.totalCapacityWeight);
      }

      if (input.parkingSpaces !== undefined) {
        updateFields.push(`parking_spaces = $${paramIndex++}`);
        values.push(input.parkingSpaces);
      }

      if (input.loadingDocks !== undefined) {
        updateFields.push(`loading_docks = $${paramIndex++}`);
        values.push(input.loadingDocks);
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
        UPDATE hubs
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, hubId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('枢纽不存在');
      }

      logger.info(`更新枢纽成功: ${hubId}`);
      return this.mapHubFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新枢纽失败:', error);
      throw error;
    }
  }

  /**
   * 删除枢纽
   */
  async deleteHub(
    tenantId: string,
    hubId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM hubs
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, hubId]);
      logger.info(`删除枢纽成功: ${hubId}`);
      return true;
    } catch (error: any) {
      logger.error('删除枢纽失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库行映射到 Warehouse
   */
  private mapWarehouseFromDb(row: any): Warehouse {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      warehouseCode: row.warehouse_code,
      warehouseName: row.warehouse_name,
      warehouseType: row.warehouse_type,
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
      totalAreaSqm: row.total_area_sqm ? parseFloat(row.total_area_sqm) : undefined,
      storageCapacityVolume: row.storage_capacity_volume ? parseFloat(row.storage_capacity_volume) : undefined,
      storageCapacityWeight: row.storage_capacity_weight ? parseFloat(row.storage_capacity_weight) : undefined,
      temperatureControlled: row.temperature_controlled,
      minTemperature: row.min_temperature ? parseFloat(row.min_temperature) : undefined,
      maxTemperature: row.max_temperature ? parseFloat(row.max_temperature) : undefined,
      loadingDocks: row.loading_docks || undefined,
      facilities: row.facilities ? JSON.parse(row.facilities) : [],
      isActive: row.is_active,
      description: row.description || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }

  /**
   * 从数据库行映射到 Hub
   */
  private mapHubFromDb(row: any): Hub {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      hubCode: row.hub_code,
      hubName: row.hub_name,
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
      totalCapacityVolume: row.total_capacity_volume ? parseFloat(row.total_capacity_volume) : undefined,
      totalCapacityWeight: row.total_capacity_weight ? parseFloat(row.total_capacity_weight) : undefined,
      parkingSpaces: row.parking_spaces || undefined,
      loadingDocks: row.loading_docks || undefined,
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

