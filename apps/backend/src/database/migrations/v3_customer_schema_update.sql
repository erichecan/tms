-- TMS v3.0-PC 客户表Schema更新
-- 创建时间: 2025-01-27 16:45:00
-- 支持PRD v3.0-PC的客户管理功能

-- 添加新字段到customers表
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(100),
ADD COLUMN IF NOT EXISTS default_pickup_address JSONB,
ADD COLUMN IF NOT EXISTS default_delivery_address JSONB;

-- 更新contact_info字段结构以兼容新字段
UPDATE customers 
SET phone = COALESCE(contact_info->>'phone', ''),
    email = COALESCE(contact_info->>'email', '')
WHERE phone IS NULL OR email IS NULL;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- 添加运单表的新字段以支持PRD v3.0-PC
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS shipment_no VARCHAR(50),
ADD COLUMN IF NOT EXISTS shipper_address JSONB,
ADD COLUMN IF NOT EXISTS receiver_address JSONB,
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS length_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS width_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS height_cm DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS services JSONB,
ADD COLUMN IF NOT EXISTS estimated_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS pricing_components JSONB,
ADD COLUMN IF NOT EXISTS pricing_rule_trace JSONB,
ADD COLUMN IF NOT EXISTS final_cost DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS cost_currency VARCHAR(3) DEFAULT 'CNY',
ADD COLUMN IF NOT EXISTS assigned_driver_id UUID,
ADD COLUMN IF NOT EXISTS assigned_vehicle_id UUID;

-- 创建运单号唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_shipments_shipment_no ON shipments(shipment_no) WHERE shipment_no IS NOT NULL;

-- 创建司机表的新字段
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS level VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS home_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS current_trip_id UUID,
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available';

-- 创建车辆表的新字段
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS plate_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS type VARCHAR(50),
ADD COLUMN IF NOT EXISTS capacity_kg DECIMAL(10,3),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'available',
ADD COLUMN IF NOT EXISTS current_trip_id UUID;

-- 创建车辆牌照唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_vehicles_plate_number ON vehicles(plate_number) WHERE plate_number IS NOT NULL;

-- 创建行程表 (trips)
CREATE TABLE IF NOT EXISTS trips (
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
);

-- 创建行程相关索引
CREATE INDEX IF NOT EXISTS idx_trips_tenant_id ON trips(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trips_trip_no ON trips(trip_no);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_vehicle_id ON trips(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status);

-- 创建时间线事件表 (timeline_events)
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    shipment_id UUID,
    trip_id UUID,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    actor_type VARCHAR(20) NOT NULL,
    actor_id UUID,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extra JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建时间线事件索引
CREATE INDEX IF NOT EXISTS idx_timeline_events_tenant_id ON timeline_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_shipment_id ON timeline_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_trip_id ON timeline_events(trip_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_timestamp ON timeline_events(timestamp);

-- 创建POD表 (proof_of_delivery)
CREATE TABLE IF NOT EXISTS pods (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id UUID NOT NULL,
    shipment_id UUID NOT NULL,
    driver_id UUID,
    image_urls TEXT[] DEFAULT '{}',
    signature_data JSONB,
    delivery_notes TEXT,
    delivered_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建POD索引
CREATE INDEX IF NOT EXISTS idx_pods_tenant_id ON pods(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pods_shipment_id ON pods(shipment_id);
CREATE INDEX IF NOT EXISTS idx_pods_driver_id ON pods(driver_id);

-- 添加外键约束
ALTER TABLE trips ADD CONSTRAINT fk_trips_driver_id FOREIGN KEY (driver_id) REFERENCES drivers(id);
ALTER TABLE trips ADD CONSTRAINT fk_trips_vehicle_id FOREIGN KEY (vehicle_id) REFERENCES vehicles(id);
ALTER TABLE timeline_events ADD CONSTRAINT fk_timeline_events_shipment_id FOREIGN KEY (shipment_id) REFERENCES shipments(id);
ALTER TABLE timeline_events ADD CONSTRAINT fk_timeline_events_trip_id FOREIGN KEY (trip_id) REFERENCES trips(id);
ALTER TABLE pods ADD CONSTRAINT fk_pods_shipment_id FOREIGN KEY (shipment_id) REFERENCES shipments(id);
ALTER TABLE pods ADD CONSTRAINT fk_pods_driver_id FOREIGN KEY (driver_id) REFERENCES drivers(id);

-- 更新现有数据以符合新Schema
UPDATE customers 
SET phone = COALESCE(contact_info->>'phone', ''),
    email = COALESCE(contact_info->>'email', '')
WHERE phone IS NULL OR email IS NULL;

-- 为现有运单生成运单号（如果不存在）
UPDATE shipments 
SET shipment_no = 'SHIP-' || TO_CHAR(created_at, 'YYYYMMDD') || '-' || LPAD(EXTRACT(EPOCH FROM created_at)::INT % 10000, 4, '0')
WHERE shipment_no IS NULL;

-- 为现有车辆生成车牌号（如果不存在）
UPDATE vehicles 
SET plate_number = 'V-' || SUBSTRING(id::text, 1, 8)::UPPER
WHERE plate_number IS NULL;

-- 添加注释
COMMENT ON COLUMN customers.phone IS '客户联系电话';
COMMENT ON COLUMN customers.email IS '客户邮箱地址';
COMMENT ON COLUMN customers.default_pickup_address IS '默认取货地址';
COMMENT ON COLUMN customers.default_delivery_address IS '默认送货地址';
COMMENT ON COLUMN shipments.shipment_no IS '运单号';
COMMENT ON COLUMN shipments.shipper_address IS '发货地址';
COMMENT ON COLUMN shipments.receiver_address IS '收货地址';
COMMENT ON COLUMN drivers.level IS '司机等级';
COMMENT ON COLUMN drivers.home_city IS '司机所在城市';
COMMENT ON COLUMN drivers.current_trip_id IS '当前行程ID';
COMMENT ON COLUMN vehicles.plate_number IS '车牌号';
COMMENT ON COLUMN vehicles.type IS '车辆类型';
COMMENT ON COLUMN vehicles.capacity_kg IS '载重量(kg)';
COMMENT ON COLUMN vehicles.current_trip_id IS '当前行程ID';
