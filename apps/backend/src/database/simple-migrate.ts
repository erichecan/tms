// 简化的数据库迁移脚本
import { Pool } from 'pg';
import { readFileSync } from 'fs';
import { join } from 'path';

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'tms_platform',
  user: 'tms_user',
  password: 'tms_password'
});

async function runMigration() {
  const client = await pool.connect();
  
  try {
    console.log('开始数据库迁移...');
    
    // 读取初始化SQL文件
    const initSqlPath = join(__dirname, '../../../docker/postgres/init.sql');
    const initSql = readFileSync(initSqlPath, 'utf8');
    
    // 执行SQL
    await client.query(initSql);
    
    console.log('数据库迁移完成！');
    
    // 验证表是否创建成功
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('已创建的表:', tables.rows.map(row => row.table_name));
    
  } catch (error) {
    console.error('数据库迁移失败:', error);
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
      console.log('迁移脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('迁移脚本执行失败:', error);
      process.exit(1);
    });
}

export { runMigration };