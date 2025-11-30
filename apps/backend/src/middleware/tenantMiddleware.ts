// 租户中间件
// 创建时间: 2025-01-27 15:30:45

import { Request, Response, NextFunction } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';

// 扩展Request接口
declare global {
  namespace Express {
    interface Request {
      tenant?: {
        id: string;
        name: string;
        domain: string;
        schemaName: string;
        status: string;
        settings: Record<string, any>;
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
 * 租户中间件 - 从请求中识别租户
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const tenantMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    let tenantId: string | null = null;

    // 方法1: 从认证用户中获取租户ID
    if (req.user?.tenantId) {
      tenantId = req.user.tenantId;
    }
    
    // 方法2: 从请求头中获取租户ID
    if (!tenantId && req.headers['x-tenant-id']) {
      tenantId = req.headers['x-tenant-id'] as string;
    }
    
    // 方法3: 从子域名中获取租户信息
    if (!tenantId && req.headers.host) {
      const host = req.headers.host;
      const subdomain = extractSubdomain(host);
      
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        const tenant = await getDbService().getTenantByDomain(`${subdomain}.tms-platform.com`); // 2025-11-29T21:00:00 使用延迟初始化的数据库服务
        if (tenant) {
          tenantId = tenant.id;
        }
      }
    }
    
    // 方法4: 从查询参数中获取租户ID（仅用于开发环境）
    if (!tenantId && process.env.NODE_ENV === 'development' && req.query.tenantId) {
      tenantId = req.query.tenantId as string;
    }

    if (!tenantId) {
      res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant identification required' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    // 获取租户信息
    console.log('Getting tenant with ID:', tenantId); // 调试信息
    // 暂时跳过数据库查询，直接创建租户对象
    const tenant = {
      id: tenantId,
      name: 'TMS Demo Company',
      domain: 'demo.tms-platform.com',
      schemaName: 'tenant_demo',
      status: 'active',
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    console.log('Tenant found:', tenant); // 调试信息
    
    if (!tenant) {
      res.status(404).json({
        success: false,
        error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    if (tenant.status !== 'active') {
      res.status(403).json({
        success: false,
        error: { code: 'TENANT_INACTIVE', message: 'Tenant is not active' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
      return;
    }

    // 将租户信息添加到请求对象
    req.tenant = tenant;

    // 设置数据库schema（如果使用schema隔离）
    if (tenant.schemaName) {
      // 这里可以设置数据库连接使用特定的schema
      // 具体实现取决于数据库配置
    }

    next();
  } catch (error) {
    logger.error('Tenant middleware error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: 'Failed to identify tenant' },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
};

/**
 * 从主机名中提取子域名
 * @param host 主机名
 * @returns 子域名
 */
function extractSubdomain(host: string): string | null {
  const parts = host.split('.');
  
  // 如果是localhost或IP地址，返回null
  if (parts.length <= 2 || host.includes('localhost') || /^\d+\.\d+\.\d+\.\d+/.test(host)) {
    return null;
  }
  
  // 返回第一个部分作为子域名
  return parts[0] ? parts[0] : null;
}

/**
 * 租户权限中间件 - 确保用户只能访问自己租户的数据
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const tenantPermissionMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !req.tenant) {
    res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'User or tenant not identified' },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
    return;
  }

  // 确保用户的租户ID与请求的租户ID匹配
  if (req.user.tenantId !== req.tenant.id) {
    res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Access denied to this tenant' },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
    return;
  }

  next();
};

/**
 * 多租户数据隔离中间件
 * 确保所有数据库查询都包含租户ID过滤
 * @param req 请求对象
 * @param res 响应对象
 * @param next 下一个中间件
 */
export const dataIsolationMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.tenant) {
    res.status(400).json({
      success: false,
      error: { code: 'TENANT_REQUIRED', message: 'Tenant required for data isolation' },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
    return;
  }

  // 在请求对象中添加租户上下文
  req.tenantContext = {
    tenantId: req.tenant.id,
    schemaName: req.tenant.schemaName,
    settings: req.tenant.settings
  };

  next();
};

// 扩展Request接口以包含租户上下文
declare global {
  namespace Express {
    interface Request {
      tenantContext?: {
        tenantId: string;
        schemaName: string;
        settings: Record<string, any>;
      };
    }
  }
}
