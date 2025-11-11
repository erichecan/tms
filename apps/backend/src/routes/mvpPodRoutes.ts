import { Router } from 'express';
import multer from 'multer';
import { mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Pool } from 'pg';

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // 2025-09-23 10:30:00

const uploadDir = process.env.UPLOAD_DIR || './uploads';
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = join(uploadDir, req.params.id);
    mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const ext = file.mimetype === 'image/png' ? '.png' : '.jpg';
    cb(null, uuidv4() + ext);
  }
});

const fileFilter = (_req: any, file: any, cb: any) => {
  if (!['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(new Error('INVALID_FILE_TYPE'));
  cb(null, true);
};

const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 }, fileFilter });

// POST /api/shipments/:id/pod // 2025-09-23 10:30:00
router.post('/:id/pod', upload.single('file'), async (req, res) => {
  const shipmentId = req.params.id;
  const note = (req.body?.note as string) || null;
  const uploadedBy = (req.body?.driverId as string) || 'Driver'; // 2025-11-11T15:37:42Z Added by Assistant: track driver upload
  const filePath = (req.file?.path as string) || '';
  if (!filePath) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'file required' } });

  try {
    await pool.query(
      'INSERT INTO proof_of_delivery (shipment_id, file_path, uploaded_by, note) VALUES ($1,$2,$3,$4)',
      [shipmentId, filePath, uploadedBy, note]
    );
    await pool.query('INSERT INTO timeline_events (shipment_id, event_type, actor_type, extra) VALUES ($1,$2,$3,$4)', [shipmentId, 'POD_UPLOADED', 'driver', JSON.stringify({ filePath })]);
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
    ); // 2025-11-11T15:37:42Z Added by Assistant: Move shipment to pod_pending_review
    res.status(201).json({ success: true, data: { filePath } });
  } catch (e: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  }
});

export default router;


