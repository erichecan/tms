import { Router } from 'express';
import { MvpShipmentController } from '../controllers/MvpShipmentController';
import { DatabaseService } from '../services/DatabaseService';
import { validateRequest } from '../middleware/validationMiddleware';

const router = Router();
const dbService = new DatabaseService(); // 数据库服务 // 2025-09-23 10:15:00
const controller = new MvpShipmentController(dbService); // 控制器 // 2025-09-23 10:15:00

// 创建运单 // 2025-09-23 10:15:00
router.post(
  '/',
  validateRequest({
    body: {
      shipperName: { type: 'string', required: true },
      shipperPhone: { type: 'string', required: true },
      shipperAddress: { type: 'object', required: true },
      receiverName: { type: 'string', required: true },
      receiverPhone: { type: 'string', required: true },
      receiverAddress: { type: 'object', required: true },
      weightKg: { type: 'number', required: true },
      dimensions: { type: 'object', required: true },
      estimatedCost: { type: 'number', required: false },
      finalCost: { type: 'number', required: false }
    }
  }),
  controller.createShipment.bind(controller)
);

// 运单列表（分页+按status过滤） // 2025-09-23 10:15:00
router.get('/', controller.listShipments.bind(controller));

// 运单详情（含 timeline 与 POD 列表） // 2025-09-23 10:15:00
router.get('/:id', controller.getShipmentDetail.bind(controller));

export default router;


