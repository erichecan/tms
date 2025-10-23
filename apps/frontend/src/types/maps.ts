// ============================================================================
// Google Maps 相关类型定义 - 二期开发功能
// 创建时间: 2025-10-10 16:35:00
// 状态: 已注释，二期恢复
// 说明: 此文件包含Google Maps API相关的TypeScript类型定义，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保类型定义正确
// ============================================================================

export interface AddressInfo {
  formattedAddress: string;
  latitude: number;
  longitude: number;
  placeId?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  street?: string;
}

export interface LogisticsRoute {
  businessType: 'WASTE_COLLECTION' | 'WAREHOUSE_TRANSFER' | 'CUSTOMER_DELIVERY' | 'MULTI_DELIVERY';
  cargoInfo: {
    weight: number;
    volume: number;
    pallets: number;
    hazardous: boolean;
  };
  pickupAddress: AddressInfo;
  deliveryAddress: AddressInfo;
  warehouseId?: string;
  requiresAppointment: boolean;
  appointmentTime?: string;
  waitingTimeLimit: number;
  optimalRoute: {
    distance: number; // km
    duration: number; // minutes
    fuelCost: number; // CAD
    tolls?: number;
    returnRoute?: RouteSegment;
    segments?: RouteSegment[];
  };
}

export interface RouteSegment {
  distance: number;
  duration: number;
  startAddress: AddressInfo;
  endAddress: AddressInfo;
  instructions?: string[];
}

export interface GeocodingResponse {
  results: google.maps.GeocoderResult[];
  status: string;
}

export interface DirectionsResponse {
  routes: google.maps.DirectionsRoute[];
  status: string;
}

export interface DistanceMatrixResponse {
  rows: google.maps.DistanceMatrixResponseRow[];
  status: string;
}

export interface MapsConfig {
  apiKey: string;
  libraries: string[];
  language: string;
  region: string;
  mapOptions?: {
    center: { lat: number; lng: number };
    zoom: number;
    mapTypeControl?: boolean;
    streetViewControl?: boolean;
  };
}

export interface RoutePricingInfo {
  distance: number;
  duration: number;
  baseCost: number;
  distanceCost: number;
  fuelCost: number;
  tollCost: number;
  totalCost: number;
  breakdown: {
    basePrice: number;
    distanceFee: number;
    fuelFee: number;
    tollFee: number;
    surcharges: number;
  };
}
