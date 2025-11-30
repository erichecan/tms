// 数据库清理脚本
// 创建时间: 2025-11-30 01:15:00
// 用途：清理所有测试数据，保留租户和用户数据

import { Pool } from 'pg';
import { logger } from '../apps/backend/src/utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function cleanDatabase() {
  const client = await pool.connect();
  
  try {
    logger.info('开始清理数据库...');
    
    await client.query('BEGIN');
    
    // 2025-11-30 03:30:00 修复：使用 IF EXISTS 或安全删除，避免表不存在时出错
    // 清理顺序：先删除依赖数据，再删除主数据
    // 1. 清理财务记录
    logger.info('清理财务记录...');
    await client.query('DELETE FROM financial_records WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = \'financial_records\')');
    
    // 2. 清理时间线事件
    logger.info('清理时间线事件...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'timeline_events') THEN
          DELETE FROM timeline_events;
        END IF;
      END $$;
    `);
    
    // 3. 清理POD记录
    logger.info('清理POD记录...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'proof_of_delivery') THEN
          DELETE FROM proof_of_delivery;
        END IF;
      END $$;
    `);
    
    // 4. 清理运单
    logger.info('清理运单...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shipments') THEN
          DELETE FROM shipments;
        END IF;
      END $$;
    `);
    
    // 5. 清理行程
    logger.info('清理行程...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'trips') THEN
          DELETE FROM trips;
        END IF;
      END $$;
    `);
    
    // 6. 清理司机（注意：这也会清理关联的车辆信息，因为vehicle_id是外键）
    logger.info('清理司机...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'drivers') THEN
          UPDATE drivers SET vehicle_id = NULL WHERE vehicle_id IS NOT NULL;
          DELETE FROM drivers;
        END IF;
      END $$;
    `);
    
    // 7. 清理车辆
    logger.info('清理车辆...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
          DELETE FROM vehicles;
        END IF;
      END $$;
    `);
    
    // 8. 清理客户（保留默认租户的初始客户，如果需要）
    logger.info('清理客户...');
    await client.query(`
      DO $$ 
      BEGIN 
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'customers') THEN
          DELETE FROM customers;
        END IF;
      END $$;
    `);
    
    // 保留租户和用户数据
    logger.info('保留租户和用户数据（不清理）');
    
    await client.query('COMMIT');
    
    logger.info('✅ 数据库清理完成！');
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ 数据库清理失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanDatabase()
    .then(() => {
      logger.info('数据库清理脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('数据库清理脚本执行失败:', error);
      process.exit(1);
    });
}

export { cleanDatabase };
