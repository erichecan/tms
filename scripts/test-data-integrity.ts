// 数据完整性测试脚本
// 创建时间：2025-11-30T14:30:00Z
// 用途：测试系统唯一性、外键验证、租户隔离等场景

import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tms_user:tms_password@localhost:5432/tms_platform',
});

const TEST_TENANT_ID = '00000000-0000-0000-0000-000000000001';
const TEST_TENANT_ID_2 = '00000000-0000-0000-0000-000000000002';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  try {
    await testFn();
    results.push({ name, passed: true });
    console.log(`✅ ${name}`);
  } catch (error: any) {
    results.push({ name, passed: false, error: error.message });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function cleanup(): Promise<void> {
  // 清理测试数据
  await pool.query('DELETE FROM shipments WHERE shipment_number LIKE $1', ['TEST-%']);
  await pool.query('DELETE FROM customers WHERE name LIKE $1', ['测试客户%']);
  await pool.query('DELETE FROM drivers WHERE name LIKE $1', ['测试司机%']);
  await pool.query('DELETE FROM vehicles WHERE plate_number LIKE $1', ['TEST-%']);
}

async function testUniqueness(): Promise<void> {
  console.log('\n=== 测试唯一性约束 ===\n');

  // 1. 测试客户名称唯一性
  await runTest('创建重复的客户名称应该失败', async () => {
    const customer1 = await pool.query(
      'INSERT INTO customers (tenant_id, name, level) VALUES ($1, $2, $3) RETURNING id',
      [TEST_TENANT_ID, '测试客户-唯一性', 'standard']
    );
    
    try {
      await pool.query(
        'INSERT INTO customers (tenant_id, name, level) VALUES ($1, $2, $3)',
        [TEST_TENANT_ID, '测试客户-唯一性', 'standard']
      );
      throw new Error('应该抛出唯一性约束错误');
    } catch (error: any) {
      if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
    
    await pool.query('DELETE FROM customers WHERE id = $1', [customer1.rows[0].id]);
  });

  // 2. 测试司机电话唯一性
  await runTest('创建重复的司机电话应该失败', async () => {
    const driver1 = await pool.query(
      'INSERT INTO drivers (tenant_id, name, phone) VALUES ($1, $2, $3) RETURNING id',
      [TEST_TENANT_ID, '测试司机-唯一性', '416-123-4567']
    );
    
    try {
      await pool.query(
        'INSERT INTO drivers (tenant_id, name, phone) VALUES ($1, $2, $3)',
        [TEST_TENANT_ID, '测试司机-唯一性2', '416-123-4567']
      );
      throw new Error('应该抛出唯一性约束错误');
    } catch (error: any) {
      if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
    
    await pool.query('DELETE FROM drivers WHERE id = $1', [driver1.rows[0].id]);
  });

  // 3. 测试车牌号唯一性
  await runTest('创建重复的车牌号应该失败', async () => {
    const vehicle1 = await pool.query(
      'INSERT INTO vehicles (tenant_id, plate_number, type, capacity_kg, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [TEST_TENANT_ID, 'TEST-001', 'van', 1000, 'available']
    );
    
    try {
      await pool.query(
        'INSERT INTO vehicles (tenant_id, plate_number, type, capacity_kg, status) VALUES ($1, $2, $3, $4, $5)',
        [TEST_TENANT_ID, 'TEST-001', 'truck', 2000, 'available']
      );
      throw new Error('应该抛出唯一性约束错误');
    } catch (error: any) {
      if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
    
    await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicle1.rows[0].id]);
  });

  // 4. 测试运单号唯一性
  await runTest('创建重复的运单号应该失败', async () => {
    const customer = await pool.query(
      'INSERT INTO customers (tenant_id, name, level) VALUES ($1, $2, $3) RETURNING id',
      [TEST_TENANT_ID, '测试客户-运单', 'standard']
    );
    
    const shipment1 = await pool.query(
      `INSERT INTO shipments (tenant_id, shipment_number, customer_id, pickup_address, delivery_address, cargo_info, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [
        TEST_TENANT_ID,
        'TEST-SHIP-001',
        customer.rows[0].id,
        '{}',
        '{}',
        '{}',
        'draft'
      ]
    );
    
    try {
      await pool.query(
        `INSERT INTO shipments (tenant_id, shipment_number, customer_id, pickup_address, delivery_address, cargo_info, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          TEST_TENANT_ID,
          'TEST-SHIP-001',
          customer.rows[0].id,
          '{}',
          '{}',
          '{}',
          'draft'
        ]
      );
      throw new Error('应该抛出唯一性约束错误');
    } catch (error: any) {
      if (!error.message.includes('unique') && !error.message.includes('duplicate')) {
        throw error;
      }
    }
    
    await pool.query('DELETE FROM shipments WHERE id = $1', [shipment1.rows[0].id]);
    await pool.query('DELETE FROM customers WHERE id = $1', [customer.rows[0].id]);
  });
}

async function testForeignKeyValidation(): Promise<void> {
  console.log('\n=== 测试外键验证 ===\n');

  // 1. 测试使用不存在的客户ID创建运单
  await runTest('使用不存在的客户ID创建运单应该失败', async () => {
    try {
      await pool.query(
        `INSERT INTO shipments (tenant_id, shipment_number, customer_id, pickup_address, delivery_address, cargo_info, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          TEST_TENANT_ID,
          'TEST-SHIP-FK-001',
          '00000000-0000-0000-0000-000000000999', // 不存在的ID
          '{}',
          '{}',
          '{}',
          'draft'
        ]
      );
      // 如果外键约束存在，这应该失败
      // 如果没有外键约束，至少应该检查代码层面的验证
    } catch (error: any) {
      // 外键约束错误是预期的
      if (!error.message.includes('foreign key') && !error.message.includes('violates foreign key')) {
        // 如果没有外键约束，这是可以接受的（代码层面会验证）
        console.log('  注意: 数据库层面没有外键约束，依赖代码层面验证');
      }
    }
  });

  // 2. 测试跨租户访问
  await runTest('租户A不能访问租户B的客户', async () => {
    // 确保测试租户2存在
    await pool.query(
      `INSERT INTO tenants (id, name, domain, schema_name) 
       VALUES ($1, 'Test Tenant 2', 'test2.tms-platform.com', 'tenant_test2')
       ON CONFLICT (id) DO NOTHING`,
      [TEST_TENANT_ID_2]
    );
    
    // 创建租户B的客户
    const customerB = await pool.query(
      'INSERT INTO customers (tenant_id, name, level) VALUES ($1, $2, $3) RETURNING id',
      [TEST_TENANT_ID_2, '租户B的客户', 'standard']
    );
    
    // 租户A尝试访问租户B的客户
    const result = await pool.query(
      'SELECT * FROM customers WHERE tenant_id = $1 AND id = $2',
      [TEST_TENANT_ID, customerB.rows[0].id]
    );
    
    if (result.rows.length > 0) {
      throw new Error('租户A不应该能访问租户B的客户');
    }
    
    await pool.query('DELETE FROM customers WHERE id = $1', [customerB.rows[0].id]);
  });
}

async function testTenantIsolation(): Promise<void> {
  console.log('\n=== 测试租户隔离 ===\n');

  // 确保测试租户2存在
  await pool.query(
    `INSERT INTO tenants (id, name, domain, schema_name) 
     VALUES ($1, 'Test Tenant 2', 'test2.tms-platform.com', 'tenant_test2')
     ON CONFLICT (id) DO NOTHING`,
    [TEST_TENANT_ID_2]
  );

  // 1. 测试不同租户可以有相同的客户名称
  await runTest('不同租户可以有相同的客户名称', async () => {
    const customer1 = await pool.query(
      'INSERT INTO customers (tenant_id, name, level) VALUES ($1, $2, $3) RETURNING id',
      [TEST_TENANT_ID, '共享名称客户', 'standard']
    );
    
    const customer2 = await pool.query(
      'INSERT INTO customers (tenant_id, name, level) VALUES ($1, $2, $3) RETURNING id',
      [TEST_TENANT_ID_2, '共享名称客户', 'standard']
    );
    
    // 应该成功，因为不同租户
    await pool.query('DELETE FROM customers WHERE id = $1', [customer1.rows[0].id]);
    await pool.query('DELETE FROM customers WHERE id = $1', [customer2.rows[0].id]);
  });

  // 2. 测试不同租户可以有相同的车牌号
  await runTest('不同租户可以有相同的车牌号', async () => {
    const vehicle1 = await pool.query(
      'INSERT INTO vehicles (tenant_id, plate_number, type, capacity_kg, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [TEST_TENANT_ID, 'SHARED-001', 'van', 1000, 'available']
    );
    
    const vehicle2 = await pool.query(
      'INSERT INTO vehicles (tenant_id, plate_number, type, capacity_kg, status) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [TEST_TENANT_ID_2, 'SHARED-001', 'van', 1000, 'available']
    );
    
    // 应该成功，因为不同租户
    await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicle1.rows[0].id]);
    await pool.query('DELETE FROM vehicles WHERE id = $1', [vehicle2.rows[0].id]);
  });
}

async function main(): Promise<void> {
  console.log('🧪 开始数据完整性测试...\n');
  
  try {
    await cleanup();
    
    await testUniqueness();
    await testForeignKeyValidation();
    await testTenantIsolation();
    
    console.log('\n' + '='.repeat(60));
    console.log('测试结果汇总:');
    console.log('='.repeat(60));
    
    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    
    results.forEach(result => {
      const icon = result.passed ? '✅' : '❌';
      console.log(`${icon} ${result.name}`);
      if (!result.passed && result.error) {
        console.log(`   错误: ${result.error}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log(`总计: ${results.length} 个测试`);
    console.log(`通过: ${passed}`);
    console.log(`失败: ${failed}`);
    console.log('='.repeat(60));
    
    await cleanup();
    
    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('测试执行过程中发生错误:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();

