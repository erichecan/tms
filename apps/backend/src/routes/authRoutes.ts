// 认证路由
// 创建时间: 2025-01-27 15:30:45
// 2025-11-29T20:46:00 修复：使用延迟初始化，确保环境变量已加载

import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest, userLoginSchema } from '../middleware/validationMiddleware';

const router = Router();

// 2025-11-29T20:46:00 延迟初始化服务，确保环境变量已加载
let dbService: DatabaseService | null = null;
let authController: AuthController | null = null;

const getServices = () => {
  if (!dbService) {
    dbService = new DatabaseService();
    authController = new AuthController(dbService);
  }
  return { dbService, authController: authController! };
};

/**
 * @route POST /api/v1/auth/login
 * @desc 用户登录
 * @access Public
 */
router.post('/login',
  validateRequest({
    body: userLoginSchema
  }),
  (req, res, next) => {
    const { authController } = getServices();
    authController.login(req, res).catch(next);
  }
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
  (req, res, next) => {
    const { authController } = getServices();
    authController.refreshToken(req, res).catch(next);
  }
);

/**
 * @route POST /api/v1/auth/logout
 * @desc 用户登出
 * @access Private
 */
router.post('/logout',
  authMiddleware,
  tenantMiddleware,
  (req, res, next) => {
    const { authController } = getServices();
    authController.logout(req, res).catch(next);
  }
);

/**
 * @route GET /api/v1/auth/me
 * @desc 获取当前用户信息
 * @access Private
 */
router.get('/me',
  authMiddleware,
  tenantMiddleware,
  (req, res, next) => {
    const { authController } = getServices();
    authController.getCurrentUser(req, res).catch(next);
  }
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
  (req, res, next) => {
    const { authController } = getServices();
    authController.changePassword(req, res).catch(next);
  }
);

/**
 * @route GET /api/v1/auth/profile
 * @desc 获取用户信息 (别名)
 * @access Private
 */
router.get('/profile',
  authMiddleware,
  tenantMiddleware,
  (req, res, next) => {
    const { authController } = getServices();
    authController.getCurrentUser(req, res).catch(next);
  }
);

export default router;
