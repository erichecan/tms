// 后端地图服务类型定义
export interface AddressInfo {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
}

export interface RouteSegment {
  distance: number; // 距离（米）
  duration: number; // 时间（秒）
  startAddress: AddressInfo;
  endAddress: AddressInfo;
  polyline?: string;
  instructions?: string[];
}

export interface LogisticsRouteRequest {
  pickupAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  businessType: 'WASTE_COLLECTION' | 'WAREHOUSE_TRANSFER' | 'CUSTOMER_DELIVERY' | 'MULTI_ORDER';
  cargoInfo: {
    weight: number;
    volume: number;
    pallets: number;
    hazardous: boolean;
  };
  requiresAppointment: boolean;
  appointmentTime?: string;
  waitingTimeLimit: number;
}

export interface LogisticsRouteResponse {
  optimalRoute: {
    distance: number; // 总距离（km）
    duration: number; // 总时间（分钟）
    fuelCost: number; // 燃油成本（CAD）
    tolls?: number; // 过路费
    returnRoute?: RouteSegment; // 返程路径
    segments: RouteSegment[];
  };
  costBreakdown: CostBreakdown;
  estimatedArrival: string;
}

export interface CostBreakdown {
  baseCost: number;
  distanceCost: number;
  cargoHandlingCost: number;
  waitingCost: number;
  fuelCost: number;
  tollCost: number;
  scenarioAdjustment: number;
  customerPremium: number;
  totalCost: number;
}

export interface DispatchMatrixRequest {
  drivers: Array<{
    id: string;
    currentLocation: AddressInfo;
    vehicleType: string;
    capacity: number;
  }>;
  shipments: Array<{
    id: string;
    pickupAddress: AddressInfo;
    deliveryAddress: AddressInfo;
    cargoInfo: {
      weight: number;
      volume: number;
      pallets: number;
    };
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    requiredBy?: string;
  }>;
}

export interface DispatchMatrixResponse {
  assignments: Array<{
    driverId: string;
    shipmentId: string;
    cost: number;
    distance: number;
    duration: number;
    route: LogisticsRouteResponse;
  }>;
  totalCost: number;
  totalSavings: number;
  optimizationMetrics: {
    averageLoadFactor: number;
    totalDistance: number;
    totalDuration: number;
  };
}

export interface GoogleMapsApiConfig {
  apiKey: string;
  baseUrl: string;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerDay: number;
  };
  cacheConfig: {
    geocodingTtl: number; // 地址解析缓存时间（秒）
    directionsTtl: number; // 路线缓存时间（秒）
    distanceMatrixTtl: number; // 距离矩阵缓存时间（秒）
  };
}

export interface ApiUsageStats {
  date: string;
  apiCalls: {
    geocoding: number;
    directions: number;
    distanceMatrix: number;
    places: number;
  };
  costEstimate: number;
  cacheHitRate: number;
}

// Google Maps API 错误类型
export interface MapsApiError {
  code: number;
  message: string;
  details?: string;
  retryAfter?: number;
}

// 缓存数据结构
export interface CachedRouteData {
  hash: string;
  route: LogisticsRouteResponse;
  createdAt: Date;
  expiresAt: Date;
  usageCount: number;
}

export interface CachedGeocodeData {
  address: string;
  result: AddressInfo;
  createdAt: Date;
  expiresAt: Date;
}