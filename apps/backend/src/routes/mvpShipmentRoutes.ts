import { Router } from 'express';
import Joi from 'joi';
import { MvpShipmentController } from '../controllers/MvpShipmentController';
import { DatabaseService } from '../services/DatabaseService';
import { validateRequest } from '../middleware/validationMiddleware';
// 2025-11-30T21:00:00 修复：添加认证和租户中间件
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

const router = Router();
const dbService = new DatabaseService(); // 数据库服务 // 2025-09-23 10:15:00
const controller = new MvpShipmentController(dbService); // 控制器 // 2025-09-23 10:15:00

// 2025-11-30T21:00:00 修复：应用认证和租户中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

const createShipmentSchema = Joi.object({
  shipperName: Joi.string().required(),
  shipperPhone: Joi.string().required(),
  shipperAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  receiverName: Joi.string().required(),
  receiverPhone: Joi.string().required(),
  receiverAddress: Joi.object({
    street: Joi.string().required(),
    city: Joi.string().required(),
    state: Joi.string().required(),
    zip: Joi.string().required(),
    country: Joi.string().required(),
  }).required(),
  weightKg: Joi.number().required(),
  dimensions: Joi.object({
    length: Joi.number().required(),
    width: Joi.number().required(),
    height: Joi.number().required(),
    unit: Joi.string().required(),
  }).required(),
  estimatedCost: Joi.number().optional(),
  finalCost: Joi.number().optional()
});

// 创建运单 // 2025-09-23 10:15:00
router.post(
  '/',
  validateRequest({ body: createShipmentSchema }),
  controller.createShipment.bind(controller)
);

// 运单列表（分页+按status过滤） // 2025-09-23 10:15:00
router.get('/', controller.listShipments.bind(controller));

// 运单时间线 // 2025-11-30 00:15:00 新增：获取运单时间线事件
router.get('/:id/timeline', controller.getShipmentTimeline.bind(controller));

// 运单POD列表 // 2025-11-30 00:15:00 新增：获取运单POD列表
router.get('/:id/pods', controller.getShipmentPODs.bind(controller));

// 运单详情（含 timeline 与 POD 列表） // 2025-09-23 10:15:00
router.get('/:id', controller.getShipmentDetail.bind(controller));

export default router;


