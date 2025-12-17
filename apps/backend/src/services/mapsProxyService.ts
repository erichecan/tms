// ============================================================================
// Google Maps 代理服务
// 创建时间: 2025-01-27 16:40:00
// 说明: 后端代理 Google Maps REST API，隐藏 API Key，避免前端暴露
// ============================================================================

import axios from 'axios';
import { AddressInfo } from '../types/maps';

// 2025-01-27 16:40:00 Google Maps API 基础 URL
const BASE_URL = 'https://maps.googleapis.com/maps/api';

// 2025-01-27 16:40:00 从环境变量读取 API Key
const API_KEY = process.env.GOOGLE_MAPS_API_KEY || '';

// 2025-01-27 16:40:00 缓存（简单内存缓存，生产环境应使用 Redis）
interface CacheEntry {
  result: any;
  expiresAt: Date;
}

const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 小时

// 2025-01-27 16:40:00 清理过期缓存
setInterval(() => {
  const now = new Date();
  for (const [key, entry] of cache.entries()) {
    if (entry.expiresAt < now) {
      cache.delete(key);
    }
  }
}, 5 * 60 * 1000); // 每 5 分钟清理一次

/**
 * 代理 Geocoding API
 * @param address - 地址字符串
 * @returns AddressInfo
 */
export async function geocodeProxy(address: string): Promise<AddressInfo> {
  if (!API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }

  // 2025-01-27 16:40:00 检查缓存
  const cacheKey = `geocode:${address}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > new Date()) {
    console.debug('✅ [Maps Proxy] Geocode cache hit:', address);
    return cached.result;
  }

  try {
    const response = await axios.get(`${BASE_URL}/geocode/json`, {
      params: {
        address: address,
        key: API_KEY,
        region: 'ca',
        language: 'en',
      },
    });

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const result = response.data.results[0];
      const addressInfo: AddressInfo = {
        formattedAddress: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        placeId: result.place_id,
      };

      // 2025-01-27 16:40:00 解析地址组件
      if (result.address_components) {
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
      }

      // 2025-01-27 16:40:00 缓存结果
      cache.set(cacheKey, {
        result: addressInfo,
        expiresAt: new Date(Date.now() + CACHE_TTL_MS),
      });

      return addressInfo;
    } else {
      throw new Error(`Geocoding failed: ${response.data.status}`);
    }
  } catch (error: any) {
    console.error('❌ [Maps Proxy] Geocoding API error:', error);
    if (error.response) {
      throw new Error(`Geocoding API error: ${error.response.data?.error_message || error.response.statusText}`);
    }
    throw error;
  }
}

/**
 * 代理 Distance Matrix API
 * @param params - 包含 origin, destination, units
 * @returns 距离信息（公里或英里）
 */
export async function distanceProxy(params: {
  origin: string;
  destination: string;
  units: 'metric' | 'imperial';
}): Promise<{
  distance: number; // 距离（公里或英里）
  distanceText: string; // 格式化距离文本
  duration: number; // 时长（秒）
  durationText: string; // 格式化时长文本
  status: string;
}> {
  if (!API_KEY) {
    throw new Error('GOOGLE_MAPS_API_KEY is not configured');
  }

  // 2025-01-27 16:40:00 检查缓存
  const cacheKey = `distance:${params.origin}:${params.destination}:${params.units}`;
  const cached = cache.get(cacheKey);
  if (cached && cached.expiresAt > new Date()) {
    console.debug('✅ [Maps Proxy] Distance cache hit');
    return cached.result;
  }

  try {
    const response = await axios.get(`${BASE_URL}/distancematrix/json`, {
      params: {
        origins: params.origin,
        destinations: params.destination,
        units: params.units,
        key: API_KEY,
        mode: 'driving',
        language: 'en',
      },
    });

    if (response.data.status === 'OK' && response.data.rows.length > 0) {
      const element = response.data.rows[0].elements[0];
      
      if (element.status === 'OK') {
        const distance = element.distance.value / (params.units === 'metric' ? 1000 : 1609.34); // 转换为公里或英里
        const duration = element.duration.value; // 秒

        const result = {
          distance,
          distanceText: element.distance.text,
          duration,
          durationText: element.duration.text,
          status: 'OK',
        };

        // 2025-01-27 16:40:00 缓存结果
        cache.set(cacheKey, {
          result,
          expiresAt: new Date(Date.now() + CACHE_TTL_MS),
        });

        return result;
      } else {
        throw new Error(`Distance calculation failed: ${element.status}`);
      }
    } else {
      throw new Error(`Distance Matrix API error: ${response.data.status}`);
    }
  } catch (error: any) {
    console.error('❌ [Maps Proxy] Distance Matrix API error:', error);
    if (error.response) {
      throw new Error(`Distance Matrix API error: ${error.response.data?.error_message || error.response.statusText}`);
    }
    throw error;
  }
}
