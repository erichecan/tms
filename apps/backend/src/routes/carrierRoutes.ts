// 承运商管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.3 承运商管理

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { CarrierService, CreateCarrierInput, UpdateCarrierInput } from '../services/CarrierService';
import { CarrierRatingService, CreateCarrierRatingInput } from '../services/CarrierRatingService';
import { CarrierQuoteService, CreateCarrierQuoteInput, UpdateCarrierQuoteInput } from '../services/CarrierQuoteService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const carrierService = new CarrierService(dbService);
const ratingService = new CarrierRatingService(dbService);
const quoteService = new CarrierQuoteService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/carriers - 获取所有承运商
router.get('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const status = req.query.status as any;
    const serviceLevel = req.query.serviceLevel as any;

    const carriers = await carrierService.getCarriers(tenantId, status, serviceLevel);

    res.json({
      success: true,
      data: carriers,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get carriers error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/carriers - 创建承运商
router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const input: CreateCarrierInput = req.body;

    const carrier = await carrierService.createCarrier(tenantId, input);

    res.status(201).json({
      success: true,
      data: carrier,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create carrier error:', error);
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

// GET /api/carriers/:id - 获取单个承运商
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const carrier = await carrierService.getCarrierById(tenantId, id);

    if (!carrier) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Carrier not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      data: carrier,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get carrier error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/carriers/:id - 更新承运商
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateCarrierInput = req.body;

    const carrier = await carrierService.updateCarrier(tenantId, id, input);

    res.json({
      success: true,
      data: carrier,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update carrier error:', error);
    if (error.message === 'Carrier not found') {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: error.message },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    } else if (error.message.includes('已被其他承运商使用')) {
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

// DELETE /api/carriers/:id - 删除承运商
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await carrierService.deleteCarrier(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Carrier not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Carrier deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete carrier error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/carriers/:id/ratings - 创建评分
router.post('/:id/ratings', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: CreateCarrierRatingInput = {
      ...req.body,
      carrierId: id
    };

    const rating = await ratingService.createRating(tenantId, input);

    res.status(201).json({
      success: true,
      data: rating,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create carrier rating error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/carriers/:id/ratings - 获取承运商的所有评分
router.get('/:id/ratings', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const ratingType = req.query.ratingType as any;

    const ratings = await ratingService.getRatingsByCarrier(tenantId, id, ratingType);

    res.json({
      success: true,
      data: ratings,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get carrier ratings error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/carriers/:id/quotes - 创建报价
router.post('/:id/quotes', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: CreateCarrierQuoteInput = {
      ...req.body,
      carrierId: id
    };

    const quote = await quoteService.createQuote(tenantId, input);

    res.status(201).json({
      success: true,
      data: quote,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create carrier quote error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/carriers/:id/quotes - 获取承运商的所有报价
router.get('/:id/quotes', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const status = req.query.status as any;

    const quotes = await quoteService.getQuotesByCarrier(tenantId, id, status);

    res.json({
      success: true,
      data: quotes,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get carrier quotes error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

