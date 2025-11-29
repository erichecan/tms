// 站点与仓库管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.2 站点与仓库管理

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { StationService, CreateStationInput, UpdateStationInput } from '../services/StationService';
import { WarehouseService, CreateWarehouseInput, UpdateWarehouseInput, CreateHubInput, UpdateHubInput } from '../services/WarehouseService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const stationService = new StationService(dbService);
const warehouseService = new WarehouseService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// ==================== 站点管理 ====================

// GET /api/stations - 获取站点列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      stationType,
      isActive,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await stationService.getStations(tenantId, {
      stationType: stationType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.stations,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取站点列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取站点列表失败: ' + error.message,
    });
  }
});

// GET /api/stations/:id - 获取单个站点
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const station = await stationService.getStationById(tenantId, id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: '站点不存在',
      });
    }

    res.json({
      success: true,
      data: station,
    });
  } catch (error: any) {
    logger.error('获取站点失败:', error);
    res.status(500).json({
      success: false,
      message: '获取站点失败: ' + error.message,
    });
  }
});

// POST /api/stations - 创建站点
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateStationInput = req.body;

    if (!input.stationCode || !input.stationName || !input.stationType || !input.address) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const station = await stationService.createStation(tenantId, input);

    res.status(201).json({
      success: true,
      data: station,
      message: '站点创建成功',
    });
  } catch (error: any) {
    logger.error('创建站点失败:', error);
    res.status(500).json({
      success: false,
      message: '创建站点失败: ' + error.message,
    });
  }
});

// PUT /api/stations/:id - 更新站点
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateStationInput = req.body;

    const station = await stationService.updateStation(tenantId, id, input);

    res.json({
      success: true,
      data: station,
      message: '站点更新成功',
    });
  } catch (error: any) {
    logger.error('更新站点失败:', error);
    res.status(500).json({
      success: false,
      message: '更新站点失败: ' + error.message,
    });
  }
});

// DELETE /api/stations/:id - 删除站点
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await stationService.deleteStation(tenantId, id);

    res.json({
      success: true,
      message: '站点删除成功',
    });
  } catch (error: any) {
    logger.error('删除站点失败:', error);
    res.status(500).json({
      success: false,
      message: '删除站点失败: ' + error.message,
    });
  }
});

// ==================== 仓库管理 ====================

// GET /api/stations/warehouses - 获取仓库列表
router.get('/warehouses', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      warehouseType,
      isActive,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await warehouseService.getWarehouses(tenantId, {
      warehouseType: warehouseType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.warehouses,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取仓库列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仓库列表失败: ' + error.message,
    });
  }
});

// GET /api/stations/warehouses/:id - 获取单个仓库
router.get('/warehouses/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const warehouse = await warehouseService.getWarehouseById(tenantId, id);

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: '仓库不存在',
      });
    }

    res.json({
      success: true,
      data: warehouse,
    });
  } catch (error: any) {
    logger.error('获取仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仓库失败: ' + error.message,
    });
  }
});

// POST /api/stations/warehouses - 创建仓库
router.post('/warehouses', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateWarehouseInput = req.body;

    if (!input.warehouseCode || !input.warehouseName || !input.warehouseType || !input.address) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const warehouse = await warehouseService.createWarehouse(tenantId, input);

    res.status(201).json({
      success: true,
      data: warehouse,
      message: '仓库创建成功',
    });
  } catch (error: any) {
    logger.error('创建仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '创建仓库失败: ' + error.message,
    });
  }
});

// PUT /api/stations/warehouses/:id - 更新仓库
router.put('/warehouses/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateWarehouseInput = req.body;

    const warehouse = await warehouseService.updateWarehouse(tenantId, id, input);

    res.json({
      success: true,
      data: warehouse,
      message: '仓库更新成功',
    });
  } catch (error: any) {
    logger.error('更新仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '更新仓库失败: ' + error.message,
    });
  }
});

// DELETE /api/stations/warehouses/:id - 删除仓库
router.delete('/warehouses/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await warehouseService.deleteWarehouse(tenantId, id);

    res.json({
      success: true,
      message: '仓库删除成功',
    });
  } catch (error: any) {
    logger.error('删除仓库失败:', error);
    res.status(500).json({
      success: false,
      message: '删除仓库失败: ' + error.message,
    });
  }
});

// ==================== 枢纽管理 ====================

// GET /api/stations/hubs - 获取枢纽列表
router.get('/hubs', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      isActive,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await warehouseService.getHubs(tenantId, {
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.hubs,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取枢纽列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取枢纽列表失败: ' + error.message,
    });
  }
});

// GET /api/stations/hubs/:id - 获取单个枢纽
router.get('/hubs/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const hub = await warehouseService.getHubById(tenantId, id);

    if (!hub) {
      return res.status(404).json({
        success: false,
        message: '枢纽不存在',
      });
    }

    res.json({
      success: true,
      data: hub,
    });
  } catch (error: any) {
    logger.error('获取枢纽失败:', error);
    res.status(500).json({
      success: false,
      message: '获取枢纽失败: ' + error.message,
    });
  }
});

// POST /api/stations/hubs - 创建枢纽
router.post('/hubs', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateHubInput = req.body;

    if (!input.hubCode || !input.hubName || !input.address) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const hub = await warehouseService.createHub(tenantId, input);

    res.status(201).json({
      success: true,
      data: hub,
      message: '枢纽创建成功',
    });
  } catch (error: any) {
    logger.error('创建枢纽失败:', error);
    res.status(500).json({
      success: false,
      message: '创建枢纽失败: ' + error.message,
    });
  }
});

// PUT /api/stations/hubs/:id - 更新枢纽
router.put('/hubs/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateHubInput = req.body;

    const hub = await warehouseService.updateHub(tenantId, id, input);

    res.json({
      success: true,
      data: hub,
      message: '枢纽更新成功',
    });
  } catch (error: any) {
    logger.error('更新枢纽失败:', error);
    res.status(500).json({
      success: false,
      message: '更新枢纽失败: ' + error.message,
    });
  }
});

// DELETE /api/stations/hubs/:id - 删除枢纽
router.delete('/hubs/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await warehouseService.deleteHub(tenantId, id);

    res.json({
      success: true,
      message: '枢纽删除成功',
    });
  } catch (error: any) {
    logger.error('删除枢纽失败:', error);
    res.status(500).json({
      success: false,
      message: '删除枢纽失败: ' + error.message,
    });
  }
});

export default router;

