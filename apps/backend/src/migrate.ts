
// migrate.ts is kept for backward compatibility.
// New migrations should be added as numbered SQL files in ../migrations/.
// Run `npm run migrate` (migrationRunner.ts) for the proper migration framework.
import { runMigrations } from './migrationRunner';

const migrate = async () => {
  await runMigrations();
};

const _legacyMigrate = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // --- Create Tables ---

    await client.query(`
      CREATE TABLE IF NOT EXISTS drivers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        status VARCHAR(20) DEFAULT 'IDLE',
        avatar_url TEXT
      );

      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(100),
        roleId VARCHAR(50),
        status VARCHAR(20) DEFAULT 'ACTIVE',
        lastLogin TIMESTAMP
      );

      -- Migration: Add password_hash and username columns (idempotent)
      DO $$ 
      BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='password_hash') THEN
              ALTER TABLE users ADD COLUMN password_hash VARCHAR(100);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='username') THEN
              ALTER TABLE users ADD COLUMN username VARCHAR(100);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
              ALTER TABLE users ADD COLUMN created_at TIMESTAMP DEFAULT NOW();
          END IF;
          -- Fix: Ensure 'name' column exists (migration failure fix)
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
              ALTER TABLE users ADD COLUMN name VARCHAR(100);
              -- Try to backfill if first/last exists
              IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
                  UPDATE users SET name = TRIM(BOTH ' ' FROM COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''));
              END IF;
          END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS customers (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100),
        phone VARCHAR(20),
        address TEXT,
        businessType VARCHAR(50),
        taxId VARCHAR(50),
        creditLimit NUMERIC DEFAULT 0,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        details JSONB
      );
    `);

    // Idempotent column addition for customers.details
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='details') THEN
          ALTER TABLE customers ADD COLUMN details JSONB;
        END IF;
      END $$;
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id VARCHAR(50) PRIMARY KEY,
        plate VARCHAR(20) NOT NULL,
        model VARCHAR(50),
        capacity VARCHAR(50),
        status VARCHAR(20) DEFAULT 'IDLE'
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trips (
        id VARCHAR(50) PRIMARY KEY,
        driver_id VARCHAR(50),
        vehicle_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'PLANNED',
        start_time_est TIMESTAMP,
        end_time_est TIMESTAMP,
        FOREIGN KEY (driver_id) REFERENCES drivers(id),
        FOREIGN KEY (vehicle_id) REFERENCES vehicles(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS waybills (
        id VARCHAR(50) PRIMARY KEY,
        waybill_no VARCHAR(50) NOT NULL,
        customer_id VARCHAR(50),
        origin VARCHAR(100),
        destination VARCHAR(100),
        cargo_desc TEXT,
        status VARCHAR(20) DEFAULT 'NEW',
        trip_id VARCHAR(50),
        price_estimated NUMERIC,
        created_at TIMESTAMP DEFAULT NOW(),
        fulfillment_center VARCHAR(100),
        delivery_date DATE,
        reference_code VARCHAR(100),
        pallet_count INTEGER,
        item_count INTEGER,
        pro_number VARCHAR(100),
        po_list TEXT,
        total_weight NUMERIC,
        time_in VARCHAR(20),
        time_out VARCHAR(20),
        distance NUMERIC,
        signature_url TEXT,
        signed_at TIMESTAMP,
        signed_by VARCHAR(100),
        details JSONB,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );

      -- Idempotent column additions for existing installations
      DO $$ 
      BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='item_count') THEN
              ALTER TABLE waybills ADD COLUMN item_count INTEGER;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='pro_number') THEN
              ALTER TABLE waybills ADD COLUMN pro_number VARCHAR(100);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='po_list') THEN
              ALTER TABLE waybills ADD COLUMN po_list TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='signature_url') THEN
              ALTER TABLE waybills ADD COLUMN signature_url TEXT;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='signed_at') THEN
              ALTER TABLE waybills ADD COLUMN signed_at TIMESTAMP;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='signed_by') THEN
              ALTER TABLE waybills ADD COLUMN signed_by VARCHAR(100);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='details') THEN
              ALTER TABLE waybills ADD COLUMN details JSONB;
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='billing_type') THEN
              ALTER TABLE waybills ADD COLUMN billing_type VARCHAR(20) DEFAULT 'DISTANCE';
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='time_in') THEN
              ALTER TABLE waybills ADD COLUMN time_in VARCHAR(20);
          END IF;
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='waybills' AND column_name='time_out') THEN
              ALTER TABLE waybills ADD COLUMN time_out VARCHAR(20);
          END IF;
      END $$;

      CREATE TABLE IF NOT EXISTS expenses (
        id VARCHAR(50) PRIMARY KEY,
        category VARCHAR(50),
        amount NUMERIC,
        trip_id VARCHAR(50),
        date TIMESTAMP,
        status VARCHAR(20) DEFAULT 'PENDING'
      );

      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        module VARCHAR(50) NOT NULL,
        description TEXT
      );

      CREATE TABLE IF NOT EXISTS role_permissions (
        roleid VARCHAR(50) NOT NULL,
        permissionid VARCHAR(50) NOT NULL,
        PRIMARY KEY (roleid, permissionid),
        FOREIGN KEY (roleid) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permissionid) REFERENCES permissions(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS rules (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        type VARCHAR(20) NOT NULL,
        priority INTEGER DEFAULT 0,
        conditions JSONB,
        actions JSONB,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(50) PRIMARY KEY,
        trip_id VARCHAR(50),
        sender VARCHAR(20),
        text TEXT,
        timestamp TIMESTAMP,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS trip_events (
        id SERIAL PRIMARY KEY,
        trip_id VARCHAR(50),
        status VARCHAR(20),
        time TIMESTAMP,
        description TEXT,
        FOREIGN KEY (trip_id) REFERENCES trips(id)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS statements (
        id VARCHAR(50) PRIMARY KEY,
        tenant_id VARCHAR(50), 
        type VARCHAR(20),
        reference_id VARCHAR(50),
        period_start DATE,
        period_end DATE,
        total_amount NUMERIC,
        status VARCHAR(20) DEFAULT 'DRAFT',
        generated_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`
      DROP TABLE IF EXISTS notifications;
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        type VARCHAR(20) DEFAULT 'INFO',
        title VARCHAR(100) NOT NULL,
        content TEXT,
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        data JSONB
        -- FOREIGN KEY (user_id) REFERENCES users(id) -- Optional: enforce generic user id
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_records (
      id VARCHAR(50) PRIMARY KEY,
      tenant_id VARCHAR(50),
      shipment_id VARCHAR(50),
      type VARCHAR(20),
      reference_id VARCHAR(50),
      amount NUMERIC,
      currency VARCHAR(3) DEFAULT 'CNY',
      status VARCHAR(20) DEFAULT 'PENDING',
      statement_id VARCHAR(50),
      due_date DATE,
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      FOREIGN KEY(statement_id) REFERENCES statements(id)
    );
    `);

    // --- Seed Data (Idempotent) ---

    // Roles
    await client.query(`
      INSERT INTO roles(id, name, description) VALUES
      ('R-ADMIN', 'Administrator', 'Full system access'),
      ('R-DISPATCHER', 'Dispatcher', 'Manage trips and waybills'),
      ('R-DRIVER', 'Driver', 'Mobile portal access')
      ON CONFLICT(id) DO NOTHING;
    `);

    // Permissions
    await client.query(`
      INSERT INTO permissions(id, name, module, description) VALUES
      ('P-WAYBILL-VIEW', 'View Waybills', 'Waybills', 'View waybill list and details'),
      ('P-WAYBILL-CREATE', 'Create Waybills', 'Waybills', 'Create new waybills'),
      ('P-WAYBILL-EDIT', 'Edit Waybills', 'Waybills', 'Edit existing waybills'),
      ('P-WAYBILL-DELETE', 'Delete Waybills', 'Waybills', 'Delete waybills'),
      ('P-FLEET-VIEW', 'View Fleet', 'Fleet', 'View fleet and expenses'),
      ('P-FLEET-MANAGE', 'Manage Fleet', 'Fleet', 'Manage vehicles and drivers'),
      ('P-CUSTOMER-VIEW', 'View Customers', 'Customers', 'View customer list'),
      ('P-CUSTOMER-MANAGE', 'Manage Customers', 'Customers', 'Create and edit customers'),
      ('P-FINANCE-VIEW', 'View Finance', 'Finance', 'View financial reports'),
      ('P-FINANCE-MANAGE', 'Manage Finance', 'Finance', 'Manage receivables and payables'),
      ('P-USER-VIEW', 'View Users', 'Users', 'View user list'),
      ('P-USER-MANAGE', 'Manage Users', 'Users', 'Create and edit users'),
      ('P-ROLE-MANAGE', 'Manage Roles', 'Roles', 'Create and edit roles and permissions'),
      -- 2026-03-13 PRD Pricing: 报价查看/管理/快速报价权限
      ('P-PRICING-VIEW', 'View Pricing', 'Pricing', 'View pricing matrices, allins, addons, FC, driver costs'),
      ('P-PRICING-MANAGE', 'Manage Pricing', 'Pricing', 'Create, edit, delete/archive all pricing data'),
      ('P-QUOTE-CALC', 'Use Quote Calculator', 'Pricing', 'Use quick quote API')
      ON CONFLICT(id) DO NOTHING;
    `);

    // Role-Permission Mappings (Admin gets all permissions)
    await client.query(`
      INSERT INTO role_permissions(roleid, permissionid) VALUES
      ('R-ADMIN', 'P-WAYBILL-VIEW'),
      ('R-ADMIN', 'P-WAYBILL-CREATE'),
      ('R-ADMIN', 'P-WAYBILL-EDIT'),
      ('R-ADMIN', 'P-WAYBILL-DELETE'),
      ('R-ADMIN', 'P-FLEET-VIEW'),
      ('R-ADMIN', 'P-FLEET-MANAGE'),
      ('R-ADMIN', 'P-CUSTOMER-VIEW'),
      ('R-ADMIN', 'P-CUSTOMER-MANAGE'),
      ('R-ADMIN', 'P-FINANCE-VIEW'),
      ('R-ADMIN', 'P-FINANCE-MANAGE'),
      ('R-ADMIN', 'P-USER-VIEW'),
      ('R-ADMIN', 'P-USER-MANAGE'),
      ('R-ADMIN', 'P-ROLE-MANAGE'),
      -- 2026-03-13 PRD Pricing: R-ADMIN 拥有全部报价权限
      ('R-ADMIN', 'P-PRICING-VIEW'),
      ('R-ADMIN', 'P-PRICING-MANAGE'),
      ('R-ADMIN', 'P-QUOTE-CALC'),
      ('R-DISPATCHER', 'P-WAYBILL-VIEW'),
      ('R-DISPATCHER', 'P-WAYBILL-CREATE'),
      ('R-DISPATCHER', 'P-WAYBILL-EDIT'),
      ('R-DISPATCHER', 'P-FLEET-VIEW'),
      ('R-DISPATCHER', 'P-CUSTOMER-VIEW'),
      -- 2026-03-13 PRD Pricing: R-DISPATCHER 可查看报价与使用快速报价
      ('R-DISPATCHER', 'P-PRICING-VIEW'),
      ('R-DISPATCHER', 'P-QUOTE-CALC'),
      -- 2026-03-13 PRD Pricing: 应业务要求，调度员也可管理报价（编辑/归档/新增）
      ('R-DISPATCHER', 'P-PRICING-MANAGE'),
      ('R-DRIVER', 'P-WAYBILL-VIEW')
      ON CONFLICT(roleid, permissionid) DO NOTHING;
    `);

    // Drivers（至少 4 个 IDLE 供集成测试：§3.1 指派 + P0 多组并发）
    await client.query(`
      INSERT INTO drivers(id, name, phone, status, avatar_url) VALUES
      ('D-001', 'James Holloway', '555-0101', 'BUSY', 'https://i.pravatar.cc/150?u=D-001'),
      ('D-002', 'Robert McAllister', '555-0102', 'IDLE', 'https://i.pravatar.cc/150?u=D-002'),
      ('D-003', 'Michael Davidson', '555-0103', 'IDLE', 'https://i.pravatar.cc/150?u=D-003'),
      ('D-004', 'William Park', '555-0104', 'IDLE', 'https://i.pravatar.cc/150?u=D-004'),
      ('D-005', 'David Lee', '555-0105', 'IDLE', 'https://i.pravatar.cc/150?u=D-005')
      ON CONFLICT(id) DO NOTHING;
    `);

    // Vehicles（至少 4 个 IDLE 供集成测试）
    await client.query(`
      INSERT INTO vehicles(id, plate, model, capacity, status) VALUES
      ('V-101', 'TX-101', 'Volvo VNL', '53ft', 'BUSY'),
      ('V-102', 'TX-102', 'Peterbilt 579', '53ft', 'IDLE'),
      ('V-103', 'TX-103', 'Kenworth T680', '53ft', 'IDLE'),
      ('V-104', 'TX-104', 'Freightliner Cascadia', '53ft', 'IDLE'),
      ('V-105', 'TX-105', 'International LT', '53ft', 'IDLE')
      ON CONFLICT(id) DO NOTHING;
    `);

    // Users（调度员 U-01；司机 Jerry 使用 D-002 与 drivers.id 一致，登录后 waybills?driver_id=D-002 可见自己的任务）
    await client.query(`
      INSERT INTO users(id, name, email, password, roleId, status) VALUES
      ('U-01', 'Tom Dispatcher', 'tom@tms.com', 'dispatcher123', 'R-ADMIN', 'ACTIVE'),
      ('D-002', 'Jerry Driver', 'jerry@tms.com', 'driver123', 'R-DRIVER', 'ACTIVE')
      ON CONFLICT(id) DO UPDATE SET 
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password = EXCLUDED.password,
        password_hash = NULL,
        roleId = EXCLUDED.roleId,
        status = EXCLUDED.status;
    `);
    // 2026-03-13: 为已有用户回填 username（邮箱 @ 前部分），便于「邮箱或用户名」登录
    await client.query(`
      UPDATE users SET username = split_part(email, '@', 1) WHERE (username IS NULL OR username = '') AND email IS NOT NULL
    `);
    // 一次性迁移：原司机账号 U-02 改为使用 D-002（与 drivers.id 一致），司机登录后可见自己任务
    const u02 = await client.query('SELECT 1 FROM users WHERE id = $1', ['U-02']);
    if (u02.rows.length > 0) {
      await client.query("UPDATE notifications SET user_id = 'D-002' WHERE user_id = 'U-02'");
      await client.query("DELETE FROM users WHERE id = 'U-02'");
    }

    // Notifications
    await client.query(`
      INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at) VALUES 
      ('N-1', 'U-01', 'ALERT', 'Waybill #123 Delivered', 'The waybill has been successfully delivered.', FALSE, NOW()),
      ('N-2', 'U-01', 'INFO', 'System Update', 'Maintenance scheduled for tonight.', FALSE, NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Customers
    await client.query(`
      INSERT INTO customers(id, name, email, phone, businessType, status) VALUES
      ('C-01', 'Apony Prime', 'prime@apony.com', '437-111-2222', 'VIP', 'ACTIVE'),
      ('C-02', 'Global Logistics Co.', 'info@global.com', '437-333-4444', 'STANDARD', 'ACTIVE'),
      ('C-03', 'Retail Giant', 'support@retail.com', '437-555-6666', 'STANDARD', 'ACTIVE')
      ON CONFLICT(id) DO NOTHING;
    `);

    // Rules
    await client.query(`
      INSERT INTO rules(id, name, description, type, priority, conditions, actions, status) VALUES
      ('RULE-ZONE-001', 'Zone Pricing (25km Radius)', 'PRD v2.0: $180 within 25km, $5/km extra beyond', 'pricing', 10,
        '[{"fact": "distance", "operator": "lessThanInclusive", "value": 25}]',
        '[{"type": "addFee", "params": {"amount": 180}}]', 'ACTIVE'),
      ('RULE-ZONE-002', 'Over Radius Surcharge', 'PRD v2.0: $5/km extra beyond 25km', 'pricing', 9,
        '[{"fact": "distance", "operator": "greaterThan", "value": 25}]',
        '[{"type": "calculateBaseFee", "params": {"ratePerKm": 5, "baseFee": 180, "subtractDistance": 25}}]', 'ACTIVE'),
      ('RULE-TIME-001', 'Hourly Rate ($80/hr)', 'Standard time-based billing for local moves', 'pricing', 5,
        '[{"fact": "billingType", "operator": "equal", "value": "TIME"}]',
        '[{"type": "calculateByTime", "params": {"ratePerHour": 80}}]', 'ACTIVE'),
      ('RULE-PAY-TIME-001', 'Driver Hourly Pay ($30/hr)', 'Standard hourly pay for drivers', 'payroll', 10,
        '[{"fact": "billingType", "operator": "equal", "value": "TIME"}]',
        '[{"type": "calculateByTime", "params": {"ratePerHour": 30}}]', 'ACTIVE')
      ON CONFLICT(id) DO NOTHING;
    `);

    // Only seed trips if table is empty to avoid dupes/fk issues
    const tripCount = await client.query('SELECT COUNT(*) FROM trips');
    if (parseInt(tripCount.rows[0].count) === 0) {
      await client.query(`
          INSERT INTO trips(id, driver_id, vehicle_id, status, start_time_est, end_time_est) VALUES
      ('T-1001', 'D-001', 'V-101', 'ACTIVE', '2026-01-08T08:00:00Z', '2026-01-08T18:00:00Z'),
      ('T-1002', 'D-003', 'V-103', 'ACTIVE', '2026-01-08T09:00:00Z', '2026-01-09T12:00:00Z')
      ON CONFLICT(id) DO NOTHING;
    `);

      // Waybills
      await client.query(`
          INSERT INTO waybills(id, waybill_no, customer_id, origin, destination, cargo_desc, status, trip_id, price_estimated, created_at) VALUES
      ('WB-001', 'WB-20260108-001', 'C-01', 'Omaha, NE', 'Chicago, IL', 'Pork Bellies - 20 Pallets', 'IN_TRANSIT', 'T-1001', 1200, '2026-01-07T10:00:00Z'),
      ('WB-004', 'WB-20260108-004', 'C-03', 'St. Louis, MO', 'Nashville, TN', 'Poultry - 22 Pallets', 'IN_TRANSIT', 'T-1002', 1100, '2026-01-07T14:00:00Z')
      ON CONFLICT(id) DO NOTHING;
    `);

      // Other Waybills
      await client.query(`
           INSERT INTO waybills(id, waybill_no, customer_id, origin, destination, cargo_desc, status, price_estimated, created_at) VALUES
      ('WB-002', 'WB-20260108-002', 'C-02', 'Kansas City, MO', 'Dallas, TX', 'Frozen Beef - 18 Pallets', 'NEW', 1500, '2026-01-08T09:00:00Z'),
      ('WB-003', 'WB-20260108-003', 'C-01', 'Des Moines, IA', 'Minneapolis, MN', 'Live Hogs - 150 Head', 'NEW', 800, '2026-01-08T10:30:00Z')
      ON CONFLICT(id) DO NOTHING;
    `);

      // Events
      await client.query(`
          INSERT INTO trip_events(trip_id, status, time, description) VALUES
      ('T-1001', 'PLANNED', '2026-01-08T07:00:00Z', 'Trip created'),
      ('T-1001', 'ACTIVE', '2026-01-08T08:15:00Z', 'Driver departed from Omaha')
      ;
    `);

      // Messages
      await client.query(`
          INSERT INTO messages(id, trip_id, sender, text, timestamp) VALUES
      ('M-1', 'T-1001', 'DRIVER', 'Loaded and rolling out.', '2026-01-08T08:16:00Z'),
      ('M-2', 'T-1001', 'DISPATCHER', 'Copy that. Watch out for snow near Des Moines.', '2026-01-08T08:18:00Z')
      ON CONFLICT(id) DO NOTHING;
    `);
    }

    // Migration: Add driver pay columns to trips table
    await client.query(`
            ALTER TABLE trips 
            ADD COLUMN IF NOT EXISTS driver_pay_calculated NUMERIC(10, 2),
      ADD COLUMN IF NOT EXISTS driver_pay_bonus NUMERIC(10, 2) DEFAULT 0,
        ADD COLUMN IF NOT EXISTS driver_pay_total NUMERIC(10, 2),
          ADD COLUMN IF NOT EXISTS driver_pay_currency VARCHAR(10) DEFAULT 'CAD',
            ADD COLUMN IF NOT EXISTS driver_pay_details JSONB;
    `);
    console.log('Migration: Added driver pay columns to trips table');

    // ============================================================
    // Phase 1: TMS Integration - New Tables & Schema Changes
    // ============================================================
    console.log('Phase 1 Migration: Starting...');

    // --- 1. FC Destinations Dictionary (no FK dependencies) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS fc_destinations (
        code VARCHAR(20) PRIMARY KEY,
        name VARCHAR(100),
        type VARCHAR(20) DEFAULT 'AMAZON_FC',
        address TEXT,
        city VARCHAR(50),
        province VARCHAR(10),
        postal_code VARCHAR(10),
        region VARCHAR(20),
        notes TEXT
      );
    `);
    console.log('  Created fc_destinations');

    // --- 2. Addon Services Catalog (no FK dependencies) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS addon_services (
        id VARCHAR(50) PRIMARY KEY,
        code VARCHAR(30) UNIQUE NOT NULL,
        name VARCHAR(100) NOT NULL,
        name_en VARCHAR(100),
        unit VARCHAR(20) NOT NULL,
        default_price NUMERIC(10,2) NOT NULL,
        description TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE'
      );
    `);
    console.log('  Created addon_services');

    // --- 3. Driver Cost Baselines (no FK dependencies) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS driver_cost_baselines (
        id VARCHAR(50) PRIMARY KEY,
        destination_code VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(20) NOT NULL,
        driver_pay NUMERIC(10,2) NOT NULL,
        fuel_cost NUMERIC(10,2) DEFAULT 0,
        waiting_free_hours NUMERIC(3,1) DEFAULT 1,
        waiting_rate_hourly NUMERIC(10,2) DEFAULT 25,
        total_cost NUMERIC(10,2),
        notes TEXT,
        UNIQUE(destination_code, vehicle_type)
      );
    `);
    console.log('  Created driver_cost_baselines');

    // --- 4. Pricing Matrices (depends on customers) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS pricing_matrices (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        destination_code VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(20) NOT NULL,
        pallet_tier VARCHAR(20) NOT NULL,
        base_price NUMERIC(10,2),
        per_pallet_price NUMERIC(10,2),
        effective_date DATE,
        expiry_date DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    // Add unique constraint idempotently
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_pricing_matrix'
        ) THEN
          ALTER TABLE pricing_matrices 
            ADD CONSTRAINT uq_pricing_matrix 
            UNIQUE(customer_id, destination_code, vehicle_type, pallet_tier, status);
        END IF;
      END $$;
    `);
    console.log('  Created pricing_matrices');

    // --- 5. Customer Addon Rates ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS customer_addon_rates (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        service_id VARCHAR(50) NOT NULL REFERENCES addon_services(id),
        custom_price NUMERIC(10,2) NOT NULL,
        conditions JSONB
      );
    `);
    await client.query(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'uq_customer_addon'
        ) THEN
          ALTER TABLE customer_addon_rates 
            ADD CONSTRAINT uq_customer_addon UNIQUE(customer_id, service_id);
        END IF;
      END $$;
    `);
    console.log('  Created customer_addon_rates');

    // --- 6. Container All-In Prices ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS container_allins (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50) NOT NULL,
        dest_group VARCHAR(50) NOT NULL,
        container_type VARCHAR(20),
        price NUMERIC(10,2) NOT NULL,
        includes JSONB,
        notes TEXT,
        effective_date DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE'
      );
    `);
    console.log('  Created container_allins');

    // --- 7. Market Benchmarks ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS market_benchmarks (
        id VARCHAR(50) PRIMARY KEY,
        destination_code VARCHAR(20) NOT NULL,
        vehicle_type VARCHAR(20),
        pallet_tier VARCHAR(20),
        min_price NUMERIC(10,2),
        max_price NUMERIC(10,2),
        avg_price NUMERIC(10,2),
        source VARCHAR(50),
        collected_at TIMESTAMP DEFAULT NOW(),
        expires_at TIMESTAMP
      );
    `);
    console.log('  Created market_benchmarks');

    // --- 8. Quote Records ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS quote_records (
        id VARCHAR(50) PRIMARY KEY,
        customer_id VARCHAR(50),
        quoted_by VARCHAR(50),
        destination_code VARCHAR(20),
        vehicle_type VARCHAR(20),
        pallet_count INTEGER,
        base_amount NUMERIC(10,2),
        addon_amount NUMERIC(10,2),
        total_amount NUMERIC(10,2),
        driver_cost NUMERIC(10,2),
        margin_amount NUMERIC(10,2),
        margin_rate NUMERIC(5,2),
        pricing_snapshot JSONB,
        status VARCHAR(20) DEFAULT 'DRAFT',
        expires_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created quote_records');

    // --- 9. Containers (main table) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS containers (
        id VARCHAR(50) PRIMARY KEY,
        container_no VARCHAR(50) NOT NULL,
        warehouse_id VARCHAR(10),
        entry_method VARCHAR(20),
        arrival_date DATE,
        unload_status TEXT,
        customer_id VARCHAR(50),
        total_cbm NUMERIC(10,3) DEFAULT 0,
        total_pieces INTEGER DEFAULT 0,
        status VARCHAR(20) DEFAULT 'NEW',
        billing_amount NUMERIC(10,2),
        billing_status VARCHAR(20),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created containers');

    // --- 10. Container Items ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS container_items (
        id VARCHAR(50) PRIMARY KEY,
        container_id VARCHAR(50) NOT NULL REFERENCES containers(id) ON DELETE CASCADE,
        sku VARCHAR(100),
        fba_shipment_id VARCHAR(50),
        po_list VARCHAR(50),
        piece_count INTEGER DEFAULT 0,
        cbm NUMERIC(10,5),
        dest_warehouse VARCHAR(20),
        delivery_address TEXT,
        pallet_count VARCHAR(10),
        pallet_count_num INTEGER,
        notes TEXT,
        waybill_id VARCHAR(50),
        status VARCHAR(20) DEFAULT 'PENDING',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      -- Idempotent column addition for existing installations
      DO $$ 
      BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='container_items' AND column_name='details') THEN
              ALTER TABLE container_items ADD COLUMN details JSONB;
          END IF;
      END $$;
    `);
    console.log('  Created/Modified container_items: +details');

    // --- 11. Delivery Appointments ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS delivery_appointments (
        id VARCHAR(50) PRIMARY KEY,
        container_item_id VARCHAR(50) NOT NULL REFERENCES container_items(id) ON DELETE CASCADE,
        appointment_time TIMESTAMP,
        operator_code VARCHAR(10),
        attempt_number INTEGER DEFAULT 1,
        status VARCHAR(20) DEFAULT 'SCHEDULED',
        rejection_reason TEXT,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created delivery_appointments');

    // --- Existing Table Modifications ---

    // vehicles: add vehicle_type and max_pallets
    await client.query(`
      ALTER TABLE vehicles 
        ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'STRAIGHT_26',
        ADD COLUMN IF NOT EXISTS max_pallets INTEGER DEFAULT 13;
    `);
    console.log('  Modified vehicles: +vehicle_type, +max_pallets');

    // drivers: add code, hourly_rate, default_vehicle_id
    await client.query(`
      ALTER TABLE drivers 
        ADD COLUMN IF NOT EXISTS code VARCHAR(10),
        ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS default_vehicle_id VARCHAR(50);
    `);
    console.log('  Modified drivers: +code, +hourly_rate, +default_vehicle_id');

    // waybills: add container_item_id, pricing_matrix_id, addon_services, driver_cost, gross_margin
    await client.query(`
      ALTER TABLE waybills 
        ADD COLUMN IF NOT EXISTS container_item_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS pricing_matrix_id VARCHAR(50),
        ADD COLUMN IF NOT EXISTS addon_services JSONB,
        ADD COLUMN IF NOT EXISTS driver_cost NUMERIC(10,2),
        ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(10,2);
    `);
    console.log('  Modified waybills: +container_item_id, +pricing_matrix_id, +addon_services, +driver_cost, +gross_margin');

    // --- Seed Data ---

    // FC Destinations (from pricing card analysis)
    await client.query(`
      INSERT INTO fc_destinations (code, name, type, city, province, region) VALUES
        ('YYZ3', 'Amazon YYZ3', 'AMAZON_FC', 'Brampton', 'ON', 'GTA'),
        ('YYZ4', 'Amazon YYZ4', 'AMAZON_FC', 'Mississauga', 'ON', 'GTA'),
        ('YYZ7', 'Amazon YYZ7', 'AMAZON_FC', 'Vaughan', 'ON', 'GTA'),
        ('YYZ9', 'Amazon YYZ9', 'AMAZON_FC', 'Scarborough', 'ON', 'GTA'),
        ('YOO1', 'Amazon YOO1', 'AMAZON_FC', 'Ajax', 'ON', 'GTA'),
        ('YHM1', 'Amazon YHM1', 'AMAZON_FC', 'Hamilton', 'ON', 'HAMILTON'),
        ('YXU1', 'Amazon YXU1', 'AMAZON_FC', 'London', 'ON', 'WESTERN_ON'),
        ('YGK1', 'Amazon YGK1', 'AMAZON_FC', 'Kingston', 'ON', 'EASTERN_ON'),
        ('YOW1', 'Amazon YOW1', 'AMAZON_FC', 'Ottawa', 'ON', 'OTTAWA'),
        ('YOW3', 'Amazon YOW3', 'AMAZON_FC', 'Ottawa', 'ON', 'OTTAWA'),
        ('YYZ1', 'Amazon YYZ1', 'AMAZON_FC', 'Toronto', 'ON', 'GTA')
      ON CONFLICT (code) DO NOTHING;
    `);
    console.log('  Seeded fc_destinations (11 FCs)');

    // Addon Services (15 standard services from pricing card)
    await client.query(`
      INSERT INTO addon_services (id, code, name, name_en, unit, default_price, description) VALUES
        ('AS-01', 'LABELING', '贴标费', 'Labeling', 'PER_PIECE', 0.25, '每张标签，默认一箱双标'),
        ('AS-02', 'LABEL_COVER', '标签覆盖/换标', 'Label Cover/Replace', 'PER_PIECE', 0.60, '覆盖或更换现有标签'),
        ('AS-03', 'SORTING', '分拣清点费', 'Sorting/Counting', 'PER_PIECE', 0.25, '入仓分拣费'),
        ('AS-04', 'TAILGATE', '尾部升降机', 'Tailgate', 'PER_USE', 10.00, '需提前通知，封顶$60'),
        ('AS-05', 'PALLET_SWAP', '提货换板', 'Pallet Swap', 'PER_PALLET', 10.00, '旧板可回收减$5'),
        ('AS-06', 'REWRAP', '二次缠膜/打板', 'Re-wrap/Re-palletize', 'PER_PALLET', 10.00, '含拉伸膜材料和人工'),
        ('AS-07', 'RESIDENTIAL', '民宅派送', 'Residential Delivery', 'PER_TICKET', 20.00, '需提前通知'),
        ('AS-08', 'FBA_APPOINTMENT', '亚马逊预约/激活/换仓', 'FBA Appointment', 'PER_TICKET', 20.00, '不成功不收费'),
        ('AS-09', 'REJECTION_RETURN', '拒收回程', 'Rejection Return', 'PERCENTAGE', 50.00, '按原运费50%收取'),
        ('AS-10', 'CANCELLATION', '临时订单取消', 'Cancellation Fee', 'PER_TICKET', 50.00, '当日取消收取'),
        ('AS-11', 'EMPTY_RUN', '提货空跑费', 'Empty Run Fee', 'PER_TICKET', 100.00, '到达提货点无法提货'),
        ('AS-12', 'OPEN_BOX', '开箱封箱费', 'Open/Reseal Box', 'PER_BOX', 2.00, '查验货物'),
        ('AS-13', 'PHOTO', '照相费', 'Photography', 'PER_PIECE', 0.50, ''),
        ('AS-14', 'LABEL_REMOVE', '标签移除', 'Label Removal', 'PER_PIECE', 1.00, '覆盖标签不收此项'),
        ('AS-15', 'OVERSIZE_PALLET', '超尺寸长托', 'Oversize/Long Pallet', 'PER_PALLET', 20.00, '货物尺寸超过1.4M')
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('  Seeded addon_services (15 services)');

    // Driver Cost Baselines (from 司机工资标准 sheet)
    await client.query(`
      INSERT INTO driver_cost_baselines (id, destination_code, vehicle_type, driver_pay, waiting_free_hours, waiting_rate_hourly, notes) VALUES
        ('DCB-01', 'YYZ3', 'STRAIGHT_26', 80, 1, 25, 'YYZ3/4/7/9 统一标准'),
        ('DCB-02', 'YYZ3', 'TRAILER_53', 120, 2, 25, 'YYZ3/4/7/9 统一标准'),
        ('DCB-03', 'YYZ4', 'STRAIGHT_26', 80, 1, 25, NULL),
        ('DCB-04', 'YYZ4', 'TRAILER_53', 120, 2, 25, NULL),
        ('DCB-05', 'YYZ7', 'STRAIGHT_26', 80, 1, 25, NULL),
        ('DCB-06', 'YYZ7', 'TRAILER_53', 120, 2, 25, NULL),
        ('DCB-07', 'YYZ9', 'STRAIGHT_26', 80, 1, 25, NULL),
        ('DCB-08', 'YYZ9', 'TRAILER_53', 120, 2, 25, NULL),
        ('DCB-09', 'YOO1', 'STRAIGHT_26', 80, 1, 25, NULL),
        ('DCB-10', 'YOO1', 'TRAILER_53', 120, 2, 25, NULL),
        ('DCB-11', 'YHM1', 'STRAIGHT_26', 120, 1, 25, NULL),
        ('DCB-12', 'YHM1', 'TRAILER_53', 150, 2, 25, NULL),
        ('DCB-13', 'YGK1', 'STRAIGHT_26', 160, 1, 25, NULL),
        ('DCB-14', 'YGK1', 'TRAILER_53', 200, 2, 25, NULL),
        ('DCB-15', 'YXU1', 'STRAIGHT_26', 180, 1, 25, NULL),
        ('DCB-16', 'YXU1', 'TRAILER_53', 220, 2, 25, NULL),
        ('DCB-17', 'YOW1', 'STRAIGHT_26', 350, 1, 25, 'YOW1/3 统一标准'),
        ('DCB-18', 'YOW1', 'TRAILER_53', 400, 2, 25, NULL),
        ('DCB-19', 'YOW3', 'STRAIGHT_26', 350, 1, 25, NULL),
        ('DCB-20', 'YOW3', 'TRAILER_53', 400, 2, 25, NULL)
      ON CONFLICT ON CONSTRAINT driver_cost_baselines_destination_code_vehicle_type_key DO NOTHING;
    `);
    console.log('  Seeded driver_cost_baselines (20 entries)');

    console.log('Phase 1 Migration: Complete');

    // ============================================================
    // Phase 2: Transfer Orders & Partner Pricing — 2026-04-05
    // ============================================================
    console.log('Phase 2 Migration: Starting...');

    // --- 1. Partners (合作单位/承运商) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS partners (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) UNIQUE NOT NULL,
        short_code VARCHAR(20),
        type VARCHAR(30) DEFAULT 'carrier',
        contact_name VARCHAR(50),
        contact_phone VARCHAR(30),
        contact_email VARCHAR(100),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created partners');

    // --- 2. Transfer Orders (转运单主表) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(30) UNIQUE NOT NULL,
        partner_id INT REFERENCES partners(id),
        customer_id VARCHAR(50),
        container_no VARCHAR(30),
        warehouse VARCHAR(50),
        entry_method VARCHAR(30),
        arrival_date DATE,
        main_dest_warehouse VARCHAR(20),
        currency VARCHAR(5) DEFAULT 'CAD',
        status VARCHAR(30) DEFAULT 'DRAFT',
        total_pallets INT DEFAULT 0,
        waybilled_pallets INT DEFAULT 0,
        hold_pallets INT DEFAULT 0,
        notes TEXT,
        source_sheet VARCHAR(50),
        created_by VARCHAR(50),
        updated_by VARCHAR(50),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created transfer_orders');

    // --- 3. Transfer Order Lines (转运单明细行) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_order_lines (
        id SERIAL PRIMARY KEY,
        transfer_order_id INT REFERENCES transfer_orders(id) ON DELETE CASCADE,
        line_no INT NOT NULL,
        sku VARCHAR(100),
        fba_shipment_id VARCHAR(50),
        po_list TEXT,
        container_no VARCHAR(30),
        piece_count INT,
        pallet_count INT,
        cbm DECIMAL(10,2),
        weight_kg DECIMAL(10,2),
        dest_warehouse VARCHAR(20),
        delivery_type VARCHAR(30),
        partner_id INT REFERENCES partners(id),
        planned_depart_date DATE,
        hold_status VARCHAR(30) DEFAULT 'NORMAL',
        hold_warehouse VARCHAR(50),
        hold_reason TEXT,
        hold_release_date DATE,
        waybilled_pallets INT DEFAULT 0,
        waybilled_cbm DECIMAL(10,2) DEFAULT 0,
        remaining_pallets INT DEFAULT 0,
        remaining_cbm DECIMAL(10,2) DEFAULT 0,
        waybill_ids JSONB DEFAULT '[]',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created transfer_order_lines');

    // --- 4. Partner Pricing Rules (合作单位报价规则) ---
    await client.query(`
      CREATE TABLE IF NOT EXISTS partner_pricing_rules (
        id SERIAL PRIMARY KEY,
        partner_id INT REFERENCES partners(id),
        pricing_type VARCHAR(20) NOT NULL,
        origin_warehouse VARCHAR(50),
        destination_warehouse VARCHAR(50),
        transport_mode VARCHAR(30),
        pallet_tier_min INT,
        pallet_tier_max INT,
        weight_min DECIMAL(10,2),
        weight_max DECIMAL(10,2),
        unit_type VARCHAR(20),
        base_price DECIMAL(10,2),
        unit_price DECIMAL(10,2),
        surcharges JSONB DEFAULT '{}',
        fuel_surcharge_rate DECIMAL(5,4),
        effective_from DATE,
        effective_to DATE,
        source_sheet VARCHAR(100),
        source_type VARCHAR(20),
        ocr_confidence DECIMAL(3,2),
        notes TEXT,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('  Created partner_pricing_rules');

    // --- Permissions for Transfer Orders & Partner Pricing ---
    await client.query(`
      INSERT INTO permissions(id, name, module, description) VALUES
      ('P-TRANSFER-VIEW', 'View Transfer Orders', 'Transfer', 'View transfer orders list and details'),
      ('P-TRANSFER-MANAGE', 'Manage Transfer Orders', 'Transfer', 'Create, edit, delete transfer orders'),
      ('P-PARTNER-VIEW', 'View Partners', 'Partners', 'View partner list'),
      ('P-PARTNER-MANAGE', 'Manage Partners', 'Partners', 'Create, edit partners and pricing rules')
      ON CONFLICT(id) DO NOTHING;
    `);
    await client.query(`
      INSERT INTO role_permissions(roleid, permissionid) VALUES
      ('R-ADMIN', 'P-TRANSFER-VIEW'),
      ('R-ADMIN', 'P-TRANSFER-MANAGE'),
      ('R-ADMIN', 'P-PARTNER-VIEW'),
      ('R-ADMIN', 'P-PARTNER-MANAGE'),
      ('R-DISPATCHER', 'P-TRANSFER-VIEW'),
      ('R-DISPATCHER', 'P-TRANSFER-MANAGE'),
      ('R-DISPATCHER', 'P-PARTNER-VIEW')
      ON CONFLICT(roleid, permissionid) DO NOTHING;
    `);
    console.log('  Seeded transfer/partner permissions');

    console.log('Phase 2 Migration: Complete');

    await client.query('COMMIT');
    console.log("Migration successful");
  } catch (e) {
    await client.query('ROLLBACK');
    console.error("Migration failed", e);
  } finally {
    client.release();
  }
};

migrate().then(() => process.exit(0));
