// 2025-11-30T11:05:00Z Created by Assistant: 位置上报服务
import { locationApi, LocationData, DRIVER_STORAGE_KEY } from './api';

export interface LocationTrackingOptions {
  interval?: number; // 上报间隔（毫秒），默认30秒
  distanceThreshold?: number; // 距离阈值（米），超过此距离才上报，默认50米
  enableHighAccuracy?: boolean; // 是否启用高精度定位
}

export class LocationService {
  private watchId: number | null = null;
  private lastLocation: { latitude: number; longitude: number } | null = null;
  private interval: number = 30000; // 30秒
  private distanceThreshold: number = 50; // 50米
  private enableHighAccuracy: boolean = false;
  private isTracking: boolean = false;
  private onErrorCallback?: (error: GeolocationPositionError) => void;
  private onSuccessCallback?: (position: GeolocationPosition) => void;

  /**
   * 计算两点之间的距离（米）
   */
  private calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371000; // 地球半径（米）
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * 检查是否需要上报位置（基于距离和时间）
   */
  private shouldReportLocation(latitude: number, longitude: number): boolean {
    if (!this.lastLocation) {
      return true;
    }

    const distance = this.calculateDistance(
      this.lastLocation.latitude,
      this.lastLocation.longitude,
      latitude,
      longitude
    );

    return distance >= this.distanceThreshold;
  }

  /**
   * 上报位置到服务器
   */
  private async reportLocation(position: GeolocationPosition): Promise<void> {
    const driverId = localStorage.getItem(DRIVER_STORAGE_KEY);
    if (!driverId) {
      console.warn('Driver ID not found, cannot report location');
      return;
    }

    const locationData: LocationData = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      speed: position.coords.speed || undefined,
      direction: position.coords.heading || undefined,
      accuracy: position.coords.accuracy || undefined,
    };

    // 检查是否需要上报（基于距离）
    if (!this.shouldReportLocation(locationData.latitude, locationData.longitude)) {
      return;
    }

    try {
      await locationApi.reportDriverLocation(driverId, locationData);
      this.lastLocation = {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
      };
      this.onSuccessCallback?.(position);
    } catch (error) {
      console.error('Failed to report location:', error);
      // 错误时不调用回调，避免干扰用户
    }
  }

  /**
   * 开始位置追踪
   */
  startTracking(options: LocationTrackingOptions = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.isTracking) {
        resolve();
        return;
      }

      this.interval = options.interval || 30000;
      this.distanceThreshold = options.distanceThreshold || 50;
      this.enableHighAccuracy = options.enableHighAccuracy || false;

      if (!navigator.geolocation) {
        const error = new Error('Geolocation is not supported by this browser') as any;
        error.code = 0;
        reject(error);
        return;
      }

      const positionOptions: PositionOptions = {
        enableHighAccuracy: this.enableHighAccuracy,
        timeout: 10000,
        maximumAge: 0,
      };

      // 立即获取一次位置
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          await this.reportLocation(position);
          resolve();
        },
        (error) => {
          reject(error);
        },
        positionOptions
      );

      // 持续追踪位置
      this.watchId = navigator.geolocation.watchPosition(
        async (position) => {
          await this.reportLocation(position);
        },
        (error) => {
          console.error('Geolocation error:', error);
          this.onErrorCallback?.(error);
        },
        positionOptions
      );

      // 定时上报（即使位置没变化，也要定期上报）
      const intervalId = setInterval(async () => {
        if (!this.isTracking) {
          clearInterval(intervalId);
          return;
        }

        navigator.geolocation.getCurrentPosition(
          async (position) => {
            await this.reportLocation(position);
          },
          (error) => {
            console.error('Periodic location update error:', error);
          },
          positionOptions
        );
      }, this.interval);

      this.isTracking = true;
      resolve();
    });
  }

  /**
   * 停止位置追踪
   */
  stopTracking(): void {
    if (this.watchId !== null) {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.isTracking = false;
    this.lastLocation = null;
  }

  /**
   * 获取当前位置（一次性）
   */
  getCurrentPosition(): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        resolve,
        reject,
        {
          enableHighAccuracy: this.enableHighAccuracy,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  }

  /**
   * 手动上报一次位置
   */
  async reportCurrentLocation(): Promise<void> {
    try {
      const position = await this.getCurrentPosition();
      await this.reportLocation(position);
    } catch (error) {
      console.error('Failed to report current location:', error);
      throw error;
    }
  }

  /**
   * 设置错误回调
   */
  onError(callback: (error: GeolocationPositionError) => void): void {
    this.onErrorCallback = callback;
  }

  /**
   * 设置成功回调
   */
  onSuccess(callback: (position: GeolocationPosition) => void): void {
    this.onSuccessCallback = callback;
  }

  /**
   * 获取追踪状态
   */
  getTrackingStatus(): boolean {
    return this.isTracking;
  }
}

// 单例模式
export const locationService = new LocationService();

