// Seed 数据验证脚本
// 创建时间: 2025-11-24T17:35:00Z
// 目的: 验证 seed 数据的完整性和一致性

import { Pool } from 'pg';
import * as readline from 'readline';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface ValidationResult {
  passed: boolean;
  message: string;
  details?: any;
}

async function validateSeedData(): Promise<void> {
  const client = await pool.connect();
  const results: ValidationResult[] = [];
  
  try {
    console.log('开始验证 seed 数据...\n');
    
    const tenantId = '00000000-0000-0000-0000-000000000001';
    
    // 1. 验证租户数据
    const tenantCheck = await client.query('SELECT COUNT(*) FROM tenants WHERE id = $1', [tenantId]);
    results.push({
      passed: parseInt(tenantCheck.rows[0].count) > 0,
      message: '租户数据存在',
      details: { count: tenantCheck.rows[0].count }
    });
    
    // 2. 验证客户数据
    const customers = await client.query('SELECT COUNT(*) as count, COUNT(DISTINCT name) as unique_names, COUNT(DISTINCT email) as unique_emails FROM customers WHERE tenant_id = $1', [tenantId]);
    const customerCount = parseInt(customers.rows[0].count);
    results.push({
      passed: customerCount >= 3 && customerCount <= 5,
      message: `客户数据: ${customerCount} 个 (期望: 3-5 个)`,
      details: {
        total: customerCount,
        uniqueNames: parseInt(customers.rows[0].unique_names),
        uniqueEmails: parseInt(customers.rows[0].unique_emails)
      }
    });
    
    // 3. 验证司机数据
    const drivers = await client.query(`
      SELECT COUNT(*) as count, 
             COUNT(DISTINCT phone) as unique_phones,
             COUNT(DISTINCT license_number) as unique_licenses,
             COUNT(DISTINCT status) as status_count
      FROM drivers WHERE tenant_id = $1
    `, [tenantId]);
    const driverCount = parseInt(drivers.rows[0].count);
    results.push({
      passed: driverCount >= 5 && driverCount <= 10,
      message: `司机数据: ${driverCount} 个 (期望: 5-10 个)`,
      details: {
        total: driverCount,
        uniquePhones: parseInt(drivers.rows[0].unique_phones),
        uniqueLicenses: parseInt(drivers.rows[0].unique_licenses),
        statusCount: parseInt(drivers.rows[0].status_count)
      }
    });
    
    // 4. 验证车辆数据
    const vehicles = await client.query(`
      SELECT COUNT(*) as count,
             COUNT(DISTINCT plate_number) as unique_plates,
             COUNT(DISTINCT type) as type_count,
             COUNT(DISTINCT status) as status_count
      FROM vehicles WHERE tenant_id = $1
    `, [tenantId]);
    const vehicleCount = parseInt(vehicles.rows[0].count);
    results.push({
      passed: vehicleCount >= 10 && vehicleCount <= 15,
      message: `车辆数据: ${vehicleCount} 辆 (期望: 10-15 辆)`,
      details: {
        total: vehicleCount,
        uniquePlates: parseInt(vehicles.rows[0].unique_plates),
        typeCount: parseInt(vehicles.rows[0].type_count),
        statusCount: parseInt(vehicles.rows[0].status_count)
      }
    });
    
    // 5. 验证运单数据
    const shipments = await client.query(`
      SELECT COUNT(*) as count,
             COUNT(DISTINCT shipment_number) as unique_numbers,
             COUNT(DISTINCT status) as status_count,
             COUNT(DISTINCT customer_id) as customer_count,
             COUNT(DISTINCT driver_id) FILTER (WHERE driver_id IS NOT NULL) as driver_count
      FROM shipments WHERE tenant_id = $1
    `, [tenantId]);
    const shipmentCount = parseInt(shipments.rows[0].count);
    results.push({
      passed: shipmentCount >= 20 && shipmentCount <= 30,
      message: `运单数据: ${shipmentCount} 个 (期望: 20-30 个)`,
      details: {
        total: shipmentCount,
        uniqueNumbers: parseInt(shipments.rows[0].unique_numbers),
        statusCount: parseInt(shipments.rows[0].status_count),
        customerCount: parseInt(shipments.rows[0].customer_count),
        driverCount: parseInt(shipments.rows[0].driver_count)
      }
    });
    
    // 6. 验证运单状态分布
    const statusDistribution = await client.query(`
      SELECT status, COUNT(*) as count
      FROM shipments WHERE tenant_id = $1
      GROUP BY status
      ORDER BY count DESC
    `, [tenantId]);
    const expectedStatuses = ['created', 'confirmed', 'scheduled', 'pickup_in_progress', 'in_transit', 'delivered', 'completed', 'cancelled', 'exception'];
    const foundStatuses = statusDistribution.rows.map(r => r.status);
    const missingStatuses = expectedStatuses.filter(s => !foundStatuses.includes(s));
    results.push({
      passed: missingStatuses.length === 0,
      message: `运单状态分布: ${foundStatuses.length} 种状态`,
      details: {
        distribution: statusDistribution.rows,
        missingStatuses: missingStatuses
      }
    });
    
    // 7. 验证财务记录
    const financialRecords = await client.query(`
      SELECT type, COUNT(*) as count
      FROM financial_records WHERE tenant_id = $1
      GROUP BY type
    `, [tenantId]);
    const hasReceivables = financialRecords.rows.some(r => r.type === 'receivable');
    const hasPayables = financialRecords.rows.some(r => r.type === 'payable');
    results.push({
      passed: hasReceivables && hasPayables,
      message: `财务记录: ${financialRecords.rows.reduce((sum, r) => sum + parseInt(r.count), 0)} 条`,
      details: {
        records: financialRecords.rows,
        hasReceivables,
        hasPayables
      }
    });
    
    // 8. 验证外键关系
    const foreignKeyChecks = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM shipments s LEFT JOIN customers c ON s.customer_id = c.id WHERE s.tenant_id = $1 AND s.customer_id IS NOT NULL AND c.id IS NULL) as orphan_shipments_customer,
        (SELECT COUNT(*) FROM shipments s LEFT JOIN drivers d ON s.driver_id = d.id WHERE s.tenant_id = $1 AND s.driver_id IS NOT NULL AND d.id IS NULL) as orphan_shipments_driver,
        (SELECT COUNT(*) FROM drivers d LEFT JOIN vehicles v ON d.vehicle_id = v.id WHERE d.tenant_id = $1 AND d.vehicle_id IS NOT NULL AND v.id IS NULL) as orphan_drivers_vehicle
    `, [tenantId]);
    const orphanShipmentsCustomer = parseInt(foreignKeyChecks.rows[0].orphan_shipments_customer);
    const orphanShipmentsDriver = parseInt(foreignKeyChecks.rows[0].orphan_shipments_driver);
    const orphanDriversVehicle = parseInt(foreignKeyChecks.rows[0].orphan_drivers_vehicle);
    results.push({
      passed: orphanShipmentsCustomer === 0 && orphanShipmentsDriver === 0 && orphanDriversVehicle === 0,
      message: '外键关系完整性',
      details: {
        orphanShipmentsCustomer,
        orphanShipmentsDriver,
        orphanDriversVehicle
      }
    });
    
    // 9. 验证唯一性约束
    const uniquenessChecks = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM (SELECT tenant_id, name FROM customers WHERE tenant_id = $1 GROUP BY tenant_id, name HAVING COUNT(*) > 1) dup) as duplicate_customer_names,
        (SELECT COUNT(*) FROM (SELECT tenant_id, phone FROM drivers WHERE tenant_id = $1 AND phone IS NOT NULL GROUP BY tenant_id, phone HAVING COUNT(*) > 1) dup) as duplicate_driver_phones,
        (SELECT COUNT(*) FROM (SELECT tenant_id, plate_number FROM vehicles WHERE tenant_id = $1 GROUP BY tenant_id, plate_number HAVING COUNT(*) > 1) dup) as duplicate_vehicle_plates,
        (SELECT COUNT(*) FROM (SELECT tenant_id, shipment_number FROM shipments WHERE tenant_id = $1 GROUP BY tenant_id, shipment_number HAVING COUNT(*) > 1) dup) as duplicate_shipment_numbers
    `, [tenantId]);
    const duplicateCustomerNames = parseInt(uniquenessChecks.rows[0].duplicate_customer_names);
    const duplicateDriverPhones = parseInt(uniquenessChecks.rows[0].duplicate_driver_phones);
    const duplicateVehiclePlates = parseInt(uniquenessChecks.rows[0].duplicate_vehicle_plates);
    const duplicateShipmentNumbers = parseInt(uniquenessChecks.rows[0].duplicate_shipment_numbers);
    results.push({
      passed: duplicateCustomerNames === 0 && duplicateDriverPhones === 0 && duplicateVehiclePlates === 0 && duplicateShipmentNumbers === 0,
      message: '唯一性约束验证',
      details: {
        duplicateCustomerNames,
        duplicateDriverPhones,
        duplicateVehiclePlates,
        duplicateShipmentNumbers
      }
    });
    
    // 输出结果
    console.log('\n验证结果:');
    console.log('='.repeat(60));
    let allPassed = true;
    for (const result of results) {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.message}`);
      if (result.details && Object.keys(result.details).length > 0) {
        console.log(`   详情:`, result.details);
      }
      if (!result.passed) {
        allPassed = false;
      }
    }
    console.log('='.repeat(60));
    console.log(`\n总体结果: ${allPassed ? '✅ 所有验证通过' : '❌ 部分验证失败'}\n`);
    
    if (!allPassed) {
      process.exit(1);
    }
    
  } catch (error) {
    console.error('验证失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
// 2025-11-24T19:25:00Z Fixed by Assistant: 修复 ES module 问题
if (import.meta.url === `file://${process.argv[1]}`) {
  validateSeedData()
    .then(() => {
      console.log('验证完成');
      process.exit(0);
    })
    .catch((error) => {
      console.error('验证失败:', error);
      process.exit(1);
    });
}

export { validateSeedData };

