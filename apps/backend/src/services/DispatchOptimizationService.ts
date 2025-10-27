// 车辆调度优化引擎服务
// 创建时间: 2025-10-02 19:10:00
// 作用: 后端智能车辆调度优化引擎，包含路线规划、最短路径计算、车辆调度优化

import { DatabaseService } from './DatabaseService';
import { logger } from '../utils/logger';

interface Coordinates {
  lat: number;
  lng: number;
}

interface Address {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  coordinates?: Coordinates;
}

interface ShippingPoint {
  id: string;
  address: Address;
  pickupTime?: string;
  deliveryTime?: string;
}

interface Vehicle {
  id: string;
  plateNumber: string;
  type: string;
  capacity: number;
  status: 'available' | 'busy' | 'maintenance';
  currentLocation?: Coordinates;
  driverId: string;
  driverName: string;
}

interface Driver {
  id: string;
  name: string;
  phone: string;
  status: 'available' | 'busy' | 'offline';
  workHours: number;
  licenseClass: string[];
}

interface RouteSegment {
  from: Coordinates;
  to: Coordinates;
  distance: number; // 公里
  duration: number; // 分钟
  instructions: string;
}

interface OptimizedRoute {
  shipmentId: string;
  vehicleId: string;
  driverId: string;
  segments: RouteSegment[];
  totalDistance: number;
  totalDuration: number;
  estimatedStartTime: string;
  estimatedEndTime: string;
  fuelEstimate: number;
  costEstimate: number;
}

interface DispatchResult {
  success: boolean;
  optimizedRoutes: OptimizedRoute[];
  unassignedShipments: string[];
  totalCostSavings: number;
  totalDistanceSavings: number;
  processingTime: number; // 毫秒
}

export class DispatchOptimizationService {
  private dbService: DatabaseService;
  private readonly GOOGLE_MAPS_API_KEY: string;
  private readonly BASE_URL = 'https://maps.googleapis.com/maps/api';

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';
  }

  /**
   * 主要的调度优化入口
   * 当创建运单时触发此方法
   * @param shipmentId 运单ID
   * @param tenantId 租户ID
   */
  async optimizeDispatchForNewShipment(shipmentId: string, tenantId: string): Promise<DispatchResult> {
    const startTime = Date.now();
    logger.info(`开始为运单 ${shipmentId} 执行调度优化`);

    try {
      // 1. 获取运单信息
      const shipment = await this.getShipmentDetails(shipmentId, tenantId);
      if (!shipment) {
        throw new Error(`运单 ${shipmentId} 不存在`);
      }

      // 2. 获取可用车辆和司机
      const availableVehicles = await this.getAvailableVehicles(tenantId);
      const availableDrivers = await this.getAvailableDrivers(tenantId);

      // 3. 获取所有待分配的运单
      const pendingShipments = await this.getPendingShipments(tenantId);

      // 4. 批量地理编码处理
      const shipmentsWithCoordinates = await this.geocodeAddresses(pendingShipments);

      // 5. 执行车辆分配算法
      const assignmentResult = await this.assignVehiclesToShipments(
        shipmentsWithCoordinates,
        availableVehicles,
        availableDrivers
      );

      // 6. 为分配成功的运单计算最优路线
      const optimizedRoutes = await this.calculateOptimalRoutes(assignmentResult.assignedShipments);

      // 7. 更新数据库
      await this.updateShipmentAssignments(optimizedRoutes, tenantId);

      // 8. 计算优化效果
      const totalCostSavings = await this.calculateCostSavings(optimizedRoutes);
      const totalDistanceSavings = await this.calculateDistanceSavings(optimizedRoutes);

      const processingTime = Date.now() - startTime;

      logger.info(`调度优化完成，用时 ${processingTime}ms，分配了 ${assignmentResult.assignedShipments.length} 个运单`);

      return {
        success: true,
        optimizedRoutes,
        unassignedShipments: assignmentResult.unassignedShipments,
        totalCostSavings,
        totalDistanceSavings,
        processingTime,
      };
    } catch (error) {
      logger.error(`调度优化失败: ${error.message}`);
      return {
        success: false,
        optimizedRoutes: [],
        unassignedShipments: [],
        totalCostSavings: 0,
        totalDistanceSavings: 0,
        processingTime: Date.now() - startTime,
      };
    }
  }

  /**
   * 使用Google Geocoding API进行地址解析
   */
  private async geocodeAddress(address: string): Promise<Coordinates | null> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      logger.warn('Google Maps API Key未配置，使用模拟坐标');
      // 返回模拟坐标
      return { lat: 39.9042 + Math.random() * 0.1, lng: 116.4074 + Math.random() * 0.1 };
    }

    try {
      const encodedAddress = encodeURIComponent(address);
      const url = `${this.BASE_URL}/geocode/json?address=${encodedAddress}&key=${this.GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if ((data as any).status === 'OK' && (data as any).results.length > 0) {
        const location = (data as any).results[0].geometry.location;
        return {
          lat: location.lat,
          lng: location.lng,
        };
      } else {
        logger.warn(`地理编码失败: ${(data as any).status}`);
        return null;
      }
    } catch (error) {
      logger.error(`地理编码API调用失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 批量地理编码处理
   */
  private async geocodeAddresses(shipments: any[]): Promise<any[]> {
    const shipmentsWithCoordinates = [];
    
    for (const shipment of shipments) {
      // 处理取货地址
      let pickupCoordinates = shipment.pickupAddress?.coordinates;
      if (!pickupCoordinates && shipment.pickupAddress) {
        const addressString = `${shipment.pickupAddress.street}, ${shipment.pickupAddress.city}, ${shipment.pickupAddress.state}`;
        pickupCoordinates = await this.geocodeAddress(addressString);
        
        // 更新数据库中的坐标
        if (pickupCoordinates) {
          await this.dbService.query(
            `UPDATE shipments SET shipper_address = jsonb_set(shipper_address, '{coordinates}', $1) WHERE id = $2`,
            [JSON.stringify(pickupCoordinates), shipment.id]
          );
        }
      }

      // 处理收货地址
      let deliveryCoordinates = shipment.deliveryAddress?.coordinates;
      if (!deliveryCoordinates && shipment.deliveryAddress) {
        const addressString = `${shipment.deliveryAddress.street}, ${shipment.deliveryAddress.city}, ${shipment.deliveryAddress.state}`;
        deliveryCoordinates = await this.geocodeAddress(addressString);
        
        // 更新数据库中的坐标
        if (deliveryCoordinates) {
          await this.dbService.query(
            `UPDATE shipments SET receiver_address = jsonb_set(receiver_address, '{coordinates}', $1) WHERE id = $2`,
            [JSON.stringify(deliveryCoordinates), shipment.id]
          );
        }
      }

      shipmentsWithCoordinates.push({
        ...shipment,
        pickupCoordinates,
        deliveryCoordinates,
      });
    }

    return shipmentsWithCoordinates;
  }

  /**
   * 获取方向和距离信息
   */
  private async getDirections(origin: Coordinates, destination: Coordinates): Promise<RouteSegment> {
    if (!this.GOOGLE_MAPS_API_KEY) {
      // 模拟距离和时长计算
      const distance = this.calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const duration = Math.round(distance * 2); // 假设平均时速30km/h
      return {
        from: origin,
        to: destination,
        distance,
        duration,
        instructions: '模拟路线指示',
      };
    }

    try {
      const originStr = `${origin.lat},${origin.lng}`;
      const destinationStr = `${destination.lat},${destination.lng}`;
      const url = `${this.BASE_URL}/directions/json?origin=${originStr}&destination=${destinationStr}&key=${this.GOOGLE_MAPS_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if ((data as any).status === 'OK' && (data as any).routes.length > 0) {
        const route = (data as any).routes[0];
        const leg = route.legs[0];
        
        return {
          from: origin,
          to: destination,
          distance: leg.distance.value / 1000, // 转换为公里
          duration: leg.duration.value / 60, // 转换为分钟
          instructions: leg.steps.map((step: any) => step.html_instructions).join(' → '),
        };
      } else {
        throw new Error(`路线规划失败: ${(data as any).status}`);
      }
    } catch (error) {
      logger.error(`路线规划API调用失败: ${error.message}`);
      // 返回基于直线距离的估算
      const distance = this.calculateHaversineDistance(origin.lat, origin.lng, destination.lat, destination.lng);
      const duration = Math.round(distance * 2);
      return {
        from: origin,
        to: destination,
        distance,
        duration,
        instructions: '路线规划失败，使用直线距离估算',
      };
    }
  }

  /**
   * 车辆分配算法 - 基于最优匹配
   */
  private async assignVehiclesToShipments(
    shipments: any[],
    vehicles: Vehicle[],
    drivers: Driver[]
  ): Promise<{ assignedShipments: any[]; unassignedShipments: string[] }> {
    
    // 简化的贪心算法实现车辆分配
    const assignedShipments = [];
    const unassignedShipments = [];
    const usedVehicles = new Set<string>();

    // 按优先级排序运单（可以根据紧急程度、价值等）
    const sortedShipments = shipments.sort((a, b) => {
      const priorityA = this.calculateShipmentPriority(a);
      const priorityB = this.calculateShipmentPriority(b);
      return priorityB - priorityA;
    });

    for (const shipment of sortedShipments) {
      let bestVehicle = null;
      let bestScore = -1;

      // 寻找最佳匹配车辆
      for (const vehicle of vehicles) {
        if (usedVehicles.has(vehicle.id)) continue;

        const score = this.calculateVehicleShipmentScore(vehicle, shipment, drivers);
        if (score > bestScore) {
          bestVehicle = vehicle;
          bestScore = score;
        }
      }

      if (bestVehicle && bestScore > 0) {
        assignedShipments.push({
          ...shipment,
          assignedVehicle: bestVehicle,
        });
        usedVehicles.add(bestVehicle.id);
      } else {
        unassignedShipments.push(shipment.id);
      }
    }

    return { assignedShipments, unassignedShipments };
  }

  /**
   * 计算运单优先级
   */
  private calculateShipmentPriority(shipment: any): number {
    let priority = 0;
    
    // 基于客户等级
    const customerTierScore = {
      'vip5': 10,
      'vip4': 8,
      'vip3': 6,
      'vip2': 4,
      'vip1': 2,
    };
    priority += customerTierScore[shipment.customerTier] || 0;

    // 基于紧急程度
    const urgencyScore = {
      'urgent': 15,
      'high': 10,
      'medium': 5,
      'low': 0,
    };
    priority += urgencyScore[shipment.priority] || 5;

    // 基于货物价值
    if (shipment.cargoValue > 10000) priority += 5;
    else if (shipment.cargoValue > 5000) priority += 3;
    else if (shipment.cargoValue > 1000) priority += 1;

    return priority;
  }

  /**
   * 计算车辆-运单匹配分数
   */
  private calculateVehicleShipmentScore(vehicle: Vehicle, shipment: any, drivers: Driver[]): number {
    let score = 0;

    // 容量匹配
    if (vehicle.capacity >= shipment.weight) {
      score += 10;
    } else {
      return 0; // 容量不足，无法分配
    }

    // 车辆类型匹配
    const typeScore = {
      '厢式货车': shipment.cargoType === '货物' ? 8 : 5,
      '冷藏车': shipment.cargoType === '冷藏' ? 10 : 3,
      '平板车': shipment.cargoType === '重货' ? 8 : 2,
    };
    score += typeScore[vehicle.type] || 3;

    // 司机技能匹配
    const driver = drivers.find(d => d.id === vehicle.driverId);
    if (driver) {
      if (driver.status === 'available') score += 10;
      else if (driver.status === 'busy') score += 5;
      
      // 驾照等级匹配
      if (vehicle.type === '大型货车' && driver.licenseClass.includes('A2')) score += 3;
    }

    // 位置距离因素
    if (vehicle.currentLocation && shipment.pickupCoordinates) {
      const distance = this.calculateHaversineDistance(
        vehicle.currentLocation.lat,
        vehicle.currentLocation.lng,
        shipment.pickupCoordinates.lat,
        shipment.pickupCoordinates.lng
      );
      
      // 距离越近分数越高
      if (distance < 10) score += 8;
      else if (distance < 20) score += 6;
      else if (distance < 50) score += 4;
      else score += 2;
    }

    return score;
  }

  /**
   * 计算最优路线
   */
  private async calculateOptimalRoutes(assignedShipments: any[]): Promise<OptimizedRoute[]> {
    const routes = [];

    for (const assignment of assignedShipments) {
      if (!assignment.pickupCoordinates || !assignment.deliveryCoordinates) continue;

      const vehicle = assignment.assignedVehicle;
      
      // 计算取货到收货点的路线
      const mainRoute = await this.getDirections(
        assignment.pickupCoordinates,
        assignment.deliveryCoordinates
      );

      // 如果有车辆当前位置，还要计算车辆开往取货点的路线
      let fromDepotRoute = null;
      if (vehicle.currentLocation) {
        fromDepotRoute = await this.getDirections(
          vehicle.currentLocation,
          assignment.pickupCoordinates
        );
      }

      const segments = [];
      if (fromDepotRoute) segments.push(fromDepotRoute);
      segments.push(mainRoute);

      const totalDistance = segments.reduce((sum, seg) => sum + seg.distance, 0);
      const totalDuration = segments.reduce((sum, seg) => sum + seg.duration, 0);

      routes.push({
        shipmentId: assignment.id,
        vehicleId: vehicle.id,
        driverId: vehicle.driverId,
        segments,
        totalDistance,
        totalDuration,
        estimatedStartTime: this.calculateEstimatedStartTime(assignment),
        estimatedEndTime: this.calculateEstimatedEndTime(assignment, totalDuration),
        fuelEstimate: this.calculateFuelEstimate(totalDistance, vehicle.type),
        costEstimate: this.calculateCostEstimate(totalDistance, totalDuration, vehicle.type),
      });
    }

    return routes;
  }

  /**
   * Haversine距离计算公式
   */
  private calculateHaversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371; // 地球半径(公里)
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // 私有辅助方法
  private async getShipmentDetails(shipmentId: string, tenantId: string): Promise<any> {
    const result = await this.dbService.query(
      'SELECT * FROM shipments WHERE id = $1 AND tenant_id = $2',
      [shipmentId, tenantId]
    );
    return result[0];
  }

  private async getAvailableVehicles(tenantId: string): Promise<Vehicle[]> {
    const result = await this.dbService.query(
      `SELECT v.*, d.name as driver_name 
       FROM vehicles v 
       LEFT JOIN drivers d ON d.vehicle_id = v.id 
       WHERE v.status = 'available' AND v.tenant_id = $1`,
      [tenantId]
    );
    return result;
  }

  private async getAvailableDrivers(tenantId: string): Promise<Driver[]> {
    const result = await this.dbService.query(
      "SELECT * FROM drivers WHERE status IN ('available', 'busy') AND tenant_id = $1",
      [tenantId]
    );
    return result;
  }

  private async getPendingShipments(tenantId: string): Promise<any[]> {
    const result = await this.dbService.query(
      "SELECT * FROM shipments WHERE status IN ('pending', 'confirmed') AND tenant_id = $1",
      [tenantId]
    );
    return result;
  }

  private async updateShipmentAssignments(routes: OptimizedRoute[], tenantId: string): Promise<void> {
    for (const route of routes) {
      await this.dbService.query(
        `UPDATE shipments 
         SET status = 'assigned', 
             trip_id = $1, 
             driver_id = $2, 
             vehicle_id = $3,
             estimated_pickup_time = $4,
             estimated_delivery_time = $5,
             updated_at = NOW()
         WHERE id = $6 AND tenant_id = $7`,
        [
          route.shipmentId, // trip_id (简化处理，实际应该是行程ID)
          route.driverId,
          route.vehicleId,
          route.estimatedStartTime,
          route.estimatedEndTime,
          route.shipmentId,
          tenantId,
        ]
      );
    }
  }

  private calculateEstimatedStartTime(shipment: any): string {
    // 当前时间 + 1小时准备时间
    const startTime = new Date(Date.now() + 60 * 60 * 1000);
    return startTime.toISOString();
  }

  private calculateEstimatedEndTime(shipment: any, totalDuration: number): string {
    const startTime = new Date(shipment.estimatedStartTime || new Date().toISOString());
    const endTime = new Date(startTime.getTime() + totalDuration * 60 * 1000);
    return endTime.toISOString();
  }

  private calculateFuelEstimate(distance: number, vehicleType: string): number {
    // 不同车型的油耗系数 (升/百公里)
    const fuelConsumption = {
      '厢式货车': 8,
      '冷藏车': 10,
      '平板车': 12,
      '大型货车': 15,
    };
    
    const consumption = fuelConsumption[vehicleType] || 10;
    return (distance / 100) * consumption;
  }

  private calculateCostEstimate(distance: number, duration: number, vehicleType: string): number {
    const fuelEstimate = this.calculateFuelEstimate(distance, vehicleType);
    const fuelCost = fuelEstimate * 7.5; // 7.5元/升
    const timeCost = (duration / 60) * 30; // 30元/小时的司机工资
    
    return Math.round(fuelCost + timeCost);
  }

  private async calculateCostSavings(routes: OptimizedRoute[]): Promise<number> {
    // 简化计算：基于路线优化的成本节省
    const totalOptimizedCost = routes.reduce((sum, route) => sum + route.costEstimate, 0);
    return Math.round(totalOptimizedCost * 0.15); // 假设优化节省15%
  }

  private async calculateDistanceSavings(routes: OptimizedRoute[]): Promise<number> {
    // 简化计算：基于距离优化
    const totalOptimizedDistance = routes.reduce((sum, route) => sum + route.totalDistance, 0);
    return Math.round(totalOptimizedDistance * 0.2); // 假设优化减少20%里程
  }
}

export default DispatchOptimizationService;
