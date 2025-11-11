import { useState, useEffect, useCallback } from 'react';
import { driversApi } from '../services/api';
import { Driver, DriverStatus } from '../types';
import { message } from 'antd';

interface UseDriversOptions {
  status?: DriverStatus | DriverStatus[];
  autoLoad?: boolean;
}

/**
 * 统一的司机数据管理 Hook
 * 2025-10-31 09:40:00 创建统一的司机数据获取逻辑
 */
export const useDrivers = (options: UseDriversOptions = {}) => {
  const { status, autoLoad = true } = options;
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadDrivers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = status ? { status } : undefined;
      const response = await driversApi.getDrivers(params);
      const driverList = response.data?.data || [];
      
      setDrivers(driverList);
      return driverList;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to load drivers:', error);
      message.error('加载司机数据失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (autoLoad) {
      loadDrivers();
    }
  }, [autoLoad, loadDrivers]);

  return { 
    drivers, 
    loading, 
    error, 
    reload: loadDrivers 
  };
};

