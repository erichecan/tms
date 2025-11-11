// 位置跟踪路由
// 创建时间: 2025-10-17 23:20:00
// 描述: 车辆、司机实时位置更新和查询 API

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { tenantMiddleware } from '../middleware/tenantMiddleware';
import { DatabaseService } from '../services/DatabaseService';
import { RuleEngineService } from '../services/RuleEngineService';
import { ShipmentService } from '../services/ShipmentService';
import { ShipmentStatus } from '@tms/shared-types';
import logger from '../utils/logger';

const router = Router();
const dbService = new DatabaseService(); // 2025-11-11 14:58:10 复用数据库连接池
const ruleEngineService = new RuleEngineService(dbService); // 2025-11-11 14:58:10
const shipmentService = new ShipmentService(dbService, ruleEngineService); // 2025-11-11 14:58:10

router.use(authMiddleware);
router.use(tenantMiddleware);

router.post('/vehicles/:vehicleId', async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const { latitude, longitude, speed, direction, accuracy } = req.body;
  const tenantId = req.user?.tenantId;

  try {
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID is required' }); // 2025-11-11 14:58:10
    }

    const allowedRoles = ['admin', 'manager', 'operator'];
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' }); // 2025-11-11 14:58:10
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: speed ? parseFloat(speed) : 0,
      direction: direction ? parseFloat(direction) : 0,
      accuracy: accuracy ? parseFloat(accuracy) : 10,
      timestamp: new Date().toISOString()
    };
    
    const updated = await dbService.query(
      `UPDATE vehicles 
       SET current_location = $1, last_location_update = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING id`,
      [JSON.stringify(locationData), vehicleId, tenantId]
    ); // 2025-11-11 14:58:10

    if (updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Vehicle not found' }); // 2025-11-11 14:58:10
    }
    
    try {
      await dbService.query(
        `INSERT INTO location_tracking 
         (entity_type, entity_id, latitude, longitude, speed, direction, accuracy)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['vehicle', vehicleId, latitude, longitude, speed || 0, direction || 0, accuracy || 10]
      );
    } catch (historyError) {
      // 忽略历史表不存在的错误
      logger.warn(`Failed to save location history: ${historyError}`);
    }
    
    logger.info(`Vehicle location updated: ${vehicleId}`);
    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    logger.error(`Failed to update vehicle location: ${error}`);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

router.post('/drivers/:driverId', async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { latitude, longitude, speed, direction, accuracy } = req.body;
  const tenantId = req.user?.tenantId;

  try {
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID is required' }); // 2025-11-11 14:58:10
    }

    const isDriverSelf = req.user?.role === 'driver' && req.user.id === driverId;
    const canManageDrivers = ['admin', 'manager', 'operator'].includes(req.user?.role || '');
    if (!isDriverSelf && !canManageDrivers) {
      return res.status(403).json({ success: false, error: 'Insufficient permissions' }); // 2025-11-11 14:58:10
    }

    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: speed ? parseFloat(speed) : 0,
      direction: direction ? parseFloat(direction) : 0,
      accuracy: accuracy ? parseFloat(accuracy) : 10,
      timestamp: new Date().toISOString()
    };
    
    const updated = await dbService.query(
      `UPDATE drivers 
       SET current_location = $1, last_location_update = NOW()
       WHERE id = $2 AND tenant_id = $3
       RETURNING id`,
      [JSON.stringify(locationData), driverId, tenantId]
    ); // 2025-11-11 14:58:10

    if (updated.length === 0) {
      return res.status(404).json({ success: false, error: 'Driver not found' }); // 2025-11-11 14:58:10
    }
    
    try {
      await dbService.query(
        `INSERT INTO location_tracking 
         (entity_type, entity_id, latitude, longitude, speed, direction, accuracy)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        ['driver', driverId, latitude, longitude, speed || 0, direction || 0, accuracy || 10]
      );
    } catch (historyError) {
      // 忽略历史表不存在的错误
      logger.warn(`Failed to save location history: ${historyError}`);
    }
    
    logger.info(`Driver location updated: ${driverId}`);
    await autoAdvanceShipmentStatus(tenantId, driverId, locationData); // 2025-11-11 14:58:10 触发状态流转

    res.json({ success: true, message: 'Location updated successfully' });
  } catch (error) {
    logger.error(`Failed to update driver location: ${error}`);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * 获取实时位置列表
 * GET /api/location/realtime
 */
router.get('/realtime', authMiddleware, async (req: Request, res: Response) => {
  try {
    const dbService = new DatabaseService();
    const tenantId = req.user?.tenantId;
    
    if (!tenantId) {
      return res.status(400).json({ error: 'Tenant ID is required' });
    }
    
    const result = await dbService.query(`
      SELECT 
        v.id as vehicle_id,
        v.plate_number,
        v.type as vehicle_type,
        v.current_location,
        v.last_location_update,
        v.status as vehicle_status,
        d.id as driver_id,
        d.name as driver_name,
        d.phone as driver_phone,
        d.status as driver_status,
        d.current_location as driver_location,
        t.id as trip_id,
        t.trip_no,
        t.status as trip_status
      FROM vehicles v
      LEFT JOIN drivers d ON v.id = d.vehicle_id AND d.tenant_id = $1
      LEFT JOIN (
        SELECT DISTINCT ON (driver_id) 
          id, driver_id, trip_no, status
        FROM trips 
        WHERE status IN ('planned', 'ongoing')
        ORDER BY driver_id, created_at DESC
      ) t ON d.id = t.driver_id
      WHERE v.tenant_id = $1
      ORDER BY v.last_location_update DESC NULLS LAST
    `, [tenantId]);
    
    logger.info(`Retrieved ${result.length} real-time locations for tenant ${tenantId}`); // 2025-11-11T15:22:41Z Added by Assistant: Correct rows length logging
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Failed to get real-time locations: ${error}`);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * 获取位置历史轨迹
 * GET /api/location/history/:entityType/:entityId
 */
router.get('/history/:entityType/:entityId', authMiddleware, async (req: Request, res: Response) => {
  const { entityType, entityId } = req.params;
  const { startTime, endTime, limit = '100' } = req.query;
  const tenantId = req.user?.tenantId;

  try {
    if (!tenantId) {
      return res.status(401).json({ success: false, error: 'Tenant ID is required' });
    }

    let isAllowedEntity = false;
    if (entityType === 'driver') {
      const result = await dbService.query(
        'SELECT 1 FROM drivers WHERE id = $1 AND tenant_id = $2',
        [entityId, tenantId]
      );
      isAllowedEntity = result.length > 0;
    } else if (entityType === 'vehicle') {
      const result = await dbService.query(
        'SELECT 1 FROM vehicles WHERE id = $1 AND tenant_id = $2',
        [entityId, tenantId]
      );
      isAllowedEntity = result.length > 0;
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported entity type' });
    }

    if (!isAllowedEntity) {
      return res.status(404).json({ success: false, error: 'Entity not found' });
    }

    // 检查表是否存在
    const tableCheck = await dbService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'location_tracking'
      );
    `);
    
    if (!tableCheck[0]?.exists) { // 2025-11-11T15:22:41Z Added by Assistant: Handle direct array result
      // 表不存在，返回空数组
      logger.warn('Location tracking table does not exist, returning empty history');
      return res.json({ success: true, data: [], message: 'Location history feature not available' });
    }
    
    let query = `
      SELECT * FROM location_tracking
      WHERE entity_type = $1 AND entity_id = $2
    `;
    const params: any[] = [entityType, entityId];
    
    if (startTime && endTime) {
      query += ` AND timestamp BETWEEN $3 AND $4`;
      params.push(startTime, endTime);
    }
    
    query += ` ORDER BY timestamp DESC LIMIT $${params.length + 1}`;
    params.push(parseInt(limit as string, 10));
    
    const result = await dbService.query(query, params);
    
    logger.info(`Retrieved ${result.length} location history records for ${entityType}:${entityId}`); // 2025-11-11T15:22:41Z Added by Assistant: Fix array logging
    res.json({ success: true, data: result });
  } catch (error) {
    logger.error(`Failed to get location history: ${error}`);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

/**
 * 批量更新位置（用于模拟器）
 * POST /api/location/bulk-update
 */
router.post('/bulk-update', authMiddleware, async (req: Request, res: Response) => {
  const { updates } = req.body;
  const tenantId = req.user?.tenantId;
  const allowedRoles = ['admin', 'manager', 'operator'];
  
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Updates must be an array' });
  }
  if (!tenantId) {
    return res.status(401).json({ success: false, error: 'Tenant ID is required' });
  }
  if (!req.user || !allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ success: false, error: 'Insufficient permissions' });
  }
  
  try {
    let successCount = 0;
    
    for (const update of updates) {
      const { entityType, entityId, latitude, longitude, speed, direction, accuracy } = update;
      
      if (!entityType || !entityId || !latitude || !longitude) {
        continue;
      }
      
      const locationData = {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        speed: speed ? parseFloat(speed) : 0,
        direction: direction ? parseFloat(direction) : 0,
        accuracy: accuracy ? parseFloat(accuracy) : 10,
        timestamp: new Date().toISOString()
      };
      
      // 根据 entity_type 更新相应的表
      const tableName = entityType === 'driver' ? 'drivers' : 'vehicles';
      
      await dbService.query(
        `UPDATE ${tableName} 
         SET current_location = $1, last_location_update = NOW()
         WHERE id = $2 AND tenant_id = $3`,
        [JSON.stringify(locationData), entityId, tenantId]
      );
      
      // 保存到历史轨迹表（如果表存在）
      try {
        await dbService.query(
          `INSERT INTO location_tracking 
           (entity_type, entity_id, latitude, longitude, speed, direction, accuracy)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [entityType, entityId, latitude, longitude, speed || 0, direction || 0, accuracy || 10]
        );
      } catch (historyError) {
        // 忽略历史表不存在的错误
      }
      
      successCount++;
    }
    
    logger.info(`Bulk location update: ${successCount}/${updates.length} successful`);
    res.json({ success: true, count: successCount, total: updates.length });
  } catch (error) {
    logger.error(`Failed to bulk update locations: ${error}`);
    res.status(500).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
});

const parseJsonField = (field: any): any => {
  if (!field) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch {
      return field;
    }
  }
  return field;
}; // 2025-11-11 14:58:10

const calculateDistanceKm = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const toRad = (value: number) => (value * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}; // 2025-11-11 14:58:10

async function autoAdvanceShipmentStatus(
  tenantId: string,
  driverId: string,
  location: { latitude: number; longitude: number }
): Promise<void> {
  try {
    const shipments = await dbService.query(
      `SELECT id, status, pickup_address, delivery_address 
       FROM shipments 
       WHERE tenant_id = $1 
         AND driver_id = $2 
         AND status IN ('scheduled', 'pickup_in_progress', 'in_transit')`,
      [tenantId, driverId]
    ); // 2025-11-11 14:58:10

    for (const shipment of shipments) {
      const pickupAddress = parseJsonField(shipment.pickup_address) || {};
      const deliveryAddress = parseJsonField(shipment.delivery_address) || {};
      const pickupCoordinates = pickupAddress.coordinates;
      const deliveryCoordinates = deliveryAddress.coordinates;

      try {
        if (
          shipment.status === ShipmentStatus.SCHEDULED &&
          pickupCoordinates
        ) {
          const distanceToPickup = calculateDistanceKm(
            location.latitude,
            location.longitude,
            pickupCoordinates.lat,
            pickupCoordinates.lng
          );
          if (distanceToPickup <= 0.3) {
            await shipmentService.startPickup(tenantId, shipment.id, driverId);
            continue;
          }
        }

        if (
          shipment.status === ShipmentStatus.PICKUP_IN_PROGRESS &&
          pickupCoordinates
        ) {
          const distanceFromPickup = calculateDistanceKm(
            location.latitude,
            location.longitude,
            pickupCoordinates.lat,
            pickupCoordinates.lng
          );
          if (distanceFromPickup >= 0.8) {
            await shipmentService.startTransit(tenantId, shipment.id, driverId);
            continue;
          }
        }

        if (
          shipment.status === ShipmentStatus.IN_TRANSIT &&
          deliveryCoordinates
        ) {
          const distanceToDelivery = calculateDistanceKm(
            location.latitude,
            location.longitude,
            deliveryCoordinates.lat,
            deliveryCoordinates.lng
          );
          if (distanceToDelivery <= 0.3) {
            await shipmentService.completeDelivery(tenantId, shipment.id, driverId);
          }
        }
      } catch (transitionError) {
        logger.debug(
          `Automatic status transition skipped for shipment ${shipment.id}:`,
          transitionError
        ); // 2025-11-11 14:58:10
      }
    }
  } catch (error) {
    logger.error('Failed to auto-advance shipment status:', error); // 2025-11-11 14:58:10
  }
}

export default router;

