import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';

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
      res.json({ success: true, data: vehicles });
    } catch (e: any) {
      console.error('Get vehicles error:', e);
      res.status(500).json({ 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: e.message } 
      });
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
      const { plateNumber, vehicleType, capacity, status = 'available' } = req.body;
      
      // 验证必填字段
      if (!plateNumber || !vehicleType || !capacity) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '车牌号、车辆类型和载重能力是必填字段' }
        });
      }

      // 创建车辆
      const vehicle = await dbService.createVehicle(tenantId, {
        plateNumber,
        vehicleType,
        capacity: Number(capacity),
        status
      });

      res.status(201).json({ success: true, data: vehicle });
    } catch (e: any) {
      console.error('Create vehicle error:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
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
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '车辆不存在' }
        });
      }

      // 验证车辆属于当前租户
      if (vehicle.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权访问此车辆' }
        });
      }

      res.json({ success: true, data: vehicle });
    } catch (e: any) {
      console.error('Get vehicle error:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
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
      const { plateNumber, vehicleType, capacity, status } = req.body;
      
      // 验证必填字段
      if (!plateNumber || !vehicleType || !capacity) {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: '车牌号、车辆类型和载重能力是必填字段' }
        });
      }

      // 检查车辆是否存在
      const existingVehicle = await dbService.getVehicleById(id);
      if (!existingVehicle) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '车辆不存在' }
        });
      }

      // 验证车辆属于当前租户
      if (existingVehicle.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权访问此车辆' }
        });
      }

      // 更新车辆
      const vehicle = await dbService.updateVehicle(id, {
        plateNumber,
        vehicleType,
        capacity: Number(capacity),
        status
      });

      res.json({ success: true, data: vehicle });
    } catch (e: any) {
      console.error('Update vehicle error:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
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
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: '车辆不存在' }
        });
      }

      // 验证车辆属于当前租户
      if (vehicle.tenant_id !== tenantId) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: '无权访问此车辆' }
        });
      }

      // 删除车辆
      await dbService.deleteVehicle(id);

      res.json({ success: true, message: '车辆删除成功' });
    } catch (e: any) {
      console.error('Delete vehicle error:', e);
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
    }
  }
);


export default router;