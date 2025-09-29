import { Request, Response, NextFunction } from 'express';
import { UserRole, Permission, ROLE_PERMISSIONS } from '../types/permissions';

// 2025-01-27 17:20:00 权限控制中间件

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    tenantId: string;
    role: UserRole;
  };
}

export const requirePermission = (permission: Permission) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        });
      }

      const userRole = req.user.role;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      if (!userPermissions.includes(permission)) {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'FORBIDDEN', 
            message: `Insufficient permissions. Required: ${permission}` 
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Permission check failed' },
        timestamp: new Date().toISOString(),
      });
    }
  };
};

export const requireAnyPermission = (permissions: Permission[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        });
      }

      const userRole = req.user.role;
      const userPermissions = ROLE_PERMISSIONS[userRole] || [];

      const hasAnyPermission = permissions.some(permission => 
        userPermissions.includes(permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'FORBIDDEN', 
            message: `Insufficient permissions. Required one of: ${permissions.join(', ')}` 
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('Permission middleware error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Permission check failed' },
        timestamp: new Date().toISOString(),
      });
    }
  };
};

export const requireRole = (role: UserRole) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
          timestamp: new Date().toISOString(),
        });
      }

      if (req.user.role !== role) {
        return res.status(403).json({
          success: false,
          error: { 
            code: 'FORBIDDEN', 
            message: `Insufficient role. Required: ${role}` 
          },
          timestamp: new Date().toISOString(),
        });
      }

      next();
    } catch (error) {
      console.error('Role middleware error:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Role check failed' },
        timestamp: new Date().toISOString(),
      });
    }
  };
};
