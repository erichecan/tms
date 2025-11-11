import { useState, useEffect, useCallback } from 'react';
import { vehiclesApi } from '../services/api';
import { Vehicle, VehicleStatus } from '../types';
import { message } from 'antd';

interface UseVehiclesOptions {
  status?: VehicleStatus | VehicleStatus[];
  autoLoad?: boolean;
}

/**
 * 统一的车辆数据管理 Hook
 * 2025-10-31 09:40:00 创建统一的车辆数据获取逻辑
 */
export const useVehicles = (options: UseVehiclesOptions = {}) => {
  const { status, autoLoad = true } = options;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadVehicles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = status ? { status } : undefined;
      const response = await vehiclesApi.getVehicles(params);
      const vehicleList = response.data?.data || [];
      
      setVehicles(vehicleList);
      return vehicleList;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to load vehicles:', error);
      message.error('加载车辆数据失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (autoLoad) {
      loadVehicles();
    }
  }, [autoLoad, loadVehicles]);

  return { 
    vehicles, 
    loading, 
    error, 
    reload: loadVehicles 
  };
};

