// 承运商证照管理路由
// 创建时间: 2025-11-29T11:25:04Z
// 第一阶段：核心主数据完善 - 1.3 承运商管理

import { Router, Request, Response } from 'express';
import { DatabaseService } from '../services/DatabaseService';
import { CarrierCertificateService, CreateCarrierCertificateInput, UpdateCarrierCertificateInput } from '../services/CarrierCertificateService';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();
const dbService = new DatabaseService();
const certificateService = new CarrierCertificateService(dbService);

router.use(authMiddleware);
router.use(tenantMiddleware);

// GET /api/carriers/:carrierId/certificates - 获取承运商的所有证照
router.get('/:carrierId/certificates', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { carrierId } = req.params;

    const certificates = await certificateService.getCertificatesByCarrier(tenantId, carrierId);

    res.json({
      success: true,
      data: certificates,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get carrier certificates error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// POST /api/carriers/:carrierId/certificates - 创建承运商证照
router.post('/:carrierId/certificates', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { carrierId } = req.params;
    const input: CreateCarrierCertificateInput = {
      ...req.body,
      carrierId
    };

    const certificate = await certificateService.createCertificate(tenantId, input);

    res.status(201).json({
      success: true,
      data: certificate,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Create carrier certificate error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// PUT /api/carriers/certificates/:id - 更新证照信息
router.put('/certificates/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;
    const input: UpdateCarrierCertificateInput = req.body;

    const certificate = await certificateService.updateCertificate(tenantId, id, input);

    res.json({
      success: true,
      data: certificate,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Update carrier certificate error:', error);
    if (error.message === 'Certificate not found') {
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

// DELETE /api/carriers/certificates/:id - 删除证照
router.delete('/certificates/:id', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const { id } = req.params;

    const deleted = await certificateService.deleteCertificate(tenantId, id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Certificate not found' },
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] as string || ''
      });
    }

    res.json({
      success: true,
      message: 'Certificate deleted successfully',
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Delete carrier certificate error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

// GET /api/carriers/certificates/expiring - 获取即将到期的证照
router.get('/certificates/expiring', async (req: Request, res: Response) => {
  try {
    const tenantId = req.user!.tenantId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 30;

    const certificates = await certificateService.getExpiringCertificates(tenantId, daysAhead);

    res.json({
      success: true,
      data: certificates,
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  } catch (error: any) {
    logger.error('Get expiring certificates error:', error);
    res.status(500).json({
      success: false,
      error: { code: 'INTERNAL_ERROR', message: error.message },
      timestamp: new Date().toISOString(),
      requestId: req.headers['x-request-id'] as string || ''
    });
  }
});

export default router;

