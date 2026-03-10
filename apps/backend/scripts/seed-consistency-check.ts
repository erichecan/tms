/**
 * TMS 种子数据关联性校验
 * 确保：司机/车辆/客户在车队、运单、行程、财务、司机登录中一一对应
 * 编写时间: 2026-03-04
 * 运行: npm run check:seed 或 ts-node scripts/seed-consistency-check.ts
 * 环境变量: CHECK_SCOPE=seed（默认）仅校验种子数据；CHECK_SCOPE=all 校验全表
 */

import { pool } from '../src/db-postgres';

const CHECK_SCOPE = process.env.CHECK_SCOPE || 'seed';
const SEED_TRIP_IDS = ['T-1001', 'T-1002'];
const SEED_WAYBILL_IDS = ['WB-001', 'WB-002', 'WB-003', 'WB-004'];

interface Violation {
  rule: string;
  detail: string;
}

async function runCheck(): Promise<Violation[]> {
  const violations: Violation[] = [];
  const client = await pool.connect();
  const tripFilter = CHECK_SCOPE === 'seed' ? ` AND t.id = ANY($1::varchar[])` : '';
  const waybillFilter = CHECK_SCOPE === 'seed' ? ` AND w.id = ANY($1::varchar[])` : '';
  const tripParams = CHECK_SCOPE === 'seed' ? [SEED_TRIP_IDS] : [];
  const waybillParams = CHECK_SCOPE === 'seed' ? [SEED_WAYBILL_IDS] : [];

  try {
    // 1. trips.driver_id 必须存在于 drivers（seed 时仅检查 T-1001, T-1002）
    const tripDriverOrphan = await client.query(
      `SELECT t.id AS trip_id, t.driver_id
       FROM trips t
       LEFT JOIN drivers d ON t.driver_id = d.id
       WHERE d.id IS NULL AND t.driver_id IS NOT NULL${tripFilter}`,
      tripParams.length ? tripParams : undefined
    );
    for (const row of tripDriverOrphan.rows) {
      violations.push({ rule: 'trips.driver_id ∈ drivers.id', detail: `trip ${row.trip_id} driver_id=${row.driver_id} 在 drivers 中不存在` });
    }

    // 2. trips.vehicle_id 必须存在于 vehicles
    const tripVehicleOrphan = await client.query(
      `SELECT t.id AS trip_id, t.vehicle_id
       FROM trips t
       LEFT JOIN vehicles v ON t.vehicle_id = v.id
       WHERE v.id IS NULL AND t.vehicle_id IS NOT NULL${tripFilter}`,
      tripParams.length ? tripParams : undefined
    );
    for (const row of tripVehicleOrphan.rows) {
      violations.push({ rule: 'trips.vehicle_id ∈ vehicles.id', detail: `trip ${row.trip_id} vehicle_id=${row.vehicle_id} 在 vehicles 中不存在` });
    }

    // 3. waybills.customer_id 必须存在于 customers（seed 时仅检查 WB-001..WB-004）
    const wbCustomerOrphan = await client.query(
      `SELECT w.id AS waybill_id, w.customer_id
       FROM waybills w
       LEFT JOIN customers c ON w.customer_id = c.id
       WHERE c.id IS NULL AND w.customer_id IS NOT NULL${waybillFilter}`,
      waybillParams.length ? waybillParams : undefined
    );
    for (const row of wbCustomerOrphan.rows) {
      violations.push({ rule: 'waybills.customer_id ∈ customers.id', detail: `waybill ${row.waybill_id} customer_id=${row.customer_id} 在 customers 中不存在` });
    }

    // 4. waybills.trip_id 必须存在于 trips 或为 NULL
    const wbTripOrphan = await client.query(
      `SELECT w.id AS waybill_id, w.trip_id
       FROM waybills w
       LEFT JOIN trips t ON w.trip_id = t.id
       WHERE t.id IS NULL AND w.trip_id IS NOT NULL${waybillFilter}`,
      waybillParams.length ? waybillParams : undefined
    );
    for (const row of wbTripOrphan.rows) {
      violations.push({ rule: 'waybills.trip_id ∈ trips.id', detail: `waybill ${row.waybill_id} trip_id=${row.trip_id} 在 trips 中不存在` });
    }

    // 5. 司机角色用户 id 必须存在于 drivers（保证移动端 waybills?driver_id=user.id 一致）
    const driverUserOrphan = await client.query(`
      SELECT u.id AS user_id, u.email
      FROM users u
      LEFT JOIN drivers d ON u.id = d.id
      WHERE (u.roleid = 'R-DRIVER' OR u.roleid = 'DRIVER') AND d.id IS NULL
    `);
    for (const row of driverUserOrphan.rows) {
      violations.push({ rule: 'R-DRIVER 用户 id ∈ drivers.id', detail: `user ${row.user_id} (${row.email}) 为司机角色但在 drivers 中无对应记录` });
    }

    // 6. 应付记录 reference_id 必须存在于 drivers
    const payableOrphan = await client.query(`
      SELECT f.id AS record_id, f.reference_id
      FROM financial_records f
      LEFT JOIN drivers d ON f.reference_id = d.id
      WHERE f.type = 'payable' AND d.id IS NULL AND f.reference_id IS NOT NULL
    `);
    for (const row of payableOrphan.rows) {
      violations.push({ rule: 'payable.reference_id ∈ drivers.id', detail: `financial_record ${row.record_id} reference_id=${row.reference_id} 在 drivers 中不存在` });
    }

    // 7. 应收记录 reference_id 必须存在于 customers
    const receivableOrphan = await client.query(`
      SELECT f.id AS record_id, f.reference_id
      FROM financial_records f
      LEFT JOIN customers c ON f.reference_id = c.id
      WHERE f.type = 'receivable' AND c.id IS NULL AND f.reference_id IS NOT NULL
    `);
    for (const row of receivableOrphan.rows) {
      violations.push({ rule: 'receivable.reference_id ∈ customers.id', detail: `financial_record ${row.record_id} reference_id=${row.reference_id} 在 customers 中不存在` });
    }

    return violations;
  } finally {
    client.release();
  }
}

async function main() {
  console.log('TMS 种子数据关联性校验（车队 / 运单 / 行程 / 财务 / 司机登录 一致）');
  console.log(`作用域: ${CHECK_SCOPE === 'seed' ? '仅种子数据 (WB-001..WB-004, T-1001/T-1002 等)' : '全表'}\n`);
  try {
    const violations = await runCheck();
    if (violations.length === 0) {
      console.log('✅ 全部通过：司机、车辆、客户在各模块中 ID 一致。');
      process.exit(0);
    }
    console.log(`❌ 发现 ${violations.length} 条违反：\n`);
    violations.forEach((v, i) => {
      console.log(`  ${i + 1}. [${v.rule}] ${v.detail}`);
    });
    console.log('\n请对照 docs/SEED_DATA_CONSISTENCY.md 修正种子数据或迁移。');
    process.exit(1);
  } catch (e) {
    console.error('校验执行失败:', e);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
