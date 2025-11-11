import { useState, useEffect, useCallback } from 'react';
import { customersApi } from '../services/api';
import { Customer, CustomerLevel } from '../types';
import { message } from 'antd';

interface UseCustomersOptions {
  level?: CustomerLevel;
  search?: string;
  autoLoad?: boolean;
}

/**
 * 统一的客户数据管理 Hook
 * 2025-10-31 09:40:00 创建统一的客户数据获取逻辑
 */
export const useCustomers = (options: UseCustomersOptions = {}) => {
  const { level, search, autoLoad = true } = options;
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const loadCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = {};
      if (level) params.level = level;
      if (search) params.search = search;
      
      const response = await customersApi.getCustomers(params);
      const customerList = response.data?.data || [];
      
      setCustomers(customerList);
      return customerList;
    } catch (err) {
      const error = err as Error;
      setError(error);
      console.error('Failed to load customers:', error);
      message.error('加载客户数据失败');
      return [];
    } finally {
      setLoading(false);
    }
  }, [level, search]);

  useEffect(() => {
    if (autoLoad) {
      loadCustomers();
    }
  }, [autoLoad, loadCustomers]);

  return { 
    customers, 
    loading, 
    error, 
    reload: loadCustomers 
  };
};

