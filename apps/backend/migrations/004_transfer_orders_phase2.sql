-- Migration 004: Transfer Orders & Partner Pricing — 2026-04-05

-- 1. Partners (合作单位/承运商)
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

-- 2. Transfer Orders (转运单主表)
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

-- 3. Transfer Order Lines (转运单明细行)
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

-- 4. Partner Pricing Rules (合作单位报价规则)
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

-- Seed: Permissions for Transfer Orders & Partner Pricing
INSERT INTO permissions (id, name, module, description) VALUES
  ('P-TRANSFER-VIEW', 'View Transfer Orders', 'Transfer', 'View transfer orders list and details'),
  ('P-TRANSFER-MANAGE', 'Manage Transfer Orders', 'Transfer', 'Create, edit, delete transfer orders'),
  ('P-PARTNER-VIEW', 'View Partners', 'Partners', 'View partner list'),
  ('P-PARTNER-MANAGE', 'Manage Partners', 'Partners', 'Create, edit partners and pricing rules')
ON CONFLICT (id) DO NOTHING;

INSERT INTO role_permissions (roleid, permissionid) VALUES
  ('R-ADMIN', 'P-TRANSFER-VIEW'),
  ('R-ADMIN', 'P-TRANSFER-MANAGE'),
  ('R-ADMIN', 'P-PARTNER-VIEW'),
  ('R-ADMIN', 'P-PARTNER-MANAGE'),
  ('R-DISPATCHER', 'P-TRANSFER-VIEW'),
  ('R-DISPATCHER', 'P-TRANSFER-MANAGE'),
  ('R-DISPATCHER', 'P-PARTNER-VIEW')
ON CONFLICT (roleid, permissionid) DO NOTHING;
