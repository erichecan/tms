import axios from 'axios';
import { 
  AddressInfo, 
  LogisticsRouteRequest, 
  LogisticsRouteResponse,
  DispatchMatrixRequest,
  DispatchMatrixResponse,
  GoogleMapsApiConfig,
  MapsApiError 
} from '@/types/maps';

export class MapsApiService {
  private config: GoogleMapsApiConfig;
  private cache: Map<string, any> = new Map();
  private usageStats = {
    geocoding: 0,
    directions: 0,
    distanceMatrix: 0,
    places: 0,
  };

  constructor(config: GoogleMapsApiConfig) {
    this.config = config;
  }

  // 地址解析（Geocoding）
  async geocodeAddress(address: string): Promise<AddressInfo> {
    const cacheKey = `geocode:${address}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && new Date() < cached.expiresAt) {
      return cached.result;
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.config.apiKey,
          region: 'ca',
          language: 'en',
        },
      });

      this.usageStats.geocoding++;

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const addressInfo: AddressInfo = {
          formattedAddress: result.formatted_address,
          latitude: result.geometry.location.lat,
          longitude: result.geometry.location.lng,
          placeId: result.place_id,
        };

        // 解析地址组件
        result.address_components.forEach((component: any) => {
          if (component.types.includes('locality')) {
            addressInfo.city = component.long_name;
          } else if (component.types.includes('administrative_area_level_1')) {
            addressInfo.province = component.long_name;
          } else if (component.types.includes('postal_code')) {
            addressInfo.postalCode = component.long_name;
          } else if (component.types.includes('country')) {
            addressInfo.country = component.long_name;
          }
        });

        // 缓存结果（24小时）
        this.cache.set(cacheKey, {
          result: addressInfo,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return addressInfo;
      } else {
        throw new Error(`Geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Geocoding API error:', error);
      throw this.handleApiError(error);
    }
  }

  // 反向地址解析
  async reverseGeocode(lat: number, lng: number): Promise<AddressInfo> {
    const cacheKey = `reverse:${lat},${lng}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && new Date() < cached.expiresAt) {
      return cached.result;
    }

    try {
      const response = await axios.get(`${this.config.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.config.apiKey,
          region: 'ca',
          language: 'en',
        },
      });

      this.usageStats.geocoding++;

      if (response.data.status === 'OK' && response.data.results.length > 0) {
        const result = response.data.results[0];
        const addressInfo: AddressInfo = {
          formattedAddress: result.formatted_address,
          latitude: lat,
          longitude: lng,
          placeId: result.place_id,
        };

        // 缓存结果（24小时）
        this.cache.set(cacheKey, {
          result: addressInfo,
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });

        return addressInfo;
      } else {
        throw new Error(`Reverse geocoding failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Reverse geocoding API error:', error);
      throw this.handleApiError(error);
    }
  }

  // 计算物流路线
  async calculateLogisticsRoute(request: LogisticsRouteRequest): Promise<LogisticsRouteResponse> {
    const cacheKey = this.generateRouteCacheKey(request);
    const cached = this.cache.get(cacheKey);
    
    if (cached && new Date() < cached.expiresAt) {
      return cached.result;
    }

    try {
      // 计算主要路线
      const routeResponse = await axios.get(`${this.config.baseUrl}/directions/json`, {
        params: {
          origin: `${request.pickupAddress.latitude},${request.pickupAddress.longitude}`,
          destination: `${request.deliveryAddress.latitude},${request.deliveryAddress.longitude}`,
          key: this.config.apiKey,
          mode: 'driving',
          alternatives: false,
          avoid: 'ferries',
          units: 'metric',
          departure_time: 'now',
          traffic_model: 'best_guess',
        },
      });

      this.usageStats.directions++;

      if (routeResponse.data.status === 'OK' && routeResponse.data.routes.length > 0) {
        const route = routeResponse.data.routes[0];
        const legs = route.legs;

        const segments = legs.map((leg: any) => ({
          distance: leg.distance.value,
          duration: leg.duration.value,
          startAddress: request.pickupAddress,
          endAddress: request.deliveryAddress,
          instructions: leg.steps.map((step: any) => step.html_instructions),
        }));

        const totalDistance = legs.reduce((sum: number, leg: any) => sum + leg.distance.value, 0);
        const totalDuration = legs.reduce((sum: number, leg: any) => sum + leg.duration.value, 0);

        // 计算返程路线（针对垃圾清运和仓库转运）
        let returnRoute = undefined;
        if (request.businessType === 'WASTE_COLLECTION' || request.businessType === 'WAREHOUSE_TRANSFER') {
          try {
            const returnResponse = await axios.get(`${this.config.baseUrl}/directions/json`, {
              params: {
                origin: `${request.deliveryAddress.latitude},${request.deliveryAddress.longitude}`,
                destination: `${request.pickupAddress.latitude},${request.pickupAddress.longitude}`,
                key: this.config.apiKey,
                mode: 'driving',
                units: 'metric',
                departure_time: 'now',
              },
            });

            if (returnResponse.data.status === 'OK' && returnResponse.data.routes.length > 0) {
              const returnLeg = returnResponse.data.routes[0].legs[0];
              returnRoute = {
                distance: returnLeg.distance.value,
                duration: returnLeg.duration.value,
                startAddress: request.deliveryAddress,
                endAddress: request.pickupAddress,
              };
            }
          } catch (error) {
            console.warn('Return route calculation failed, using estimate:', error);
          }
        }

        // 计算成本
        const costBreakdown = this.calculateCostBreakdown(request, totalDistance, totalDuration, returnRoute);

        const response: LogisticsRouteResponse = {
          optimalRoute: {
            distance: totalDistance / 1000, // 转换为km
            duration: totalDuration / 60, // 转换为分钟
            fuelCost: this.calculateFuelCost(totalDistance / 1000),
            segments,
            returnRoute,
          },
          costBreakdown,
          estimatedArrival: new Date(Date.now() + totalDuration * 1000).toISOString(),
        };

        // 缓存结果（1小时，考虑交通变化）
        this.cache.set(cacheKey, {
          result: response,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000),
        });

        return response;
      } else {
        throw new Error(`Directions calculation failed: ${routeResponse.data.status}`);
      }
    } catch (error) {
      console.error('Directions API error:', error);
      throw this.handleApiError(error);
    }
  }

  // 计算调度距离矩阵
  async calculateDispatchMatrix(request: DispatchMatrixRequest): Promise<DispatchMatrixResponse> {
    try {
      const origins = request.drivers.map(driver => 
        `${driver.currentLocation.latitude},${driver.currentLocation.longitude}`
      );
      const destinations = request.shipments.map(shipment => 
        `${shipment.pickupAddress.latitude},${shipment.pickupAddress.longitude}`
      );

      const response = await axios.get(`${this.config.baseUrl}/distancematrix/json`, {
        params: {
          origins: origins.join('|'),
          destinations: destinations.join('|'),
          key: this.config.apiKey,
          mode: 'driving',
          units: 'metric',
          departure_time: 'now',
          traffic_model: 'best_guess',
        },
      });

      this.usageStats.distanceMatrix++;

      if (response.data.status === 'OK') {
        const assignments = this.optimizeAssignments(response.data, request);
        return assignments;
      } else {
        throw new Error(`Distance matrix calculation failed: ${response.data.status}`);
      }
    } catch (error) {
      console.error('Distance matrix API error:', error);
      throw this.handleApiError(error);
    }
  }

  // 优化调度分配（简化版）
  private optimizeAssignments(data: any, request: DispatchMatrixRequest): DispatchMatrixResponse {
    const assignments = [];
    let totalCost = 0;
    let totalDistance = 0;
    let totalDuration = 0;

    // 简单的贪心算法：为每个运单分配最近的可用司机
    const availableDrivers = [...request.drivers];
    const unassignedShipments = [...request.shipments];

    while (unassignedShipments.length > 0 && availableDrivers.length > 0) {
      let bestAssignment = null;
      let bestCost = Infinity;

      for (const shipment of unassignedShipments) {
        for (const driver of availableDrivers) {
          const driverIndex = request.drivers.indexOf(driver);
          const shipmentIndex = request.shipments.indexOf(shipment);
          
          const element = data.rows[driverIndex]?.elements[shipmentIndex];
          if (element?.status === 'OK') {
            const distance = element.distance.value;
            const duration = element.duration.value;
            const cost = this.calculateAssignmentCost(driver, shipment, distance, duration);

            if (cost < bestCost) {
              bestAssignment = { driver, shipment, distance, duration, cost };
              bestCost = cost;
            }
          }
        }
      }

      if (bestAssignment) {
        assignments.push({
          driverId: bestAssignment.driver.id,
          shipmentId: bestAssignment.shipment.id,
          cost: bestAssignment.cost,
          distance: bestAssignment.distance,
          duration: bestAssignment.duration,
          route: {} as any, // 简化版，实际需要计算完整路线
        });

        totalCost += bestAssignment.cost;
        totalDistance += bestAssignment.distance;
        totalDuration += bestAssignment.duration;

        // 移除已分配的司机和运单
        availableDrivers.splice(availableDrivers.indexOf(bestAssignment.driver), 1);
        unassignedShipments.splice(unassignedShipments.indexOf(bestAssignment.shipment), 1);
      } else {
        break;
      }
    }

    return {
      assignments,
      totalCost,
      totalSavings: this.calculateSavings(assignments, request),
      optimizationMetrics: {
        averageLoadFactor: this.calculateLoadFactor(assignments, request),
        totalDistance,
        totalDuration,
      },
    };
  }

  // 成本计算辅助方法
  private calculateCostBreakdown(
    request: LogisticsRouteRequest, 
    distance: number, 
    duration: number,
    returnRoute?: any
  ): CostBreakdown {
    const distanceKm = distance / 1000;
    const durationHours = duration / 3600;

    // 基础成本
    const baseCost = 80; // CAD $80 起步价
    const distanceCost = distanceKm * 2.00; // CAD $2.00/km
    const cargoHandlingCost = request.cargoInfo.pallets * 5; // CAD $5/托盘
    
    // 时间成本
    const driverHourlyRate = 25; // CAD $25/hour
    const timeCost = durationHours * driverHourlyRate;
    
    // 等待成本
    const waitingCost = (request.waitingTimeLimit / 60) * 20; // CAD $20/hour
    
    // 燃油成本
    const fuelCost = this.calculateFuelCost(distanceKm);
    
    // 返程成本（如果有）
    let returnCost = 0;
    if (returnRoute) {
      returnCost = this.calculateFuelCost(returnRoute.distance / 1000) + 
                  (returnRoute.duration / 3600) * driverHourlyRate;
    }
    
    // 业务场景调整
    let scenarioAdjustment = 0;
    if (request.businessType === 'WASTE_COLLECTION') {
      scenarioAdjustment = -15; // 垃圾清运内部折扣
    } else if (request.businessType === 'WAREHOUSE_TRANSFER') {
      scenarioAdjustment = 20; // 仓库转运补贴
    }
    
    const subtotal = baseCost + distanceCost + cargoHandlingCost + timeCost + waitingCost + fuelCost + returnCost + scenarioAdjustment;
    
    return {
      baseCost,
      distanceCost,
      cargoHandlingCost,
      waitingCost,
      fuelCost,
      tollCost: 0, // 简化版，实际需要从API获取
      scenarioAdjustment,
      customerPremium: 0, // 简化版
      totalCost: subtotal,
    };
  }

  private calculateFuelCost(distanceKm: number): number {
    const fuelEfficiency = 8; // 升/100km
    const fuelPrice = 1.5; // CAD/升
    return (distanceKm * fuelEfficiency * fuelPrice) / 100;
  }

  private calculateAssignmentCost(driver: any, shipment: any, distance: number, duration: number): number {
    const distanceKm = distance / 1000;
    const durationHours = duration / 3600;
    
    return 80 + (distanceKm * 2.00) + (durationHours * 25) + (shipment.cargoInfo.pallets * 5);
  }

  private calculateSavings(assignments: any[], request: DispatchMatrixRequest): number {
    // 简化版：计算相对于单独配送的节省
    const individualCost = request.shipments.reduce((sum, shipment) => {
      return sum + 80 + (100 * 2.00) + (2 * 25) + (shipment.cargoInfo.pallets * 5); // 假设平均距离100km，时间2小时
    }, 0);
    
    const optimizedCost = assignments.reduce((sum, assignment) => sum + assignment.cost, 0);
    
    return individualCost - optimizedCost;
  }

  private calculateLoadFactor(assignments: any[], request: DispatchMatrixRequest): number {
    if (assignments.length === 0) return 0;
    
    const totalCapacity = request.drivers.reduce((sum, driver) => sum + driver.capacity, 0);
    const totalWeight = assignments.reduce((sum, assignment) => {
      const shipment = request.shipments.find(s => s.id === assignment.shipmentId);
      return sum + (shipment?.cargoInfo.weight || 0);
    }, 0);
    
    return totalWeight / totalCapacity;
  }

  private generateRouteCacheKey(request: LogisticsRouteRequest): string {
    return `route:${request.pickupAddress.latitude},${request.pickupAddress.longitude}-${request.deliveryAddress.latitude},${request.deliveryAddress.longitude}-${request.businessType}`;
  }

  private handleApiError(error: any): MapsApiError {
    if (axios.isAxiosError(error)) {
      return {
        code: error.response?.status || 500,
        message: error.response?.data?.error_message || error.message,
        details: error.response?.data?.status,
      };
    }
    
    return {
      code: 500,
      message: error.message || 'Unknown API error',
    };
  }

  // 获取使用统计
  getUsageStats() {
    return { ...this.usageStats };
  }

  // 清空缓存
  clearCache(): void {
    this.cache.clear();
  }
}

// 创建默认配置的服务实例
const defaultConfig: GoogleMapsApiConfig = {
  apiKey: process.env.GOOGLE_MAPS_API_KEY || '',
  baseUrl: 'https://maps.googleapis.com/maps/api',
  rateLimit: {
    requestsPerMinute: 50,
    requestsPerDay: 2500,
  },
  cacheConfig: {
    geocodingTtl: 24 * 60 * 60, // 24小时
    directionsTtl: 60 * 60, // 1小时
    distanceMatrixTtl: 30 * 60, // 30分钟
  },
};

export const mapsApiService = new MapsApiService(defaultConfig);
export default mapsApiService;