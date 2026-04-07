-- Migration 001: Initial Schema
-- Base tables, idempotent column additions, and seed data

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
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='name') THEN
    ALTER TABLE users ADD COLUMN name VARCHAR(100);
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='customers' AND column_name='details') THEN
    ALTER TABLE customers ADD COLUMN details JSONB;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(50) PRIMARY KEY,
  plate VARCHAR(20) NOT NULL,
  model VARCHAR(50),
  capacity VARCHAR(50),
  status VARCHAR(20) DEFAULT 'IDLE'
);

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

CREATE TABLE IF NOT EXISTS messages (
  id VARCHAR(50) PRIMARY KEY,
  trip_id VARCHAR(50),
  sender VARCHAR(20),
  text TEXT,
  timestamp TIMESTAMP,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

CREATE TABLE IF NOT EXISTS trip_events (
  id SERIAL PRIMARY KEY,
  trip_id VARCHAR(50),
  status VARCHAR(20),
  time TIMESTAMP,
  description TEXT,
  FOREIGN KEY (trip_id) REFERENCES trips(id)
);

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
);

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

-- Seed: Roles
INSERT INTO roles (id, name, description) VALUES
  ('R-ADMIN', 'Administrator', 'Full system access'),
  ('R-DISPATCHER', 'Dispatcher', 'Manage trips and waybills'),
  ('R-DRIVER', 'Driver', 'Mobile portal access')
ON CONFLICT (id) DO NOTHING;

-- Seed: Permissions
INSERT INTO permissions (id, name, module, description) VALUES
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
  ('P-PRICING-VIEW', 'View Pricing', 'Pricing', 'View pricing matrices, allins, addons, FC, driver costs'),
  ('P-PRICING-MANAGE', 'Manage Pricing', 'Pricing', 'Create, edit, delete/archive all pricing data'),
  ('P-QUOTE-CALC', 'Use Quote Calculator', 'Pricing', 'Use quick quote API')
ON CONFLICT (id) DO NOTHING;

-- Seed: Role-Permission Mappings
INSERT INTO role_permissions (roleid, permissionid) VALUES
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
  ('R-ADMIN', 'P-PRICING-VIEW'),
  ('R-ADMIN', 'P-PRICING-MANAGE'),
  ('R-ADMIN', 'P-QUOTE-CALC'),
  ('R-DISPATCHER', 'P-WAYBILL-VIEW'),
  ('R-DISPATCHER', 'P-WAYBILL-CREATE'),
  ('R-DISPATCHER', 'P-WAYBILL-EDIT'),
  ('R-DISPATCHER', 'P-FLEET-VIEW'),
  ('R-DISPATCHER', 'P-CUSTOMER-VIEW'),
  ('R-DISPATCHER', 'P-PRICING-VIEW'),
  ('R-DISPATCHER', 'P-QUOTE-CALC'),
  ('R-DISPATCHER', 'P-PRICING-MANAGE'),
  ('R-DRIVER', 'P-WAYBILL-VIEW')
ON CONFLICT (roleid, permissionid) DO NOTHING;

-- Seed: Drivers
INSERT INTO drivers (id, name, phone, status, avatar_url) VALUES
  ('D-001', 'James Holloway', '555-0101', 'BUSY', 'https://i.pravatar.cc/150?u=D-001'),
  ('D-002', 'Robert McAllister', '555-0102', 'IDLE', 'https://i.pravatar.cc/150?u=D-002'),
  ('D-003', 'Michael Davidson', '555-0103', 'IDLE', 'https://i.pravatar.cc/150?u=D-003'),
  ('D-004', 'William Park', '555-0104', 'IDLE', 'https://i.pravatar.cc/150?u=D-004'),
  ('D-005', 'David Lee', '555-0105', 'IDLE', 'https://i.pravatar.cc/150?u=D-005')
ON CONFLICT (id) DO NOTHING;

-- Seed: Vehicles
INSERT INTO vehicles (id, plate, model, capacity, status) VALUES
  ('V-101', 'TX-101', 'Volvo VNL', '53ft', 'BUSY'),
  ('V-102', 'TX-102', 'Peterbilt 579', '53ft', 'IDLE'),
  ('V-103', 'TX-103', 'Kenworth T680', '53ft', 'IDLE'),
  ('V-104', 'TX-104', 'Freightliner Cascadia', '53ft', 'IDLE'),
  ('V-105', 'TX-105', 'International LT', '53ft', 'IDLE')
ON CONFLICT (id) DO NOTHING;

-- Seed: Users
INSERT INTO users (id, name, email, password, roleId, status) VALUES
  ('U-01', 'Tom Dispatcher', 'tom@tms.com', 'dispatcher123', 'R-ADMIN', 'ACTIVE'),
  ('D-002', 'Jerry Driver', 'jerry@tms.com', 'driver123', 'R-DRIVER', 'ACTIVE')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  password = EXCLUDED.password,
  password_hash = NULL,
  roleId = EXCLUDED.roleId,
  status = EXCLUDED.status;

-- Backfill usernames from email prefix
UPDATE users SET username = split_part(email, '@', 1)
WHERE (username IS NULL OR username = '') AND email IS NOT NULL;

-- One-time migration: rename U-02 driver account to D-002
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = 'U-02') THEN
    UPDATE notifications SET user_id = 'D-002' WHERE user_id = 'U-02';
    DELETE FROM users WHERE id = 'U-02';
  END IF;
END $$;

-- Seed: Notifications
INSERT INTO notifications (id, user_id, type, title, content, is_read, created_at) VALUES
  ('N-1', 'U-01', 'ALERT', 'Waybill #123 Delivered', 'The waybill has been successfully delivered.', FALSE, NOW()),
  ('N-2', 'U-01', 'INFO', 'System Update', 'Maintenance scheduled for tonight.', FALSE, NOW())
ON CONFLICT (id) DO NOTHING;

-- Seed: Customers
INSERT INTO customers (id, name, email, phone, businessType, status) VALUES
  ('C-01', 'Apony Prime', 'prime@apony.com', '437-111-2222', 'VIP', 'ACTIVE'),
  ('C-02', 'Global Logistics Co.', 'info@global.com', '437-333-4444', 'STANDARD', 'ACTIVE'),
  ('C-03', 'Retail Giant', 'support@retail.com', '437-555-6666', 'STANDARD', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- Seed: Rules
INSERT INTO rules (id, name, description, type, priority, conditions, actions, status) VALUES
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
ON CONFLICT (id) DO NOTHING;

-- Seed: Trips, Waybills, Events, Messages (only if trips table is empty)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM trips) = 0 THEN
    INSERT INTO trips (id, driver_id, vehicle_id, status, start_time_est, end_time_est) VALUES
      ('T-1001', 'D-001', 'V-101', 'ACTIVE', '2026-01-08T08:00:00Z', '2026-01-08T18:00:00Z'),
      ('T-1002', 'D-003', 'V-103', 'ACTIVE', '2026-01-08T09:00:00Z', '2026-01-09T12:00:00Z')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc, status, trip_id, price_estimated, created_at) VALUES
      ('WB-001', 'WB-20260108-001', 'C-01', 'Omaha, NE', 'Chicago, IL', 'Pork Bellies - 20 Pallets', 'IN_TRANSIT', 'T-1001', 1200, '2026-01-07T10:00:00Z'),
      ('WB-004', 'WB-20260108-004', 'C-03', 'St. Louis, MO', 'Nashville, TN', 'Poultry - 22 Pallets', 'IN_TRANSIT', 'T-1002', 1100, '2026-01-07T14:00:00Z')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO waybills (id, waybill_no, customer_id, origin, destination, cargo_desc, status, price_estimated, created_at) VALUES
      ('WB-002', 'WB-20260108-002', 'C-02', 'Kansas City, MO', 'Dallas, TX', 'Frozen Beef - 18 Pallets', 'NEW', 1500, '2026-01-08T09:00:00Z'),
      ('WB-003', 'WB-20260108-003', 'C-01', 'Des Moines, IA', 'Minneapolis, MN', 'Live Hogs - 150 Head', 'NEW', 800, '2026-01-08T10:30:00Z')
    ON CONFLICT (id) DO NOTHING;

    INSERT INTO trip_events (trip_id, status, time, description) VALUES
      ('T-1001', 'PLANNED', '2026-01-08T07:00:00Z', 'Trip created'),
      ('T-1001', 'ACTIVE', '2026-01-08T08:15:00Z', 'Driver departed from Omaha');

    INSERT INTO messages (id, trip_id, sender, text, timestamp) VALUES
      ('M-1', 'T-1001', 'DRIVER', 'Loaded and rolling out.', '2026-01-08T08:16:00Z'),
      ('M-2', 'T-1001', 'DISPATCHER', 'Copy that. Watch out for snow near Des Moines.', '2026-01-08T08:18:00Z')
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;
