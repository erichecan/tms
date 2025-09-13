// 认证路由
// 创建时间: 2025-01-27 15:30:45

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest, userLoginSchema } from '../middleware/validationMiddleware';

const router = Router();

// 初始化服务
const dbService = new DatabaseService();
const authController = new AuthController(dbService);

/**
 * @route POST /api/v1/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login',
  validateRequest({
    body: userLoginSchema
  }),
  authController.login.bind(authController)
);

/**
 * @route POST /api/v1/auth/refresh
 * @desc 刷新Token
 * @access Public
 */
router.post('/refresh',
  validateRequest({
    body: {
      refreshToken: { type: 'string', required: true }
    }
  }),
  authController.refreshToken.bind(authController)
);

/**
 * @route POST /api/v1/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post('/logout',
  authMiddleware,
  tenantMiddleware,
  authController.logout.bind(authController)
);

/**
 * @route GET /api/v1/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me',
  authMiddleware,
  tenantMiddleware,
  authController.getCurrentUser.bind(authController)
);

/**
 * @route PUT /api/v1/auth/change-password
 * @desc 修改密码
 * @access Private
 */
router.put('/change-password',
  authMiddleware,
  tenantMiddleware,
  validateRequest({
    body: {
      currentPassword: { type: 'string', required: true },
      newPassword: { type: 'string', required: true }
    }
  }),
  authController.changePassword.bind(authController)
);

/**
 * @route GET /api/v1/auth/profile
 * @desc 获取用户信息 (别名)
 * @access Private
 */
router.get('/profile',
  authMiddleware,
  tenantMiddleware,
  authController.getCurrentUser.bind(authController)
);

export default router;
