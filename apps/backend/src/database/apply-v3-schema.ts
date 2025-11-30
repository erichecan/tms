import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

// 2025-01-27 16:45:00 应用TMS v3.0-PC Schema更新

// 2025-11-30T19:40:00Z Fixed by Assistant: 强制使用 DATABASE_URL
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

async function applySchema() {
  const client = await pool.connect();
  try {
    console.log('开始应用TMS v3.0-PC Schema更新...');
    
    // 读取迁移SQL文件
    const migrationPath = path.join(__dirname, 'migrations', 'v3_customer_schema_update.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    // 执行迁移
    await client.query(migrationSQL);
    
    console.log('✅ TMS v3.0-PC Schema更新应用成功');
    
    // 验证更新
    console.log('验证数据库更新...');
    
    // 检查customers表的新字段
    const customerColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('phone', 'email', 'default_pickup_address', 'default_delivery_address')
    `);
    
    console.log('Customers表新字段:', customerColumns.rows);
    
    // 检查trips表是否存在
    const tripsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trips'
      )
    `);
    
    console.log('Trips表存在:', tripsExists.rows[0].exists);
    
    // 检查timeline_events表是否存在
    const timelineExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'timeline_events'
      )
    `);
    
    console.log('Timeline_events表存在:', timelineExists.rows[0].exists);
    
    // 检查pods表是否存在
    const podsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'pods'
      )
    `);
    
    console.log('Pods表存在:', podsExists.rows[0].exists);
    
    console.log('🎉 数据库Schema验证完成');
    
  } catch (error) {
    console.error('❌ Schema更新失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await applySchema();
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { applySchema };
