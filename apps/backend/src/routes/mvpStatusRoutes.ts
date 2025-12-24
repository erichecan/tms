import { Router } from 'express';
import { Pool } from 'pg';
import { StatusService } from '../services/StatusService';
import { ShipmentStatus } from '@tms/shared-types';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { logger } from '../utils/logger';

const router = Router();

// 应用中间件
router.use(authMiddleware);
router.use(tenantMiddleware);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// POST /api/shipments/:id/status { targetStatus }
router.post('/:id/status', async (req, res) => {
  const shipmentId = req.params.id;
  const { targetStatus } = req.body as { targetStatus: ShipmentStatus };
  if (!targetStatus) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'targetStatus required' } });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sres = await client.query('SELECT * FROM shipments WHERE id=$1 FOR UPDATE', [shipmentId]);
    if (sres.rowCount === 0) throw new Error('Shipment not found');
    const shipment = sres.rows[0];

    if (!StatusService.canTransition(shipment.status, targetStatus)) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: { code: 'INVALID_TRANSITION', message: `${shipment.status} -> ${targetStatus} not allowed` } });
    }

    await client.query(
      `UPDATE shipments 
       SET status=$1, 
           timeline = CASE 
                        WHEN $1 = 'pod_pending_review' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{podPendingReview}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'pickup_in_progress' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{pickupInProgress}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'scheduled' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{scheduled}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'pending_confirmation' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{pendingConfirmation}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'confirmed' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{confirmed}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'in_transit' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{inTransit}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'delivered' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{delivered}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'completed' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{completed}', to_jsonb(NOW())::jsonb, true)
                        WHEN $1 = 'cancelled' THEN jsonb_set(coalesce(timeline, '{}'::jsonb), '{cancelled}', to_jsonb(NOW())::jsonb, true)
                        ELSE timeline
                      END,
           updated_at=NOW() 
       WHERE id=$2`,
      [targetStatus, shipmentId]
    );
    await client.query('INSERT INTO timeline_events (shipment_id, event_type, from_status, to_status, actor_type) VALUES ($1,$2,$3,$4,$5)', [shipmentId, 'STATUS_CHANGED', shipment.status, targetStatus, 'user']);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e: any) {
    await client.query('ROLLBACK');
    logger.error('Error updating shipment status:', e);
    if (e.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  } finally {
    client.release();
  }
});

export default router;
