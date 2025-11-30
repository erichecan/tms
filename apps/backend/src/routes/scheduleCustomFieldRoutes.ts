// 排班自定义字段定义路由
// 创建时间: 2025-11-29T11:25:04Z
// 产品需求：排班管理支持自定义字段

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { ScheduleCustomFieldService, CreateScheduleCustomFieldDefinitionInput, UpdateScheduleCustomFieldDefinitionInput } from '../services/ScheduleCustomFieldService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const fieldService = new ScheduleCustomFieldService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/schedules/custom-fields - 获取所有自定义字段定义
router.get('/', async (req: Request, res: Response) => {
  try {
    // 2025-11-30 06:55:00 修复：使用 req.tenant?.id 而不是 req.user!.tenantId
    const tenantId = req.tenant?.id || req.user?.tenantId;
    if (!tenantId) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Tenant not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    const activeOnly = req.query.activeOnly === 'true';

    const fields = await fieldService.getFieldDefinitions(tenantId, activeOnly);

    res.json({
      success: true,
      data: fields,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get schedule custom field definitions error:', error);
    // 2025-11-30 06:55:00 修复：如果表不存在，返回空数组而不是500错误
    if (error.code === '42P01') { // relation does not exist
      logger.warn('Table schedule_custom_field_definitions might not exist. Returning empty array.');
      return res.json({
        success: true,
        data: [],
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/schedules/custom-fields/:id - 获取单个字段定义
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const field = await fieldService.getFieldDefinition(tenantId, id);

    if (!field) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Field definition not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      data: field,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get schedule custom field definition error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/schedules/custom-fields - 创建字段定义
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const input: CreateScheduleCustomFieldDefinitionInput = {
      ...req.body,
      createdBy: req.user!.id
    };

    const field = await fieldService.createFieldDefinition(tenantId, input);

    res.status(201).json({
      success: true,
      data: field,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create schedule custom field definition error:', error);
    if (error.message.includes('已存在')) {
      res.status(400).json({
        success: false,
        error: { code: 'DUPLICATE_FIELD', message: error.message },
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

// PUT /api/schedules/custom-fields/:id - 更新字段定义
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateScheduleCustomFieldDefinitionInput = {
      ...req.body,
      updatedBy: req.user!.id
    };

    const field = await fieldService.updateFieldDefinition(tenantId, id, input);

    res.json({
      success: true,
      data: field,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update schedule custom field definition error:', error);
    if (error.message === 'Field definition not found') {
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

// DELETE /api/schedules/custom-fields/:id - 删除字段定义
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await fieldService.deleteFieldDefinition(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Field definition not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      data: { id },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete schedule custom field definition error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

