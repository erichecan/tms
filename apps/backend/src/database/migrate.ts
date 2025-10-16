// 数据库迁移脚本
// 创建时间: 2025-01-27 15:30:45

import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    logger.info('开始数据库迁移...');
    
    // 读取初始化SQL文件 // 2025-10-16 17:28:00
    // 使用项目根目录的database_schema.sql文件
    const projectRoot = join(__dirname, '../../../../');
    const initSqlPath = join(projectRoot, 'database_schema.sql');
    const initSql = readFileSync(initSqlPath, 'utf8');
    
    // 执行SQL
    await client.query(initSql);
    
    logger.info('数据库迁移完成！');
    
    // 验证表是否创建成功
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    logger.info('已创建的表:', tables.rows.map(row => row.table_name));
    
  } catch (error) {
    logger.error('数据库迁移失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runMigration()
    .then(() => {
      logger.info('迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('迁移脚本执行失败:', error);
      process.exit(1);
    });
}

export { runMigration };
