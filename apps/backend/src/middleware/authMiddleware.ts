// 认证中间件
// 创建时间: 2025-01-27 15:30:45

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        tenantId: string;
      };
    }
  }
}

const dbService = new DatabaseService();

/**
 * JWT认证中间件
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    // 开发环境跳过 JWT 验证 - 2025-10-10 15:45:00
    if (process.env.NODE_ENV === 'development') {
      req.user = {
        id: '00000000-0000-0000-0000-000000000001',
        email: 'dev@tms-platform.com',
        role: 'admin',
        tenantId: '00000000-0000-0000-0000-000000000001'
      };
      console.log('[DEV MODE] Authentication bypassed, using default user');
      next();
      return;
    }
    
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

    // 验证JWT token
    const jwtSecret = 'your-super-secret-jwt-key-change-this-in-production';
    console.log('JWT Secret:', jwtSecret); // 调试信息
    const decoded = jwt.verify(token, jwtSecret) as any;
    console.log('Decoded token:', decoded); // 调试信息
    
    // 暂时跳过数据库查询，直接使用 token 中的信息
    req.user = {
      id: decoded.userId,
      email: 'admin@demo.tms-platform.com',
      role: decoded.role,
      tenantId: decoded.tenantId
    };
    
    console.log('User set in request:', req.user); // 调试信息
    next();
  } catch (error) {
    console.error('Authentication error details:', error); // 详细错误信息
    logger.error('Authentication error:', error);
    
    if (error.name === 'TokenExpiredError') {
      res.status(401).json({
        success: false,
        error: { code: 'TOKEN_EXPIRED', message: 'Token has expired' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else if (error.name === 'JsonWebTokenError') {
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

    if (!allowedRoles.includes(req.user.role)) {
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
 * 可选认证中间件（用于公开API）
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const optionalAuthMiddleware = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, 'your-super-secret-jwt-key-change-this-in-production') as any;
      const user = await dbService.getUser(decoded.tenantId, decoded.userId);
      
      if (user && user.status === 'active') {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId
        };
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
    'your-super-secret-jwt-key-change-this-in-production',
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
    'your-super-secret-jwt-key-change-this-in-production',
    { expiresIn: '30d' } as any
  );
};
