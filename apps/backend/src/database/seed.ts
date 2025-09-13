// 数据库种子数据脚本
// 创建时间: 2025-01-27 15:30:45

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
    
    // 插入更多示例数据
    const seedData = `
      -- 插入更多客户
      INSERT INTO customers (tenant_id, name, level, contact_info, billing_info) VALUES
      ('00000000-0000-0000-0000-000000000001', '北京物流公司', 'premium', 
       '{"email": "beijing@logistics.com", "phone": "010-12345678", "address": {"street": "朝阳区物流园区1号", "city": "北京", "state": "北京", "postalCode": "100000", "country": "中国"}, "contactPerson": "王总"}',
       '{"companyName": "北京物流有限公司", "taxId": "91110000000000001X", "billingAddress": {"street": "朝阳区物流园区1号", "city": "北京", "state": "北京", "postalCode": "100000", "country": "中国"}, "paymentTerms": "月结15天"}'),
      ('00000000-0000-0000-0000-000000000001', '上海运输集团', 'standard', 
       '{"email": "shanghai@transport.com", "phone": "021-87654321", "address": {"street": "浦东新区运输路88号", "city": "上海", "state": "上海", "postalCode": "200000", "country": "中国"}, "contactPerson": "李经理"}',
       '{"companyName": "上海运输集团有限公司", "taxId": "91310000000000002X", "billingAddress": {"street": "浦东新区运输路88号", "city": "上海", "state": "上海", "postalCode": "200000", "country": "中国"}, "paymentTerms": "月结30天"}');
      
      -- 插入更多司机
      INSERT INTO drivers (tenant_id, name, phone, license_number, vehicle_info, status, performance) VALUES
      ('00000000-0000-0000-0000-000000000001', '王司机', '13800138001', 'B987654321', 
       '{"type": "van", "licensePlate": "京B67890", "capacity": 3000, "dimensions": {"length": 4.2, "width": 1.8, "height": 2.0}, "features": ["GPS"]}',
       'active', '{"rating": 4.5, "totalDeliveries": 89, "onTimeRate": 0.88, "customerSatisfaction": 0.85}'),
      ('00000000-0000-0000-0000-000000000001', '张司机', '13900139001', 'C111111111', 
       '{"type": "trailer", "licensePlate": "沪A99999", "capacity": 20000, "dimensions": {"length": 12, "width": 2.5, "height": 3.5}, "features": ["尾板", "GPS", "冷藏"]}',
       'active', '{"rating": 4.9, "totalDeliveries": 203, "onTimeRate": 0.96, "customerSatisfaction": 0.94}');
      
      -- 插入更多规则
      INSERT INTO rules (tenant_id, name, description, type, priority, conditions, actions, status) VALUES
      ('00000000-0000-0000-0000-000000000001', '危险品附加费', '运输危险品时收取200元附加费', 'pricing', 150,
       '[{"fact": "isHazardous", "operator": "equal", "value": true}]',
       '[{"type": "addFee", "params": {"amount": 200}}]', 'active'),
      ('00000000-0000-0000-0000-000000000001', '周末配送费', '周末配送收取150元附加费', 'pricing', 160,
       '[{"fact": "weekendDelivery", "operator": "equal", "value": true}]',
       '[{"type": "addFee", "params": {"amount": 150}}]', 'active'),
      ('00000000-0000-0000-0000-000000000001', '高级客户提成', '高级客户订单司机提成35%', 'payroll', 310,
       '[{"fact": "customerLevel", "operator": "equal", "value": "premium"}]',
       '[{"type": "setDriverCommission", "params": {"percentage": 35}}]', 'active');
    `;
    
    await client.query(seedData);
    
    logger.info('种子数据填充完成！');
    
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
