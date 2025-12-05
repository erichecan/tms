// ============================================================================
// 地图服务 - 二期开发功能
// 创建时间: 2025-10-10
// 状态: 已注释，二期恢复
// 说明: 此服务包含Google Maps API集成功能，在一期版本中暂时不使用
// 二期恢复时，请取消注释并确保API密钥配置正确
// ============================================================================

import { Loader } from '@googlemaps/js-api-loader';
import { 
  AddressInfo, 
  LogisticsRoute,
  MapsConfig 
} from '@/types/maps';

class MapsService {
  private static loaderInstance: Loader | null = null;
  private static initPromise: Promise<void> | null = null;
  private maps: unknown = null;
  private isInitialized = false;

  constructor(private config: MapsConfig) {}

  async initialize(): Promise<void> {
    // 如果已初始化，直接返回
    if (this.isInitialized && this.maps) {
      return Promise.resolve();
    }

    // 如果正在初始化，返回同一个Promise
    if (MapsService.initPromise) {
      await MapsService.initPromise;
      return;
    }

    // 创建初始化Promise
    MapsService.initPromise = this.doInitialize();
    
    try {
      await MapsService.initPromise;
    } finally {
      // 初始化完成后清除Promise，但保持实例
      MapsService.initPromise = null;
    }
  }

  private async doInitialize(): Promise<void> {
    try {
      // 2025-12-05T13:50:00Z Added by Assistant: 添加详细的调试信息
      console.group('🔍 [Google Maps] 初始化调试信息');
      console.log('📦 环境变量检查:');
      console.log('  - import.meta.env:', import.meta.env);
      console.log('  - import.meta.env.VITE_GOOGLE_MAPS_API_KEY:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
      console.log('  - API Key 类型:', typeof import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
      console.log('  - API Key 长度:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.length || 0);
      console.log('  - API Key 前8位:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.substring(0, 8) || '(未设置)');
      console.log('📋 配置信息:');
      console.log('  - config.apiKey:', this.config.apiKey ? `${this.config.apiKey.substring(0, 8)}...` : '(空)');
      console.log('  - config.apiKey.trim():', this.config.apiKey?.trim() || '(空)');
      console.log('  - isInitialized:', this.isInitialized);
      console.groupEnd();

      // 2025-11-24T18:00:00Z Updated by Assistant: 改进错误处理和 API 密钥验证
      // 2025-12-05T13:50:00Z Added by Assistant: 增强错误信息
      if (!this.config.apiKey || this.config.apiKey.trim() === '') {
        const error = new Error('缺少 VITE_GOOGLE_MAPS_API_KEY 配置');
        console.error('❌ [Google Maps] 配置错误:', {
          message: error.message,
          envValue: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
          configValue: this.config.apiKey,
          envKeys: Object.keys(import.meta.env).filter(key => key.includes('GOOGLE') || key.includes('MAPS')),
        });
        throw error;
      }

      // 2025-10-10 17:35:00 使用单例Loader，统一libraries顺序
      if (!MapsService.loaderInstance) {
        MapsService.loaderInstance = new Loader({
          apiKey: this.config.apiKey,
          version: 'weekly', // 使用稳定版本
          libraries: ['places', 'geometry'], // 统一顺序
          language: this.config.language,
          region: this.config.region,
        });
      }

      console.log('🚀 [Google Maps] 开始加载 Google Maps API...');
      console.log('  - API Key 前8位:', this.config.apiKey.substring(0, 8));
      console.log('  - Libraries:', this.config.libraries);
      
      this.maps = await MapsService.loaderInstance.load();
      this.isInitialized = true;
      console.log('✅ [Google Maps] Google Maps API initialized successfully');
      console.log('  - Maps object:', this.maps);
      console.log('  - window.google:', window.google);
      console.log('  - window.google.maps:', window.google?.maps);
    } catch (error: any) {
      console.error('❌ [Google Maps] Failed to initialize Google Maps API:', error);
      console.error('❌ [Google Maps] 错误详情:', {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
        errorType: error?.constructor?.name,
      });
      
      // 2025-11-24T18:00:00Z Added by Assistant: 提供更详细的错误信息
      // 2025-12-05T13:50:00Z Added by Assistant: 增强错误提示
      if (error.message?.includes('ApiNotActivatedMapError')) {
        console.error('💡 提示: Google Maps API 未启用。请在 Google Cloud Console 中启用 Maps JavaScript API。');
      } else if (error.message?.includes('RefererNotAllowedMapError')) {
        console.error('💡 提示: 当前域名未在 API 密钥限制中允许。请在 Google Cloud Console 中配置 API 密钥限制。');
        console.error('   当前域名:', window.location.origin);
      } else if (error.message?.includes('InvalidKeyMapError')) {
        console.error('💡 提示: API 密钥无效。请检查 VITE_GOOGLE_MAPS_API_KEY 环境变量是否正确。');
        console.error('   使用的 API Key 前8位:', this.config.apiKey?.substring(0, 8) || '(未设置)');
      } else if (error.message?.includes('缺少') || error.message?.includes('未配置')) {
        console.error('💡 提示: API Key 未配置。');
        console.error('   构建时环境变量:', import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '(未设置)');
        console.error('   检查方法: 在浏览器控制台运行 console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY)');
      }
      
      MapsService.initPromise = null; // 失败时清除Promise，允许重试
      throw error;
    }
  }

  // 地址解析（Geocoding）
  async geocodeAddress(address: string): Promise<AddressInfo> {
    if (!this.maps) throw new Error('Maps service not initialized');

    const geocoder = new google.maps.Geocoder(); // 2025-10-17T15:20:00 修复 Geocoder 构造函数调用
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const addressInfo: AddressInfo = {
            formattedAddress: result.formatted_address,
            latitude: result.geometry.location.lat(),
            longitude: result.geometry.location.lng(),
            placeId: result.place_id,
          };

          // 解析地址组件
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

          resolve(addressInfo);
        } else {
          reject(new Error(`Geocoding failed: ${status}`));
        }
      });
    });
  }

  // 反向地址解析
  async reverseGeocode(lat: number, lng: number): Promise<AddressInfo> {
    if (!this.maps) throw new Error('Maps service not initialized');

    const geocoder = new google.maps.Geocoder(); // 2025-10-17T15:20:00 修复 Geocoder 构造函数调用
    
    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const result = results[0];
          const addressInfo: AddressInfo = {
            formattedAddress: result.formatted_address,
            latitude: lat,
            longitude: lng,
            placeId: result.place_id,
          };

          resolve(addressInfo);
        } else {
          reject(new Error(`Reverse geocoding failed: ${status}`));
        }
      });
    });
  }

  // 计算单一路径
  async calculateRoute(
    origin: AddressInfo, 
    destination: AddressInfo,
    waypoints: AddressInfo[] = []
  ): Promise<LogisticsRoute> {
    if (!this.maps) throw new Error('Maps service not initialized');

    const directionsService = new this.maps.DirectionsService();
    
    return new Promise((resolve, reject) => {
      const request = {
        origin: { lat: origin.latitude, lng: origin.longitude },
        destination: { lat: destination.latitude, lng: destination.longitude },
        waypoints: waypoints.map(wp => ({
          location: { lat: wp.latitude, lng: wp.longitude },
          stopover: true,
        })),
        travelMode: this.maps!.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: this.maps!.TrafficModel.BEST_GUESS,
        },
        optimizeWaypoints: waypoints.length > 0,
      };

      directionsService.route(request, (result, status) => {
        if (status === 'OK' && result) {
          const route = this.parseDirectionsResponse(result, origin, destination);
          resolve(route);
        } else {
          reject(new Error(`Directions calculation failed: ${status}`));
        }
      });
    });
  }

  // 批量距离矩阵计算（用于调度优化）
  async calculateDistanceMatrix(
    origins: AddressInfo[], 
    destinations: AddressInfo[]
  ): Promise<number[][]> {
    if (!this.maps) throw new Error('Maps service not initialized');

    const distanceMatrixService = new this.maps.DistanceMatrixService();
    
    return new Promise((resolve, reject) => {
      const request = {
        origins: origins.map(origin => ({ 
          lat: origin.latitude, 
          lng: origin.longitude 
        })),
        destinations: destinations.map(dest => ({ 
          lat: dest.latitude, 
          lng: dest.longitude 
        })),
        travelMode: this.maps!.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(),
          trafficModel: this.maps!.TrafficModel.BEST_GUESS,
        },
        unitSystem: this.maps!.UnitSystem.METRIC,
      };

      distanceMatrixService.getDistanceMatrix(request, (response, status) => {
        if (status === 'OK' && response) {
          const matrix = response.rows.map(row =>
            row.elements.map(element => 
              element.status === 'OK' ? element.distance.value : Infinity
            )
          );
          resolve(matrix);
        } else {
          reject(new Error(`Distance matrix calculation failed: ${status}`));
        }
      });
    });
  }

  // 解析Directions API响应
  private parseDirectionsResponse(
    response: google.maps.DirectionsResult,
    origin: AddressInfo,
    destination: AddressInfo
  ): LogisticsRoute {
    const route = response.routes[0];
    const legs = route.legs;

    const segments = legs.map(leg => ({
      distance: leg.distance?.value || 0,
      duration: leg.duration?.value || 0,
      startAddress: origin,
      endAddress: destination,
      instructions: leg.steps?.map(step => step.instructions) || [],
    }));

    const totalDistance = legs.reduce((sum, leg) => sum + (leg.distance?.value || 0), 0);
    const totalDuration = legs.reduce((sum, leg) => sum + (leg.duration?.value || 0), 0);

    return {
      businessType: 'CUSTOMER_DELIVERY',
      cargoInfo: { weight: 0, volume: 0, pallets: 0, hazardous: false },
      pickupAddress: origin,
      deliveryAddress: destination,
      requiresAppointment: false,
      waitingTimeLimit: 30,
      optimalRoute: {
        distance: totalDistance / 1000, // 转换为km
        duration: totalDuration / 60, // 转换为分钟
        fuelCost: this.calculateFuelCost(totalDistance / 1000),
        segments,
      },
    };
  }

  // 计算燃油成本（简化版）
  private calculateFuelCost(distanceKm: number): number {
    const fuelEfficiency = 8; // 升/100km
    const fuelPrice = 1.5; // CAD/升
    return (distanceKm * fuelEfficiency * fuelPrice) / 100;
  }

  // 获取地图实例
  getMaps(): unknown {
    if (!this.maps) throw new Error('Maps service not initialized');
    return this.maps;
  }

  // 检查是否已初始化
  isReady(): boolean {
    return this.isInitialized;
  }
}

// 创建默认配置的MapsService实例
// 2025-12-05T14:00:00Z Added by Assistant: 增强配置创建时的调试信息
const rawApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
console.log('🔧 [Google Maps] 创建 MapsService 配置:');
console.log('  📍 时间戳:', new Date().toISOString());
console.log('  🔑 环境变量存在:', 'VITE_GOOGLE_MAPS_API_KEY' in import.meta.env);
console.log('  📝 原始 API Key 值:', rawApiKey ? `${rawApiKey.substring(0, 8)}...${rawApiKey.substring(rawApiKey.length - 8)}` : '(空字符串)');
console.log('  📏 API Key 长度:', rawApiKey.length);
console.log('  📋 API Key 类型:', typeof rawApiKey);
console.log('  ✂️  trim() 后:', rawApiKey.trim() ? `${rawApiKey.trim().substring(0, 8)}...` : '(空字符串)');
console.log('  📦 所有 VITE_ 环境变量:', Object.keys(import.meta.env).filter(key => key.startsWith('VITE_')));
console.log('  🔍 import.meta.env 完整对象:', import.meta.env);

const defaultConfig: MapsConfig = {
  apiKey: rawApiKey,
  libraries: ['places', 'geometry'],
  language: 'en',
  region: 'CA',
  mapOptions: {
    center: { lat: 43.7615, lng: -79.4635 }, // 3401 Dufferin St, North York, ON M6A 2T9
    zoom: 10,
    mapTypeControl: true,
    streetViewControl: false,
  },
};

console.log('  ✅ defaultConfig 创建完成:', {
  apiKey: defaultConfig.apiKey ? `${defaultConfig.apiKey.substring(0, 8)}...` : '(空)',
  apiKeyLength: defaultConfig.apiKey?.length || 0,
  libraries: defaultConfig.libraries,
});

export const mapsService = new MapsService(defaultConfig);
console.log('  ✅ MapsService 实例创建完成');

// 2025-12-05T14:00:00Z Added by Assistant: 验证实例的配置
console.log('  🔍 MapsService 实例验证:', {
  hasConfig: !!mapsService,
  // 注意：config 是私有属性，无法直接访问，但可以通过初始化测试
});

export default mapsService;