// 维护记录管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理 - 3.1 维护保养完整功能

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { MaintenanceService, CreateMaintenanceRecordInput, UpdateMaintenanceRecordInput } from '../services/MaintenanceService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const maintenanceService = new MaintenanceService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/maintenance/records - 获取维护记录列表
router.get('/records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      vehicleId,
      status,
      maintenanceType,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await maintenanceService.getMaintenanceRecords(tenantId, {
      vehicleId: vehicleId as string,
      status: status as string,
      maintenanceType: maintenanceType as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.records,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取维护记录列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取维护记录列表失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/records/:id - 获取单个维护记录
router.get('/records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const record = await maintenanceService.getMaintenanceRecordById(tenantId, id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: '维护记录不存在',
      });
    }

    res.json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    logger.error('获取维护记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取维护记录失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/vehicles/:vehicleId/records - 获取车辆的维护记录
router.get('/vehicles/:vehicleId/records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { vehicleId } = req.params;

    const records = await maintenanceService.getMaintenanceRecordsByVehicle(
      tenantId,
      vehicleId
    );

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    logger.error('获取车辆维护记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车辆维护记录失败: ' + error.message,
    });
  }
});

// POST /api/maintenance/records - 创建维护记录
router.post('/records', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateMaintenanceRecordInput = req.body;

    // 验证必填字段
    if (!input.vehicleId || !input.maintenanceType || !input.description || !input.maintenanceDate) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const record = await maintenanceService.createMaintenanceRecord(tenantId, input);

    res.status(201).json({
      success: true,
      data: record,
      message: '维护记录创建成功',
    });
  } catch (error: any) {
    logger.error('创建维护记录失败:', error);
    res.status(500).json({
      success: false,
      message: '创建维护记录失败: ' + error.message,
    });
  }
});

// PUT /api/maintenance/records/:id - 更新维护记录
router.put('/records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateMaintenanceRecordInput = req.body;

    const record = await maintenanceService.updateMaintenanceRecord(tenantId, id, input);

    res.json({
      success: true,
      data: record,
      message: '维护记录更新成功',
    });
  } catch (error: any) {
    logger.error('更新维护记录失败:', error);
    res.status(500).json({
      success: false,
      message: '更新维护记录失败: ' + error.message,
    });
  }
});

// DELETE /api/maintenance/records/:id - 删除维护记录
router.delete('/records/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await maintenanceService.deleteMaintenanceRecord(tenantId, id);

    res.json({
      success: true,
      message: '维护记录删除成功',
    });
  } catch (error: any) {
    logger.error('删除维护记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除维护记录失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/upcoming - 获取即将到期的维护提醒
router.get('/upcoming', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const daysAhead = req.query.daysAhead
      ? parseInt(req.query.daysAhead as string)
      : 30;

    const records = await maintenanceService.getUpcomingMaintenance(tenantId, daysAhead);

    res.json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    logger.error('获取即将到期维护失败:', error);
    res.status(500).json({
      success: false,
      message: '获取即将到期维护失败: ' + error.message,
    });
  }
});

// ==================== 保养计划管理 ====================

// GET /api/maintenance/plans - 获取保养计划列表
router.get('/plans', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      vehicleId,
      isActive,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await maintenancePlanService.getMaintenancePlans(tenantId, {
      vehicleId: vehicleId as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.plans,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取保养计划列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取保养计划列表失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/plans/:id - 获取单个保养计划
router.get('/plans/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const plan = await maintenancePlanService.getMaintenancePlanById(tenantId, id);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: '保养计划不存在',
      });
    }

    res.json({
      success: true,
      data: plan,
    });
  } catch (error: any) {
    logger.error('获取保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取保养计划失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/vehicles/:vehicleId/plans - 获取车辆的保养计划
router.get('/vehicles/:vehicleId/plans', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { vehicleId } = req.params;
    const isActive = req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined;

    const plans = await maintenancePlanService.getMaintenancePlansByVehicle(
      tenantId,
      vehicleId,
      isActive
    );

    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    logger.error('获取车辆保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车辆保养计划失败: ' + error.message,
    });
  }
});

// POST /api/maintenance/plans - 创建保养计划
router.post('/plans', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateMaintenancePlanInput = req.body;

    if (!input.vehicleId || !input.planName || !input.maintenanceType || !input.intervalType) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const plan = await maintenancePlanService.createMaintenancePlan(tenantId, input);

    res.status(201).json({
      success: true,
      data: plan,
      message: '保养计划创建成功',
    });
  } catch (error: any) {
    logger.error('创建保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '创建保养计划失败: ' + error.message,
    });
  }
});

// PUT /api/maintenance/plans/:id - 更新保养计划
router.put('/plans/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateMaintenancePlanInput = req.body;

    const plan = await maintenancePlanService.updateMaintenancePlan(tenantId, id, input);

    res.json({
      success: true,
      data: plan,
      message: '保养计划更新成功',
    });
  } catch (error: any) {
    logger.error('更新保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '更新保养计划失败: ' + error.message,
    });
  }
});

// DELETE /api/maintenance/plans/:id - 删除保养计划
router.delete('/plans/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await maintenancePlanService.deleteMaintenancePlan(tenantId, id);

    res.json({
      success: true,
      message: '保养计划删除成功',
    });
  } catch (error: any) {
    logger.error('删除保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '删除保养计划失败: ' + error.message,
    });
  }
});

// POST /api/maintenance/plans/:id/execute - 执行保养计划
router.post('/plans/:id/execute', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const { executionDate, executionMileage } = req.body;

    if (!executionDate) {
      return res.status(400).json({
        success: false,
        message: '缺少执行日期',
      });
    }

    const plan = await maintenancePlanService.executeMaintenancePlan(
      tenantId,
      id,
      executionDate,
      executionMileage
    );

    res.json({
      success: true,
      data: plan,
      message: '保养计划执行成功',
    });
  } catch (error: any) {
    logger.error('执行保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '执行保养计划失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/plans/upcoming - 获取即将到期的保养计划
router.get('/plans/upcoming', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const daysAhead = req.query.daysAhead
      ? parseInt(req.query.daysAhead as string)
      : 30;

    const plans = await maintenancePlanService.getUpcomingMaintenancePlans(tenantId, daysAhead);

    res.json({
      success: true,
      data: plans,
    });
  } catch (error: any) {
    logger.error('获取即将到期保养计划失败:', error);
    res.status(500).json({
      success: false,
      message: '获取即将到期保养计划失败: ' + error.message,
    });
  }
});

// ==================== 维修工单管理 ====================

// GET /api/maintenance/work-orders - 获取工单列表
router.get('/work-orders', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      vehicleId,
      status,
      priority,
      workOrderType,
      assignedTo,
      startDate,
      endDate,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await workOrderService.getWorkOrders(tenantId, {
      vehicleId: vehicleId as string,
      status: status as string,
      priority: priority as string,
      workOrderType: workOrderType as string,
      assignedTo: assignedTo as string,
      startDate: startDate as string,
      endDate: endDate as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.workOrders,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取工单列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工单列表失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/work-orders/:id - 获取单个工单
router.get('/work-orders/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const workOrder = await workOrderService.getWorkOrderById(tenantId, id);

    if (!workOrder) {
      return res.status(404).json({
        success: false,
        message: '工单不存在',
      });
    }

    res.json({
      success: true,
      data: workOrder,
    });
  } catch (error: any) {
    logger.error('获取工单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取工单失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/vehicles/:vehicleId/work-orders - 获取车辆的工单
router.get('/vehicles/:vehicleId/work-orders', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { vehicleId } = req.params;

    const workOrders = await workOrderService.getWorkOrdersByVehicle(tenantId, vehicleId);

    res.json({
      success: true,
      data: workOrders,
    });
  } catch (error: any) {
    logger.error('获取车辆工单失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车辆工单失败: ' + error.message,
    });
  }
});

// POST /api/maintenance/work-orders - 创建工单
router.post('/work-orders', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateWorkOrderInput = req.body;

    if (!input.vehicleId || !input.workOrderType || !input.description) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const workOrder = await workOrderService.createWorkOrder(tenantId, input);

    res.status(201).json({
      success: true,
      data: workOrder,
      message: '工单创建成功',
    });
  } catch (error: any) {
    logger.error('创建工单失败:', error);
    res.status(500).json({
      success: false,
      message: '创建工单失败: ' + error.message,
    });
  }
});

// PUT /api/maintenance/work-orders/:id - 更新工单
router.put('/work-orders/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateWorkOrderInput = req.body;

    const workOrder = await workOrderService.updateWorkOrder(tenantId, id, input);

    res.json({
      success: true,
      data: workOrder,
      message: '工单更新成功',
    });
  } catch (error: any) {
    logger.error('更新工单失败:', error);
    res.status(500).json({
      success: false,
      message: '更新工单失败: ' + error.message,
    });
  }
});

// DELETE /api/maintenance/work-orders/:id - 删除工单
router.delete('/work-orders/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await workOrderService.deleteWorkOrder(tenantId, id);

    res.json({
      success: true,
      message: '工单删除成功',
    });
  } catch (error: any) {
    logger.error('删除工单失败:', error);
    res.status(500).json({
      success: false,
      message: '删除工单失败: ' + error.message,
    });
  }
});

// ==================== 备件管理 ====================

// GET /api/maintenance/spare-parts - 获取备件列表
router.get('/spare-parts', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const {
      partCategory,
      isActive,
      lowStock,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await sparePartsService.getSpareParts(tenantId, {
      partCategory: partCategory as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      lowStock: lowStock === 'true',
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.parts,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取备件列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取备件列表失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/spare-parts/:id - 获取单个备件
router.get('/spare-parts/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    const part = await sparePartsService.getSparePartById(tenantId, id);

    if (!part) {
      return res.status(404).json({
        success: false,
        message: '备件不存在',
      });
    }

    res.json({
      success: true,
      data: part,
    });
  } catch (error: any) {
    logger.error('获取备件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取备件失败: ' + error.message,
    });
  }
});

// POST /api/maintenance/spare-parts - 创建备件
router.post('/spare-parts', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const input: CreateSparePartInput = req.body;

    if (!input.partNumber || !input.partName || input.unitPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const part = await sparePartsService.createSparePart(tenantId, input);

    res.status(201).json({
      success: true,
      data: part,
      message: '备件创建成功',
    });
  } catch (error: any) {
    logger.error('创建备件失败:', error);
    res.status(500).json({
      success: false,
      message: '创建备件失败: ' + error.message,
    });
  }
});

// PUT /api/maintenance/spare-parts/:id - 更新备件
router.put('/spare-parts/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: UpdateSparePartInput = req.body;

    const part = await sparePartsService.updateSparePart(tenantId, id, input);

    res.json({
      success: true,
      data: part,
      message: '备件更新成功',
    });
  } catch (error: any) {
    logger.error('更新备件失败:', error);
    res.status(500).json({
      success: false,
      message: '更新备件失败: ' + error.message,
    });
  }
});

// DELETE /api/maintenance/spare-parts/:id - 删除备件
router.delete('/spare-parts/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;

    await sparePartsService.deleteSparePart(tenantId, id);

    res.json({
      success: true,
      message: '备件删除成功',
    });
  } catch (error: any) {
    logger.error('删除备件失败:', error);
    res.status(500).json({
      success: false,
      message: '删除备件失败: ' + error.message,
    });
  }
});

// POST /api/maintenance/spare-parts/:id/adjust-stock - 库存调整
router.post('/spare-parts/:id/adjust-stock', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;
    const { id } = req.params;
    const input: StockAdjustmentInput = req.body;

    if (!input.adjustmentType || input.quantity === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const part = await sparePartsService.adjustStock(tenantId, id, input);

    res.json({
      success: true,
      data: part,
      message: '库存调整成功',
    });
  } catch (error: any) {
    logger.error('库存调整失败:', error);
    res.status(500).json({
      success: false,
      message: '库存调整失败: ' + error.message,
    });
  }
});

// GET /api/maintenance/spare-parts/low-stock - 获取低库存备件
router.get('/spare-parts/low-stock', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenantId!;

    const parts = await sparePartsService.getLowStockParts(tenantId);

    res.json({
      success: true,
      data: parts,
    });
  } catch (error: any) {
    logger.error('获取低库存备件失败:', error);
    res.status(500).json({
      success: false,
      message: '获取低库存备件失败: ' + error.message,
    });
  }
});

export default router;

