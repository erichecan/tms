// 2025-01-27 17:20:00 后端权限控制类型定义

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  DISPATCHER = 'dispatcher',
  DRIVER = 'driver',
  CUSTOMER = 'customer',
}

export enum Permission {
  // 运单管理权限
  SHIPMENT_CREATE = 'shipment:create',
  SHIPMENT_READ = 'shipment:read',
  SHIPMENT_UPDATE = 'shipment:update',
  SHIPMENT_DELETE = 'shipment:delete',
  SHIPMENT_ASSIGN = 'shipment:assign',
  
  // 客户管理权限
  CUSTOMER_CREATE = 'customer:create',
  CUSTOMER_READ = 'customer:read',
  CUSTOMER_UPDATE = 'customer:update',
  CUSTOMER_DELETE = 'customer:delete',
  
  // 司机管理权限
  DRIVER_CREATE = 'driver:create',
  DRIVER_READ = 'driver:read',
  DRIVER_UPDATE = 'driver:update',
  DRIVER_DELETE = 'driver:delete',
  
  // 车辆管理权限
  VEHICLE_CREATE = 'vehicle:create',
  VEHICLE_READ = 'vehicle:read',
  VEHICLE_UPDATE = 'vehicle:update',
  VEHICLE_DELETE = 'vehicle:delete',
  
  // 行程管理权限
  TRIP_CREATE = 'trip:create',
  TRIP_READ = 'trip:read',
  TRIP_UPDATE = 'trip:update',
  TRIP_DELETE = 'trip:delete',
  
  // 财务管理权限
  FINANCE_READ = 'finance:read',
  FINANCE_CREATE = 'finance:create',
  FINANCE_UPDATE = 'finance:update',
  
  // 系统管理权限
  SYSTEM_ADMIN = 'system:admin',
  SYSTEM_CONFIG = 'system:config',
}

export interface UserPermissions {
  role: UserRole;
  permissions: Permission[];
}

// 角色权限映射
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.ADMIN]: [
    // 管理员拥有所有权限
    ...Object.values(Permission),
  ],
  
  [UserRole.MANAGER]: [
    // 经理权限
    Permission.SHIPMENT_CREATE,
    Permission.SHIPMENT_READ,
    Permission.SHIPMENT_UPDATE,
    Permission.SHIPMENT_ASSIGN,
    Permission.CUSTOMER_CREATE,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
    Permission.DRIVER_READ,
    Permission.VEHICLE_READ,
    Permission.TRIP_CREATE,
    Permission.TRIP_READ,
    Permission.TRIP_UPDATE,
    Permission.FINANCE_READ,
    Permission.FINANCE_CREATE,
    Permission.FINANCE_UPDATE,
  ],
  
  [UserRole.DISPATCHER]: [
    // 调度员权限
    Permission.SHIPMENT_READ,
    Permission.SHIPMENT_UPDATE,
    Permission.SHIPMENT_ASSIGN,
    Permission.CUSTOMER_READ,
    Permission.DRIVER_READ,
    Permission.VEHICLE_READ,
    Permission.TRIP_CREATE,
    Permission.TRIP_READ,
    Permission.TRIP_UPDATE,
  ],
  
  [UserRole.DRIVER]: [
    // 司机权限
    Permission.SHIPMENT_READ,
    Permission.TRIP_READ,
  ],
  
  [UserRole.CUSTOMER]: [
    // 客户权限
    Permission.SHIPMENT_CREATE,
    Permission.SHIPMENT_READ,
    Permission.CUSTOMER_READ,
    Permission.CUSTOMER_UPDATE,
  ],
};
