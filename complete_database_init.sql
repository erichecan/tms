-- 完整的数据库初始化脚本
-- 创建时间: 2025-10-20 23:10:00
-- 包含: Schema + Additional Tables + Location Tracking + Test Data
-- 适用于 GCP Cloud SQL PostgreSQL 部署

-- ====================================
-- 第一部分: 基础 Schema
-- ====================================

-- 启用 UUID 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 设置基本参数
SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- ====================================
-- 创建核心表
-- ====================================

-- 1. Tenants 表
CREATE TABLE IF NOT EXISTS tenants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name character varying(255) NOT NULL,
    domain character varying(255) NOT NULL UNIQUE,
    schema_name character varying(63) NOT NULL UNIQUE,
    status character varying(20) DEFAULT 'active',
    settings jsonb DEFAULT '{}',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 2. Users 表
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    profile jsonb DEFAULT '{}',
    status character varying(20) DEFAULT 'active',
    last_login_at timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- 3. Customers 表
CREATE TABLE IF NOT EXISTS customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    name character varying(255) NOT NULL,
    level character varying(50) DEFAULT 'standard',
    contact_info jsonb DEFAULT '{}',
    billing_info jsonb,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 4. Vehicles 表
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    plate_number character varying(50) NOT NULL UNIQUE,
    type character varying(50) NOT NULL,
    capacity_kg numeric(10,2),
    status character varying(20) DEFAULT 'available',
    current_location jsonb DEFAULT '{}',
    last_location_update timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 5. Drivers 表
CREATE TABLE IF NOT EXISTS drivers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    name character varying(255) NOT NULL,
    phone character varying(20),
    license_number character varying(50),
    vehicle_info jsonb DEFAULT '{}',
    status character varying(20) DEFAULT 'available',
    performance jsonb DEFAULT '{}',
    vehicle_id uuid REFERENCES vehicles(id),
    current_location jsonb DEFAULT '{}',
    last_location_update timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 6. Shipments 表
CREATE TABLE IF NOT EXISTS shipments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    shipment_number character varying(50) NOT NULL UNIQUE,
    customer_id uuid REFERENCES customers(id),
    driver_id uuid REFERENCES drivers(id),
    pickup_address jsonb NOT NULL,
    delivery_address jsonb NOT NULL,
    cargo_info jsonb NOT NULL,
    estimated_cost numeric(10,2),
    actual_cost numeric(10,2),
    additional_fees jsonb DEFAULT '[]',
    applied_rules jsonb DEFAULT '[]',
    status character varying(50) DEFAULT 'created',
    timeline jsonb DEFAULT '{}',
    notes text,
    shipper_name character varying(255),
    shipper_phone character varying(50),
    shipper_addr_line1 character varying(255),
    shipper_city character varying(100),
    shipper_province character varying(100),
    shipper_postal_code character varying(20),
    shipper_country character varying(100),
    receiver_name character varying(255),
    receiver_phone character varying(50),
    receiver_addr_line1 character varying(255),
    receiver_city character varying(100),
    receiver_province character varying(100),
    receiver_postal_code character varying(20),
    receiver_country character varying(100),
    weight_kg numeric(10,2),
    dimensions jsonb,
    final_cost numeric(10,2),
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 7. Assignments 表
CREATE TABLE IF NOT EXISTS assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 8. Notifications 表
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    type character varying(50) NOT NULL,
    target_role character varying(50) NOT NULL,
    shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
    driver_id uuid REFERENCES drivers(id),
    payload jsonb DEFAULT '{}',
    delivered boolean DEFAULT false,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 9. Timeline Events 表
CREATE TABLE IF NOT EXISTS timeline_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
    event_type character varying(50) NOT NULL,
    from_status character varying(50),
    to_status character varying(50),
    actor_type character varying(20) NOT NULL,
    actor_id uuid,
    timestamp timestamp DEFAULT CURRENT_TIMESTAMP,
    extra jsonb DEFAULT '{}'
);

-- 10. Financial Records 表
CREATE TABLE IF NOT EXISTS financial_records (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    type character varying(50) NOT NULL,
    reference_id uuid NOT NULL,
    amount numeric(10,2) NOT NULL,
    currency character varying(3) DEFAULT 'CAD',
    status character varying(20) DEFAULT 'pending',
    due_date date,
    paid_at timestamp,
    description text,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 11. Statements 表
CREATE TABLE IF NOT EXISTS statements (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    type character varying(50) NOT NULL,
    reference_id uuid NOT NULL,
    period_start date NOT NULL,
    period_end date NOT NULL,
    items jsonb NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    status character varying(20) DEFAULT 'draft',
    generated_at timestamp NOT NULL,
    generated_by character varying(255) NOT NULL,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 12. Proof of Delivery 表
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_id uuid REFERENCES shipments(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    uploaded_at timestamp DEFAULT CURRENT_TIMESTAMP,
    uploaded_by character varying(20) NOT NULL,
    note text
);

-- 13. Rules 表
CREATE TABLE IF NOT EXISTS rules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    name character varying(255) NOT NULL,
    description text,
    type character varying(50) NOT NULL,
    priority integer NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    status character varying(20) DEFAULT 'active',
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 14. Rule Executions 表
CREATE TABLE IF NOT EXISTS rule_executions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id uuid REFERENCES rules(id),
    context jsonb NOT NULL,
    result jsonb NOT NULL,
    execution_time integer,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 额外的表（Trips 和 Location Tracking）
-- ====================================

-- 15. Trips 表
CREATE TABLE IF NOT EXISTS trips (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id uuid REFERENCES drivers(id),
    vehicle_id uuid REFERENCES vehicles(id),
    start_time timestamp,
    end_time timestamp,
    status character varying(50) DEFAULT 'planned',
    route jsonb DEFAULT '{}',
    distance_km numeric(10,2),
    current_location jsonb DEFAULT '{}',
    last_location_update timestamp,
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- 16. Location Tracking 表
CREATE TABLE IF NOT EXISTS location_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id uuid NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0,
    direction NUMERIC(5, 2) DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 10,
    altitude NUMERIC(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 创建索引
-- ====================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_id ON drivers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_id ON shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_assignments_shipment_id ON assignments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver_id ON assignments(driver_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_shipment_id ON timeline_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_tenant_id ON financial_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_entity ON location_tracking(entity_type, entity_id, timestamp DESC);

-- ====================================
-- 创建实用函数
-- ====================================

-- 计算距离函数（哈弗辛公式）
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC, lng1 NUMERIC, 
    lat2 NUMERIC, lng2 NUMERIC
) 
RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 6371;
    dLat NUMERIC;
    dLng NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLng := RADIANS(lng2 - lng1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLng/2) * SIN(dLng/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO tms_user;

SELECT 'Database schema created successfully!' as status;


