// ============================================================================
// Google Maps 统一服务封装
// 创建时间: 2025-01-27 14:35:00
// 说明: 提供统一的 Google Maps API 调用接口，包含调用计数、缓存、去抖和限流
// ============================================================================

import { loadGoogleMaps, isGoogleMapsLoaded } from '../lib/googleMapsLoader';
import { AddressInfo, LogisticsRoute } from '../types/maps';
import LRU from 'lru-cache';

// 2025-01-27 14:35:00 环境变量配置
const DEBOUNCE_MS = Number(import.meta.env.VITE_GM_DEBOUNCE_MS || 400);
const CACHE_TTL_MS = Number(import.meta.env.VITE_GM_CACHE_TTL_MS || 60000); // 默认 1 分钟
const MAX_CALLS_PER_SESSION = Number(import.meta.env.VITE_GM_MAX_CALLS_PER_SESSION || 200);
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// 2025-01-27 14:35:00 调用统计类型
export interface GoogleMapsCallStats {
  total: number;
  byType: Record<string, number>;
  sessionStart: number;
}

// 2025-01-27 14:35:00 调用类型
export type GoogleMapsCallType = 
  | 'js_api_load'
  | 'static_maps'
  | 'geocoding'
  | 'reverse_geocoding'
  | 'distance_matrix'
  | 'directions'
  | 'places_autocomplete'
  | 'places_details'
  | 'elevation';

// 2025-01-27 14:35:00 调用事件
interface GoogleMapsCallEvent {
  type: GoogleMapsCallType;
  paramsDigest: string;
  timestamp: number;
  page: string;
  userId?: string;
  traceId: string;
}

// 2025-01-27 14:35:00 全局统计对象
declare global {
  interface Window {
    __gmStats?: GoogleMapsCallStats;
  }
}

// 2025-01-27 14:35:00 初始化全局统计
if (typeof window !== 'undefined') {
  window.__gmStats = window.__gmStats || {
    total: 0,
    byType: {},
    sessionStart: Date.now(),
  };
}

// 2025-01-27 14:35:00 LRU 缓存
const cache = new LRU<string, any>({
  max: 500,
  ttl: CACHE_TTL_MS,
});

// 2025-01-27 14:35:00 会话调用计数
let sessionCalls = 0;

// 2025-01-27 14:35:00 去抖定时器映射
const debounceTimers = new Map<string, NodeJS.Timeout>();

// 2025-01-27 14:35:00 生成参数摘要（用于缓存键和统计）
function getParamsDigest(type: string, params: any): string {
  try {
    return `${type}:${JSON.stringify(params)}`;
  } catch {
    return `${type}:${String(params)}`;
  }
}

// 2025-01-27 14:35:00 生成 traceId
function generateTraceId(): string {
  return `gm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 2025-01-27 14:35:00 记录调用并检查限流
function countAndCheck(type: GoogleMapsCallType): void {
  sessionCalls++;
  
  if (typeof window !== 'undefined' && window.__gmStats) {
    window.__gmStats.total = sessionCalls;
    window.__gmStats.byType[type] = (window.__gmStats.byType[type] || 0) + 1;
  }

  if (sessionCalls > MAX_CALLS_PER_SESSION) {
    const error = new Error(
      `Google Maps call limit exceeded: ${sessionCalls}/${MAX_CALLS_PER_SESSION}`
    );
    console.error('❌ [Google Maps Service] Call limit exceeded:', {
      sessionCalls,
      maxCalls: MAX_CALLS_PER_SESSION,
      stats: window.__gmStats,
    });
    throw error;
  }
}

// 2025-01-27 14:35:00 上报调用事件（节流）
let telemetryQueue: GoogleMapsCallEvent[] = [];
let telemetryTimer: NodeJS.Timeout | null = null;

function reportTelemetry(event: GoogleMapsCallEvent): void {
  telemetryQueue.push(event);

  // 2025-01-27 14:35:00 每 5 秒批量上报一次
  if (!telemetryTimer) {
    telemetryTimer = setTimeout(() => {
      if (telemetryQueue.length > 0) {
        const events = [...telemetryQueue];
        telemetryQueue = [];

        // 2025-01-27 14:35:00 上报到后端（如果后端支持）
        fetch('/api/telemetry/googlemaps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ events }),
        }).catch(err => {
          console.warn('⚠️ [Google Maps Service] Failed to report telemetry:', err);
        });
      }
      telemetryTimer = null;
    }, 5000);
  }
}

// 2025-01-27 14:35:00 确保 Google Maps API 已加载
async function ensureMapsLoaded(): Promise<typeof google> {
  if (isGoogleMapsLoaded()) {
    return (window as any).google;
  }

  if (!API_KEY) {
    throw new Error('VITE_GOOGLE_MAPS_API_KEY is not configured');
  }

  countAndCheck('js_api_load');
  const googleObj = await loadGoogleMaps(API_KEY, ['places', 'geometry']);
  return googleObj;
}

// 2025-01-27 14:35:00 地址解析（Geocoding）
export async function geocode(address: string): Promise<AddressInfo> {
  const cacheKey = getParamsDigest('geocoding', { address });
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.debug('✅ [Google Maps Service] Geocode cache hit:', address);
    return cached;
  }

  countAndCheck('geocoding');
  const googleObj = await ensureMapsLoaded();
  const geocoder = new googleObj.maps.Geocoder();

  return new Promise<AddressInfo>((resolve, reject) => {
    geocoder.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const addressInfo: AddressInfo = {
          formattedAddress: result.formatted_address,
          latitude: result.geometry.location.lat(),
          longitude: result.geometry.location.lng(),
          placeId: result.place_id,
        };

        // 2025-01-27 14:35:00 解析地址组件
        result.address_components.forEach(component => {
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

        cache.set(cacheKey, addressInfo);
        
        // 2025-01-27 14:35:00 上报调用
        reportTelemetry({
          type: 'geocoding',
          paramsDigest: cacheKey,
          timestamp: Date.now(),
          page: window.location.pathname,
          traceId: generateTraceId(),
        });

        resolve(addressInfo);
      } else {
        reject(new Error(`Geocoding failed: ${status}`));
      }
    });
  });
}

// 2025-01-27 14:35:00 反向地址解析
export async function reverseGeocode(lat: number, lng: number): Promise<AddressInfo> {
  const cacheKey = getParamsDigest('reverse_geocoding', { lat, lng });
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.debug('✅ [Google Maps Service] Reverse geocode cache hit:', { lat, lng });
    return cached;
  }

  countAndCheck('reverse_geocoding');
  const googleObj = await ensureMapsLoaded();
  const geocoder = new googleObj.maps.Geocoder();

  return new Promise<AddressInfo>((resolve, reject) => {
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const result = results[0];
        const addressInfo: AddressInfo = {
          formattedAddress: result.formatted_address,
          latitude: lat,
          longitude: lng,
          placeId: result.place_id,
        };

        cache.set(cacheKey, addressInfo);
        
        // 2025-01-27 14:35:00 上报调用
        reportTelemetry({
          type: 'reverse_geocoding',
          paramsDigest: cacheKey,
          timestamp: Date.now(),
          page: window.location.pathname,
          traceId: generateTraceId(),
        });

        resolve(addressInfo);
      } else {
        reject(new Error(`Reverse geocoding failed: ${status}`));
      }
    });
  });
}

// 2025-01-27 14:35:00 距离矩阵计算（带缓存）
export async function calculateDistanceMatrix(
  origins: Array<{ lat: number; lng: number }>,
  destinations: Array<{ lat: number; lng: number }>
): Promise<number[][]> {
  const cacheKey = getParamsDigest('distance_matrix', { origins, destinations });
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.debug('✅ [Google Maps Service] Distance matrix cache hit');
    return cached;
  }

  countAndCheck('distance_matrix');
  const googleObj = await ensureMapsLoaded();
  const distanceMatrixService = new googleObj.maps.DistanceMatrixService();

  return new Promise<number[][]>((resolve, reject) => {
    distanceMatrixService.getDistanceMatrix(
      {
        origins: origins.map(o => new googleObj.maps.LatLng(o.lat, o.lng)),
        destinations: destinations.map(d => new googleObj.maps.LatLng(d.lat, d.lng)),
        travelMode: googleObj.maps.TravelMode.DRIVING,
        unitSystem: googleObj.maps.UnitSystem.METRIC,
      },
      (response, status) => {
        if (status === 'OK' && response) {
          const matrix = response.rows.map(row =>
            row.elements.map(element =>
              element.status === 'OK' ? element.distance.value : Infinity
            )
          );
          cache.set(cacheKey, matrix);
          
          // 2025-01-27 14:35:00 上报调用
          reportTelemetry({
            type: 'distance_matrix',
            paramsDigest: cacheKey,
            timestamp: Date.now(),
            page: window.location.pathname,
            traceId: generateTraceId(),
          });

          resolve(matrix);
        } else {
          reject(new Error(`Distance matrix calculation failed: ${status}`));
        }
      }
    );
  });
}

// 2025-01-27 14:35:00 路线计算（Directions）
export async function calculateRoute(
  origin: AddressInfo,
  destination: AddressInfo,
  waypoints: AddressInfo[] = []
): Promise<LogisticsRoute> {
  const cacheKey = getParamsDigest('directions', { origin, destination, waypoints });
  const cached = cache.get(cacheKey);
  
  if (cached) {
    console.debug('✅ [Google Maps Service] Route cache hit');
    return cached;
  }

  countAndCheck('directions');
  const googleObj = await ensureMapsLoaded();
  const directionsService = new googleObj.maps.DirectionsService();

  return new Promise<LogisticsRoute>((resolve, reject) => {
    const request: google.maps.DirectionsRequest = {
      origin: { lat: origin.latitude, lng: origin.longitude },
      destination: { lat: destination.latitude, lng: destination.longitude },
      waypoints: waypoints.map(wp => ({
        location: { lat: wp.latitude, lng: wp.longitude },
        stopover: true,
      })),
      travelMode: googleObj.maps.TravelMode.DRIVING,
      optimizeWaypoints: waypoints.length > 0,
    };

    directionsService.route(request, (result, status) => {
      if (status === 'OK' && result) {
        const route = result.routes[0];
        const legs = route.legs;

        const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
        const totalDuration = legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);

        const logisticsRoute: LogisticsRoute = {
          businessType: 'CUSTOMER_DELIVERY',
          cargoInfo: { weight: 0, volume: 0, pallets: 0, hazardous: false },
          pickupAddress: origin,
          deliveryAddress: destination,
          requiresAppointment: false,
          waitingTimeLimit: 30,
          optimalRoute: {
            distance: totalDistance / 1000, // 转换为 km
            duration: totalDuration / 60, // 转换为分钟
            fuelCost: (totalDistance / 1000) * 0.12, // 简化计算
            segments: legs.map(leg => ({
              distance: leg.distance?.value || 0,
              duration: leg.duration?.value || 0,
              startAddress: origin,
              endAddress: destination,
              instructions: leg.steps?.map(step => step.instructions) || [],
            })),
          },
        };

        cache.set(cacheKey, logisticsRoute);
        
        // 2025-01-27 14:35:00 上报调用
        reportTelemetry({
          type: 'directions',
          paramsDigest: cacheKey,
          timestamp: Date.now(),
          page: window.location.pathname,
          traceId: generateTraceId(),
        });

        resolve(logisticsRoute);
      } else {
        reject(new Error(`Directions calculation failed: ${status}`));
      }
    });
  });
}

// 2025-01-27 14:35:00 Places Autocomplete（带去抖）
export function createPlacesAutocomplete(
  input: HTMLInputElement,
  options: {
    onPlaceSelected?: (place: google.maps.places.PlaceResult) => void;
    minLength?: number;
  } = {}
): Promise<google.maps.places.Autocomplete> {
  const { onPlaceSelected, minLength = 3 } = options;

  return new Promise(async (resolve, reject) => {
    try {
      const googleObj = await ensureMapsLoaded();
      
      // 2025-01-27 14:35:00 创建 Autocomplete 实例
      const autocomplete = new googleObj.maps.places.Autocomplete(input, {
        types: ['address'],
        componentRestrictions: { country: 'ca' },
        fields: ['formatted_address', 'geometry', 'address_components', 'place_id'],
      });

      // 2025-01-27 14:35:00 去抖处理输入
      let debounceTimer: NodeJS.Timeout | null = null;
      const originalInputHandler = input.oninput;

      input.addEventListener('input', (e: Event) => {
        const target = e.target as HTMLInputElement;
        const value = target.value.trim();

        // 2025-01-27 14:35:00 清除之前的定时器
        if (debounceTimer) {
          clearTimeout(debounceTimer);
        }

        // 2025-01-27 14:35:00 如果输入过短，不触发
        if (value.length < minLength) {
          return;
        }

        // 2025-01-27 14:35:00 去抖延迟
        debounceTimer = setTimeout(() => {
          countAndCheck('places_autocomplete');
          
          // 2025-01-27 14:35:00 上报调用
          reportTelemetry({
            type: 'places_autocomplete',
            paramsDigest: getParamsDigest('places_autocomplete', { query: value }),
            timestamp: Date.now(),
            page: window.location.pathname,
            traceId: generateTraceId(),
          });
        }, DEBOUNCE_MS);
      });

      // 2025-01-27 14:35:00 监听地址选择
      if (onPlaceSelected) {
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.geometry) {
            countAndCheck('places_details');
            onPlaceSelected(place);
          }
        });
      }

      resolve(autocomplete);
    } catch (error) {
      reject(error);
    }
  });
}

// 2025-01-27 14:35:00 获取调用统计
export function getCallStats(): GoogleMapsCallStats {
  if (typeof window !== 'undefined' && window.__gmStats) {
    return { ...window.__gmStats };
  }
  return {
    total: 0,
    byType: {},
    sessionStart: Date.now(),
  };
}

// 2025-01-27 14:35:00 重置统计
export function resetStats(): void {
  sessionCalls = 0;
  if (typeof window !== 'undefined' && window.__gmStats) {
    window.__gmStats = {
      total: 0,
      byType: {},
      sessionStart: Date.now(),
    };
  }
}

// 2025-01-27 14:35:00 清除缓存
export function clearCache(): void {
  cache.clear();
}
