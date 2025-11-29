// 司机班组管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.2 司机档案完善

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { DriverGroupService, CreateDriverGroupInput, UpdateDriverGroupInput } from '../services/DriverGroupService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const groupService = new DriverGroupService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/drivers/groups - 获取所有班组
router.get('/groups', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const status = req.query.status as any;

    const groups = await groupService.getGroups(tenantId, status);

    res.json({
      success: true,
      data: groups,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get driver groups error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/drivers/groups - 创建班组
router.post('/groups', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const input: CreateDriverGroupInput = req.body;

    const group = await groupService.createGroup(tenantId, input);

    res.status(201).json({
      success: true,
      data: group,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create driver group error:', error);
    if (error.message.includes('已存在')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message },
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

// GET /api/drivers/groups/:id - 获取单个班组详情
router.get('/groups/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const group = await groupService.getGroupById(tenantId, id);

    if (!group) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      data: group,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get driver group error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/drivers/groups/:id - 更新班组信息
router.put('/groups/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateDriverGroupInput = req.body;

    const group = await groupService.updateGroup(tenantId, id, input);

    res.json({
      success: true,
      data: group,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update driver group error:', error);
    if (error.message === 'Group not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else if (error.message.includes('已被其他班组使用')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message },
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

// DELETE /api/drivers/groups/:id - 删除班组
router.delete('/groups/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await groupService.deleteGroup(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Group not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Group deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete driver group error:', error);
    if (error.message.includes('还有活跃成员')) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: error.message },
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

// POST /api/drivers/groups/:groupId/members - 添加司机到班组
router.post('/groups/:groupId/members', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { groupId } = req.params;
    const { driverId, role = 'member' } = req.body;

    if (!driverId) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'driverId is required' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    const member = await groupService.addMember(tenantId, groupId, driverId, role);

    res.status(201).json({
      success: true,
      data: member,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Add group member error:', error);
    if (error.message.includes('已在其他班组中') || error.message.includes('已有班长')) {
      res.status(409).json({
        success: false,
        error: { code: 'CONFLICT', message: error.message },
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

// DELETE /api/drivers/groups/:groupId/members/:driverId - 从班组移除司机
router.delete('/groups/:groupId/members/:driverId', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { groupId, driverId } = req.params;

    const deleted = await groupService.removeMember(tenantId, groupId, driverId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Member not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Member removed successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Remove group member error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/drivers/groups/:id/members - 获取班组成员列表
router.get('/groups/:id/members', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const status = req.query.status as any;

    const members = await groupService.getGroupMembers(tenantId, id, status);

    res.json({
      success: true,
      data: members,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get group members error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

