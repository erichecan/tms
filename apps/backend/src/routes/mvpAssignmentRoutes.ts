import { Router } from 'express';
import { Pool } from 'pg';
import { StatusService } from '../services/StatusService';
import { ShipmentStatus } from '@tms/shared-types'; // 2025-11-11 14:44:10 同步状态枚举

const router = Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL }); // 2025-09-23 10:30:00

// POST /api/shipments/:id/assign-driver { driverId } // 2025-09-23 10:30:00
router.post('/:id/assign-driver', async (req, res) => {
  const shipmentId = req.params.id;
  const { driverId } = req.body;
  if (!driverId) return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'driverId required' } });

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const sres = await client.query('SELECT * FROM shipments WHERE id=$1 FOR UPDATE', [shipmentId]);
    if (sres.rowCount === 0) throw new Error('Shipment not found');
    const shipment = sres.rows[0];

    if (!StatusService.canTransition(shipment.status, ShipmentStatus.SCHEDULED)) {
      return res.status(409).json({ success: false, error: { code: 'INVALID_TRANSITION', message: '仅支持调度到已安排状态' } });
    }

    const dres = await client.query('SELECT * FROM drivers WHERE id=$1 FOR UPDATE', [driverId]);
    if (dres.rowCount === 0) throw new Error('Driver not found');
    const driver = dres.rows[0];
    if (driver.status !== 'available') {
      return res.status(409).json({ success: false, error: { code: 'DRIVER_NOT_AVAILABLE', message: 'Driver not available' } });
    }

    await client.query('UPDATE drivers SET status=$1, updated_at=NOW() WHERE id=$2', ['busy', driverId]);
    await client.query(
      "UPDATE shipments SET driver_id=$1, status=$2, timeline = jsonb_set(coalesce(timeline, '{}'::jsonb), '{scheduled}', to_jsonb(NOW())::jsonb, true), updated_at=NOW() WHERE id=$3",
      [driverId, ShipmentStatus.SCHEDULED, shipmentId]
    );
    await client.query('INSERT INTO assignments (shipment_id, driver_id) VALUES ($1,$2)', [shipmentId, driverId]);
    await client.query('INSERT INTO timeline_events (shipment_id, event_type, from_status, to_status, actor_type) VALUES ($1,$2,$3,$4,$5)', [shipmentId, 'STATUS_CHANGED', shipment.status, ShipmentStatus.SCHEDULED, 'system']);

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (e: any) {
    await client.query('ROLLBACK');
    if (e.message.includes('not found')) return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: e.message } });
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: e.message } });
  } finally {
    client.release();
  }
});

export default router;


