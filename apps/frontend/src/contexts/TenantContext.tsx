import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { Tenant } from '../types/index';

interface TenantContextType {
  tenant: Tenant | null;
  setTenant: (tenant: Tenant | null) => void;
  loading: boolean;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider = ({ children }: { children: ReactNode }) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // 临时模拟租户数据
    const mockTenant = {
      id: '00000000-0000-0000-0000-000000000001',
      name: 'TMS Demo Company',
      domain: 'demo.tms-platform.com',
      settings: {
        timezone: 'Asia/Shanghai',
        currency: 'CNY',
        language: 'zh-CN'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    setTenant(mockTenant);
    localStorage.setItem('current_tenant', JSON.stringify(mockTenant));
    setLoading(false);
  }, []);

  const updateTenant = (newTenant: Tenant | null) => {
    setTenant(newTenant);
    if (newTenant) {
      localStorage.setItem('current_tenant', JSON.stringify(newTenant));
    } else {
      localStorage.removeItem('current_tenant');
    }
  };

  return (
    <TenantContext.Provider value={{ tenant, setTenant: updateTenant, loading }}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};