// 位置跟踪路由
// 创建时间: 2025-10-17 23:20:00
// 描述: 车辆、司机实时位置更新和查询 API

import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/authMiddleware';
import { DatabaseService } from '../services/DatabaseService';
import logger from '../utils/logger';

const router = Router();

/**
 * 更新车辆位置
 * POST /api/location/vehicles/:vehicleId
 */
router.post('/vehicles/:vehicleId', authMiddleware, async (req: Request, res: Response) => {
  const { vehicleId } = req.params;
  const { latitude, longitude, speed, direction, accuracy } = req.body;
  
  try {
    const dbService = new DatabaseService();
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: speed ? parseFloat(speed) : 0,
      direction: direction ? parseFloat(direction) : 0,
      accuracy: accuracy ? parseFloat(accuracy) : 10,
      timestamp: new Date().toISOString()
    };
    
    // 更新 vehicles 表的 current_location
    await dbService.query(
      `UPDATE vehicles 
       SET current_location = $1, last_location_update = NOW()
       WHERE id = $2`,
      [JSON.stringify(locationData), vehicleId]
    );
    
    // 保存到历史轨迹表（如果表存在）
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

/**
 * 更新司机位置
 * POST /api/location/drivers/:driverId
 */
router.post('/drivers/:driverId', authMiddleware, async (req: Request, res: Response) => {
  const { driverId } = req.params;
  const { latitude, longitude, speed, direction, accuracy } = req.body;
  
  try {
    const dbService = new DatabaseService();
    
    const locationData = {
      latitude: parseFloat(latitude),
      longitude: parseFloat(longitude),
      speed: speed ? parseFloat(speed) : 0,
      direction: direction ? parseFloat(direction) : 0,
      accuracy: accuracy ? parseFloat(accuracy) : 10,
      timestamp: new Date().toISOString()
    };
    
    // 更新 drivers 表的 current_location
    await dbService.query(
      `UPDATE drivers 
       SET current_location = $1, last_location_update = NOW()
       WHERE id = $2`,
      [JSON.stringify(locationData), driverId]
    );
    
    // 保存到历史轨迹表（如果表存在）
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
    
    logger.info(`Retrieved ${result.rows.length} real-time locations for tenant ${tenantId}`);
    res.json({ success: true, data: result.rows });
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
  
  try {
    const dbService = new DatabaseService();
    
    // 检查表是否存在
    const tableCheck = await dbService.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'location_tracking'
      );
    `);
    
    if (!tableCheck.rows[0].exists) {
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
    
    logger.info(`Retrieved ${result.rows.length} location history records for ${entityType}:${entityId}`);
    res.json({ success: true, data: result.rows });
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
  
  if (!Array.isArray(updates)) {
    return res.status(400).json({ error: 'Updates must be an array' });
  }
  
  try {
    const dbService = new DatabaseService();
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
         WHERE id = $2`,
        [JSON.stringify(locationData), entityId]
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

export default router;

