import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { validateRequest } from '../middleware/validationMiddleware'; // 2025-12-24 Added
import { sendSuccess, handleApiError, sendError } from '../utils/apiUtils'; // 2025-12-24 Added

const router = Router();
const dbService = new DatabaseService();

// GET /api/v1/vehicles - 获取车辆列表 // 2025-10-31 09:45:00 添加租户隔离
router.get('/',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const params: any = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 50,
        status: req.query.status as string,
      };

      const vehicles = await dbService.getVehiclesByTenant(tenantId, params);
      return sendSuccess(res, vehicles);
    } catch (e: any) {
      return handleApiError(res, e, 'Failed to get vehicles');
    }
  }
);

// POST /api/v1/vehicles - 创建新车辆 // 2025-10-31 10:16:00 添加租户隔离
router.post('/',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const {
        plateNumber,
        vehicleType,
        type, // 兼容前端可能发送的 type
        capacity,
        capacityKg, // 兼容前端可能发送的 capacityKg
        status = 'available'
      } = req.body;

      if (!plateNumber) {
        return sendError(res, 400, 'VALIDATION_ERROR', 'Plate number is required');
      }

      // 统一字段名称
      const finalVehicleType = vehicleType || type;
      const finalCapacity = capacity || capacityKg;

      // 创建车辆
      const vehicle = await dbService.createVehicle(tenantId, {
        plateNumber,
        vehicleType: finalVehicleType,
        capacity: finalCapacity !== undefined && finalCapacity !== null ? Number(finalCapacity) : undefined,
        status
      });

      return sendSuccess(res, vehicle, 'Vehicle created successfully', 201);
    } catch (e: any) {
      return handleApiError(res, e, 'Failed to create vehicle');
    }
  }
);

// GET /api/v1/vehicles/:id - 获取单个车辆 // 2025-10-31 10:16:00 添加租户隔离
router.get('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const vehicle = await dbService.getVehicleById(id);

      if (!vehicle) {
        return sendError(res, 404, 'NOT_FOUND', 'Vehicle not found');
      }

      // 验证车辆属于当前租户
      if (vehicle.tenant_id !== tenantId) {
        return sendError(res, 403, 'FORBIDDEN', 'Access denied to this vehicle');
      }

      return sendSuccess(res, vehicle);
    } catch (e: any) {
      return handleApiError(res, e, 'Failed to get vehicle');
    }
  }
);

// PUT /api/v1/vehicles/:id - 更新车辆 // 2025-10-31 10:16:00 添加租户隔离
router.put('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;
      const {
        plateNumber,
        vehicleType,
        type,
        capacity,
        capacityKg,
        status
      } = req.body;

      const finalVehicleType = vehicleType || type;
      const finalCapacity = capacity || capacityKg;

      // 更新车辆
      const vehicle = await dbService.updateVehicle(id, {
        plateNumber,
        vehicleType: finalVehicleType,
        capacity: finalCapacity !== undefined && finalCapacity !== null ? Number(finalCapacity) : undefined,
        status
      });

      return sendSuccess(res, vehicle);
    } catch (e: any) {
      return handleApiError(res, e, 'Failed to update vehicle');
    }
  }
);


// DELETE /api/v1/vehicles/:id - 删除车辆 // 2025-10-31 10:16:00 添加租户隔离
router.delete('/:id',
  authMiddleware,
  tenantMiddleware,
  async (req, res) => {
    try {
      const tenantId = req.user!.tenantId;
      const { id } = req.params;

      // 检查车辆是否存在
      const vehicle = await dbService.getVehicleById(id);
      if (!vehicle) {
        return sendError(res, 404, 'NOT_FOUND', 'Vehicle not found');
      }

      // 验证车辆属于当前租户
      if (vehicle.tenant_id !== tenantId) {
        return sendError(res, 403, 'FORBIDDEN', 'Access denied to this vehicle');
      }

      // 删除车辆
      await dbService.deleteVehicle(tenantId, id);

      return sendSuccess(res, null, 'Vehicle deleted successfully');
    } catch (e: any) {
      return handleApiError(res, e, 'Failed to delete vehicle');
    }
  }
);


export default router;