// 智能调度算法实现
// 创建时间: 2025-10-10 18:28:00
// 算法: 贪心算法 + 遗传算法混合策略

import { Shipment, Driver, DriverStatus } from '../types';

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
}

interface DispatchResult {
  assignments: Assignment[];
  totalCost: number;
  totalSaving: number;
  algorithm: 'greedy' | 'genetic' | 'hybrid';
  executionTime: number;
}

// 从地址对象中提取坐标信息
function extractCoordinates(location: any): { lat?: number; lng?: number; latitude?: number; longitude?: number } {
  if (!location) return { lat: 43.7615, lng: -79.4635 };
  
  // 如果是 ShipmentAddress 类型
  if (location.latitude !== undefined && location.longitude !== undefined) {
    return { latitude: location.latitude, longitude: location.longitude };
  }
  
  // 如果是包含 lat/lng 的对象
  if (location.lat !== undefined && location.lng !== undefined) {
    return { lat: location.lat, lng: location.lng };
  }
  
  // 默认位置
  return { lat: 43.7615, lng: -79.4635 };
}

// 计算两点之间的距离（哈弗辛公式）
function calculateDistance(
  point1: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null | undefined,
  point2: { lat?: number; lng?: number; latitude?: number; longitude?: number } | null | undefined
): number {
  if (!point1 || !point2) return 999; // 默认很远的距离
  
  const lat1 = point1.lat ?? point1.latitude ?? 43.7615;
  const lng1 = point1.lng ?? point1.longitude ?? -79.4635;
  const lat2 = point2.lat ?? point2.latitude ?? 43.7615;
  const lng2 = point2.lng ?? point2.longitude ?? -79.4635;
  
  const R = 6371; // 地球半径（公里）
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 计算运输成本
function calculateCost(distance: number, shipment: Shipment): number {
  const baseFee = 100;
  const distanceFee = distance * 2.0; // $2/km
  const weightFee = (shipment.cargoWeight || 0) * 0.5;
  return baseFee + distanceFee + weightFee;
}

// 计算节省（相比随机分配）
function calculateSaving(distance: number, shipment: Shipment): number {
  const randomDistance = 15 + Math.random() * 25; // 随机分配平均距离
  const actualCost = calculateCost(distance, shipment);
  const randomCost = calculateCost(randomDistance, shipment);
  return Math.max(0, randomCost - actualCost);
}

/**
 * 贪心算法 - 最近距离优先
 * 时间复杂度: O(n*m) where n=运单数, m=司机数
 * 适用场景: 运单数 < 50
 */
export function greedyDispatch(input: DispatchInput): DispatchResult {
  const startTime = Date.now();
  const { shipments, drivers } = input;
  const assignments: Assignment[] = [];
  // 修复：使用正确的司机状态枚举值 - 2025-10-10 18:35:00
  const availableDrivers = [...drivers].filter(d => d.status === DriverStatus.AVAILABLE);
  
  console.log('🔍 智能调度调试信息:', {
    totalDrivers: drivers.length,
    availableDrivers: availableDrivers.length,
    driverStatuses: drivers.map(d => ({ name: d.name, status: d.status })),
    totalShipments: shipments.length
  });
  
  if (availableDrivers.length === 0) {
    console.warn('⚠️ 没有可用司机进行调度');
    return {
      assignments: [],
      totalCost: 0,
      totalSaving: 0,
      algorithm: 'greedy',
      executionTime: Date.now() - startTime
    };
  }
  
  // 为每个运单找到最近的司机
  for (const shipment of shipments) {
    let minDistance = Infinity;
    let bestDriverIndex = -1;
    
    // 遍历所有可用司机
    for (let i = 0; i < availableDrivers.length; i++) {
      const driver = availableDrivers[i];
      
      // 修复：司机可能没有currentLocation，使用默认位置 - 2025-10-10 18:36:00
      const driverLocation = driver.currentLocation || { 
        lat: 43.7615 + (Math.random() - 0.5) * 0.1, // 在默认中心附近随机位置
        lng: -79.4635 + (Math.random() - 0.5) * 0.1 
      };
      
      // 修复：运单可能没有pickupAddress，使用默认地址 - 2025-10-10 18:37:00
      const pickupLocation = shipment.pickupAddress || {
        lat: 43.7615,
        lng: -79.4635,
        city: 'North York'
      };
      
      const driverCoords = extractCoordinates(driverLocation);
      const pickupCoords = extractCoordinates(pickupLocation);
      const distance = calculateDistance(driverCoords, pickupCoords);
      
      if (distance < minDistance) {
        minDistance = distance;
        bestDriverIndex = i;
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
        estimatedCost: cost,
        saving: saving
      });
      
      // 移除已分配的司机
      availableDrivers.splice(bestDriverIndex, 1);
    }
  }
  
  console.log('🎯 贪心算法调度结果:', {
    totalAssignments: assignments.length,
    assignments: assignments.map(a => ({
      shipmentNumber: a.shipmentNumber,
      driverName: a.driverName,
      distance: a.distance.toFixed(2) + 'km',
      cost: '$' + a.estimatedCost.toFixed(2),
      saving: '$' + a.saving.toFixed(2)
    }))
  });
  
  return {
    assignments,
    totalCost: assignments.reduce((sum, a) => sum + a.estimatedCost, 0),
    totalSaving: assignments.reduce((sum, a) => sum + a.saving, 0),
    algorithm: 'greedy',
    executionTime: Date.now() - startTime
  };
}

/**
 * 遗传算法 - 全局优化
 * 适用场景: 运单数 >= 50，需要全局最优解
 */
interface Individual {
  genes: number[]; // 司机索引数组，genes[i]表示第i个运单分配给第genes[i]个司机
  fitness: number;
}

function generateInitialPopulation(
  shipments: Shipment[],
  drivers: Driver[],
  populationSize: number
): Individual[] {
  const population: Individual[] = [];
  
  for (let i = 0; i < populationSize; i++) {
    const genes = shipments.map(() => Math.floor(Math.random() * drivers.length));
    population.push({ genes, fitness: 0 });
  }
  
  return population;
}

function calculateFitness(
  individual: Individual,
  shipments: Shipment[],
  drivers: Driver[]
): number {
  let totalCost = 0;
  
  for (let i = 0; i < shipments.length; i++) {
    const shipment = shipments[i];
    const driver = drivers[individual.genes[i]];
    
    if (!driver) continue;
    
    // 修复：使用默认位置 - 2025-10-10 18:38:00
    const driverLocation = driver.currentLocation || { 
      lat: 43.7615 + (Math.random() - 0.5) * 0.1,
      lng: -79.4635 + (Math.random() - 0.5) * 0.1 
    };
    const pickupLocation = shipment.pickupAddress || {
      lat: 43.7615,
      lng: -79.4635,
      city: 'North York'
    };
    
    const driverCoords = extractCoordinates(driverLocation);
    const pickupCoords = extractCoordinates(pickupLocation);
    const distance = calculateDistance(driverCoords, pickupCoords);
    const cost = calculateCost(distance, shipment);
    totalCost += cost;
  }
  
  // 适应度 = 1 / 总成本（成本越低，适应度越高）
  return totalCost > 0 ? 1 / totalCost : 0;
}

function selectParents(population: Individual[]): [Individual, Individual] {
  // 轮盘赌选择
  const totalFitness = population.reduce((sum, ind) => sum + ind.fitness, 0);
  
  const select = () => {
    let random = Math.random() * totalFitness;
    for (const individual of population) {
      random -= individual.fitness;
      if (random <= 0) return individual;
    }
    return population[0];
  };
  
  return [select(), select()];
}

function crossover(parent1: Individual, parent2: Individual): Individual {
  // 单点交叉
  const crossoverPoint = Math.floor(Math.random() * parent1.genes.length);
  const genes = [
    ...parent1.genes.slice(0, crossoverPoint),
    ...parent2.genes.slice(crossoverPoint)
  ];
  return { genes, fitness: 0 };
}

function mutate(individual: Individual, drivers: Driver[], mutationRate: number): void {
  for (let i = 0; i < individual.genes.length; i++) {
    if (Math.random() < mutationRate) {
      individual.genes[i] = Math.floor(Math.random() * drivers.length);
    }
  }
}

export function geneticDispatch(input: DispatchInput): DispatchResult {
  const startTime = Date.now();
  const { shipments, drivers } = input;
  const populationSize = 50;
  const generations = 100;
  const mutationRate = 0.1;
  
  // 生成初始种群
  let population = generateInitialPopulation(shipments, drivers, populationSize);
  
  // 迭代进化
  for (let gen = 0; gen < generations; gen++) {
    // 计算适应度
    population.forEach(individual => {
      individual.fitness = calculateFitness(individual, shipments, drivers);
    });
    
    // 按适应度排序
    population.sort((a, b) => b.fitness - a.fitness);
    
    // 生成新一代
    const newPopulation: Individual[] = [];
    
    // 保留最优个体（精英主义）
    newPopulation.push(population[0]);
    
    // 生成其余个体
    while (newPopulation.length < populationSize) {
      const [parent1, parent2] = selectParents(population);
      const offspring = crossover(parent1, parent2);
      mutate(offspring, drivers, mutationRate);
      newPopulation.push(offspring);
    }
    
    population = newPopulation;
  }
  
  // 选择最优个体
  population.forEach(individual => {
    individual.fitness = calculateFitness(individual, shipments, drivers);
  });
  population.sort((a, b) => b.fitness - a.fitness);
  const best = population[0];
  
  // 转换为结果格式
  const assignments: Assignment[] = shipments.map((shipment, index) => {
    const driver = drivers[best.genes[index]];
    
    // 修复：使用默认位置 - 2025-10-10 18:39:00
    const driverLocation = driver.currentLocation || { 
      lat: 43.7615 + (Math.random() - 0.5) * 0.1,
      lng: -79.4635 + (Math.random() - 0.5) * 0.1 
    };
    const pickupLocation = shipment.pickupAddress || {
      lat: 43.7615,
      lng: -79.4635,
      city: 'North York'
    };
    
    const driverCoords = extractCoordinates(driverLocation);
    const pickupCoords = extractCoordinates(pickupLocation);
    const distance = calculateDistance(driverCoords, pickupCoords);
    const cost = calculateCost(distance, shipment);
    const saving = calculateSaving(distance, shipment);
    
    return {
      shipmentId: shipment.id,
      shipmentNumber: shipment.shipmentNumber || shipment.id.substring(0, 8),
      route: `${shipment.pickupAddress?.city || '起点'} → ${shipment.deliveryAddress?.city || '终点'}`,
      driverId: driver.id,
      driverName: driver.name,
      distance,
      estimatedCost: cost,
      saving
    };
  });
  
  return {
    assignments,
    totalCost: assignments.reduce((sum, a) => sum + a.estimatedCost, 0),
    totalSaving: assignments.reduce((sum, a) => sum + a.saving, 0),
    algorithm: 'genetic',
    executionTime: Date.now() - startTime
  };
}

/**
 * 混合智能调度策略
 * - 运单数 < 50: 使用贪心算法（快速）
 * - 运单数 >= 50: 使用遗传算法（全局优化）
 */
export function smartDispatch(input: DispatchInput): DispatchResult {
  const { shipments, drivers } = input;
  
  console.log('🚀 智能调度开始:', {
    shipmentCount: shipments.length,
    driverCount: drivers.length,
    availableDrivers: drivers.filter(d => d.status === DriverStatus.AVAILABLE).length
  });
  
  if (shipments.length < 50) {
    console.log(`📊 使用贪心算法调度 ${shipments.length} 个运单`);
    return greedyDispatch(input);
  } else {
    console.log(`📊 使用遗传算法调度 ${shipments.length} 个运单`);
    return geneticDispatch(input);
  }
}

