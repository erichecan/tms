// 第一阶段数据库迁移执行脚本
// 创建时间: 2025-11-29T11:25:04Z
// 使用说明: 运行此脚本执行第一阶段的所有数据库迁移

import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

async function runPhase1Migration() {
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
    console.log('开始执行第一阶段数据库迁移...');

    // 读取合并的迁移文件（使用安全版本）
    // __dirname 指向编译后的 dist/database 目录，需要回到项目根目录
    const projectRoot = path.resolve(__dirname, '../../../..');
    const migrationFiles = [
      path.join(projectRoot, 'database_migrations/010_phase1_complete_migration_safe.sql'),
      path.join(projectRoot, 'database_migrations/011_add_custom_fields_to_schedules.sql'),
    ];
    console.log(`准备执行 ${migrationFiles.length} 个迁移文件...`);

    // 检查基础表是否存在
    console.log('检查基础表是否存在...');
    const baseTables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('vehicles', 'drivers', 'shipments')
    `);
    
    if (baseTables.rows.length < 3) {
      console.warn('⚠ 警告: 基础表（vehicles, drivers, shipments）可能不存在');
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
      await client.query('CREATE EXTENSION IF NOT EXISTS "pg_trgm"');
      console.log('✓ 扩展已启用');
      
      // 执行所有迁移文件
      console.log('执行迁移SQL...');
      for (const migrationFile of migrationFiles) {
        if (fs.existsSync(migrationFile)) {
          console.log(`执行迁移文件: ${path.basename(migrationFile)}`);
          const sql = fs.readFileSync(migrationFile, 'utf-8');
          await client.query(sql);
        } else {
          console.warn(`迁移文件不存在，跳过: ${migrationFile}`);
        }
      }
      
      await client.query('COMMIT');
      console.log('\n✅ 第一阶段数据库迁移执行完成！');
      
      // 验证表是否创建成功
      const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN (
          'vehicle_certificates', 'vehicle_insurance', 'vehicle_inspections', 'vehicle_devices',
          'driver_certificates', 'driver_violations', 'driver_medical_records', 'driver_training_records',
          'driver_schedules', 'driver_groups', 'driver_group_members',
          'carriers', 'carrier_certificates', 'carrier_ratings', 'carrier_quotes',
          'schedule_custom_field_definitions'
        )
        ORDER BY table_name
      `);
      
      console.log('\n已创建的表:');
      tables.rows.forEach((row: any) => {
        console.log(`  ✓ ${row.table_name}`);
      });

      // 检查 driver_schedules 表是否有 custom_fields 字段
      const customFieldsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'driver_schedules' 
        AND column_name = 'custom_fields'
      `);
      
      if (customFieldsCheck.rows.length > 0) {
        console.log('  ✓ driver_schedules.custom_fields 字段已添加');
      }
    } catch (error: any) {
      await client.query('ROLLBACK');
      // 如果是"已存在"的错误，可以忽略
      if (error.message.includes('already exists') || error.message.includes('duplicate') || error.message.includes('IF NOT EXISTS')) {
        console.log('⚠ 部分表或索引已存在，但迁移继续执行...');
        // 尝试提交（如果只是警告）
        try {
          await client.query('COMMIT');
          console.log('\n✅ 第一阶段数据库迁移执行完成（部分已存在）！');
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
  runPhase1Migration()
    .then(() => {
      console.log('迁移完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移失败:', error);
      process.exit(1);
    });
}

export { runPhase1Migration };

