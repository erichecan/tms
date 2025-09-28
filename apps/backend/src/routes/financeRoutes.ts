// 财务路由
// 创建时间: 2025-01-27 15:30:45

import { Router } from 'express';
import { FinanceController } from '../controllers/FinanceController';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { CurrencyService } from '../services/CurrencyService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();

// 初始化服务
const dbService = new DatabaseService();
const ruleEngineService = new RuleEngineService(dbService);
const currencyService = new CurrencyService(dbService);
const financeController = new FinanceController(dbService, ruleEngineService, currencyService);

// 应用中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @route GET /api/v1/finance/receivables
 * @desc 获取应收账款汇总
 * @access Private
 */
router.get('/receivables', financeController.getReceivablesSummary.bind(financeController));

/**
 * @route GET /api/v1/finance/payables
 * @desc 获取应付账款汇总
 * @access Private
 */
router.get('/payables', financeController.getPayablesSummary.bind(financeController));

/**
 * @route POST /api/v1/finance/statements/customer
 * @desc 生成客户对账单
 * @access Private
 */
router.post('/statements/customer',
  validateRequest({
    body: {
      customerId: { type: 'string', required: true },
      startDate: { type: 'string', required: true },
      endDate: { type: 'string', required: true }
    }
  }),
  financeController.generateCustomerStatement.bind(financeController)
);

/**
 * @route POST /api/v1/finance/statements/driver
 * @desc 生成司机结算单
 * @access Private
 */
router.post('/statements/driver',
  validateRequest({
    body: {
      driverId: { type: 'string', required: true },
      startDate: { type: 'string', required: true },
      endDate: { type: 'string', required: true }
    }
  }),
  financeController.generateDriverStatement.bind(financeController)
);

/**
 * @route PUT /api/v1/finance/statements/:id/send
 * @desc 标记对账单为已发送
 * @access Private
 */
router.put('/statements/:id/send', financeController.markStatementAsSent.bind(financeController));

/**
 * @route PUT /api/v1/finance/statements/:id/pay
 * @desc 标记对账单为已支付
 * @access Private
 */
router.put('/statements/:id/pay',
  validateRequest({
    body: {
      paidAmount: { type: 'number', required: true },
      paymentDate: { type: 'string', required: false }
    }
  }),
  financeController.markStatementAsPaid.bind(financeController)
);

/**
 * @route GET /api/v1/finance/report
 * @desc 获取财务报告
 * @access Private
 */
router.get('/report', financeController.getFinancialReport.bind(financeController));

/**
 * @route GET /api/v1/finance/statements
 * @desc 获取对账单列表
 * @access Private
 */
router.get('/statements', financeController.getStatements.bind(financeController));

/**
 * @route GET /api/v1/finance/records
 * @desc 获取财务记录列表
 * @access Private
 */
router.get('/records', financeController.getFinancialRecords.bind(financeController));

export default router;
