// 规则引擎路由
// 创建时间: 2025-01-27 15:30:45

import { Router } from 'express';
import { RuleController } from '../controllers/RuleController';
import { RuleEngineService } from '../services/RuleEngineService';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware, roleMiddleware, permissionMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';
import { auditMiddleware } from '../middleware/auditMiddleware'; // 2025-11-11T15:19:22Z Added by Assistant: Audit trail middleware
import { logger } from '../utils/logger'; // 2025-11-30T15:00:00Z Added by Assistant: Add logger for debugging

const router = Router();

// 初始化服务
const dbService = new DatabaseService();
const ruleEngineService = new RuleEngineService(dbService);
const ruleController = new RuleController(ruleEngineService, dbService);

// 应用中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @route GET /api/v1/rules
 * @desc 获取规则列表
 * @access Private
 */
router.get(
  '/',
  // 2025-11-30T15:00:00Z Added by Assistant: 改进开发环境检查，确保开发环境下可以正常访问
  // 检查是否为开发环境（支持多种判断方式）
  (req: any, res: any, next: any) => {
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          process.env.NODE_ENV === 'dev' ||
                          !process.env.NODE_ENV ||
                          process.env.NODE_ENV === '';
    
    if (isDevelopment) {
      logger.debug('Development mode: skipping role and permission checks for rules list');
      return next();
    }
    return next();
  },
  // 生产环境：检查角色和权限（admin 角色会在中间件中自动通过）
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 访问规则管理
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  ruleController.getRules.bind(ruleController)
);

/**
 * @route GET /api/v1/rules/:id
 * @desc 获取单个规则
 * @access Private
 */
router.get(
  '/:id',
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 访问规则详情
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  ruleController.getRule.bind(ruleController)
);

/**
 * @route POST /api/v1/rules
 * @desc 创建新规则
 * @access Private
 */
router.post('/', 
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 创建规则
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  validateRequest({
    body: {
      name: { type: 'string', required: true },
      description: { type: 'string', required: false },
      type: { type: 'string', enum: ['pricing', 'payroll'], required: true },
      priority: { type: 'number', required: true },
      conditions: { type: 'array', required: true },
      actions: { type: 'array', required: true },
      status: { type: 'string', enum: ['active', 'inactive'], required: false }
    }
  }),
  auditMiddleware({
    entityType: 'rule',
    operation: 'create'
  }),
  ruleController.createRule.bind(ruleController)
);

/**
 * @route PUT /api/v1/rules/:id
 * @desc 更新规则
 * @access Private
 */
router.put('/:id',
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 更新规则
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  validateRequest({
    body: {
      name: { type: 'string', required: false },
      description: { type: 'string', required: false },
      type: { type: 'string', enum: ['pricing', 'payroll'], required: false },
      priority: { type: 'number', required: false },
      conditions: { type: 'array', required: false },
      actions: { type: 'array', required: false },
      status: { type: 'string', enum: ['active', 'inactive'], required: false }
    }
  }),
  auditMiddleware({
    entityType: 'rule',
    operation: 'update'
  }),
  ruleController.updateRule.bind(ruleController)
);

router.delete('/:id',
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 删除规则
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  auditMiddleware({
    entityType: 'rule',
    operation: 'delete'
  }),
  ruleController.deleteRule.bind(ruleController)
);

/**
 * @route POST /api/v1/rules/validate
 * @desc 验证规则
 * @access Private
 */
router.post('/validate',
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 验证规则
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  validateRequest({
    body: {
      name: { type: 'string', required: true },
      type: { type: 'string', enum: ['pricing', 'payroll'], required: true },
      conditions: { type: 'array', required: true },
      actions: { type: 'array', required: true }
    }
  }),
  ruleController.validateRule.bind(ruleController)
);

/**
 * @route POST /api/v1/rules/test
 * @desc 测试规则执行
 * @access Private
 */
router.post('/test',
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 测试规则
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  validateRequest({
    body: {
      facts: { type: 'object', required: true }
    }
  }),
  ruleController.testRule.bind(ruleController)
);

router.get('/:id/stats',
  // 2025-12-10T19:00:00Z Updated by Assistant: 允许 dispatcher 查看规则统计
  roleMiddleware(['admin', 'manager', 'dispatcher', 'TENANT_ADMIN', 'SYSTEM_ADMIN']), // 2025-12-10T19:00:00Z Added dispatcher
  permissionMiddleware(['rules:manage']), // 2025-12-10T19:00:00Z Changed to rules:manage
  ruleController.getRuleStats.bind(ruleController)
);

export default router;
