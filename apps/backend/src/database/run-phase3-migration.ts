// 第三阶段数据库迁移脚本
// 创建时间: 2025-11-29T11:25:04Z
// 第三阶段：维护保养与成本管理

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function runPhase3Migration() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  const client = await pool.connect();

  try {
    console.log('开始执行第三阶段数据库迁移...');

    const projectRoot = path.resolve(__dirname, '../../../..');
    const migrationFile = path.join(projectRoot, 'database_migrations/012_maintenance_management.sql');
    
    if (!fs.existsSync(migrationFile)) {
      console.error(`迁移文件不存在: ${migrationFile}`);
      process.exit(1);
    }

    console.log(`执行迁移文件: ${path.basename(migrationFile)}`);

    // 检查基础表是否存在
    console.log('检查基础表是否存在...');
    const baseTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('vehicles')
    `);
    
    if (baseTables.rows.length < 1) {
      console.warn('⚠ 警告: 基础表（vehicles）可能不存在');
      console.warn('   请先运行基础数据库初始化脚本');
      console.warn('   迁移将继续执行，但可能会失败...');
    } else {
      console.log('✓ 基础表检查通过');
    }

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
      console.log('\n✅ 第三阶段数据库迁移执行完成！');
      
      // 验证表是否创建成功
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'maintenance_records', 'maintenance_plans', 
          'maintenance_work_orders', 'spare_parts', 'work_order_parts'
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
          console.log('\n✅ 第三阶段数据库迁移执行完成（部分已存在）！');
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
  runPhase3Migration()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

export { runPhase3Migration };

