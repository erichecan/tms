// Google Maps API 类型定义
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

export interface LogisticsRoute {
  // 基础信息
  shipmentId?: string;
  businessType: 'WASTE_COLLECTION' | 'WAREHOUSE_TRANSFER' | 'CUSTOMER_DELIVERY' | 'MULTI_ORDER';
  
  // 货物信息
  cargoInfo: {
    weight: number; // 重量（kg）
    volume: number; // 体积（m³）
    pallets: number; // 托盘数量
    hazardous: boolean; // 危险品
  };
  
  // 地址信息
  pickupAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  
  // 物流特定信息
  warehouseId?: string;
  requiresAppointment: boolean;
  appointmentTime?: string;
  waitingTimeLimit: number; // 等待时间限制（分钟）
  
  // 路径优化结果
  optimalRoute: {
    distance: number; // 总距离（km）
    duration: number; // 总时间（分钟）
    fuelCost: number; // 燃油成本（CAD）
    tolls?: number; // 过路费
    returnRoute?: RouteSegment; // 返程路径
    segments: RouteSegment[];
  };
}

export interface DispatchAssignment {
  driverId: string;
  shipmentId: string;
  vehicleId: string;
  estimatedArrival: string;
  route: LogisticsRoute;
  costBreakdown: CostBreakdown;
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

export interface MapsConfig {
  apiKey: string;
  libraries: string[];
  language: string;
  region: string;
  mapOptions: {
    center: { lat: number; lng: number };
    zoom: number;
    mapTypeControl: boolean;
    streetViewControl: boolean;
  };
}

// Google Maps API 响应类型
export interface GeocodingResponse {
  results: Array<{
    formatted_address: string;
    geometry: {
      location: { lat: number; lng: number };
    };
    place_id: string;
    address_components: Array<{
      long_name: string;
      short_name: string;
      types: string[];
    }>;
  }>;
  status: string;
}

export interface DirectionsResponse {
  routes: Array<{
    legs: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      start_address: string;
      end_address: string;
      steps: Array<{
        distance: { value: number; text: string };
        duration: { value: number; text: string };
        html_instructions: string;
        polyline: { points: string };
      }>;
    }>;
    overview_polyline: { points: string };
  }>;
  status: string;
}

export interface DistanceMatrixResponse {
  rows: Array<{
    elements: Array<{
      distance: { value: number; text: string };
      duration: { value: number; text: string };
      status: string;
    }>;
  }>;
  status: string;
}