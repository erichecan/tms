// 创建缺失的表脚本
// 创建时间: 2025-11-30 03:40:00
// 用途：创建 trips、timeline_events、proof_of_delivery 等缺失的表

import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { logger } from '../apps/backend/src/utils/logger';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function createMissingTables() {
  const client = await pool.connect();
  
  try {
    logger.info('开始创建缺失的表...');
    
    await client.query('BEGIN');
    
    // 1. 创建 trips 表
    logger.info('创建 trips 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        tenant_id UUID NOT NULL,
        trip_no VARCHAR(50) NOT NULL,
        status VARCHAR(20) DEFAULT 'planning',
        driver_id UUID,
        vehicle_id UUID,
        legs JSONB DEFAULT '[]',
        shipments JSONB DEFAULT '[]',
        start_time_planned TIMESTAMP,
        end_time_planned TIMESTAMP,
        start_time_actual TIMESTAMP,
        end_time_actual TIMESTAMP,
        route_path JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 创建 trips 相关索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON trips(tenant_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trips_trip_no ON trips(trip_no)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)');
    
    // 2. 创建 timeline_events 表（如果不存在）
    logger.info('检查并创建 timeline_events 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS timeline_events (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        tenant_id UUID,
        shipment_id UUID,
        trip_id UUID,
        event_type VARCHAR(50) NOT NULL,
        from_status VARCHAR(50),
        to_status VARCHAR(50),
        actor_type VARCHAR(20) NOT NULL,
        actor_id UUID,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        extra JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // 2025-11-30 03:45:00 修复：检查并添加缺失的列
    const timelineColumns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'timeline_events'
    `);
    const existingColumns = timelineColumns.rows.map((r: any) => r.column_name);
    
    if (!existingColumns.includes('tenant_id')) {
      logger.info('为 timeline_events 表添加 tenant_id 列...');
      await client.query('ALTER TABLE timeline_events ADD COLUMN tenant_id UUID');
    }
    
    if (!existingColumns.includes('trip_id')) {
      logger.info('为 timeline_events 表添加 trip_id 列...');
      await client.query('ALTER TABLE timeline_events ADD COLUMN trip_id UUID');
    }
    
    // 创建 timeline_events 相关索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_events_tenant_id ON timeline_events(tenant_id) WHERE tenant_id IS NOT NULL');
    await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_events_shipment_id ON timeline_events(shipment_id) WHERE shipment_id IS NOT NULL');
    await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_events_trip_id ON timeline_events(trip_id) WHERE trip_id IS NOT NULL');
    await client.query('CREATE INDEX IF NOT EXISTS idx_timeline_events_timestamp ON timeline_events(timestamp)');
    
    // 3. 创建 proof_of_delivery 表（如果不存在）
    logger.info('检查并创建 proof_of_delivery 表...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS proof_of_delivery (
        id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
        tenant_id UUID,
        shipment_id UUID NOT NULL,
        file_path TEXT NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        uploaded_by VARCHAR(20) NOT NULL,
        note TEXT
      )
    `);
    
    // 如果 proof_of_delivery 表存在但没有 tenant_id，添加它
    const podTenantIdExists = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'proof_of_delivery' AND column_name = 'tenant_id'
      )
    `);
    
    if (!podTenantIdExists.rows[0].exists) {
      logger.info('为 proof_of_delivery 表添加 tenant_id 列...');
      await client.query('ALTER TABLE proof_of_delivery ADD COLUMN tenant_id UUID');
    }
    
    // 创建 proof_of_delivery 相关索引
    await client.query('CREATE INDEX IF NOT EXISTS idx_pod_shipment_id ON proof_of_delivery(shipment_id)');
    await client.query('CREATE INDEX IF NOT EXISTS idx_pod_tenant_id ON proof_of_delivery(tenant_id)');
    
    await client.query('COMMIT');
    
    logger.info('✅ 所有表创建/更新完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ 创建表失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createMissingTables()
    .then(() => {
      logger.info('表创建脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('表创建脚本执行失败:', error);
      process.exit(1);
    });
}

export { createMissingTables };
