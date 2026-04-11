-- Migration 003: Pricing Phase 1 — FC destinations, addon services, pricing matrices, containers

-- 1. FC Destinations Dictionary
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

-- 2. Addon Services Catalog
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

-- 3. Driver Cost Baselines
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

-- 4. Pricing Matrices
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

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_pricing_matrix') THEN
    ALTER TABLE pricing_matrices
      ADD CONSTRAINT uq_pricing_matrix
      UNIQUE(customer_id, destination_code, vehicle_type, pallet_tier, status);
  END IF;
END $$;

-- 5. Customer Addon Rates
CREATE TABLE IF NOT EXISTS customer_addon_rates (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(50) NOT NULL REFERENCES addon_services(id),
  custom_price NUMERIC(10,2) NOT NULL,
  conditions JSONB
);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_customer_addon') THEN
    ALTER TABLE customer_addon_rates
      ADD CONSTRAINT uq_customer_addon UNIQUE(customer_id, service_id);
  END IF;
END $$;

-- 6. Container All-In Prices
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

-- 7. Market Benchmarks
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

-- 8. Quote Records
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

-- 9. Containers
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

-- 10. Container Items
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

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='container_items' AND column_name='details') THEN
    ALTER TABLE container_items ADD COLUMN details JSONB;
  END IF;
END $$;

-- 11. Delivery Appointments
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

-- Modify existing tables
ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'STRAIGHT_26',
  ADD COLUMN IF NOT EXISTS max_pallets INTEGER DEFAULT 13;

ALTER TABLE drivers
  ADD COLUMN IF NOT EXISTS code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS default_vehicle_id VARCHAR(50);

ALTER TABLE waybills
  ADD COLUMN IF NOT EXISTS container_item_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pricing_matrix_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS addon_services JSONB,
  ADD COLUMN IF NOT EXISTS driver_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(10,2);

-- Seed: FC Destinations
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

-- Seed: Addon Services
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

-- Seed: Driver Cost Baselines
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
