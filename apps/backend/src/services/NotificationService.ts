// 通知服务 Stub（插表 + console） // 2025-09-23 10:25:00
import { Pool } from 'pg';

export class NotificationService {
  private pool: Pool;
  constructor(pool: Pool) {
    this.pool = pool; // 2025-09-23 10:25:00
  }

  async insert(type: 'ASSIGNMENT' | 'STATUS_CHANGE', targetRole: 'DRIVER' | 'FLEET_MANAGER', shipmentId: string, driverId?: string, payload: any = {}) {
    console.log('[Notify]', { type, targetRole, shipmentId, driverId, payload }); // 2025-09-23 10:25:00
    await this.pool.query(
      `INSERT INTO notifications (type, target_role, shipment_id, driver_id, payload, delivered) VALUES ($1,$2,$3,$4,$5,false)`,
      [type, targetRole, shipmentId, driverId || null, JSON.stringify(payload)]
    );
  }
}


