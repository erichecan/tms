// 司机排班管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { DriverScheduleService, CreateDriverScheduleInput, UpdateDriverScheduleInput } from '../services/DriverScheduleService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const scheduleService = new DriverScheduleService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/drivers/:driverId/schedules - 获取司机的排班记录
router.get('/:driverId/schedules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    const schedules = await scheduleService.getSchedulesByDriver(
      tenantId,
      driverId,
      startDate || undefined,
      endDate || undefined
    );

    res.json({
      success: true,
      data: schedules,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get driver schedules error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/drivers/schedules/date/:date - 获取某日期的所有排班
router.get('/schedules/date/:date', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { date } = req.params;

    const schedules = await scheduleService.getSchedulesByDate(tenantId, date);

    res.json({
      success: true,
      data: schedules,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get schedules by date error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/drivers/:driverId/schedules - 创建排班记录
router.post('/:driverId/schedules', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;
    const input: CreateDriverScheduleInput = {
      ...req.body,
      driverId
    };

    const schedule = await scheduleService.createSchedule(tenantId, input);

    res.status(201).json({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create driver schedule error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/drivers/schedules/:id - 更新排班记录
router.put('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateDriverScheduleInput = req.body;

    const schedule = await scheduleService.updateSchedule(tenantId, id, input);

    res.json({
      success: true,
      data: schedule,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update driver schedule error:', error);
    if (error.message === 'Schedule not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else {
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
  }
});

// DELETE /api/drivers/schedules/:id - 删除排班记录
router.delete('/schedules/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await scheduleService.deleteSchedule(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Schedule not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Schedule deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete driver schedule error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/drivers/:driverId/schedules/check-hours - 检查司机工时是否超限
router.get('/:driverId/schedules/check-hours', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { driverId } = req.params;
    const date = req.query.date as string || new Date().toISOString().split('T')[0];

    const result = await scheduleService.checkWorkHoursLimit(tenantId, driverId, date);

    res.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Check work hours limit error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

