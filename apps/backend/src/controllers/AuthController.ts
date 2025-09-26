// 认证控制器
// 创建时间: 2025-01-27 15:30:45

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { DatabaseService } from '../services/DatabaseService';
import { logger } from '../utils/logger';
import { generateToken, generateRefreshToken } from '../middleware/authMiddleware';

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
      const { email, password, tenantDomain } = req.body;
      
      // 临时自动登录功能 - 跳过认证
      if (email === 'admin@demo.tms-platform.com' && password === 'password') {
        const mockUser = {
          id: '00000000-0000-0000-0000-000000000001',
          email: 'admin@demo.tms-platform.com',
          name: 'Admin User',
          role: 'admin',
          tenantId: '00000000-0000-0000-0000-000000000001'
        };

        const token = generateToken(mockUser.id, mockUser.tenantId, mockUser.role);

        const refreshToken = generateRefreshToken(mockUser.id, mockUser.tenantId);

        res.json({
          success: true,
          data: {
            token,
            refreshToken,
            user: mockUser
          },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }
      
      if (!email || !password) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email and password are required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
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
            requestId: req.headers['x-request-id'] as string || ''
          });
          return;
        }
      } else {
        // 从邮箱域名推断租户
        const emailDomain = email.split('@')[1];
        tenant = await this.dbService.getTenantByDomain(emailDomain);
        if (!tenant) {
          res.status(404).json({
            success: false,
            error: { code: 'TENANT_NOT_FOUND', message: 'Tenant not found for email domain' },
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] as string || ''
          });
          return;
        }
      }

      // 获取用户信息
      const user = await this.dbService.getUserByEmail(tenant.id, email);
      if (!user) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      // 验证密码
      const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
      if (!isPasswordValid) {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      // 检查用户状态
      if (user.status !== 'active') {
        res.status(403).json({
          success: false,
          error: { code: 'ACCOUNT_INACTIVE', message: 'Account is not active' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
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

      logger.info(`User logged in: ${email} (${tenant.name})`);

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
          refreshToken,
          expiresIn: process.env.JWT_EXPIRES_IN || '7d'
        },
        message: 'Login successful',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Login failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Login failed' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
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
      const { refreshToken } = req.body;
      
      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Refresh token is required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      // 验证刷新token
      const decoded = jwt.verify(refreshToken, 'your-super-secret-jwt-key-change-this-in-production') as any;
      
      if (decoded.type !== 'refresh') {
        res.status(401).json({
          success: false,
          error: { code: 'INVALID_TOKEN', message: 'Invalid refresh token' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
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
          requestId: req.headers['x-request-id'] as string || ''
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
          requestId: req.headers['x-request-id'] as string || ''
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
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Token refresh failed:', error);
      
      if (error.name === 'TokenExpiredError') {
        res.status(401).json({
          success: false,
          error: { code: 'TOKEN_EXPIRED', message: 'Refresh token has expired' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'INTERNAL_ERROR', message: 'Token refresh failed' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
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
      // 在实际应用中，这里可以将token加入黑名单
      // 或者更新用户的最后活动时间
      
      logger.info(`User logged out: ${req.user?.email}`);
      
      res.json({
        success: true,
        message: 'Logout successful',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Logout failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Logout failed' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
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
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      const user = await this.dbService.getUser(tenantId, userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: { code: 'USER_NOT_FOUND', message: 'User not found' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
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
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Get current user failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to get current user' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
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
      const tenantId = req.tenant?.id;
      const userId = req.user?.id;
      const { currentPassword, newPassword } = req.body;

      if (!tenantId || !userId) {
        res.status(401).json({
          success: false,
          error: { code: 'UNAUTHORIZED', message: 'User not authenticated' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      if (!currentPassword || !newPassword) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Current password and new password are required' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
        });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'New password must be at least 8 characters long' },
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] as string || ''
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
          requestId: req.headers['x-request-id'] as string || ''
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
          requestId: req.headers['x-request-id'] as string || ''
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

      logger.info(`Password changed for user: ${user.email}`);

      res.json({
        success: true,
        message: 'Password changed successfully',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } catch (error) {
      logger.error('Change password failed:', error);
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to change password' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
}
