import { Loader } from '@googlemaps/js-api-loader';
import { 
  AddressInfo, 
  LogisticsRoute, 
  GeocodingResponse, 
  DirectionsResponse,
  DistanceMatrixResponse,
  MapsConfig 
} from '@/types/maps';

class MapsService {
  private static loaderInstance: Loader | null = null;
  private static initPromise: Promise<void> | null = null;
  private maps: typeof google.maps | null = null;
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
      // 2025-10-10 17:35:00 使用单例Loader，统一libraries顺序
      if (!MapsService.loaderInstance) {
        MapsService.loaderInstance = new Loader({
          apiKey: this.config.apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry'], // 统一顺序
          language: this.config.language,
          region: this.config.region,
        });
      }

      this.maps = await MapsService.loaderInstance.load();
      this.isInitialized = true;
      console.log('✅ Google Maps API initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Google Maps API:', error);
      MapsService.initPromise = null; // 失败时清除Promise，允许重试
      throw error;
    }
  }

  // 地址解析（Geocoding）
  async geocodeAddress(address: string): Promise<AddressInfo> {
    if (!this.maps) throw new Error('Maps service not initialized');

    const geocoder = new this.maps.Geocoder();
    
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

    const geocoder = new this.maps.Geocoder();
    
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
  getMaps(): typeof google.maps {
    if (!this.maps) throw new Error('Maps service not initialized');
    return this.maps;
  }

  // 检查是否已初始化
  isReady(): boolean {
    return this.isInitialized;
  }
}

// 创建默认配置的MapsService实例
const defaultConfig: MapsConfig = {
  apiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '',
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

export const mapsService = new MapsService(defaultConfig);
export default mapsService;