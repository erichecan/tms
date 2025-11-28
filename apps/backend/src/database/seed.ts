// 数据库种子数据脚本
// 创建时间: 2025-01-27 15:30:45
// 2025-11-24T17:30:00Z Updated by Assistant: 扩展 seed 数据，创建完整的测试数据以支持端到端测试

import { Pool } from 'pg';
import { logger } from '../utils/logger';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
  const client = await pool.connect();
  
  try {
    logger.info('开始填充种子数据...');
    
    // 检查是否已有数据
    const existingCustomers = await client.query('SELECT COUNT(*) FROM customers');
    if (parseInt(existingCustomers.rows[0].count) > 0) {
      logger.info('数据库已有数据，跳过种子数据填充');
      return;
    }
    
    const tenantId = '00000000-0000-0000-0000-000000000001';
    
    // 2025-11-24T17:30:00Z Added by Assistant: 完整的 seed 数据，覆盖所有业务流程
    const seedData = `
      -- =============================================================================
      -- 1. 客户数据 (5个不同级别的客户)
      -- =============================================================================
      INSERT INTO customers (tenant_id, name, email, level, contact_info, billing_info) VALUES
      ('${tenantId}', '北京物流公司', 'beijing@logistics.com', 'premium', 
       '{"email": "beijing@logistics.com", "phone": "010-12345678", "address": {"street": "朝阳区物流园区1号", "city": "北京", "state": "北京", "postalCode": "100000", "country": "中国"}, "contactPerson": "王总"}',
       '{"companyName": "北京物流有限公司", "taxId": "91110000000000001X", "billingAddress": {"street": "朝阳区物流园区1号", "city": "北京", "state": "北京", "postalCode": "100000", "country": "中国"}, "paymentTerms": "月结15天"}'),
      ('${tenantId}', '上海运输集团', 'shanghai@transport.com', 'standard', 
       '{"email": "shanghai@transport.com", "phone": "021-87654321", "address": {"street": "浦东新区运输路88号", "city": "上海", "state": "上海", "postalCode": "200000", "country": "中国"}, "contactPerson": "李经理"}',
       '{"companyName": "上海运输集团有限公司", "taxId": "91310000000000002X", "billingAddress": {"street": "浦东新区运输路88号", "city": "上海", "state": "上海", "postalCode": "200000", "country": "中国"}, "paymentTerms": "月结30天"}'),
      ('${tenantId}', '广州贸易公司', 'guangzhou@trade.com', 'vip', 
       '{"email": "guangzhou@trade.com", "phone": "020-11111111", "address": {"street": "天河区贸易大道100号", "city": "广州", "state": "广东", "postalCode": "510000", "country": "中国"}, "contactPerson": "张总"}',
       '{"companyName": "广州贸易有限公司", "taxId": "91440000000000003X", "billingAddress": {"street": "天河区贸易大道100号", "city": "广州", "state": "广东", "postalCode": "510000", "country": "中国"}, "paymentTerms": "月结7天"}'),
      ('${tenantId}', '深圳电商物流', 'shenzhen@ecommerce.com', 'standard', 
       '{"email": "shenzhen@ecommerce.com", "phone": "0755-22222222", "address": {"street": "南山区科技园200号", "city": "深圳", "state": "广东", "postalCode": "518000", "country": "中国"}, "contactPerson": "刘经理"}',
       '{"companyName": "深圳电商物流有限公司", "taxId": "91440300000000004X", "billingAddress": {"street": "南山区科技园200号", "city": "深圳", "state": "广东", "postalCode": "518000", "country": "中国"}, "paymentTerms": "月结30天"}'),
      ('${tenantId}', '成都快运公司', 'chengdu@express.com', 'premium', 
       '{"email": "chengdu@express.com", "phone": "028-33333333", "address": {"street": "锦江区快运路300号", "city": "成都", "state": "四川", "postalCode": "610000", "country": "中国"}, "contactPerson": "陈总"}',
       '{"companyName": "成都快运有限公司", "taxId": "91510000000000005X", "billingAddress": {"street": "锦江区快运路300号", "city": "成都", "state": "四川", "postalCode": "610000", "country": "中国"}, "paymentTerms": "月结15天"}')
      ON CONFLICT (tenant_id, name) DO NOTHING;

      -- =============================================================================
      -- 2. 车辆数据 (15辆车，不同类型)
      -- =============================================================================
      INSERT INTO vehicles (tenant_id, plate_number, type, capacity_kg, status) VALUES
      ('${tenantId}', '京A10001', 'van', 1200, 'available'),
      ('${tenantId}', '京A10002', 'van', 1500, 'available'),
      ('${tenantId}', '京A10003', 'van', 2000, 'busy'),
      ('${tenantId}', '沪B20001', 'truck', 5000, 'available'),
      ('${tenantId}', '沪B20002', 'truck', 8000, 'available'),
      ('${tenantId}', '沪B20003', 'truck', 10000, 'busy'),
      ('${tenantId}', '粤C30001', 'trailer', 15000, 'available'),
      ('${tenantId}', '粤C30002', 'trailer', 20000, 'available'),
      ('${tenantId}', '粤C30003', 'trailer', 25000, 'maintenance'),
      ('${tenantId}', '川D40001', 'refrigerated', 8000, 'available'),
      ('${tenantId}', '川D40002', 'refrigerated', 10000, 'available'),
      ('${tenantId}', '深E50001', 'flatbed', 12000, 'available'),
      ('${tenantId}', '深E50002', 'flatbed', 15000, 'busy'),
      ('${tenantId}', '成F60001', 'box_truck', 6000, 'available'),
      ('${tenantId}', '成F60002', 'box_truck', 8000, 'available')
      ON CONFLICT (tenant_id, plate_number) DO NOTHING;

      -- =============================================================================
      -- 3. 司机数据 (10个司机，不同状态)
      -- =============================================================================
      INSERT INTO drivers (tenant_id, name, phone, license_number, vehicle_id, vehicle_info, status, performance) VALUES
      ('${tenantId}', '王司机', '13800138001', 'DL001234567', (SELECT id FROM vehicles WHERE plate_number = '京A10001' LIMIT 1),
       '{"type": "van", "licensePlate": "京A10001", "capacity": 1200, "dimensions": {"length": 4.2, "width": 1.8, "height": 2.0}, "features": ["GPS"]}',
       'available', '{"rating": 4.5, "totalDeliveries": 89, "onTimeRate": 0.88, "customerSatisfaction": 0.85}'),
      ('${tenantId}', '张司机', '13900139001', 'DL002345678', (SELECT id FROM vehicles WHERE plate_number = '沪B20001' LIMIT 1),
       '{"type": "truck", "licensePlate": "沪B20001", "capacity": 5000, "dimensions": {"length": 6.0, "width": 2.2, "height": 2.5}, "features": ["尾板", "GPS"]}',
       'available', '{"rating": 4.9, "totalDeliveries": 203, "onTimeRate": 0.96, "customerSatisfaction": 0.94}'),
      ('${tenantId}', '李司机', '13700137001', 'DL003456789', (SELECT id FROM vehicles WHERE plate_number = '粤C30001' LIMIT 1),
       '{"type": "trailer", "licensePlate": "粤C30001", "capacity": 15000, "dimensions": {"length": 12, "width": 2.5, "height": 3.5}, "features": ["尾板", "GPS", "冷藏"]}',
       'busy', '{"rating": 4.7, "totalDeliveries": 156, "onTimeRate": 0.92, "customerSatisfaction": 0.90}'),
      ('${tenantId}', '刘司机', '13600136001', 'DL004567890', (SELECT id FROM vehicles WHERE plate_number = '川D40001' LIMIT 1),
       '{"type": "refrigerated", "licensePlate": "川D40001", "capacity": 8000, "dimensions": {"length": 7.5, "width": 2.3, "height": 2.8}, "features": ["GPS", "温度监控"]}',
       'available', '{"rating": 4.6, "totalDeliveries": 112, "onTimeRate": 0.89, "customerSatisfaction": 0.87}'),
      ('${tenantId}', '陈司机', '13500135001', 'DL005678901', (SELECT id FROM vehicles WHERE plate_number = '深E50001' LIMIT 1),
       '{"type": "flatbed", "licensePlate": "深E50001", "capacity": 12000, "dimensions": {"length": 9.0, "width": 2.4, "height": 2.6}, "features": ["GPS", "固定装置"]}',
       'available', '{"rating": 4.4, "totalDeliveries": 78, "onTimeRate": 0.85, "customerSatisfaction": 0.83}'),
      ('${tenantId}', '赵司机', '13400134001', 'DL006789012', (SELECT id FROM vehicles WHERE plate_number = '成F60001' LIMIT 1),
       '{"type": "box_truck", "licensePlate": "成F60001", "capacity": 6000, "dimensions": {"length": 5.5, "width": 2.0, "height": 2.3}, "features": ["GPS"]}',
       'offline', '{"rating": 4.3, "totalDeliveries": 65, "onTimeRate": 0.82, "customerSatisfaction": 0.80}'),
      ('${tenantId}', '孙司机', '13300133001', 'DL007890123', (SELECT id FROM vehicles WHERE plate_number = '京A10002' LIMIT 1),
       '{"type": "van", "licensePlate": "京A10002", "capacity": 1500, "dimensions": {"length": 4.5, "width": 1.9, "height": 2.1}, "features": ["GPS"]}',
       'available', '{"rating": 4.8, "totalDeliveries": 145, "onTimeRate": 0.93, "customerSatisfaction": 0.91}'),
      ('${tenantId}', '周司机', '13200132001', 'DL008901234', (SELECT id FROM vehicles WHERE plate_number = '沪B20002' LIMIT 1),
       '{"type": "truck", "licensePlate": "沪B20002", "capacity": 8000, "dimensions": {"length": 6.5, "width": 2.3, "height": 2.6}, "features": ["尾板", "GPS"]}',
       'busy', '{"rating": 4.2, "totalDeliveries": 54, "onTimeRate": 0.79, "customerSatisfaction": 0.77}'),
      ('${tenantId}', '吴司机', '13100131001', 'DL009012345', (SELECT id FROM vehicles WHERE plate_number = '粤C30002' LIMIT 1),
       '{"type": "trailer", "licensePlate": "粤C30002", "capacity": 20000, "dimensions": {"length": 13, "width": 2.6, "height": 3.8}, "features": ["尾板", "GPS", "冷藏"]}',
       'available', '{"rating": 4.9, "totalDeliveries": 198, "onTimeRate": 0.97, "customerSatisfaction": 0.95}'),
      ('${tenantId}', '郑司机', '13000130001', 'DL010123456', (SELECT id FROM vehicles WHERE plate_number = '川D40002' LIMIT 1),
       '{"type": "refrigerated", "licensePlate": "川D40002", "capacity": 10000, "dimensions": {"length": 8.0, "width": 2.4, "height": 3.0}, "features": ["GPS", "温度监控"]}',
       'available', '{"rating": 4.5, "totalDeliveries": 98, "onTimeRate": 0.87, "customerSatisfaction": 0.85}')
      ON CONFLICT (tenant_id, phone) DO NOTHING;

      -- =============================================================================
      -- 4. 规则数据 (计费规则、司机薪酬规则)
      -- =============================================================================
      INSERT INTO rules (tenant_id, name, description, type, priority, conditions, actions, status) VALUES
      ('${tenantId}', '基础运费', '基础运费按距离计算，每公里5元', 'pricing', 100,
       '[{"fact": "distance", "operator": "greaterThan", "value": 0}]',
       '[{"type": "calculateBaseFee", "params": {"ratePerKm": 5}}]', 'active'),
      ('${tenantId}', '危险品附加费', '运输危险品时收取200元附加费', 'pricing', 150,
       '[{"fact": "isHazardous", "operator": "equal", "value": true}]',
       '[{"type": "addFee", "params": {"amount": 200}}]', 'active'),
      ('${tenantId}', '周末配送费', '周末配送收取150元附加费', 'pricing', 160,
       '[{"fact": "weekendDelivery", "operator": "equal", "value": true}]',
       '[{"type": "addFee", "params": {"amount": 150}}]', 'active'),
      ('${tenantId}', 'VIP客户折扣', 'VIP客户享受10%折扣', 'pricing', 200,
       '[{"fact": "customerLevel", "operator": "equal", "value": "vip"}]',
       '[{"type": "applyDiscount", "params": {"percentage": 10}}]', 'active'),
      ('${tenantId}', '高级客户提成', '高级客户订单司机提成35%', 'payroll', 310,
       '[{"fact": "customerLevel", "operator": "equal", "value": "premium"}]',
       '[{"type": "setDriverCommission", "params": {"percentage": 35}}]', 'active'),
      ('${tenantId}', '标准客户提成', '标准客户订单司机提成30%', 'payroll', 320,
       '[{"fact": "customerLevel", "operator": "equal", "value": "standard"}]',
       '[{"type": "setDriverCommission", "params": {"percentage": 30}}]', 'active')
      ON CONFLICT (tenant_id, name) DO NOTHING;
    `;
    
    await client.query(seedData);
    
    // 获取创建的客户和司机ID，用于创建运单
    const customers = await client.query('SELECT id, name FROM customers WHERE tenant_id = $1', [tenantId]);
    const drivers = await client.query('SELECT id, name FROM drivers WHERE tenant_id = $1', [tenantId]);
    
    if (customers.rows.length === 0 || drivers.rows.length === 0) {
      logger.warn('客户或司机数据未创建，跳过运单创建');
      return;
    }
    
    // =============================================================================
    // 5. 运单数据 (25个运单，覆盖所有状态)
    // =============================================================================
    const shipmentStatuses = [
      'created', 'confirmed', 'scheduled', 'pickup_in_progress', 
      'in_transit', 'delivered', 'pod_pending_review', 'completed', 
      'cancelled', 'exception'
    ];
    
    const shipmentData = [];
    const now = new Date();
    
    for (let i = 0; i < 25; i++) {
      const customer = customers.rows[i % customers.rows.length];
      const driver = i < 15 ? drivers.rows[i % drivers.rows.length] : null; // 前15个有司机，后10个没有
      const status = shipmentStatuses[i % shipmentStatuses.length];
      const shipmentNumber = `SH${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(i + 1).padStart(5, '0')}`;
      
      // 根据状态设置时间线
      const timeline: any = { created: new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000).toISOString() };
      if (status !== 'created') {
        timeline.confirmed = new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000 + 3600000).toISOString();
      }
      if (['scheduled', 'pickup_in_progress', 'in_transit', 'delivered', 'completed'].includes(status)) {
        timeline.assigned = new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000 + 7200000).toISOString();
      }
      if (['pickup_in_progress', 'in_transit', 'delivered', 'completed'].includes(status)) {
        timeline.picked_up = new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000 + 10800000).toISOString();
      }
      if (['in_transit', 'delivered', 'completed'].includes(status)) {
        timeline.in_transit = new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000 + 14400000).toISOString();
      }
      if (['delivered', 'completed'].includes(status)) {
        timeline.delivered = new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000 + 18000000).toISOString();
      }
      if (status === 'completed') {
        timeline.completed = new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000 + 21600000).toISOString();
      }
      
      shipmentData.push({
        tenant_id: tenantId,
        shipment_number: shipmentNumber,
        customer_id: customer.id,
        driver_id: driver?.id || null,
        pickup_address: JSON.stringify({
          addressLine1: `取货地址${i + 1}号`,
          city: '北京',
          province: '北京',
          postalCode: '100000',
          country: '中国'
        }),
        delivery_address: JSON.stringify({
          addressLine1: `送货地址${i + 1}号`,
          city: i % 2 === 0 ? '上海' : '广州',
          province: i % 2 === 0 ? '上海' : '广东',
          postalCode: i % 2 === 0 ? '200000' : '510000',
          country: '中国'
        }),
        cargo_info: JSON.stringify({
          weightKg: 100 + i * 10,
          volume: 1 + i * 0.1,
          items: [{ name: `货物${i + 1}`, quantity: i + 1 }]
        }),
        estimated_cost: 500 + i * 50,
        actual_cost: status === 'completed' ? 500 + i * 50 : null,
        status: status,
        timeline: JSON.stringify(timeline),
        created_at: new Date(now.getTime() - (25 - i) * 24 * 60 * 60 * 1000).toISOString()
      });
    }
    
    // 批量插入运单
    for (const shipment of shipmentData) {
      await client.query(`
        INSERT INTO shipments (
          tenant_id, shipment_number, customer_id, driver_id,
          pickup_address, delivery_address, cargo_info,
          estimated_cost, actual_cost, status, timeline, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (tenant_id, shipment_number) DO NOTHING
      `, [
        shipment.tenant_id,
        shipment.shipment_number,
        shipment.customer_id,
        shipment.driver_id,
        shipment.pickup_address,
        shipment.delivery_address,
        shipment.cargo_info,
        shipment.estimated_cost,
        shipment.actual_cost,
        shipment.status,
        shipment.timeline,
        shipment.created_at
      ]);
    }
    
    // =============================================================================
    // 6. 财务记录 (为已完成的运单创建应收款和应付款)
    // =============================================================================
    const completedShipments = await client.query(
      'SELECT id, customer_id, driver_id, actual_cost FROM shipments WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'completed']
    );
    
    for (const shipment of completedShipments.rows) {
      if (shipment.actual_cost) {
        // 应收款 (客户应该支付)
        await client.query(`
          INSERT INTO financial_records (
            tenant_id, type, reference_id, amount, currency, status, description
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (tenant_id, reference_id, type) DO NOTHING
        `, [
          tenantId,
          'receivable',
          shipment.id,
          shipment.actual_cost,
          'CAD',
          'pending',
          `运单 ${shipment.id} 应收款`
        ]);
        
        // 应付款 (司机应该得到，假设是30%)
        if (shipment.driver_id) {
          await client.query(`
            INSERT INTO financial_records (
              tenant_id, type, reference_id, amount, currency, status, description
            ) VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (tenant_id, reference_id, type) DO NOTHING
          `, [
            tenantId,
            'payable',
            shipment.id,
            shipment.actual_cost * 0.3,
            'CAD',
            'pending',
            `运单 ${shipment.id} 司机应付款`
          ]);
        }
      }
    }
    
    logger.info('种子数据填充完成！');
    logger.info(`- 客户: ${customers.rows.length} 个`);
    logger.info(`- 车辆: 15 辆`);
    logger.info(`- 司机: ${drivers.rows.length} 个`);
    logger.info(`- 运单: 25 个`);
    logger.info(`- 财务记录: ${completedShipments.rows.length * 2} 条`);
    
  } catch (error) {
    logger.error('种子数据填充失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('种子数据脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('种子数据脚本执行失败:', error);
      process.exit(1);
    });
}

export { seedDatabase };
