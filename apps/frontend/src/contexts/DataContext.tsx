// 2025-11-11T16:00:00Z Added by Assistant: Global data management context for cross-page data synchronization
// 2025-11-29T19:30:00 修复：只在认证成功后加载数据
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { Driver, Vehicle, Customer, Shipment, DriverStatus, VehicleStatus } from '../types';
import { driversApi, vehiclesApi, customersApi, shipmentsApi } from '../services/api';
import { useAuth } from './AuthContext';

interface DataContextValue {
  // Drivers
  drivers: Driver[];
  availableDrivers: Driver[];
  allDrivers: Driver[];
  driversLoading: boolean;
  reloadDrivers: () => Promise<void>;

  // Vehicles
  vehicles: Vehicle[];
  availableVehicles: Vehicle[];
  allVehicles: Vehicle[];
  vehiclesLoading: boolean;
  reloadVehicles: () => Promise<void>;

  // Customers
  customers: Customer[];
  customersLoading: boolean;
  reloadCustomers: () => Promise<void>;

  // Shipments
  shipments: Shipment[];
  shipmentsLoading: boolean;
  reloadShipments: () => Promise<void>;

  // Global refresh
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export const useDataContext = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useDataContext must be used within DataProvider');
  }
  return context;
};

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // 2025-11-29T19:30:00 获取认证状态，只在认证成功后加载数据
  const { isAuthenticated, loading: authLoading } = useAuth();

  // Drivers state
  const [allDrivers, setAllDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);

  // Vehicles state
  const [allVehicles, setAllVehicles] = useState<Vehicle[]>([]);
  const [vehiclesLoading, setVehiclesLoading] = useState(false);

  // Customers state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [customersLoading, setCustomersLoading] = useState(false);

  // Shipments state
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [shipmentsLoading, setShipmentsLoading] = useState(false);

  // Computed: Available drivers and vehicles
  const availableDrivers = Array.isArray(allDrivers) ? allDrivers.filter(d => d.status === DriverStatus.AVAILABLE) : [];
  const availableVehicles = Array.isArray(allVehicles) ? allVehicles.filter(v => v.status === VehicleStatus.AVAILABLE) : [];

  // 2025-11-29T19:30:00 优雅处理 401 错误
  const handleApiError = (error: unknown, resourceName: string) => {
    const axiosError = error as { response?: { status?: number } };
    // 如果是 401，不显示错误消息（可能是认证问题，由 AuthContext 处理）
    if (axiosError.response?.status === 401) {
      if (import.meta.env.DEV) {
        console.warn(`[DEV MODE] 401 error loading ${resourceName}, authentication may be required`);
      }
      return;
    }
    // 其他错误才显示错误消息
    console.error(`Failed to load ${resourceName}:`, error);
    message.error(`加载${resourceName}数据失败`);
  };

  // Load all drivers
  const reloadDrivers = useCallback(async () => {
    // 2025-11-29T19:30:00 只在认证成功后加载数据
    if (!isAuthenticated) {
      return;
    }

    try {
      setDriversLoading(true);
      const response = await driversApi.getDrivers();
      const driverList = response.data?.data || [];
      setAllDrivers(driverList);
    } catch (error) {
      handleApiError(error, '司机');
    } finally {
      setDriversLoading(false);
    }
  }, [isAuthenticated]);

  // Load all vehicles
  const reloadVehicles = useCallback(async () => {
    // 2025-11-29T19:30:00 只在认证成功后加载数据
    if (!isAuthenticated) {
      return;
    }

    try {
      setVehiclesLoading(true);
      const response = await vehiclesApi.getVehicles();
      const vehicleList = response.data?.data || [];
      setAllVehicles(vehicleList);
    } catch (error) {
      handleApiError(error, '车辆');
    } finally {
      setVehiclesLoading(false);
    }
  }, [isAuthenticated]);

  // Load all customers
  const reloadCustomers = useCallback(async () => {
    // 2025-11-29T19:30:00 只在认证成功后加载数据
    if (!isAuthenticated) {
      return;
    }

    try {
      setCustomersLoading(true);
      const response = await customersApi.getCustomers();
      const customerList = response.data?.data || [];
      setCustomers(customerList);
    } catch (error) {
      handleApiError(error, '客户');
    } finally {
      setCustomersLoading(false);
    }
  }, [isAuthenticated]);

  // Load all shipments
  const reloadShipments = useCallback(async () => {
    // 2025-11-29T19:30:00 只在认证成功后加载数据
    if (!isAuthenticated) {
      return;
    }

    try {
      setShipmentsLoading(true);
      const response = await shipmentsApi.getShipments();
      const shipmentList = response.data?.data || [];
      setShipments(shipmentList);
    } catch (error) {
      handleApiError(error, '运单');
    } finally {
      setShipmentsLoading(false);
    }
  }, [isAuthenticated]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    // 2025-11-29T19:30:00 只在认证成功后刷新数据
    if (!isAuthenticated) {
      return;
    }

    await Promise.all([
      reloadDrivers(),
      reloadVehicles(),
      reloadCustomers(),
      reloadShipments(),
    ]);
  }, [isAuthenticated, reloadDrivers, reloadVehicles, reloadCustomers, reloadShipments]);

  // 2025-11-29T19:30:00 初始加载：只在认证成功后加载数据
  useEffect(() => {
    // 等待认证状态加载完成
    if (authLoading) {
      return;
    }

    // 只在认证成功后加载数据
    if (isAuthenticated) {
      void reloadDrivers();
      void reloadVehicles();
      void reloadCustomers();
      void reloadShipments();
    } else {
      // 如果未认证，清空数据
      setAllDrivers([]);
      setAllVehicles([]);
      setCustomers([]);
      setShipments([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, authLoading]); // 依赖认证状态

  const value: DataContextValue = {
    // Drivers
    drivers: allDrivers,
    availableDrivers,
    allDrivers,
    driversLoading,
    reloadDrivers,

    // Vehicles
    vehicles: allVehicles,
    availableVehicles,
    allVehicles,
    vehiclesLoading,
    reloadVehicles,

    // Customers
    customers,
    customersLoading,
    reloadCustomers,

    // Shipments
    shipments,
    shipmentsLoading,
    reloadShipments,

    // Global refresh
    refreshAll,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
};

