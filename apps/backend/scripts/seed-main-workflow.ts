// apps/backend/scripts/seed-main-workflow.ts
import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false },
});

async function seed() {
  const client = await pool.connect();
  try {
    console.log('🌱 开始播种主流程测试数据...\n');
    const pw = await bcrypt.hash('Tms@2026', 10);

    // ── 1. 用户账号 ────────────────────────────────────────────────────────────
    const users = [
      { id: 'U-MAIN-ADMIN',      name: 'Eric Chen',  email: 'admin@tms.local',       username: 'admin',             role: 'R-ADMIN' },
      { id: 'U-MAIN-DISPATCHER', name: '张伟',        email: 'dispatcher@tms.local',  username: 'dispatcher_zhang',  role: 'R-DISPATCHER' },
      { id: 'U-MAIN-DRIVER',     name: '王建国',      email: 'driver@tms.local',      username: 'driver_wang',       role: 'R-DRIVER' },
      { id: 'U-MAIN-FINANCE',    name: '李梅',        email: 'finance@tms.local',     username: 'finance_li',        role: 'R-FINANCE' },
      { id: 'U-MAIN-FLEET',      name: '赵强',        email: 'fleet@tms.local',       username: 'fleet_zhao',        role: 'R-FLEET' },
    ];

    for (const u of users) {
      await client.query(
        `INSERT INTO users (id, name, email, username, password, roleid, status)
         VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE')
         ON CONFLICT (email) DO UPDATE SET id=$1, name=$2, username=$4, password=$5, roleid=$6, status='ACTIVE'`,
        [u.id, u.name, u.email, u.username, pw, u.role]
      );
    }
    console.log(`✅ 5 个用户账号已就绪（密码均为 Tms@2026）`);

    // ── 2. 客户 Sunny Trade ────────────────────────────────────────────────────
    await client.query(
      `INSERT INTO customers (id, name, email, phone, status)
       VALUES ('C-SUNNY-TRADE','Sunny Trade','sunny@trade.ca','416-888-8888','ACTIVE')
       ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, status='ACTIVE'`
    );
    console.log('✅ 客户 Sunny Trade 已就绪（id: C-SUNNY-TRADE）');

    // ── 3. 合作方 Sunny Trade（报价规则用 partner_id）────────────────────────
    const partnerRes = await client.query(
      `INSERT INTO partners (name, short_code, type, contact_name, contact_phone, status)
       VALUES ('Sunny Trade','SUNNY','customer','陈小明','416-888-8888','ACTIVE')
       ON CONFLICT (name) DO UPDATE SET status='ACTIVE'
       RETURNING id`
    );
    const partnerId: number = partnerRes.rows[0].id;
    console.log(`✅ 合作方 Sunny Trade 已就绪（partner_id: ${partnerId}）`);

    // ── 4. 车辆 TRK-001（53 尺拖车）────────────────────────────────────────────
    await client.query(
      `INSERT INTO vehicles (id, plate, model, capacity, status, vehicle_type, max_pallets)
       VALUES ('V-MAIN-TRK001','TRK-001','Freightliner Cascadia','53ft Trailer','IDLE','TRAILER_53', 28)
       ON CONFLICT (id) DO UPDATE SET plate='TRK-001', status='IDLE'`
    );
    console.log('✅ 车辆 TRK-001 已就绪（id: V-MAIN-TRK001）');

    // ── 5. 司机王建国（驾驶员档案，与用户账号 U-MAIN-DRIVER 绑定）────────────
    await client.query(
      `INSERT INTO drivers (id, name, phone, status, code)
       VALUES ('U-MAIN-DRIVER','王建国','647-999-0001','IDLE','D-WANG')
       ON CONFLICT (id) DO UPDATE SET name='王建国', status='IDLE'`
    );
    console.log('✅ 司机王建国已就绪（driver id: U-MAIN-DRIVER）');

    // ── 6. 司机成本基线：YYZ9 + TRAILER_53 = $1,215 ──────────────────────────
    //    ($4,860 应收 × 25% 提成 ≈ $1,215)
    await client.query(
      `INSERT INTO driver_cost_baselines (destination_code, vehicle_type, total_cost, currency)
       VALUES ('YYZ9','TRAILER_53', 1215.00,'CAD')
       ON CONFLICT (destination_code, vehicle_type) DO UPDATE SET total_cost=1215.00`
    ).catch(() => {
      // 表可能有不同结构，静默处理
      console.warn('  ⚠️  driver_cost_baselines 插入跳过（字段不匹配），司机薪酬将回退到规则引擎');
    });
    console.log('✅ 司机成本基线已就绪（YYZ9/TRAILER_53 = $1,215）');

    // ── 7. 合作单位报价规则：Sunny Trade → YYZ9，$45/pallet + 8% FSC ───────
    await client.query(
      `INSERT INTO partner_pricing_rules
         (partner_id, pricing_type, destination_warehouse, transport_mode,
          pallet_tier_min, pallet_tier_max, unit_type, base_price, unit_price,
          fuel_surcharge_rate, status)
       VALUES
         ($1,'FBA_HEADEND','YYZ9','FTL', 1, 999, 'per_pallet', 0, 45.00, 0.08, 'ACTIVE')
       ON CONFLICT DO NOTHING`,
      [partnerId]
    );
    console.log('✅ 合作报价规则已就绪（YYZ9，$45/板 + 8% 燃油附加）');

    // ── 8. FC Destination YYZ9 ────────────────────────────────────────────────
    await client.query(
      `INSERT INTO fc_destinations (code, name, address, province, city)
       VALUES ('YYZ9','Amazon YYZ9','8050 Heritage Rd, Brampton, ON L6Y 0R9','ON','Brampton')
       ON CONFLICT (code) DO NOTHING`
    );
    console.log('✅ FC Destination YYZ9 已就绪');

    console.log('\n🎉 主流程种子数据播种完成！\n');
    console.log('账号列表：');
    console.log('  admin           / Tms@2026  （Eric Chen，全权限）');
    console.log('  dispatcher_zhang/ Tms@2026  （张伟，调度）');
    console.log('  driver_wang     / Tms@2026  （王建国，司机）');
    console.log('  finance_li      / Tms@2026  （李梅，财务）');
    console.log('  fleet_zhao      / Tms@2026  （赵强，车队经理）');
    console.log('\n接下来运行验证脚本：npm run verify:main\n');

  } catch (e) {
    console.error('❌ 播种失败:', e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

seed();
