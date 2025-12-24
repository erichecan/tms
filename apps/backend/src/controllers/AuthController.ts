// 认证控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';
import { generateToken, generateRefreshToken } from '../middleware/authMiddleware';
import { v4 as uuidv4 } from 'uuid';

// Helper to get request ID safely
const getRequestId = (req: Request): string => {
  const requestId = req.headers['x-request-id'];
  const id = (Array.isArray(requestId) ? requestId[0] : requestId) || uuidv4();
  // 设置到请求对象上，方便后续透传
  (req as any).requestId = id;
  return id;
};

export class AuthController {
  private dbService: DatabaseService;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
  }

  /**
   * 用户登录
   * @param req 请求对象
   * @param res 响应对象
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const { email, password, tenantDomain } = req.body;

      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 获取租户信息
      let tenant;
      if (tenantDomain) {
        tenant = await this.dbService.getTenantByDomain(tenantDomain);
        if (!tenant) {
          res.status(404).json({
            success: false,
            error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found' },
            timestamp: new Date().toISOString(),
            requestId
          });
          return;
        }
      } else {
        // 从邮箱域名推断租户
        const emailDomain = email.split('@')[1];
        tenant = await this.dbService.getTenantByDomain(emailDomain);

        // 2025-12-02T17:10:00Z Fixed by Assistant: 如果找不到租户，尝试使用默认租户
        if (!tenant) {
          // 尝试获取默认租户（demo.tms-platform.com）
          tenant = await this.dbService.getTenantByDomain('demo.tms-platform.com');
          // 如果还是找不到，尝试获取第一个租户
          if (!tenant) {
            const tenants = await this.dbService.query('SELECT * FROM tenants LIMIT 1');
            if (tenants && tenants.length > 0) {
              tenant = await this.dbService.getTenant(tenants[0].id);
            }
          }

          // 如果还是找不到租户，返回错误
          if (!tenant) {
            res.status(404).json({
              success: false,
              error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found for email domain' },
              timestamp: new Date().toISOString(),
              requestId
            });
            return;
          }
        }
      }

      // 获取用户信息
      const user = await this.dbService.getUserByEmail(tenant.id, email);
      if (!user) {
        logger.warn(`[${requestId}] Login failed: User not found - tenant: ${tenant.id}, email: ${email}`);
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 验证密码 // 2025-11-29T18:25:00 添加调试日志
      logger.info(`[${requestId}] Login attempt: ${email}, tenant: ${tenant.id}, user found: ${!!user}`);
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      logger.info(`[${requestId}] Password validation result: ${isPasswordValid}`);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 检查用户状态
      if (user.status !== 'active') {
        res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_INACTIVE', message: 'Account is not active' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 生成JWT token
      const accessToken = generateToken(user.id, tenant.id, user.role);
      const refreshToken = generateRefreshToken(user.id, tenant.id);

      // 更新最后登录时间
      await this.dbService.updateUser(tenant.id, user.id, {
        lastLoginAt: new Date()
      });

      logger.info(`[${requestId}] User logged in: ${email} (${tenant.name})`);

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            tenant: {
              id: tenant.id,
              name: tenant.name,
              domain: tenant.domain
            }
          },
          accessToken,
          token: accessToken, // 2025-11-11T15:21:37Z Added by Assistant: Maintain legacy token field
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },
        message: 'Login successful',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Login failed:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Login failed' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }

  /**
   * 刷新Token
   * @param req 请求对象
   * @param res 响应对象
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Refresh token is required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        res.status(500).json({
          success: false,
          error: { code: 'CONFIG_ERROR', message: 'Authentication secret is not configured' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 验证刷新token
      const decoded = jwt.verify(refreshToken, jwtSecret) as any; // 2025-11-11T15:21:37Z Added by Assistant: Use configured secret

      if (decoded.type !== 'refresh') {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 获取用户信息
      const user = await this.dbService.getUser(decoded.tenantId, decoded.userId);
      if (!user || user.status !== 'active') {
        res.status(401).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found or inactive' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 获取租户信息
      const tenant = await this.dbService.getTenant(decoded.tenantId);
      if (!tenant || tenant.status !== 'active') {
        res.status(401).json({
          success: false,
          error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found or inactive' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 生成新的访问token
      const newAccessToken = generateToken(user.id, tenant.id, user.role);

      res.json({
        success: true,
        data: {
          accessToken: newAccessToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },
        message: 'Token refreshed successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Token refresh failed:`, error);

      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Refresh token has expired' },
          timestamp: new Date().toISOString(),
          requestId
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Token refresh failed' },
          timestamp: new Date().toISOString(),
          requestId
        });
      }
    }
  }

  /**
   * 用户登出
   * @param req 请求对象
   * @param res 响应对象
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      // 在实际应用中，这里可以将token加入黑名单
      // 或者更新用户的最后活动时间

      logger.info(`[${requestId}] User logged out: ${req.user?.email}`);

      res.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Logout failed:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Logout failed' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }

  /**
   * 获取当前用户信息
   * @param req 请求对象
   * @param res 响应对象
   */
  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      const user = await this.dbService.getUser(tenantId, userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            profile: user.profile,
            status: user.status,
            lastLoginAt: user.lastLoginAt,
            tenant: {
              id: req.tenant?.id,
              name: req.tenant?.name,
              domain: req.tenant?.domain
            }
          }
        },
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Get current user failed:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get current user' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }

  /**
   * 修改密码
   * @param req 请求对象
   * @param res 响应对象
   */
  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const requestId = getRequestId(req);
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Current password and new password are required' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters long' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 获取用户信息
      const user = await this.dbService.getUser(tenantId, userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 验证当前密码
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
      if (!isCurrentPasswordValid) {
        res.status(400).json({
          success: false,
          error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect' },
          timestamp: new Date().toISOString(),
          requestId
        });
        return;
      }

      // 加密新密码
      const saltRounds = 10;
      const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

      // 更新密码
      await this.dbService.updateUser(tenantId, userId, {
        passwordHash: newPasswordHash
      });

      logger.info(`[${requestId}] Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
        requestId
      });
    } catch (error) {
      const requestId = getRequestId(req);
      logger.error(`[${requestId}] Change password failed:`, error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' },
        timestamp: new Date().toISOString(),
        requestId
      });
    }
  }
}
