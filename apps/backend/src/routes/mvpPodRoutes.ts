import { Router } from 'express';
import multer from 'multer';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';
import { CloudStorageService } from '../services/CloudStorageService';
import { logger } from '../utils/logger';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // 2025-09-23 10:30:00
const cloudStorage = new CloudStorageService(); // 2025-11-11T16:18:55Z Added by Assistant: 初始化云存储服务

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const fileFilter = (_req: any, file: any, cb: any) => {
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(new Error('INVALID_FILE_TYPE'));
  cb(null, true);
}; // 2025-11-11T16:18:55Z Added by Assistant: 文件类型校验

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
}); // 2025-11-11T16:18:55Z Added by Assistant: 使用内存存储以便上传至云端

// POST /api/shipments/:id/pod // 2025-09-23 10:30:00
router.post('/:id/pod', upload.single('file'), async (req, res) => {
  const shipmentId = req.params.id;
  const note = (req.body?.note as string) || null;
  const uploadedBy = (req.body?.driverId as string) || 'Driver'; // 2025-11-11T15:37:42Z Added by Assistant: track driver upload
  const tenantId = (req.headers['x-tenant-id'] as string) || 'anonymous'; // 2025-11-11T16:18:55Z Added by Assistant: 存储租户信息

  if (!req.file) {
    res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'file required' } });
    return;
  }

  const fileExtension = req.file.mimetype === 'image/png' ? '.png' : '.jpg';
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
       timeline = jsonb_set(coalesce(timeline, '{}'::jsonb), '{podPendingReview}', to_jsonb(NOW())::jsonb, true),
       updated_at = NOW()
       WHERE id = $1`,
      [shipmentId]
    ); // 2025-11-11 15:37:42Z Added by Assistant: Move shipment to pod_pending_review

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


