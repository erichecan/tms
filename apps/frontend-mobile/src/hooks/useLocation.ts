// 2025-11-30T11:10:00Z Created by Assistant: useLocation Hook
import { useState, useEffect, useCallback, useRef } from 'react';
import { locationService, LocationTrackingOptions } from '../services/locationService';

export interface UseLocationResult {
  isTracking: boolean;
  isSupported: boolean;
  hasPermission: boolean | null;
  error: GeolocationPositionError | null;
  startTracking: (options?: LocationTrackingOptions) => Promise<void>;
  stopTracking: () => void;
  requestPermission: () => Promise<boolean>;
}

export function useLocation(): UseLocationResult {
  const [isTracking, setIsTracking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<GeolocationPositionError | null>(null);
  const errorHandlerRef = useRef<(error: GeolocationPositionError) => void>();

  // 检查浏览器支持
  useEffect(() => {
    setIsSupported('geolocation' in navigator);
  }, []);

  // 检查权限状态
  useEffect(() => {
    if (!isSupported) {
      setHasPermission(false);
      return;
    }

    // 使用 Permissions API 检查权限（如果支持）
    if ('permissions' in navigator) {
      // 2025-11-30T22:30:00 修复：类型断言解决 Permissions API 类型问题
      (navigator.permissions as any)
        .query({ name: 'geolocation' })
        .then((result: any) => {
          setHasPermission(result.state === 'granted');
          result.onchange = () => {
            setHasPermission(result.state === 'granted');
          };
        })
        .catch(() => {
          // Permissions API 不支持，使用其他方式
          setHasPermission(null);
        });
    } else {
      // Permissions API 不支持，尝试获取位置来判断
      // 2025-11-30T22:30:00 修复：类型断言解决 geolocation API 类型问题
      if ('geolocation' in navigator) {
        (navigator as any).geolocation.getCurrentPosition(
          () => setHasPermission(true),
          () => setHasPermission(false),
          { timeout: 100 }
        );
      } else {
        setHasPermission(false);
      }
    }
  }, [isSupported]);

  // 设置错误处理
  useEffect(() => {
    errorHandlerRef.current = (err: GeolocationPositionError) => {
      setError(err);
      
      // 如果权限被拒绝，更新权限状态
      if (err.code === GeolocationPositionError.PERMISSION_DENIED) {
        setHasPermission(false);
      }
    };

    locationService.onError(errorHandlerRef.current);

    return () => {
      locationService.onError(() => {});
    };
  }, []);

  // 请求权限
  const requestPermission = useCallback(async (): Promise<boolean> => {
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        () => {
          setHasPermission(true);
          resolve(true);
        },
        (error) => {
          setError(error);
          if (error.code === GeolocationPositionError.PERMISSION_DENIED) {
            setHasPermission(false);
          }
          resolve(false);
        },
        { timeout: 5000 }
      );
    });
  }, []);

  // 开始追踪
  const startTracking = useCallback(async (options?: LocationTrackingOptions) => {
    try {
      await locationService.startTracking(options);
      setIsTracking(true);
      setError(null);
    } catch (err: any) {
      setError(err);
      setIsTracking(false);
      throw err;
    }
  }, []);

  // 停止追踪
  const stopTracking = useCallback(() => {
    locationService.stopTracking();
    setIsTracking(false);
    setError(null);
  }, []);

  // 清理
  useEffect(() => {
    return () => {
      if (isTracking) {
        locationService.stopTracking();
      }
    };
  }, [isTracking]);

  return {
    isTracking,
    isSupported,
    hasPermission,
    error,
    startTracking,
    stopTracking,
    requestPermission,
  };
}

