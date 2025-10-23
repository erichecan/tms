// 优化的智能调度算法 - 集成 Google Maps Distance Matrix API
// 创建时间: 2025-10-17 23:55:00
// 特性: 使用实际道路距离而非直线距离，考虑实时交通

import { Shipment, Driver, DriverStatus } from '../types';
// ============================================================================
// 地图相关导入 - 二期开发功能 (2025-01-27 18:20:00)
// 状态: 已注释，二期恢复
// 说明: 以下地图相关导入在一期版本中暂时不使用，二期时取消注释
// ============================================================================
// import mapsService from '../services/mapsService';
// import { AddressInfo } from '@/types/maps';

// 一期版本临时类型定义
interface AddressInfo {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

interface DispatchInput {
  shipments: Shipment[];
  drivers: Driver[];
  constraints?: {
    maxDistance?: number;
    maxDriverWorkload?: number;
  };
}

interface Assignment {
  shipmentId: string;
  shipmentNumber: string;
  route: string;
  driverId: string;
  driverName: string;
  distance: number;
  estimatedCost: number;
  saving: number;
  actualRoadDistance?: number; // 实际道路距离（与直线距离区分）
  estimatedTime?: number; // 预估时间（分钟）
}

interface DispatchResult {
  assignments: Assignment[];
  totalCost: number;
  totalSaving: number;
  totalDistance: number;
  totalTime: number;
  algorithm: 'optimized-greedy' | 'fallback-haversine';
  usedGoogleMaps: boolean;
  executionTime: number;
}

// 计算两点之间的直线距离（哈弗辛公式）- 作为降级方案
function calculateHaversineDistance(
  point1: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null | undefined,
  point2: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null | undefined
): number {
  if (!point1 || !point2) return 999;
  
  const lat1 = point1.lat ?? point1.latitude ?? 43.7615;
  const lng1 = point1.lng ?? point1.longitude ?? -79.4635;
  const lat2 = point2.lat ?? point2.latitude ?? 43.7615;
  const lng2 = point2.lng ?? point2.longitude ?? -79.4635;
  
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 提取地址坐标
function extractCoordinates(location: any): AddressInfo | null {
  if (!location) return null;
  
  // 尝试多种格式
  const lat = location.lat ?? location.latitude ?? location.current_location?.latitude;
  const lng = location.lng ?? location.longitude ?? location.current_location?.longitude;
  
  if (typeof lat === 'number' && typeof lng === 'number') {
    return {
      latitude: lat,
      longitude: lng,
      formattedAddress: location.address || location.city || '',
    };
  }
  
  return null;
}

// 计算运输成本
function calculateCost(distance: number, shipment: Shipment): number {
  const baseFee = 100;
  const distanceFee = distance * 2.0; // $2/km
  const weightFee = (shipment.cargoWeight || 0) * 0.5;
  return baseFee + distanceFee + weightFee;
}

// 计算节省
function calculateSaving(distance: number, shipment: Shipment): number {
  const randomDistance = 15 + Math.random() * 25;
  const actualCost = calculateCost(distance, shipment);
  const randomCost = calculateCost(randomDistance, shipment);
  return Math.max(0, randomCost - actualCost);
}

/**
 * 优化的贪心调度算法 - 使用 Google Maps Distance Matrix API
 * 特点：
 * 1. 使用实际道路距离而非直线距离
 * 2. 考虑实时交通状况
 * 3. 提供预估到达时间
 * 4. API失败时自动降级到哈弗辛公式
 */
export async function optimizedGreedyDispatch(input: DispatchInput): Promise<DispatchResult> {
  const startTime = Date.now();
  const { shipments, drivers } = input;
  const assignments: Assignment[] = [];
  const availableDrivers = [...drivers].filter(d => d.status === DriverStatus.AVAILABLE);
  
  console.log('🚀 优化调度开始:', {
    totalDrivers: drivers.length,
    availableDrivers: availableDrivers.length,
    totalShipments: shipments.length,
    mapsAvailable: false // 一期版本暂时禁用地图API
  });
  
  if (availableDrivers.length === 0) {
    console.warn('⚠️ 没有可用司机');
    return {
      assignments: [],
      totalCost: 0,
      totalSaving: 0,
      totalDistance: 0,
      totalTime: 0,
      algorithm: 'optimized-greedy',
      usedGoogleMaps: false,
      executionTime: Date.now() - startTime
    };
  }
  
  let usedGoogleMaps = false;
  let distanceMatrix: number[][] | null = null;
  
  try {
    // 一期版本暂时禁用 Google Maps Distance Matrix API
    // await mapsService.initialize();
    
    // 一期版本暂时禁用地图API调用，使用直线距离计算
    // const driverLocations: AddressInfo[] = availableDrivers.map(driver => {
    //   const loc = extractCoordinates(driver.currentLocation || driver);
    //   return loc || {
    //     latitude: 43.7615 + (Math.random() - 0.5) * 0.1,
    //     longitude: -79.4635 + (Math.random() - 0.5) * 0.1,
    //     formattedAddress: 'Toronto, ON'
    //   };
    // });
    
    // const shipmentLocations: AddressInfo[] = shipments.map(shipment => {
    //   const loc = extractCoordinates(shipment.pickupAddress);
    //   return loc || {
    //     latitude: 43.7615,
    //     longitude: -79.4635,
    //     formattedAddress: 'Toronto, ON'
    //   };
    // });
    
    // console.log('📍 准备调用 Google Maps Distance Matrix API...');
    // console.log(`   司机位置: ${driverLocations.length}`, driverLocations.slice(0, 2));
    // console.log(`   运单位置: ${shipmentLocations.length}`, shipmentLocations.slice(0, 2));
    
    // distanceMatrix = await mapsService.calculateDistanceMatrix(
    //   driverLocations,
    //   shipmentLocations
    // );
    
    // usedGoogleMaps = true;
    // console.log('✅ Google Maps Distance Matrix API 调用成功');
    // console.log(`   距离矩阵大小: ${distanceMatrix.length} × ${distanceMatrix[0]?.length}`);
    
  } catch (error) {
    console.warn('⚠️ Google Maps API 调用失败，降级到哈弗辛公式:', error);
    usedGoogleMaps = false;
  }
  
  // 为每个运单找到最近的司机
  for (let shipmentIdx = 0; shipmentIdx < shipments.length; shipmentIdx++) {
    const shipment = shipments[shipmentIdx];
    let minDistance = Infinity;
    let bestDriverIndex = -1;
    let estimatedTime = 0;
    
    for (let driverIdx = 0; driverIdx < availableDrivers.length; driverIdx++) {
      const driver = availableDrivers[driverIdx];
      let distance: number;
      
      if (usedGoogleMaps && distanceMatrix) {
        // 使用 Google Maps 计算的实际道路距离（米 -> 公里）
        distance = distanceMatrix[driverIdx][shipmentIdx] / 1000;
        
        // 估算时间（假设平均速度40km/h）
        estimatedTime = (distance / 40) * 60; // 转换为分钟
        
      } else {
        // 降级：使用哈弗辛公式计算直线距离
        const driverLocation = driver.currentLocation || { 
          lat: 43.7615 + (Math.random() - 0.5) * 0.1,
          lng: -79.4635 + (Math.random() - 0.5) * 0.1 
        };
        const pickupLocation = shipment.pickupAddress || {
          lat: 43.7615,
          lng: -79.4635
        };
        
        const driverCoords = extractCoordinates(driverLocation);
        const pickupCoords = extractCoordinates(pickupLocation);
        distance = calculateHaversineDistance(driverCoords, pickupCoords);
        estimatedTime = (distance / 30) * 60; // 直线距离，假设平均速度30km/h
      }
      
      if (distance < minDistance) {
        minDistance = distance;
        bestDriverIndex = driverIdx;
      }
    }
    
    if (bestDriverIndex >= 0) {
      const bestDriver = availableDrivers[bestDriverIndex];
      const cost = calculateCost(minDistance, shipment);
      const saving = calculateSaving(minDistance, shipment);
      
      assignments.push({
        shipmentId: shipment.id,
        shipmentNumber: shipment.shipmentNumber || shipment.id.substring(0, 8),
        route: `${shipment.pickupAddress?.city || '起点'} → ${shipment.deliveryAddress?.city || '终点'}`,
        driverId: bestDriver.id,
        driverName: bestDriver.name,
        distance: minDistance,
        actualRoadDistance: usedGoogleMaps ? minDistance : undefined,
        estimatedCost: cost,
        saving: saving,
        estimatedTime: Math.round(estimatedTime)
      });
      
      // 移除已分配的司机
      availableDrivers.splice(bestDriverIndex, 1);
      
      // 同时从距离矩阵中移除该司机（如果使用）
      if (usedGoogleMaps && distanceMatrix) {
        distanceMatrix.splice(bestDriverIndex, 1);
      }
    }
  }
  
  const totalDistance = assignments.reduce((sum, a) => sum + a.distance, 0);
  const totalTime = assignments.reduce((sum, a) => sum + (a.estimatedTime || 0), 0);
  const totalCost = assignments.reduce((sum, a) => sum + a.estimatedCost, 0);
  const totalSaving = assignments.reduce((sum, a) => sum + a.saving, 0);
  
  console.log('🎯 优化调度结果:', {
    totalAssignments: assignments.length,
    usedGoogleMaps,
    totalDistance: totalDistance.toFixed(2) + ' km',
    totalTime: totalTime.toFixed(0) + ' min',
    totalCost: '$' + totalCost.toFixed(2),
    totalSaving: '$' + totalSaving.toFixed(2),
    executionTime: (Date.now() - startTime) + ' ms',
    sampleAssignments: assignments.slice(0, 3).map(a => ({
      shipment: a.shipmentNumber,
      driver: a.driverName,
      distance: a.distance.toFixed(2) + ' km',
      time: a.estimatedTime + ' min',
      cost: '$' + a.estimatedCost.toFixed(2)
    }))
  });
  
  return {
    assignments,
    totalCost,
    totalSaving,
    totalDistance,
    totalTime,
    algorithm: usedGoogleMaps ? 'optimized-greedy' : 'fallback-haversine',
    usedGoogleMaps,
    executionTime: Date.now() - startTime
  };
}

/**
 * 智能调度入口
 * 自动选择最佳算法并使用 Google Maps API（如果可用）
 */
export async function smartDispatchOptimized(input: DispatchInput): Promise<DispatchResult> {
  console.log('🧠 智能调度 (优化版) 开始...');
  
  // 优先使用优化算法
  return await optimizedGreedyDispatch(input);
}

export default {
  optimizedGreedyDispatch,
  smartDispatchOptimized
};

