
import { pool } from './db-postgres';

const migrate = async () => {
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
        created_at TIMESTAMP DEFAULT NOW()
      );
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
        FOREIGN KEY (statement_id) REFERENCES statements(id)
      );
    `);

    // --- Seed Data (Idempotent) ---

    // Roles
    await client.query(`
      INSERT INTO roles (id, name, description) VALUES 
      ('R-ADMIN', 'Administrator', 'Full system access'),
      ('R-DISPATCHER', 'Dispatcher', 'Manage trips and waybills'),
      ('R-DRIVER', 'Driver', 'Mobile portal access')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Drivers
    await client.query(`
      INSERT INTO drivers (id, name, phone, status, avatar_url) VALUES 
      ('D-001', 'James Holloway', '555-0101', 'BUSY', 'https://i.pravatar.cc/150?u=D-001'),
      ('D-002', 'Robert McAllister', '555-0102', 'IDLE', 'https://i.pravatar.cc/150?u=D-002'),
      ('D-003', 'Michael Davidson', '555-0103', 'BUSY', 'https://i.pravatar.cc/150?u=D-003')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Vehicles
    await client.query(`
      INSERT INTO vehicles (id, plate, model, capacity, status) VALUES 
      ('V-101', 'TX-101', 'Volvo VNL', '53ft', 'BUSY'),
      ('V-102', 'TX-102', 'Peterbilt 579', '53ft', 'IDLE'),
      ('V-103', 'TX-103', 'Kenworth T680', '53ft', 'BUSY')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Users
    await client.query(`
      INSERT INTO users (id, name, email, password, roleId, status) VALUES 
      ('U-01', 'Tom Dispatcher', 'tom@tms.com', 'dispatcher123', 'R-ADMIN', 'ACTIVE'),
      ('U-02', 'Jerry Driver', 'jerry@tms.com', 'driver123', 'R-DRIVER', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Customers
    await client.query(`
      INSERT INTO customers (id, name, email, phone, businessType, status) VALUES 
      ('C-01', 'Apony Prime', 'prime@apony.com', '437-111-2222', 'VIP', 'ACTIVE'),
      ('C-02', 'Global Logistics Co.', 'info@global.com', '437-333-4444', 'STANDARD', 'ACTIVE'),
      ('C-03', 'Retail Giant', 'support@retail.com', '437-555-6666', 'STANDARD', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Rules
    await client.query(`
      INSERT INTO rules (id, name, description, type, priority, conditions, actions, status) VALUES 
      ('RULE-ZONE-001', 'Zone Pricing (25km Radius)', 'PRD v2.0: $180 within 25km, $5/km extra beyond', 'pricing', 10, 
       '[{"fact": "distance", "operator": "lessThanInclusive", "value": 25}]',
       '[{"type": "addFee", "params": {"amount": 180}}]', 'ACTIVE'),
      ('RULE-ZONE-002', 'Over Radius Surcharge', 'PRD v2.0: $5/km extra beyond 25km', 'pricing', 9, 
       '[{"fact": "distance", "operator": "greaterThan", "value": 25}]',
       '[{"type": "calculateBaseFee", "params": {"ratePerKm": 5, "baseFee": 180, "subtractDistance": 25}}]', 'ACTIVE')
      ON CONFLICT (id) DO NOTHING;
    `);

    // Only seed trips if table is empty to avoid dupes/fk issues
    const tripCount = await client.query('SELECT COUNT(*) FROM trips');
    if (parseInt(tripCount.rows[0].count) === 0) {
      await client.query(`
          INSERT INTO trips (id, driver_id, vehicle_id, status, start_time_est, end_time_est) VALUES 
          ('T-1001', 'D-001', 'V-101', 'ACTIVE', '2026-01-08T08:00:00Z', '2026-01-08T18:00:00Z'),
          ('T-1002', 'D-003', 'V-103', 'ACTIVE', '2026-01-08T09:00:00Z', '2026-01-09T12:00:00Z');
        `);

      // Waybills
      await client.query(`
          INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc, status, trip_id, price_estimated, created_at) VALUES 
          ('WB-001', 'WB-20260108-001', 'C-01', 'Omaha, NE', 'Chicago, IL', 'Pork Bellies - 20 Pallets', 'IN_TRANSIT', 'T-1001', 1200, '2026-01-07T10:00:00Z'),
          ('WB-004', 'WB-20260108-004', 'C-03', 'St. Louis, MO', 'Nashville, TN', 'Poultry - 22 Pallets', 'IN_TRANSIT', 'T-1002', 1100, '2026-01-07T14:00:00Z');
        `);

      // Other Waybills
      await client.query(`
           INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc, status, price_estimated, created_at) VALUES 
           ('WB-002', 'WB-20260108-002', 'C-02', 'Kansas City, MO', 'Dallas, TX', 'Frozen Beef - 18 Pallets', 'NEW', 1500, '2026-01-08T09:00:00Z'),
           ('WB-003', 'WB-20260108-003', 'C-01', 'Des Moines, IA', 'Minneapolis, MN', 'Live Hogs - 150 Head', 'NEW', 800, '2026-01-08T10:30:00Z');
         `);

      // Events
      await client.query(`
          INSERT INTO trip_events (trip_id, status, time, description) VALUES
          ('T-1001', 'PLANNED', '2026-01-08T07:00:00Z', 'Trip created'),
          ('T-1001', 'ACTIVE', '2026-01-08T08:15:00Z', 'Driver departed from Omaha');
        `);

      // Messages
      await client.query(`
          INSERT INTO messages (id, trip_id, sender, text, timestamp) VALUES
          ('M-1', 'T-1001', 'DRIVER', 'Loaded and rolling out.', '2026-01-08T08:16:00Z'),
          ('M-2', 'T-1001', 'DISPATCHER', 'Copy that. Watch out for snow near Des Moines.', '2026-01-08T08:18:00Z');
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
