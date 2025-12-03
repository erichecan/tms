// 线路管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理 - 2.1 线路管理

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { RouteService, CreateRouteInput, UpdateRouteInput, CreateRouteSegmentInput, UpdateRouteSegmentInput } from '../services/RouteService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const routeService = new RouteService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// ==================== 线路管理 ====================

// GET /api/routes - 获取线路列表
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const {
      routeType,
      isActive,
      search,
      page = '1',
      limit = '20',
    } = req.query;

    const result = await routeService.getRoutes(tenantId, {
      routeType: routeType as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search as string,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });

    res.json({
      success: true,
      data: result.routes,
      total: result.total,
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    });
  } catch (error: any) {
    logger.error('获取线路列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取线路列表失败: ' + error.message,
    });
  }
});

// GET /api/routes/:id - 获取单个线路
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    const route = await routeService.getRouteById(tenantId, id);

    if (!route) {
      return res.status(404).json({
        success: false,
        message: '线路不存在',
      });
    }

    res.json({
      success: true,
      data: route,
    });
  } catch (error: any) {
    logger.error('获取线路失败:', error);
    res.status(500).json({
      success: false,
      message: '获取线路失败: ' + error.message,
    });
  }
});

// POST /api/routes - 创建线路
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const input: CreateRouteInput = req.body;

    if (!input.routeCode || !input.routeName || !input.routeType || !input.originLocation || !input.destinationLocation) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const route = await routeService.createRoute(tenantId, input);

    res.status(201).json({
      success: true,
      data: route,
      message: '线路创建成功',
    });
  } catch (error: any) {
    logger.error('创建线路失败:', error);
    res.status(500).json({
      success: false,
      message: '创建线路失败: ' + error.message,
    });
  }
});

// PUT /api/routes/:id - 更新线路
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;
    const input: UpdateRouteInput = req.body;

    const route = await routeService.updateRoute(tenantId, id, input);

    res.json({
      success: true,
      data: route,
      message: '线路更新成功',
    });
  } catch (error: any) {
    logger.error('更新线路失败:', error);
    res.status(500).json({
      success: false,
      message: '更新线路失败: ' + error.message,
    });
  }
});

// DELETE /api/routes/:id - 删除线路
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    await routeService.deleteRoute(tenantId, id);

    res.json({
      success: true,
      message: '线路删除成功',
    });
  } catch (error: any) {
    logger.error('删除线路失败:', error);
    res.status(500).json({
      success: false,
      message: '删除线路失败: ' + error.message,
    });
  }
});

// GET /api/routes/:id/metrics - 计算线路里程和过路费
router.get('/:id/metrics', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { id } = req.params;

    const metrics = await routeService.calculateRouteMetrics(tenantId, id);

    res.json({
      success: true,
      data: metrics,
    });
  } catch (error: any) {
    logger.error('计算线路指标失败:', error);
    res.status(500).json({
      success: false,
      message: '计算线路指标失败: ' + error.message,
    });
  }
});

// ==================== 路段管理 ====================

// GET /api/routes/:routeId/segments - 获取线路的所有路段
router.get('/:routeId/segments', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { routeId } = req.params;

    const segments = await routeService.getRouteSegments(tenantId, routeId);

    res.json({
      success: true,
      data: segments,
    });
  } catch (error: any) {
    logger.error('获取路段失败:', error);
    res.status(500).json({
      success: false,
      message: '获取路段失败: ' + error.message,
    });
  }
});

// POST /api/routes/:routeId/segments - 创建路段
router.post('/:routeId/segments', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { routeId } = req.params;
    const input: CreateRouteSegmentInput = req.body;

    if (!input.startLocation || !input.endLocation || input.distanceKm === undefined) {
      return res.status(400).json({
        success: false,
        message: '缺少必填字段',
      });
    }

    const segment = await routeService.createRouteSegment(tenantId, routeId, input);

    res.status(201).json({
      success: true,
      data: segment,
      message: '路段创建成功',
    });
  } catch (error: any) {
    logger.error('创建路段失败:', error);
    res.status(500).json({
      success: false,
      message: '创建路段失败: ' + error.message,
    });
  }
});

// PUT /api/routes/segments/:segmentId - 更新路段
router.put('/segments/:segmentId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { segmentId } = req.params;
    const input: UpdateRouteSegmentInput = req.body;

    const segment = await routeService.updateRouteSegment(tenantId, segmentId, input);

    res.json({
      success: true,
      data: segment,
      message: '路段更新成功',
    });
  } catch (error: any) {
    logger.error('更新路段失败:', error);
    res.status(500).json({
      success: false,
      message: '更新路段失败: ' + error.message,
    });
  }
});

// DELETE /api/routes/segments/:segmentId - 删除路段
router.delete('/segments/:segmentId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(400).json({
        success: false,
        error: { code: 'TENANT_REQUIRED', message: 'Tenant ID is required' },
      });
    }
    const { segmentId } = req.params;

    await routeService.deleteRouteSegment(tenantId, segmentId);

    res.json({
      success: true,
      message: '路段删除成功',
    });
  } catch (error: any) {
    logger.error('删除路段失败:', error);
    res.status(500).json({
      success: false,
      message: '删除路段失败: ' + error.message,
    });
  }
});

export default router;

