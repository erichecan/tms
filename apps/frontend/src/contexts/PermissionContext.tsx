import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserRole, Permission, ROLE_PERMISSIONS, PermissionContextType } from '../types/permissions';

// 2025-01-27 17:20:00 权限控制上下文

const PermissionContext = createContext<PermissionContextType | undefined>(undefined);

interface PermissionProviderProps {
  children: ReactNode;
}

export const PermissionProvider: React.FC<PermissionProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>(UserRole.ADMIN); // 默认管理员角色
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // 从localStorage或API获取用户角色
    const storedRole = localStorage.getItem('user_role') as UserRole;
    if (storedRole && Object.values(UserRole).includes(storedRole)) {
      setUserRole(storedRole);
    }
    
    // 根据角色设置权限
    const rolePermissions = ROLE_PERMISSIONS[userRole] || [];
    setPermissions(rolePermissions);
  }, [userRole]);

  const hasPermission = (permission: Permission): boolean => {
    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: Permission[]): boolean => {
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: Permission[]): boolean => {
    return permissions.every(permission => hasPermission(permission));
  };

  const value: PermissionContextType = {
    userRole,
    permissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
  };

  return (
    <PermissionContext.Provider value={value}>
      {children}
    </PermissionContext.Provider>
  );
};

export const usePermissions = (): PermissionContextType => {
  const context = useContext(PermissionContext);
  if (context === undefined) {
    throw new Error('usePermissions must be used within a PermissionProvider');
  }
  return context;
};

// 权限控制高阶组件
export const withPermissions = <P extends object>(
  Component: React.ComponentType<P>,
  requiredPermissions: Permission[]
) => {
  return (props: P) => {
    const { hasAllPermissions } = usePermissions();
    
    if (!hasAllPermissions(requiredPermissions)) {
      return (
        <div style={{ 
          padding: '20px', 
          textAlign: 'center', 
          color: '#999' 
        }}>
          您没有权限访问此功能
        </div>
      );
    }
    
    return <Component {...props} />;
  };
};

// 权限控制组件
interface PermissionGuardProps {
  permission: Permission;
  fallback?: ReactNode;
  children: ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  fallback = null, 
  children 
}) => {
  const { hasPermission } = usePermissions();
  
  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
};
