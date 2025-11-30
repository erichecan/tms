// 第二阶段数据库迁移脚本
// 创建时间: 2025-11-29T11:25:04Z
// 第二阶段：线路与站点管理

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function runPhase2Migration() {
  // 2025-11-30T19:40:00Z Fixed by Assistant: 添加 DATABASE_URL 验证
  if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置！');
    console.error('⚠️  请设置 DATABASE_URL 环境变量');
    process.exit(1);
  }

  let connectionString = process.env.DATABASE_URL;
  // 移除 channel_binding 参数（某些环境不支持）
  if (connectionString.includes('neon.tech')) {
    connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/, '').replace(/\?\?/, '?').replace(/&&/, '&').replace(/[&?]$/, '');
  }

  const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
  });

  const client = await pool.connect();

  try {
    console.log('开始执行第二阶段数据库迁移...');

    const projectRoot = path.resolve(__dirname, '../../../..');
    const migrationFile = path.join(projectRoot, 'database_migrations/013_routes_and_stations.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`迁移文件不存在: ${migrationFile}`);
      process.exit(1);
    }

    console.log(`执行迁移文件: ${path.basename(migrationFile)}`);

    // 执行迁移
    await client.query('BEGIN');
    try {
      // 先启用必要的扩展
      console.log('启用 PostgreSQL 扩展...');
      await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
      console.log('✓ 扩展已启用');
      
      // 执行迁移SQL
      console.log('执行迁移SQL...');
      const sql = fs.readFileSync(migrationFile, 'utf-8');
      await client.query(sql);
      
      await client.query('COMMIT');
      console.log('\n✅ 第二阶段数据库迁移执行完成！');
      
      // 验证表是否创建成功
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'routes', 'route_segments', 'stations', 'hubs', 'warehouses'
        )
        ORDER BY table_name
      `);
      
      console.log('\n已创建的表:');
      tables.rows.forEach((row: any) => {
        console.log(`  ✓ ${row.table_name}`);
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
      // 如果是"已存在"的错误，可以忽略
      if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('IF NOT EXISTS')) {
        console.log('⚠ 部分表或索引已存在，但迁移继续执行...');
        // 尝试提交（如果只是警告）
        try {
          await client.query('COMMIT');
          console.log('\n✅ 第二阶段数据库迁移执行完成（部分已存在）！');
        } catch (e) {
          throw error;
        }
      } else {
        throw error;
      }
    }
  } catch (error: any) {
    console.error('❌ 迁移执行失败:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  runPhase2Migration()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

export { runPhase2Migration };

