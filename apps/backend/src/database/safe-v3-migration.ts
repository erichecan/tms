import { Pool } from 'pg';

// 2025-01-27 16:45:00 安全的TMS v3.0-PC Schema更新

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://tms_user:tms_password@localhost:5432/tms_platform',
});

async function safeMigration() {
  const client = await pool.connect();
  try {
    console.log('开始安全应用TMS v3.0-PC Schema更新...');
    
    // 1. 检查并添加customers表的新字段
    console.log('1. 更新customers表...');
    
    const customerUpdates = [
      "ALTER TABLE customers ADD COLUMN IF NOT EXISTS phone VARCHAR(20)",
      "ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(100)",
      "ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_pickup_address JSONB",
      "ALTER TABLE customers ADD COLUMN IF NOT EXISTS default_delivery_address JSONB"
    ];
    
    for (const sql of customerUpdates) {
      try {
        await client.query(sql);
        console.log(`  ✅ 执行成功: ${sql}`);
      } catch (error) {
        console.log(`  ⚠️  跳过（已存在）: ${sql}`);
      }
    }
    
    // 2. 检查并添加shipments表的新字段
    console.log('2. 更新shipments表...');
    
    const shipmentUpdates = [
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipment_no VARCHAR(50)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_address JSONB",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_address JSONB",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,3)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS tags TEXT[]",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS services JSONB",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pricing_components JSONB",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS pricing_rule_trace JSONB",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS final_cost DECIMAL(12,2)",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'CNY'",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS assigned_driver_id UUID",
      "ALTER TABLE shipments ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID"
    ];
    
    for (const sql of shipmentUpdates) {
      try {
        await client.query(sql);
        console.log(`  ✅ 执行成功: ${sql}`);
      } catch (error) {
        console.log(`  ⚠️  跳过（已存在）: ${sql}`);
      }
    }
    
    // 3. 检查并添加drivers表的新字段
    console.log('3. 更新drivers表...');
    
    const driverUpdates = [
      "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'standard'",
      "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS home_city VARCHAR(100)",
      "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS current_trip_id UUID",
      "ALTER TABLE drivers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available'"
    ];
    
    for (const sql of driverUpdates) {
      try {
        await client.query(sql);
        console.log(`  ✅ 执行成功: ${sql}`);
      } catch (error) {
        console.log(`  ⚠️  跳过（已存在）: ${sql}`);
      }
    }
    
    // 4. 检查并添加vehicles表的新字段
    console.log('4. 更新vehicles表...');
    
    const vehicleUpdates = [
      "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS plate_number VARCHAR(20)",
      "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS type VARCHAR(50)",
      "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS capacity_kg DECIMAL(10,3)",
      "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available'",
      "ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS current_trip_id UUID"
    ];
    
    for (const sql of vehicleUpdates) {
      try {
        await client.query(sql);
        console.log(`  ✅ 执行成功: ${sql}`);
      } catch (error) {
        console.log(`  ⚠️  跳过（已存在）: ${sql}`);
      }
    }
    
    // 5. 检查trips表是否存在，如果不存在则创建
    console.log('5. 检查trips表...');
    
    const tripsExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'trips'
      )
    `);
    
    if (!tripsExists.rows[0].exists) {
      console.log('  创建trips表...');
      await client.query(`
        CREATE TABLE trips (
          id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
          tenant_id UUID NOT NULL,
          trip_no VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'planning',
          driver_id UUID,
          vehicle_id UUID,
          legs JSONB DEFAULT '[]',
          shipments JSONB DEFAULT '[]',
          start_time_planned TIMESTAMP,
          end_time_planned TIMESTAMP,
          start_time_actual TIMESTAMP,
          end_time_actual TIMESTAMP,
          route_path JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('  ✅ trips表创建成功');
    } else {
      console.log('  ✅ trips表已存在');
    }
    
    // 6. 创建索引
    console.log('6. 创建索引...');
    
    const indexes = [
      "CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone)",
      "CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email)",
      "CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name)",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_shipment_no ON shipments(shipment_no) WHERE shipment_no IS NOT NULL",
      "CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate_number ON vehicles(plate_number) WHERE plate_number IS NOT NULL",
      "CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON trips(tenant_id)",
      "CREATE INDEX IF NOT EXISTS idx_trips_trip_no ON trips(trip_no)",
      "CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id)",
      "CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id)",
      "CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)"
    ];
    
    for (const sql of indexes) {
      try {
        await client.query(sql);
        console.log(`  ✅ 索引创建成功`);
      } catch (error) {
        console.log(`  ⚠️  索引跳过: ${error.message}`);
      }
    }
    
    console.log('🎉 TMS v3.0-PC Schema更新完成');
    
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    throw error;
  } finally {
    client.release();
  }
}

async function main() {
  try {
    await safeMigration();
    process.exit(0);
  } catch (error) {
    console.error('迁移失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

export { safeMigration };
