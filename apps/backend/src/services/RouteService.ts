// 线路管理服务
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.1 线路管理

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

export interface Route {
  id: string;
  tenantId: string;
  routeCode: string;
  routeName: string;
  routeType: 'regular' | 'express' | 'dedicated' | 'flexible';
  originLocation: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLocation: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  totalDistanceKm?: number;
  estimatedDurationHours?: number;
  tollFee: number;
  fuelCostPerKm?: number;
  description?: string;
  isActive: boolean;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface RouteSegment {
  id: string;
  routeId: string;
  tenantId: string;
  segmentOrder: number;
  segmentName?: string;
  startLocation: string;
  startLatitude?: number;
  startLongitude?: number;
  endLocation: string;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm: number;
  estimatedDurationMinutes?: number;
  roadType?: string;
  tollFee: number;
  speedLimit?: number;
  notes?: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateRouteInput {
  routeCode: string;
  routeName: string;
  routeType: 'regular' | 'express' | 'dedicated' | 'flexible';
  originLocation: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLocation: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  totalDistanceKm?: number;
  estimatedDurationHours?: number;
  tollFee?: number;
  fuelCostPerKm?: number;
  description?: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface UpdateRouteInput {
  routeName?: string;
  routeType?: 'regular' | 'express' | 'dedicated' | 'flexible';
  originLocation?: string;
  originLatitude?: number;
  originLongitude?: number;
  destinationLocation?: string;
  destinationLatitude?: number;
  destinationLongitude?: number;
  totalDistanceKm?: number;
  estimatedDurationHours?: number;
  tollFee?: number;
  fuelCostPerKm?: number;
  description?: string;
  isActive?: boolean;
  updatedBy?: string;
}

export interface CreateRouteSegmentInput {
  segmentOrder: number;
  segmentName?: string;
  startLocation: string;
  startLatitude?: number;
  startLongitude?: number;
  endLocation: string;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm: number;
  estimatedDurationMinutes?: number;
  roadType?: string;
  tollFee?: number;
  speedLimit?: number;
  notes?: string;
  createdBy?: string;
}

export interface UpdateRouteSegmentInput {
  segmentOrder?: number;
  segmentName?: string;
  startLocation?: string;
  startLatitude?: number;
  startLongitude?: number;
  endLocation?: string;
  endLatitude?: number;
  endLongitude?: number;
  distanceKm?: number;
  estimatedDurationMinutes?: number;
  roadType?: string;
  tollFee?: number;
  speedLimit?: number;
  notes?: string;
  updatedBy?: string;
}

export class RouteService {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 创建线路
   */
  async createRoute(
    tenantId: string,
    input: CreateRouteInput
  ): Promise<Route> {
    try {
      const query = `
        INSERT INTO routes (
          tenant_id, route_code, route_name, route_type,
          origin_location, origin_latitude, origin_longitude,
          destination_location, destination_latitude, destination_longitude,
          total_distance_km, estimated_duration_hours, toll_fee,
          fuel_cost_per_km, description, is_active, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        tenantId,
        input.routeCode,
        input.routeName,
        input.routeType,
        input.originLocation,
        input.originLatitude || null,
        input.originLongitude || null,
        input.destinationLocation,
        input.destinationLatitude || null,
        input.destinationLongitude || null,
        input.totalDistanceKm || null,
        input.estimatedDurationHours || null,
        input.tollFee || 0,
        input.fuelCostPerKm || null,
        input.description || null,
        input.isActive !== false,
        input.createdBy || null,
      ]);

      const route = this.mapRouteFromDb(result[0]);
      logger.info(`创建线路成功: ${route.id} (${route.routeCode})`);
      return route;
    } catch (error: any) {
      logger.error('创建线路失败:', error);
      throw error;
    }
  }

  /**
   * 获取所有线路
   */
  async getRoutes(
    tenantId: string,
    params?: {
      routeType?: string;
      isActive?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    }
  ): Promise<{ routes: Route[]; total: number }> {
    try {
      const { routeType, isActive, search, page = 1, limit = 20 } = params || {};

      let whereClause = 'WHERE tenant_id = $1';
      const queryParams: any[] = [tenantId];
      let paramIndex = 2;

      if (routeType) {
        whereClause += ` AND route_type = $${paramIndex++}`;
        queryParams.push(routeType);
      }

      if (isActive !== undefined) {
        whereClause += ` AND is_active = $${paramIndex++}`;
        queryParams.push(isActive);
      }

      if (search) {
        whereClause += ` AND (route_code ILIKE $${paramIndex} OR route_name ILIKE $${paramIndex} OR origin_location ILIKE $${paramIndex} OR destination_location ILIKE $${paramIndex})`;
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      // 获取总数
      const countQuery = `SELECT COUNT(*) FROM routes ${whereClause}`;
      const countResult = await this.dbService.query(countQuery, queryParams);
      const total = parseInt(countResult[0].count);

      // 获取数据
      const offset = (page - 1) * limit;
      const dataQuery = `
        SELECT * FROM routes
        ${whereClause}
        ORDER BY created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;
      queryParams.push(limit, offset);

      const result = await this.dbService.query(dataQuery, queryParams);
      return {
        routes: result.map(row => this.mapRouteFromDb(row)),
        total,
      };
    } catch (error: any) {
      logger.error('获取线路列表失败:', error);
      throw error;
    }
  }

  /**
   * 获取单个线路
   */
  async getRouteById(
    tenantId: string,
    routeId: string
  ): Promise<Route | null> {
    try {
      const query = `
        SELECT * FROM routes
        WHERE tenant_id = $1 AND id = $2
      `;

      const result = await this.dbService.query(query, [tenantId, routeId]);
      if (result.length === 0) {
        return null;
      }

      return this.mapRouteFromDb(result[0]);
    } catch (error: any) {
      logger.error('获取线路失败:', error);
      throw error;
    }
  }

  /**
   * 更新线路
   */
  async updateRoute(
    tenantId: string,
    routeId: string,
    input: UpdateRouteInput
  ): Promise<Route> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.routeName !== undefined) {
        updateFields.push(`route_name = $${paramIndex++}`);
        values.push(input.routeName);
      }

      if (input.routeType !== undefined) {
        updateFields.push(`route_type = $${paramIndex++}`);
        values.push(input.routeType);
      }

      if (input.originLocation !== undefined) {
        updateFields.push(`origin_location = $${paramIndex++}`);
        values.push(input.originLocation);
      }

      if (input.originLatitude !== undefined) {
        updateFields.push(`origin_latitude = $${paramIndex++}`);
        values.push(input.originLatitude);
      }

      if (input.originLongitude !== undefined) {
        updateFields.push(`origin_longitude = $${paramIndex++}`);
        values.push(input.originLongitude);
      }

      if (input.destinationLocation !== undefined) {
        updateFields.push(`destination_location = $${paramIndex++}`);
        values.push(input.destinationLocation);
      }

      if (input.destinationLatitude !== undefined) {
        updateFields.push(`destination_latitude = $${paramIndex++}`);
        values.push(input.destinationLatitude);
      }

      if (input.destinationLongitude !== undefined) {
        updateFields.push(`destination_longitude = $${paramIndex++}`);
        values.push(input.destinationLongitude);
      }

      if (input.totalDistanceKm !== undefined) {
        updateFields.push(`total_distance_km = $${paramIndex++}`);
        values.push(input.totalDistanceKm);
      }

      if (input.estimatedDurationHours !== undefined) {
        updateFields.push(`estimated_duration_hours = $${paramIndex++}`);
        values.push(input.estimatedDurationHours);
      }

      if (input.tollFee !== undefined) {
        updateFields.push(`toll_fee = $${paramIndex++}`);
        values.push(input.tollFee);
      }

      if (input.fuelCostPerKm !== undefined) {
        updateFields.push(`fuel_cost_per_km = $${paramIndex++}`);
        values.push(input.fuelCostPerKm);
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
        UPDATE routes
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, routeId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('线路不存在');
      }

      logger.info(`更新线路成功: ${routeId}`);
      return this.mapRouteFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新线路失败:', error);
      throw error;
    }
  }

  /**
   * 删除线路
   */
  async deleteRoute(
    tenantId: string,
    routeId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM routes
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, routeId]);
      logger.info(`删除线路成功: ${routeId}`);
      return true;
    } catch (error: any) {
      logger.error('删除线路失败:', error);
      throw error;
    }
  }

  /**
   * 计算线路里程和过路费
   */
  async calculateRouteMetrics(
    tenantId: string,
    routeId: string
  ): Promise<{
    totalDistance: number;
    totalTollFee: number;
    estimatedDuration: number;
  }> {
    try {
      // 获取路段信息
      const segmentsQuery = `
        SELECT 
          COALESCE(SUM(distance_km), 0) as total_distance,
          COALESCE(SUM(toll_fee), 0) as total_toll,
          COALESCE(SUM(estimated_duration_minutes), 0) as total_duration
        FROM route_segments
        WHERE route_id = $1 AND tenant_id = $2
      `;

      const segmentsResult = await this.dbService.query(segmentsQuery, [routeId, tenantId]);
      const segmentData = segmentsResult[0];

      // 如果线路本身有总里程，优先使用
      const route = await this.getRouteById(tenantId, routeId);
      const totalDistance = route?.totalDistanceKm || parseFloat(segmentData.total_distance || 0);
      const totalTollFee = (route?.tollFee || 0) + parseFloat(segmentData.total_toll || 0);
      const estimatedDuration = route?.estimatedDurationHours || (parseFloat(segmentData.total_duration || 0) / 60);

      return {
        totalDistance,
        totalTollFee,
        estimatedDuration,
      };
    } catch (error: any) {
      logger.error('计算线路指标失败:', error);
      throw error;
    }
  }

  /**
   * 获取线路的所有路段
   */
  async getRouteSegments(
    tenantId: string,
    routeId: string
  ): Promise<RouteSegment[]> {
    try {
      const query = `
        SELECT * FROM route_segments
        WHERE tenant_id = $1 AND route_id = $2
        ORDER BY segment_order ASC
      `;

      const result = await this.dbService.query(query, [tenantId, routeId]);
      return result.map(row => this.mapSegmentFromDb(row));
    } catch (error: any) {
      logger.error('获取路段失败:', error);
      throw error;
    }
  }

  /**
   * 创建路段
   */
  async createRouteSegment(
    tenantId: string,
    routeId: string,
    input: CreateRouteSegmentInput
  ): Promise<RouteSegment> {
    try {
      const query = `
        INSERT INTO route_segments (
          route_id, tenant_id, segment_order, segment_name,
          start_location, start_latitude, start_longitude,
          end_location, end_latitude, end_longitude,
          distance_km, estimated_duration_minutes, road_type,
          toll_fee, speed_limit, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
        RETURNING *
      `;

      const result = await this.dbService.query(query, [
        routeId,
        tenantId,
        input.segmentOrder,
        input.segmentName || null,
        input.startLocation,
        input.startLatitude || null,
        input.startLongitude || null,
        input.endLocation,
        input.endLatitude || null,
        input.endLongitude || null,
        input.distanceKm,
        input.estimatedDurationMinutes || null,
        input.roadType || null,
        input.tollFee || 0,
        input.speedLimit || null,
        input.notes || null,
        input.createdBy || null,
      ]);

      const segment = this.mapSegmentFromDb(result[0]);
      logger.info(`创建路段成功: ${segment.id}`);
      return segment;
    } catch (error: any) {
      logger.error('创建路段失败:', error);
      throw error;
    }
  }

  /**
   * 更新路段
   */
  async updateRouteSegment(
    tenantId: string,
    segmentId: string,
    input: UpdateRouteSegmentInput
  ): Promise<RouteSegment> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (input.segmentOrder !== undefined) {
        updateFields.push(`segment_order = $${paramIndex++}`);
        values.push(input.segmentOrder);
      }

      if (input.segmentName !== undefined) {
        updateFields.push(`segment_name = $${paramIndex++}`);
        values.push(input.segmentName);
      }

      if (input.startLocation !== undefined) {
        updateFields.push(`start_location = $${paramIndex++}`);
        values.push(input.startLocation);
      }

      if (input.startLatitude !== undefined) {
        updateFields.push(`start_latitude = $${paramIndex++}`);
        values.push(input.startLatitude);
      }

      if (input.startLongitude !== undefined) {
        updateFields.push(`start_longitude = $${paramIndex++}`);
        values.push(input.startLongitude);
      }

      if (input.endLocation !== undefined) {
        updateFields.push(`end_location = $${paramIndex++}`);
        values.push(input.endLocation);
      }

      if (input.endLatitude !== undefined) {
        updateFields.push(`end_latitude = $${paramIndex++}`);
        values.push(input.endLatitude);
      }

      if (input.endLongitude !== undefined) {
        updateFields.push(`end_longitude = $${paramIndex++}`);
        values.push(input.endLongitude);
      }

      if (input.distanceKm !== undefined) {
        updateFields.push(`distance_km = $${paramIndex++}`);
        values.push(input.distanceKm);
      }

      if (input.estimatedDurationMinutes !== undefined) {
        updateFields.push(`estimated_duration_minutes = $${paramIndex++}`);
        values.push(input.estimatedDurationMinutes);
      }

      if (input.roadType !== undefined) {
        updateFields.push(`road_type = $${paramIndex++}`);
        values.push(input.roadType);
      }

      if (input.tollFee !== undefined) {
        updateFields.push(`toll_fee = $${paramIndex++}`);
        values.push(input.tollFee);
      }

      if (input.speedLimit !== undefined) {
        updateFields.push(`speed_limit = $${paramIndex++}`);
        values.push(input.speedLimit);
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

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      const query = `
        UPDATE route_segments
        SET ${updateFields.join(', ')}
        WHERE tenant_id = $${paramIndex++} AND id = $${paramIndex++}
        RETURNING *
      `;

      values.push(tenantId, segmentId);
      const result = await this.dbService.query(query, values);

      if (result.length === 0) {
        throw new Error('路段不存在');
      }

      logger.info(`更新路段成功: ${segmentId}`);
      return this.mapSegmentFromDb(result[0]);
    } catch (error: any) {
      logger.error('更新路段失败:', error);
      throw error;
    }
  }

  /**
   * 删除路段
   */
  async deleteRouteSegment(
    tenantId: string,
    segmentId: string
  ): Promise<boolean> {
    try {
      const query = `
        DELETE FROM route_segments
        WHERE tenant_id = $1 AND id = $2
      `;

      await this.dbService.query(query, [tenantId, segmentId]);
      logger.info(`删除路段成功: ${segmentId}`);
      return true;
    } catch (error: any) {
      logger.error('删除路段失败:', error);
      throw error;
    }
  }

  /**
   * 从数据库行映射到 Route
   */
  private mapRouteFromDb(row: any): Route {
    return {
      id: row.id,
      tenantId: row.tenant_id,
      routeCode: row.route_code,
      routeName: row.route_name,
      routeType: row.route_type,
      originLocation: row.origin_location,
      originLatitude: row.origin_latitude ? parseFloat(row.origin_latitude) : undefined,
      originLongitude: row.origin_longitude ? parseFloat(row.origin_longitude) : undefined,
      destinationLocation: row.destination_location,
      destinationLatitude: row.destination_latitude ? parseFloat(row.destination_latitude) : undefined,
      destinationLongitude: row.destination_longitude ? parseFloat(row.destination_longitude) : undefined,
      totalDistanceKm: row.total_distance_km ? parseFloat(row.total_distance_km) : undefined,
      estimatedDurationHours: row.estimated_duration_hours ? parseFloat(row.estimated_duration_hours) : undefined,
      tollFee: parseFloat(row.toll_fee || 0),
      fuelCostPerKm: row.fuel_cost_per_km ? parseFloat(row.fuel_cost_per_km) : undefined,
      description: row.description || undefined,
      isActive: row.is_active,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }

  /**
   * 从数据库行映射到 RouteSegment
   */
  private mapSegmentFromDb(row: any): RouteSegment {
    return {
      id: row.id,
      routeId: row.route_id,
      tenantId: row.tenant_id,
      segmentOrder: row.segment_order,
      segmentName: row.segment_name || undefined,
      startLocation: row.start_location,
      startLatitude: row.start_latitude ? parseFloat(row.start_latitude) : undefined,
      startLongitude: row.start_longitude ? parseFloat(row.start_longitude) : undefined,
      endLocation: row.end_location,
      endLatitude: row.end_latitude ? parseFloat(row.end_latitude) : undefined,
      endLongitude: row.end_longitude ? parseFloat(row.end_longitude) : undefined,
      distanceKm: parseFloat(row.distance_km),
      estimatedDurationMinutes: row.estimated_duration_minutes || undefined,
      roadType: row.road_type || undefined,
      tollFee: parseFloat(row.toll_fee || 0),
      speedLimit: row.speed_limit || undefined,
      notes: row.notes || undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      createdBy: row.created_by || undefined,
      updatedBy: row.updated_by || undefined,
    };
  }
}

