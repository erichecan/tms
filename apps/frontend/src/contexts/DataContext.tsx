// 2025-11-11T16:00:00Z Added by Assistant: Global data management context for cross-page data synchronization
import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { message } from 'antd';
import { Driver, Vehicle, Customer, Shipment, DriverStatus, VehicleStatus } from '../types';
import { driversApi, vehiclesApi, customersApi, shipmentsApi } from '../services/api';

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
  const availableDrivers = allDrivers.filter(d => d.status === DriverStatus.AVAILABLE);
  const availableVehicles = allVehicles.filter(v => v.status === VehicleStatus.AVAILABLE);

  // Load all drivers
  const reloadDrivers = useCallback(async () => {
    try {
      setDriversLoading(true);
      const response = await driversApi.getDrivers();
      const driverList = response.data?.data || [];
      setAllDrivers(driverList);
    } catch (error) {
      console.error('Failed to load drivers:', error);
      message.error('加载司机数据失败');
    } finally {
      setDriversLoading(false);
    }
  }, []);

  // Load all vehicles
  const reloadVehicles = useCallback(async () => {
    try {
      setVehiclesLoading(true);
      const response = await vehiclesApi.getVehicles();
      const vehicleList = response.data?.data || [];
      setAllVehicles(vehicleList);
    } catch (error) {
      console.error('Failed to load vehicles:', error);
      message.error('加载车辆数据失败');
    } finally {
      setVehiclesLoading(false);
    }
  }, []);

  // Load all customers
  const reloadCustomers = useCallback(async () => {
    try {
      setCustomersLoading(true);
      const response = await customersApi.getCustomers();
      const customerList = response.data?.data || [];
      setCustomers(customerList);
    } catch (error) {
      console.error('Failed to load customers:', error);
      message.error('加载客户数据失败');
    } finally {
      setCustomersLoading(false);
    }
  }, []);

  // Load all shipments
  const reloadShipments = useCallback(async () => {
    try {
      setShipmentsLoading(true);
      const response = await shipmentsApi.getShipments();
      const shipmentList = response.data?.data || [];
      setShipments(shipmentList);
    } catch (error) {
      console.error('Failed to load shipments:', error);
      message.error('加载运单数据失败');
    } finally {
      setShipmentsLoading(false);
    }
  }, []);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    await Promise.all([
      reloadDrivers(),
      reloadVehicles(),
      reloadCustomers(),
      reloadShipments(),
    ]);
  }, [reloadDrivers, reloadVehicles, reloadCustomers, reloadShipments]);

  // Initial load - 2025-11-11T16:00:00Z Added by Assistant: Load data on mount
  useEffect(() => {
    void reloadDrivers();
    void reloadVehicles();
    void reloadCustomers();
    void reloadShipments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

