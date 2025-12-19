import { Router } from 'express';
import multer from 'multer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/authMiddleware'; // 2025-12-19 11:43:00 POD上传必须鉴权
import { tenantMiddleware } from '../middleware/tenantMiddleware'; // 2025-12-19 11:43:00 POD上传必须租户隔离
import { CloudStorageService } from '../services/CloudStorageService';
import { logger } from '../utils/logger';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // 2025-09-23 10:30:00
const cloudStorage = new CloudStorageService(); // 2025-11-11T16:18:55Z Added by Assistant: 初始化云存储服务

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const fileFilter = (_req: any, file: any, cb: any) => {
  // 2025-12-19 11:43:00 兼容 iOS Safari 拍照 HEIC/HEIF
  if (!['image/jpeg', 'image/png', 'image/heic', 'image/heif'].includes(file.mimetype)) return cb(new Error('INVALID_FILE_TYPE'));
  cb(null, true);
}; // 2025-11-11T16:18:55Z Added by Assistant: 文件类型校验

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
}); // 2025-11-11T16:18:55Z Added by Assistant: 使用内存存储以便上传至云端

router.use(authMiddleware); // 2025-12-19 11:43:00
router.use(tenantMiddleware); // 2025-12-19 11:43:00

// POST /api/shipments/:id/pod // 2025-09-23 10:30:00
router.post('/:id/pod', upload.single('file'), async (req, res) => {
  const shipmentId = req.params.id;
  const note = (req.body?.note as string) || null;
  const uploadedBy = (req.body?.driverId as string) || 'Driver'; // 2025-11-11T15:37:42Z Added by Assistant: track driver upload
  const tenantId = req.tenant?.id || req.user?.tenantId || (req.headers['x-tenant-id'] as string) || 'anonymous'; // 2025-12-19 11:43:00 优先使用鉴权后的租户

  // 2025-12-19 11:43:00 业务规则：POD 非强制，但仅送达后可上传，且最多 5 张
  try {
    const shipmentRes = await pool.query(
      'SELECT id, tenant_id, driver_id, status FROM shipments WHERE id = $1',
      [shipmentId]
    );
    if (shipmentRes.rowCount === 0) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } });
      return;
    }
    const shipment = shipmentRes.rows[0];

    if (tenantId && shipment.tenant_id && shipment.tenant_id !== tenantId) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Tenant mismatch' } });
      return;
    }

    // 司机仅可上传自己运单的 POD
    if (req.user?.role === 'driver' && shipment.driver_id && shipment.driver_id !== req.user.id) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Driver can only upload POD for own shipments' } });
      return;
    }

    const allowedStatuses = new Set(['delivered', 'pod_pending_review', 'completed']);
    if (!allowedStatuses.has(String(shipment.status))) {
      res.status(409).json({
        success: false,
        error: { code: 'INVALID_STATUS', message: 'POD can only be uploaded after delivery' }
      });
      return;
    }

    const podCountRes = await pool.query(
      'SELECT COUNT(*)::int AS count FROM proof_of_delivery WHERE shipment_id=$1',
      [shipmentId]
    );
    const currentCount = podCountRes.rows?.[0]?.count ?? 0;
    if (currentCount >= 5) {
      res.status(409).json({
        success: false,
        error: { code: 'POD_LIMIT_EXCEEDED', message: 'Maximum 5 POD images are allowed' }
      });
      return;
    }
  } catch (validationError: any) {
    logger.error('Failed to validate POD upload request', validationError); // 2025-12-19 11:43:00
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to validate POD upload request' } });
    return;
  }

  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'file required' } });
    return;
  }

  const fileExtension =
    req.file.mimetype === 'image/png'
      ? '.png'
      : (req.file.mimetype === 'image/heic' || req.file.mimetype === 'image/heif')
        ? '.heic'
        : '.jpg'; // 2025-12-19 11:43:00
  const objectKey = `pods/${tenantId}/${shipmentId}/${uuidv4()}${fileExtension}`; // 2025-11-11T16:18:55Z Added by Assistant: 统一对象路径

  let storedPath = '';
  let previewUrl: string | undefined;
  let storageProvider: 'gcs' | 'local' = 'local';

  if (cloudStorage.isEnabled()) {
    try {
      const result = await cloudStorage.upload({
        buffer: req.file.buffer,
        destination: objectKey,
        contentType: req.file.mimetype,
        metadata: {
          shipmentId,
          tenantId,
          uploadedBy
        }
      }); // 2025-11-11T16:18:55Z Added by Assistant: 上传到 GCS

      storedPath = `gs://${result.bucket}/${result.objectName}`;
      previewUrl = result.publicUrl;
      storageProvider = 'gcs';
    } catch (error) {
      logger.error('Failed to upload POD to Cloud Storage, falling back to local storage', error); // 2025-11-11T16:18:55Z Added by Assistant: 回退日志
    }
  }

  if (!storedPath) {
    try {
      const dir = join(uploadDir, shipmentId);
      await mkdir(dir, { recursive: true });
      storedPath = join(dir, `${uuidv4()}${fileExtension}`);
      await writeFile(storedPath, req.file.buffer);
      storageProvider = 'local';
    } catch (error) {
      logger.error('Failed to persist POD locally', error); // 2025-11-11T16:18:55Z Added by Assistant: 本地保存失败
      res.status(500).json({ success: false, error: { code: 'STORAGE_WRITE_FAILED', message: 'Unable to store POD file' } });
      return;
    }
  }

  try {
    await pool.query(
      'INSERT INTO proof_of_delivery (shipment_id, file_path, uploaded_by, note) VALUES ($1,$2,$3,$4)',
      [shipmentId, storedPath, uploadedBy, note]
    );
    await pool.query(
      'INSERT INTO timeline_events (shipment_id, event_type, actor_type, extra) VALUES ($1,$2,$3,$4)',
      [
        shipmentId,
        'POD_UPLOADED',
        'driver',
        JSON.stringify({ filePath: storedPath, storageProvider, previewUrl })
      ]
    ); // 2025-11-11T16:18:55Z Added by Assistant: 记录上传来源
    await pool.query(
      `UPDATE shipments
       SET status = CASE
         WHEN status = 'delivered' THEN 'pod_pending_review'
         ELSE status
       END,
       timeline = CASE
         WHEN status = 'delivered' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{podPendingReview}', to_jsonb(NOW())::jsonb, true)
         ELSE timeline
       END,
       updated_at = NOW()
       WHERE id = $1`,
      [shipmentId]
    ); // 2025-12-19 11:43:00 POD 非强制：仅在 delivered 时推进到 pod_pending_review

    res.status(201).json({
      success: true,
      data: {
        filePath: storedPath,
        storageProvider,
        previewUrl
      }
    });
  } catch (e: any) {
    logger.error('Failed to persist POD metadata', e); // 2025-11-11T16:18:55Z Added by Assistant: 元数据持久化失败
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  }
});

export default router;


