// 授予计费引擎表的访问权限给 tms_user
// 创建时间: 2025-10-08 14:20:00

const { Pool } = require('pg');

// 数据库连接配置 - 2025-11-30T19:35:00Z Updated: 统一使用 DATABASE_URL
// 2025-11-30T19:35:00Z Fixed by Assistant: 强制使用 DATABASE_URL，不再使用独立的 DB_* 变量
if (!process.env.DATABASE_URL) {
  console.error('❌ 错误: DATABASE_URL 环境变量未设置！');
  console.error('⚠️  请设置 DATABASE_URL 环境变量，例如：');
  console.error('   export DATABASE_URL=postgresql://user:password@host:port/database');
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

async function grantPermissions() {
  console.log('🔐 开始授予计费引擎表权限给 tms_user...\n');
  
  try {
    // 需要授权的表列表
    const tables = [
      'pricing_templates',
      'pricing_components',
      'pricing_tables',
      'shipment_pricing_details',
      'warehouses',
      'distance_matrix'
    ];

    console.log('📋 将授权以下表的访问权限：');
    tables.forEach(table => console.log(`  - ${table}`));
    console.log('');

    // 授予所有权限给 tms_user
    for (const table of tables) {
      const grantSQL = `GRANT ALL PRIVILEGES ON TABLE public.${table} TO tms_user;`;
      await pool.query(grantSQL);
      console.log(`✓ 已授权 ${table} 表给 tms_user`);
    }

    // 授予序列（如果有）的权限
    console.log('\n📊 授予序列权限...');
    await pool.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO tms_user;`);
    console.log('✓ 已授权所有序列给 tms_user');

    // 授予 shipments 表的新增字段权限（如果需要）
    console.log('\n📦 授予 shipments 表权限...');
    await pool.query(`GRANT ALL PRIVILEGES ON TABLE public.shipments TO tms_user;`);
    console.log('✓ 已授权 shipments 表给 tms_user');

    console.log('\n✅ 权限授予完成！');
    console.log('\n验证权限：');
    
    // 验证权限
    const checkSQL = `
      SELECT grantee, table_name, privilege_type
      FROM information_schema.table_privileges
      WHERE grantee = 'tms_user'
      AND table_schema = 'public'
      AND table_name IN (${tables.map(t => `'${t}'`).join(',')})
      ORDER BY table_name, privilege_type;
    `;
    
    const result = await pool.query(checkSQL);
    console.log(`\ntms_user 当前拥有的权限 (${result.rows.length} 条)：`);
    
    const grouped = {};
    result.rows.forEach(row => {
      if (!grouped[row.table_name]) {
        grouped[row.table_name] = [];
      }
      grouped[row.table_name].push(row.privilege_type);
    });
    
    Object.entries(grouped).forEach(([table, privileges]) => {
      console.log(`  ${table}: ${privileges.join(', ')}`);
    });

  } catch (error) {
    console.error('\n❌ 授权失败:', error.message);
    
    if (error.code === '42501') {
      console.log('\n💡 提示：当前用户没有授权权限。');
      console.log('   请使用数据库超级用户执行此脚本。');
    }
    
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// 运行授权
grantPermissions();

