// 运单路由
// 创建时间: 2025-01-27 15:30:45

import { Router } from 'express';
import { ShipmentController } from '../controllers/ShipmentController';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest, shipmentCreateFormSchema } from '../middleware/validationMiddleware';

const router = Router();

// 初始化服务
const dbService = new DatabaseService();
const ruleEngineService = new RuleEngineService(dbService);
const shipmentController = new ShipmentController(dbService, ruleEngineService);

// 应用中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

/**
 * @route GET /api/v1/shipments
 * @desc 获取运单列表
 * @access Private
 */
router.get('/', shipmentController.getShipments.bind(shipmentController));

/**
 * @route POST /api/v1/shipments
 * @desc 创建运单
 * @access Private
 */
router.post('/',
  validateRequest({
    body: shipmentCreateFormSchema
  }),
  shipmentController.createShipment.bind(shipmentController)
);

/**
 * @route GET /api/v1/shipments/:id
 * @desc 获取单个运单
 * @access Private
 */
router.get('/:id', shipmentController.getShipment.bind(shipmentController));

/**
 * @route PUT /api/v1/shipments/:id
 * @desc 更新运单
 * @access Private
 */
router.put('/:id',
  validateRequest({
    body: {
      status: { type: 'string', enum: ['pending', 'quoted', 'confirmed', 'assigned', 'picked_up', 'in_transit', 'delivered', 'completed', 'cancelled', 'exception'], required: false },
      driverId: { type: 'string', required: false },
      actualCost: { type: 'number', required: false },
      additionalFees: { type: 'array', required: false },
      timeline: { type: 'object', required: false },
      notes: { type: 'string', required: false }
    }
  }),
  shipmentController.updateShipment.bind(shipmentController)
);

/**
 * @route POST /api/v1/shipments/:id/assign
 * @desc 分配司机
 * @access Private
 */
router.post('/:id/assign',
  validateRequest({
    body: {
      driverId: { type: 'string', required: true },
      notes: { type: 'string', required: false }
    }
  }),
  shipmentController.assignDriver.bind(shipmentController)
);

/**
 * @route POST /api/v1/shipments/:id/confirm
 * @desc 确认运单
 * @access Private
 */
router.post('/:id/confirm', shipmentController.confirmShipment.bind(shipmentController));

/**
 * @route POST /api/v1/shipments/:id/pickup
 * @desc 开始取货
 * @access Private
 */
router.post('/:id/pickup',
  validateRequest({
    body: {
      driverId: { type: 'string', required: false }
    }
  }),
  shipmentController.startPickup.bind(shipmentController)
);

/**
 * @route POST /api/v1/shipments/:id/transit
 * @desc 开始运输
 * @access Private
 */
router.post('/:id/transit',
  validateRequest({
    body: {
      driverId: { type: 'string', required: false }
    }
  }),
  shipmentController.startTransit.bind(shipmentController)
);

/**
 * @route POST /api/v1/shipments/:id/delivery
 * @desc 完成配送
 * @access Private
 */
router.post('/:id/delivery',
  validateRequest({
    body: {
      driverId: { type: 'string', required: false },
      deliveryNotes: { type: 'string', required: false }
    }
  }),
  shipmentController.completeDelivery.bind(shipmentController)
);

/**
 * @route POST /api/v1/shipments/:id/complete
 * @desc 完成运单
 * @access Private
 */
router.post('/:id/complete',
  validateRequest({
    body: {
      finalCost: { type: 'number', required: false }
    }
  }),
  shipmentController.completeShipment.bind(shipmentController)
);

/**
 * @route POST /api/v1/shipments/:id/cancel
 * @desc 取消运单
 * @access Private
 */
router.post('/:id/cancel',
  validateRequest({
    body: {
      reason: { type: 'string', required: true }
    }
  }),
  shipmentController.cancelShipment.bind(shipmentController)
);

/**
 * @route GET /api/v1/shipments/stats
 * @desc 获取运单统计
 * @access Private
 */
router.get('/stats', shipmentController.getShipmentStats.bind(shipmentController));

/**
 * @route GET /api/v1/shipments/driver/:driverId
 * @desc 获取司机运单列表
 * @access Private
 */
router.get('/driver/:driverId', shipmentController.getDriverShipments.bind(shipmentController));

export default router;
