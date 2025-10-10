// 授予计费引擎表的访问权限给 tms_user
// 创建时间: 2025-10-08 14:20:00

const { Pool } = require('pg');

// 使用管理员用户连接（拥有表的用户）
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME || 'tms_platform',
  user: process.env.DB_USER || process.env.USER || 'apony-it',
  password: process.env.DB_PASSWORD || '',
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

