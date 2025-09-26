import { Router } from 'express';
import { DatabaseService } from '../services/DatabaseService';

const router = Router();
const dbService = new DatabaseService();

// GET /api/v1/vehicles - 获取车辆列表
router.get('/', async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const vehicles = await dbService.getVehicles(Number(limit), Number(offset));
    res.json({ success: true, data: vehicles });
  } catch (e: any) {
    console.error('Get vehicles error:', e);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  }
});

// POST /api/v1/vehicles - 创建新车辆
router.post('/', async (req, res) => {
  try {
    const { plateNumber, vehicleType, capacity, status = 'active' } = req.body;
    
    // 验证必填字段
    if (!plateNumber || !vehicleType || !capacity) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: '车牌号、车辆类型和载重能力是必填字段' }
      });
    }

    // 创建车辆
    const vehicle = await dbService.createVehicle({
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
});

// GET /api/v1/vehicles/:id - 获取单个车辆
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const vehicle = await dbService.getVehicleById(id);
    
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '车辆不存在' }
      });
    }

    res.json({ success: true, data: vehicle });
  } catch (e: any) {
    console.error('Get vehicle error:', e);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  }
});

// DELETE /api/v1/vehicles/:id - 删除车辆
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 检查车辆是否存在
    const vehicle = await dbService.getVehicleById(id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: '车辆不存在' }
      });
    }

    // 删除车辆
    await dbService.deleteVehicle(id);

    res.json({ success: true, message: '车辆删除成功' });
  } catch (e: any) {
    console.error('Delete vehicle error:', e);
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  }
});

export default router;