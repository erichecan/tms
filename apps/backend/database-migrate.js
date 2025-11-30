// 简化的数据库迁移脚本
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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

async function migrate() {
  console.log('开始数据库迁移...');
  
  try {
    // 创建租户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS tenants (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        domain VARCHAR(255) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ 租户表创建成功');

    // 创建默认租户
    const tenantResult = await pool.query(`
      INSERT INTO tenants (name, domain, status) 
      VALUES ('默认租户', 'default', 'active')
      ON CONFLICT (domain) DO NOTHING
      RETURNING id;
    `);
    console.log('✓ 默认租户创建成功');

    // 创建用户表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(tenant_id, email)
      );
    `);
    console.log('✓ 用户表创建成功');

    // 创建默认管理员用户
    await pool.query(`
      INSERT INTO users (tenant_id, email, password_hash, role, status) 
      VALUES ($1, 'admin@tms.com', '$2b$10$examplehash', 'admin', 'active')
      ON CONFLICT (tenant_id, email) DO NOTHING;
    `, [tenantResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000']);
    console.log('✓ 默认管理员用户创建成功');

    // 创建运单表
    await pool.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tenant_id UUID NOT NULL REFERENCES tenants(id),
        shipment_number VARCHAR(100) UNIQUE NOT NULL,
        customer_id UUID,
        status VARCHAR(50) DEFAULT 'pending',
        pickup_address JSONB,
        delivery_address JSONB,
        cargo_info JSONB,
        estimated_cost DECIMAL(10,2),
        final_cost DECIMAL(10,2),
        timeline JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✓ 运单表创建成功');

    // 创建测试运单
    await pool.query(`
      INSERT INTO shipments (tenant_id, shipment_number, status, pickup_address, delivery_address, cargo_info, estimated_cost) 
      VALUES ($1, 'SH-001', 'pending', 
        '{"street": "测试地址1", "city": "测试城市", "state": "测试省份", "postalCode": "123456"}',
        '{"street": "测试地址2", "city": "测试城市", "state": "测试省份", "postalCode": "654321"}',
        '{"weight": 100, "volume": 1, "type": "general"}',
        500.00
      );
    `, [tenantResult.rows[0]?.id || '00000000-0000-0000-0000-000000000000']);
    console.log('✓ 测试运单创建成功');

    console.log('🎉 数据库迁移完成！');
    
  } catch (error) {
    console.error('❌ 数据库迁移失败:', error);
  } finally {
    await pool.end();
  }
}

// 运行迁移
migrate();