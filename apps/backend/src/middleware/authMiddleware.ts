// 认证中间件
// 创建时间: 2025-01-27 15:30:45

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

const PERMISSION_ALIASES: Record<string, string[]> = {
  'pricing:view': ['pricing:edit', 'pricing:create', 'pricing:publish'],
  'pricing:test': ['pricing:edit', 'pricing:publish'],
  'pricing:delete': ['pricing:edit', 'pricing:publish']
}; // 2025-11-11T15:14:25Z Added by Assistant: Permission alias mapping

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
        tenantRole?: string;
        permissions: string[];
      };
    }
  }
}

// 2025-11-29T21:00:00 延迟初始化 DatabaseService，确保环境变量已加载
let dbService: DatabaseService | null = null;

const getDbService = () => {
  if (!dbService) {
    dbService = new DatabaseService();
  }
  return dbService;
};

/**
 * JWT认证中间件
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'No token provided' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET; // 2025-11-11T15:14:25Z Added by Assistant: Use environment JWT secret

    if (!jwtSecret) {
      logger.error('JWT_SECRET is not configured');
      res.status(500).json({
        success: false,
        error: { code: 'CONFIG_ERROR', message: 'Authentication service misconfigured' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    const decoded = jwt.verify(token, jwtSecret) as { userId: string; tenantId: string; role?: string; }; // 2025-11-11T15:14:25Z Added by Assistant: Strongly typed payload
    const user = await getDbService().getUser(decoded.tenantId, decoded.userId); // 2025-11-29T21:00:00 使用延迟初始化的数据库服务

    if (!user || user.status !== 'active') {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not found or inactive' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    // 2025-11-29T21:25:00 修复：tenant_users 表可能不存在，使用 try-catch 处理
    let tenantUser = null;
    try {
      tenantUser = await getDbService().getTenantUser(decoded.tenantId, decoded.userId);
    } catch (error: any) {
      // 如果 tenant_users 表不存在，忽略错误（这是可选的）
      if (error?.code !== '42P01') { // 42P01 = relation does not exist
        logger.warn('Failed to get tenant user (non-critical):', error);
      }
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      tenantId: user.tenantId,
      tenantRole: tenantUser?.role,
      permissions: tenantUser?.granted_permissions ?? []
    };
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Authentication failed' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
};

/**
 * 角色权限中间件
 * @param allowedRoles 允许的角色列表
 * @returns 中间件函数
 */
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    // 2025-11-30T15:00:00Z Added by Assistant: Admin 角色自动通过所有角色检查
    if (req.user.role === 'admin') {
      logger.debug(`Role check passed: user ${req.user.email} has admin role`);
      next();
      return;
    }

    const effectiveRoles = [
      req.user.role,
      req.user.tenantRole
    ].filter(Boolean) as string[]; // 2025-11-11T15:14:25Z Added by Assistant: Combine global and tenant roles

    const hasRole = allowedRoles.some(role => effectiveRoles.includes(role));

    if (!hasRole) {
      logger.warn(`Role check failed: user ${req.user.email} (roles: ${effectiveRoles.join(', ')}) not in allowed roles: ${allowedRoles.join(', ')}`);
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    next();
  };
};

/**
 * 权限校验中间件
 * 2025-11-11T15:14:25Z Added by Assistant: Enforce fine-grained permissions
 */
export const permissionMiddleware = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    // 2025-11-30T15:00:00Z Added by Assistant: Admin 角色自动通过所有权限检查
    if (req.user.role === 'admin') {
      logger.debug(`Permission check passed: user ${req.user.email} has admin role`);
      next();
      return;
    }

    const tenantRole = req.user.tenantRole ?? '';
    if (tenantRole === 'SYSTEM_ADMIN' || tenantRole === 'TENANT_ADMIN') {
      logger.debug(`Permission check passed: user ${req.user.email} has tenant admin role: ${tenantRole}`);
      next();
      return;
    }

    const missing = requiredPermissions.filter(permission => {
      const candidates = [permission, ...(PERMISSION_ALIASES[permission] ?? [])];
      return !candidates.some(candidate => req.user?.permissions?.includes(candidate));
    });

    if (missing.length > 0) {
      logger.warn(`Permission check failed: user ${req.user.email} missing permissions: ${missing.join(', ')}, has: ${req.user.permissions.join(', ') || 'none'}`);
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Missing permissions', details: missing },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    logger.debug(`Permission check passed: user ${req.user.email} has all required permissions`);
    next();
  };
};

/**
 * 可选认证中间件（用于公开API）
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const jwtSecret = process.env.JWT_SECRET; // 2025-11-11T15:14:25Z Added by Assistant: Optional auth secret reuse
      if (!jwtSecret) {
        logger.error('JWT_SECRET is not configured for optional auth');
      } else {
        const decoded = jwt.verify(token, jwtSecret) as { userId: string; tenantId: string; }; // 2025-11-11T15:14:25Z Added by Assistant: Decode optional payload
        const user = await getDbService().getUser(decoded.tenantId, decoded.userId); // 2025-11-29T21:00:00 使用延迟初始化的数据库服务
        // 2025-11-29T21:25:00 修复：tenant_users 表可能不存在，使用 try-catch 处理
        let tenantUser = null;
        if (user) {
          try {
            tenantUser = await getDbService().getTenantUser(decoded.tenantId, decoded.userId);
          } catch (error: any) {
            if (error?.code !== '42P01') { // 42P01 = relation does not exist
              logger.warn('Failed to get tenant user (non-critical):', error);
            }
          }
        }
      
        if (user && user.status === 'active') {
          req.user = {
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId,
            tenantRole: tenantUser?.role,
            permissions: tenantUser?.granted_permissions ?? []
          };
        }
      }
    }
    
    next();
  } catch (error) {
    // 可选认证失败时不阻止请求继续
    logger.warn('Optional authentication failed:', error);
    next();
  }
};

/**
 * 从请求中提取token
 * @param req 请求对象
 * @returns token字符串
 */
function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // 也可以从cookie中获取token
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * 生成JWT token
 * @param userId 用户ID
 * @param tenantId 租户ID
 * @param role 用户角色
 * @returns JWT token
 */
export const generateToken = (userId: string, tenantId: string, role: string): string => {
  return jwt.sign(
    { userId, tenantId, role },
    process.env.JWT_SECRET || 'fallback-secret', // 2025-11-11T15:14:25Z Added by Assistant: Fallback for local tooling
    { expiresIn: '7d' } as any
  );
};

/**
 * 生成刷新token
 * @param userId 用户ID
 * @param tenantId 租户ID
 * @returns 刷新token
 */
export const generateRefreshToken = (userId: string, tenantId: string): string => {
  return jwt.sign(
    { userId, tenantId, type: 'refresh' },
    process.env.JWT_SECRET || 'fallback-secret', // 2025-11-11T15:14:25Z Added by Assistant: Fallback for local tooling
    { expiresIn: '30d' } as any
  );
};
