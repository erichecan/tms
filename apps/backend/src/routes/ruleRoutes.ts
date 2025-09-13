// 规则引擎路由
// 创建时间: 2025-01-27 15:30:45

import { Router } from 'express';
import { RuleController } from '../controllers/RuleController';
import { RuleEngineService } from '../services/RuleEngineService';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

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
router.get('/', ruleController.getRules.bind(ruleController));

/**
 * @route GET /api/v1/rules/:id
 * @desc 获取单个规则
 * @access Private
 */
router.get('/:id', ruleController.getRule.bind(ruleController));

/**
 * @route POST /api/v1/rules
 * @desc 创建新规则
 * @access Private
 */
router.post('/', 
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
  ruleController.createRule.bind(ruleController)
);

/**
 * @route PUT /api/v1/rules/:id
 * @desc 更新规则
 * @access Private
 */
router.put('/:id',
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
  ruleController.updateRule.bind(ruleController)
);

/**
 * @route DELETE /api/v1/rules/:id
 * @desc 删除规则
 * @access Private
 */
router.delete('/:id', ruleController.deleteRule.bind(ruleController));

/**
 * @route POST /api/v1/rules/validate
 * @desc 验证规则
 * @access Private
 */
router.post('/validate',
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
  validateRequest({
    body: {
      facts: { type: 'object', required: true }
    }
  }),
  ruleController.testRule.bind(ruleController)
);

/**
 * @route GET /api/v1/rules/:id/stats
 * @desc 获取规则执行统计
 * @access Private
 */
router.get('/:id/stats', ruleController.getRuleStats.bind(ruleController));

export default router;
