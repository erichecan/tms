// 智能清理 Seed 数据脚本
// 创建时间: 2025-12-02T20:50:00Z
// 用途：清理初期 seed 数据，保留用户创建的数据
// 策略：基于创建时间和命名模式识别 seed 数据

import { Pool } from 'pg';
import { logger } from '../apps/backend/src/utils/logger';

// 2025-12-02T20:50:00Z 添加 DATABASE_URL 验证
if (!process.env.DATABASE_URL) {
  logger.error('❌ 错误: DATABASE_URL 环境变量未设置！');
  logger.error('⚠️  请设置 DATABASE_URL 环境变量');
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

// Seed 数据特征模式
const SEED_PATTERNS = {
  // 客户名称模式
  customerNames: [
    '北京物流公司',
    '上海运输集团',
    '广州贸易公司',
    '深圳电商物流',
    '成都快运公司'
  ],
  // 车辆车牌模式
  vehiclePlates: [
    '京A10001', '京A10002', '京A10003',
    '沪B20001', '沪B20002', '沪B20003',
    '粤C30001', '粤C30002', '粤C30003',
    '川D40001', '川D40002',
    '深E50001', '深E50002',
    '成F60001', '成F60002'
  ],
  // 司机名称模式
  driverNames: [
    '王司机', '张司机', '李司机', '刘司机', '陈司机',
    '赵司机', '孙司机', '周司机', '吴司机', '郑司机'
  ],
  // 规则名称模式
  ruleNames: [
    '基础运费',
    '危险品附加费',
    '周末配送费',
    'VIP客户折扣',
    '高级客户提成',
    '标准客户提成'
  ],
  // 运单编号模式（SH{年份}{月份}{序号}）
  shipmentNumberPattern: /^SH\d{6}\d{5}$/
};

// 创建时间阈值：2025-12-01 之前的数据视为 seed 数据
const SEED_TIME_THRESHOLD = '2025-12-01 00:00:00';

async function cleanSeedDataOnly() {
  const client = await pool.connect();
  
  try {
    logger.info('开始清理 Seed 数据（保留用户创建的数据）...');
    logger.info(`使用时间阈值: ${SEED_TIME_THRESHOLD}`);
    
    await client.query('BEGIN');
    
    let totalDeleted = 0;
    
    // =============================================================================
    // 1. 清理财务记录（关联到 seed 运单的）
    // =============================================================================
    logger.info('清理财务记录...');
    const financialResult = await client.query(`
      DELETE FROM financial_records fr
      WHERE EXISTS (
        SELECT 1 FROM shipments s
        WHERE s.id = fr.reference_id
        AND (
          s.created_at < $1::timestamp
          OR s.shipment_number ~ $2
        )
      )
      OR (
        fr.created_at < $1::timestamp
        AND fr.description LIKE '%运单%'
      )
    `, [SEED_TIME_THRESHOLD, '^SH\\d{11}$']);
    totalDeleted += financialResult.rowCount || 0;
    logger.info(`  ✓ 删除财务记录: ${financialResult.rowCount || 0} 条`);
    
    // =============================================================================
    // 2. 清理时间线事件（关联到 seed 运单或行程的）
    // =============================================================================
    logger.info('清理时间线事件...');
    const timelineCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'timeline_events'
      ) as table_exists
    `);
    
    if (timelineCheck.rows[0]?.table_exists) {
      // 检查表结构，确定时间列名
      const columnsCheck = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'timeline_events' 
        AND column_name IN ('created_at', 'timestamp')
      `);
      
      const timeColumn = columnsCheck.rows.find((r: any) => r.column_name === 'created_at') 
        ? 'created_at' 
        : columnsCheck.rows.find((r: any) => r.column_name === 'timestamp')
        ? 'timestamp'
        : null;
      
      if (timeColumn) {
        const timelineResult = await client.query(`
          DELETE FROM timeline_events te
          WHERE EXISTS (
            SELECT 1 FROM shipments s
            WHERE s.id = te.shipment_id
            AND (
              s.created_at < $1::timestamp
              OR s.shipment_number ~ $2
            )
          )
          OR EXISTS (
            SELECT 1 FROM trips t
            WHERE t.id = te.trip_id
            AND (
              t.created_at < $1::timestamp
              OR t.trip_no ~ '^TRIP\\d{9}$'
            )
          )
          ${timeColumn === 'created_at' ? 'OR te.created_at < $1::timestamp' : 'OR te.timestamp < $1::timestamp'}
        `, [SEED_TIME_THRESHOLD, '^SH\\d{11}$']);
        totalDeleted += timelineResult.rowCount || 0;
        logger.info(`  ✓ 删除时间线事件: ${timelineResult.rowCount || 0} 条`);
      } else {
        // 如果没有时间列，只根据关联的运单和行程删除
        const timelineResult = await client.query(`
          DELETE FROM timeline_events te
          WHERE EXISTS (
            SELECT 1 FROM shipments s
            WHERE s.id = te.shipment_id
            AND (
              s.created_at < $1::timestamp
              OR s.shipment_number ~ $2
            )
          )
          OR EXISTS (
            SELECT 1 FROM trips t
            WHERE t.id = te.trip_id
            AND (
              t.created_at < $1::timestamp
              OR t.trip_no ~ '^TRIP\\d{9}$'
            )
          )
        `, [SEED_TIME_THRESHOLD, '^SH\\d{11}$']);
        totalDeleted += timelineResult.rowCount || 0;
        logger.info(`  ✓ 删除时间线事件: ${timelineResult.rowCount || 0} 条`);
      }
    } else {
      logger.info(`  ✓ 时间线事件表不存在，跳过`);
    }
    
    // =============================================================================
    // 3. 清理POD记录（关联到 seed 运单的）
    // =============================================================================
    logger.info('清理POD记录...');
    const podCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'proof_of_delivery'
      ) as table_exists
    `);
    
    if (podCheck.rows[0]?.table_exists) {
      const podResult = await client.query(`
        DELETE FROM proof_of_delivery pod
        WHERE EXISTS (
          SELECT 1 FROM shipments s
          WHERE s.id = pod.shipment_id
          AND (
            s.created_at < $1::timestamp
            OR s.shipment_number ~ $2
          )
        )
      `, [SEED_TIME_THRESHOLD, '^SH\\d{11}$']);
      totalDeleted += podResult.rowCount || 0;
      logger.info(`  ✓ 删除POD记录: ${podResult.rowCount || 0} 条`);
    } else {
      logger.info(`  ✓ POD记录表不存在，跳过`);
    }
    
    // =============================================================================
    // 4. 清理运单（seed 创建的）
    // =============================================================================
    logger.info('清理运单...');
    const shipmentResult = await client.query(`
      DELETE FROM shipments
      WHERE (
        created_at < $1::timestamp
        OR shipment_number ~ $2
        OR pickup_address::text LIKE '%取货地址%号%'
        OR delivery_address::text LIKE '%送货地址%号%'
      )
    `, [SEED_TIME_THRESHOLD, '^SH\\d{11}$']);
    totalDeleted += shipmentResult.rowCount || 0;
    logger.info(`  ✓ 删除运单: ${shipmentResult.rowCount || 0} 条`);
    
    // =============================================================================
    // 5. 清理行程（seed 创建的）
    // =============================================================================
    logger.info('清理行程...');
    const tripResult = await client.query(`
      DELETE FROM trips
      WHERE (
        created_at < $1::timestamp
        OR trip_no ~ '^TRIP\\d{9}$'
      )
    `, [SEED_TIME_THRESHOLD]);
    totalDeleted += tripResult.rowCount || 0;
    logger.info(`  ✓ 删除行程: ${tripResult.rowCount || 0} 条`);
    
    // =============================================================================
    // 6. 清理司机（seed 创建的，先解除车辆关联）
    // =============================================================================
    logger.info('清理司机...');
    // 先解除车辆关联
    await client.query(`
      UPDATE drivers
      SET vehicle_id = NULL
      WHERE (
        created_at < $1::timestamp
        OR name = ANY($2::text[])
      )
    `, [SEED_TIME_THRESHOLD, SEED_PATTERNS.driverNames]);
    
    // 然后删除司机
    const driverResult = await client.query(`
      DELETE FROM drivers
      WHERE (
        created_at < $1::timestamp
        OR name = ANY($2::text[])
      )
    `, [SEED_TIME_THRESHOLD, SEED_PATTERNS.driverNames]);
    totalDeleted += driverResult.rowCount || 0;
    logger.info(`  ✓ 删除司机: ${driverResult.rowCount || 0} 条`);
    
    // =============================================================================
    // 7. 清理车辆（seed 创建的）
    // =============================================================================
    logger.info('清理车辆...');
    const vehicleResult = await client.query(`
      DELETE FROM vehicles
      WHERE (
        created_at < $1::timestamp
        OR plate_number = ANY($2::text[])
      )
    `, [SEED_TIME_THRESHOLD, SEED_PATTERNS.vehiclePlates]);
    totalDeleted += vehicleResult.rowCount || 0;
    logger.info(`  ✓ 删除车辆: ${vehicleResult.rowCount || 0} 辆`);
    
    // =============================================================================
    // 8. 清理客户（seed 创建的）
    // =============================================================================
    logger.info('清理客户...');
    const customerResult = await client.query(`
      DELETE FROM customers
      WHERE (
        created_at < $1::timestamp
        OR name = ANY($2::text[])
      )
    `, [SEED_TIME_THRESHOLD, SEED_PATTERNS.customerNames]);
    totalDeleted += customerResult.rowCount || 0;
    logger.info(`  ✓ 删除客户: ${customerResult.rowCount || 0} 个`);
    
    // =============================================================================
    // 9. 清理规则（seed 创建的）
    // =============================================================================
    logger.info('清理规则...');
    const ruleResult = await client.query(`
      DELETE FROM rules
      WHERE (
        created_at < $1::timestamp
        OR name = ANY($2::text[])
      )
    `, [SEED_TIME_THRESHOLD, SEED_PATTERNS.ruleNames]);
    totalDeleted += ruleResult.rowCount || 0;
    logger.info(`  ✓ 删除规则: ${ruleResult.rowCount || 0} 条`);
    
    await client.query('COMMIT');
    
    logger.info('✅ Seed 数据清理完成！');
    logger.info(`总计删除记录: ${totalDeleted} 条`);
    
    // 验证清理结果
    logger.info('\n验证清理结果...');
    const remainingCounts = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM customers) as customers,
        (SELECT COUNT(*) FROM vehicles) as vehicles,
        (SELECT COUNT(*) FROM drivers) as drivers,
        (SELECT COUNT(*) FROM shipments) as shipments,
        (SELECT COUNT(*) FROM trips) as trips,
        (SELECT COUNT(*) FROM rules) as rules,
        (SELECT COUNT(*) FROM financial_records) as financial_records
    `);
    
    const counts = remainingCounts.rows[0];
    logger.info(`剩余数据统计:`);
    logger.info(`  - 客户: ${counts.customers} 个`);
    logger.info(`  - 车辆: ${counts.vehicles} 辆`);
    logger.info(`  - 司机: ${counts.drivers} 个`);
    logger.info(`  - 运单: ${counts.shipments} 条`);
    logger.info(`  - 行程: ${counts.trips} 条`);
    logger.info(`  - 规则: ${counts.rules} 条`);
    logger.info(`  - 财务记录: ${counts.financial_records} 条`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('❌ Seed 数据清理失败:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  cleanSeedDataOnly()
    .then(() => {
      logger.info('Seed 数据清理脚本执行完成');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed 数据清理脚本执行失败:', error);
      process.exit(1);
    });
}

export { cleanSeedDataOnly };

