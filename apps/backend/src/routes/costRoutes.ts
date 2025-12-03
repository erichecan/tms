// 成本核算管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.3 成本核算

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { VehicleCostService, CreateCostCategoryInput, UpdateCostCategoryInput, CreateVehicleCostInput, UpdateVehicleCostInput } from '../services/VehicleCostService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const costService = new VehicleCostService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// ==================== 成本分类管理 ====================

// GET /api/costs/categories - 获取成本分类列表
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const {
      categoryType,
      isActive,
      parentCategoryId,
    } = req.query;

    const categories = await costService.getCostCategories(tenantId, {
      categoryType: categoryType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      parentCategoryId: parentCategoryId === 'null' ? null : parentCategoryId as string,
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error: any) {
    logger.error('获取成本分类列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成本分类列表失败: ' + error.message,
    });
  }
});

// GET /api/costs/categories/:id - 获取单个成本分类
router.get('/categories/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    const category = await costService.getCostCategoryById(tenantId, id);

    if (!category) {
      return res.status(404).json({
        success: false,
        message: '成本分类不存在',
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (error: any) {
    logger.error('获取成本分类失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成本分类失败: ' + error.message,
    });
  }
});

// POST /api/costs/categories - 创建成本分类
router.post('/categories', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const input: CreateCostCategoryInput = req.body;

    if (!input.categoryCode || !input.categoryName || !input.categoryType) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const category = await costService.createCostCategory(tenantId, input);

    res.status(201).json({
      success: true,
      data: category,
      message: '成本分类创建成功',
    });
  } catch (error: any) {
    logger.error('创建成本分类失败:', error);
    res.status(500).json({
      success: false,
      message: '创建成本分类失败: ' + error.message,
    });
  }
});

// PUT /api/costs/categories/:id - 更新成本分类
router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;
    const input: UpdateCostCategoryInput = req.body;

    const category = await costService.updateCostCategory(tenantId, id, input);

    res.json({
      success: true,
      data: category,
      message: '成本分类更新成功',
    });
  } catch (error: any) {
    logger.error('更新成本分类失败:', error);
    res.status(500).json({
      success: false,
      message: '更新成本分类失败: ' + error.message,
    });
  }
});

// DELETE /api/costs/categories/:id - 删除成本分类
router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    await costService.deleteCostCategory(tenantId, id);

    res.json({
      success: true,
      message: '成本分类删除成功',
    });
  } catch (error: any) {
    logger.error('删除成本分类失败:', error);
    res.status(500).json({
      success: false,
      message: '删除成本分类失败: ' + error.message,
    });
  }
});

// ==================== 车辆成本管理 ====================

// GET /api/costs/vehicles - 获取车辆成本记录列表
router.get('/vehicles', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const {
      vehicleId,
      costType,
      costCategoryId,
      startDate,
      endDate,
      paymentStatus,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await costService.getVehicleCosts(tenantId, {
      vehicleId: vehicleId as string,
      costType: costType as string,
      costCategoryId: costCategoryId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      paymentStatus: paymentStatus as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.costs,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取车辆成本记录列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车辆成本记录列表失败: ' + error.message,
    });
  }
});

// GET /api/costs/vehicles/:id - 获取单个成本记录
router.get('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    const cost = await costService.getVehicleCostById(tenantId, id);

    if (!cost) {
      return res.status(404).json({
        success: false,
        message: '成本记录不存在',
      });
    }

    res.json({
      success: true,
      data: cost,
    });
  } catch (error: any) {
    logger.error('获取车辆成本记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车辆成本记录失败: ' + error.message,
    });
  }
});

// POST /api/costs/vehicles - 创建车辆成本记录
router.post('/vehicles', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const input: CreateVehicleCostInput = req.body;

    if (!input.vehicleId || !input.costCategoryId || !input.costDate || input.costAmount === undefined || !input.costType) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const cost = await costService.createVehicleCost(tenantId, input);

    res.status(201).json({
      success: true,
      data: cost,
      message: '成本记录创建成功',
    });
  } catch (error: any) {
    logger.error('创建车辆成本记录失败:', error);
    res.status(500).json({
      success: false,
      message: '创建车辆成本记录失败: ' + error.message,
    });
  }
});

// PUT /api/costs/vehicles/:id - 更新车辆成本记录
router.put('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;
    const input: UpdateVehicleCostInput = req.body;

    const cost = await costService.updateVehicleCost(tenantId, id, input);

    res.json({
      success: true,
      data: cost,
      message: '成本记录更新成功',
    });
  } catch (error: any) {
    logger.error('更新车辆成本记录失败:', error);
    res.status(500).json({
      success: false,
      message: '更新车辆成本记录失败: ' + error.message,
    });
  }
});

// DELETE /api/costs/vehicles/:id - 删除车辆成本记录
router.delete('/vehicles/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    await costService.deleteVehicleCost(tenantId, id);

    res.json({
      success: true,
      message: '成本记录删除成功',
    });
  } catch (error: any) {
    logger.error('删除车辆成本记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除车辆成本记录失败: ' + error.message,
    });
  }
});

// GET /api/costs/summary - 获取成本汇总统计
router.get('/summary', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const {
      vehicleId,
      startDate,
      endDate,
      costType,
    } = req.query;

    const summary = await costService.getCostSummary(tenantId, {
      vehicleId: vehicleId as string,
      startDate: startDate as string,
      endDate: endDate as string,
      costType: costType as string,
    });

    res.json({
      success: true,
      data: summary,
    });
  } catch (error: any) {
    logger.error('获取成本汇总失败:', error);
    res.status(500).json({
      success: false,
      message: '获取成本汇总失败: ' + error.message,
    });
  }
});

// POST /api/costs/compare - 成本对比分析
router.post('/compare', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { vehicleIds, startDate, endDate } = req.body;

    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供至少一个车辆ID',
      });
    }

    const comparison = await costService.compareVehicleCosts(
      tenantId,
      vehicleIds,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: comparison,
    });
  } catch (error: any) {
    logger.error('成本对比分析失败:', error);
    res.status(500).json({
      success: false,
      message: '成本对比分析失败: ' + error.message,
    });
  }
});

export default router;

