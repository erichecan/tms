import { useState, useEffect, useCallback } from 'react';
import { shipmentsApi } from '../services/api';
import { Shipment, ShipmentStatus } from '../types';
import { message } from 'antd';

interface UseShipmentsOptions {
  status?: ShipmentStatus | ShipmentStatus[];
  driverId?: string;
  customerId?: string;
  limit?: number;
  autoLoad?: boolean;
}

/**
 * 统一的运单数据管理 Hook
 * 2025-10-31 09:40:00 创建统一的运单数据获取逻辑
 */
export const useShipments = (options: UseShipmentsOptions = {}) => {
  const { status, driverId, customerId, limit, autoLoad = true } = options;
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadShipments = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (status) params.status = status;
      if (driverId) params.driverId = driverId;
      if (customerId) params.customerId = customerId;
      if (limit) params.limit = limit;
      
      const response = await shipmentsApi.getShipments(params);
      const shipmentList = response.data?.data || [];
      
      // 统一的数据验证：确保必要字段存在
      const validShipments = shipmentList.filter((s: Shipment) => 
        s.id && s.shipmentNumber
      );
      
      setShipments(validShipments);
      return validShipments;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to load shipments:', error);
      message.error('加载运单数据失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, [status, driverId, customerId, limit]);

  useEffect(() => {
    if (autoLoad) {
      loadShipments();
    }
  }, [autoLoad, loadShipments]);

  return { 
    shipments, 
    loading, 
    error, 
    reload: loadShipments 
  };
};

