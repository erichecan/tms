// 计费引擎数据库迁移脚本
// 创建时间: 2025-10-08 14:10:00

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// 数据库连接配置 - 2025-10-08 14:15:00 
// 尝试使用系统用户名（macOS 通常不需要密码）
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'tms_platform',
  user: process.env.DB_USER || process.env.USER || 'tms_user',
  password: process.env.DB_PASSWORD || '',
});

console.log('📊 数据库连接配置:');
console.log('  Host:', pool.options.host);
console.log('  Port:', pool.options.port);
console.log('  Database:', pool.options.database);
console.log('  User:', pool.options.user);
console.log('');

async function migrate() {
  console.log('🚀 开始执行计费引擎数据库迁移...\n');
  
  try {
    // 读取迁移 SQL 文件
    const migrationPath = path.join(__dirname, '../../migrations/add_pricing_engine_tables.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');
    
    console.log('📄 读取迁移文件:', migrationPath);
    console.log('📊 执行迁移脚本...\n');
    
    // 执行迁移
    await pool.query(migrationSQL);
    
    console.log('\n✅ 计费引擎数据库迁移完成！');
    console.log('\n创建的表：');
    console.log('  ✓ pricing_templates - 计费模板表');
    console.log('  ✓ pricing_components - 计费组件表');
    console.log('  ✓ pricing_tables - 价格表');
    console.log('  ✓ shipment_pricing_details - 运单计费明细表');
    console.log('  ✓ warehouses - 仓库表');
    console.log('  ✓ distance_matrix - 距离矩阵表');
    console.log('\n已插入示例数据：');
    console.log('  ✓ 2个计费模板（垃圾清运、亚马逊仓库转运）');
    console.log('  ✓ 8个计费组件');
    console.log('  ✓ 3个仓库配置');
    
  } catch (error) {
    console.error('\n❌ 数据库迁移失败:', error.message);
    
    // 如果是表已存在的错误，提示用户
    if (error.code === '42P07') {
      console.log('\n💡 提示：部分表已存在，这可能是正常的。');
      console.log('   如需重新创建表，请先手动删除相关表。');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行迁移
migrate();

