-- TMS平台数据库初始化脚本
-- 创建时间: 2025-01-27 15:30:45

-- 创建扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 创建租户管理相关表
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    schema_name VARCHAR(63) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    profile JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active',
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, email)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_tenants_schema_name ON tenants(schema_name);
CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 插入默认租户（用于开发测试）
INSERT INTO tenants (id, name, domain, schema_name) 
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'TMS Demo Company',
    'demo.tms-platform.com',
    'tenant_demo'
) ON CONFLICT (domain) DO NOTHING;

-- 插入默认管理员用户
INSERT INTO users (id, tenant_id, email, password_hash, role)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@demo.tms-platform.com',
    '$2a$10$GplA4J5iV/b/9gA.Ie3m.OqISjLdC0caN203n4i/TEc2T5.ZDCz/6', -- admin123
    'admin'
) ON CONFLICT (tenant_id, email) DO NOTHING;

-- 创建客户表
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    level VARCHAR(50) DEFAULT 'standard',
    contact_info JSONB DEFAULT '{}',
    billing_info JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建司机表
CREATE TABLE IF NOT EXISTS drivers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    license_number VARCHAR(50),
    vehicle_info JSONB DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'available',
    performance JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建运单表
CREATE TABLE IF NOT EXISTS shipments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    shipment_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID REFERENCES customers(id),
    driver_id UUID REFERENCES drivers(id),
    pickup_address JSONB NOT NULL,
    delivery_address JSONB NOT NULL,
    cargo_info JSONB NOT NULL,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'CAD', 'EUR')),
    additional_fees JSONB DEFAULT '[]',
    applied_rules JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'created',
    timeline JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- MVP: 扩展运单结构（保持向后兼容） // 2025-09-23 10:05:00
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_name VARCHAR(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_phone VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_addr_line1 VARCHAR(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_city VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_province VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_postal_code VARCHAR(20);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS shipper_country VARCHAR(100);

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_name VARCHAR(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_phone VARCHAR(50);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_addr_line1 VARCHAR(255);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_city VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_province VARCHAR(100);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_postal_code VARCHAR(20);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS receiver_country VARCHAR(100);

ALTER TABLE shipments ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(10,2);
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS dimensions JSONB; -- {lengthCm,widthCm,heightCm}
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS final_cost DECIMAL(10,2);

-- 创建规则表
CREATE TABLE IF NOT EXISTS rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    priority INTEGER NOT NULL,
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建规则执行日志表
CREATE TABLE IF NOT EXISTS rule_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES rules(id),
    context JSONB NOT NULL,
    result JSONB NOT NULL,
    execution_time INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建财务记录表
CREATE TABLE IF NOT EXISTS financial_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'CAD', 'EUR')),
    status VARCHAR(20) DEFAULT 'pending',
    due_date DATE,
    paid_at TIMESTAMP,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建汇率表
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    from_currency VARCHAR(3) NOT NULL CHECK (from_currency IN ('CAD', 'USD', 'CAD', 'EUR')),
    to_currency VARCHAR(3) NOT NULL CHECK (to_currency IN ('CAD', 'USD', 'CAD', 'EUR')),
    rate DECIMAL(10,6) NOT NULL,
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    effective_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_currency, to_currency, effective_date)
);

-- 创建对账单表
CREATE TABLE IF NOT EXISTS statements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    items JSONB NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    generated_at TIMESTAMP NOT NULL,
    generated_by VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_level ON customers(level);
CREATE INDEX IF NOT EXISTS idx_drivers_tenant_id ON drivers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status);
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_id ON shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_shipment_number ON shipments(shipment_number);

-- 车辆表（MVP） // 2025-09-23 10:05:00
CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plate_number VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL,
    capacity_kg DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 司机-车辆简单关联（可选） // 2025-09-23 10:05:00
ALTER TABLE drivers ADD COLUMN IF NOT EXISTS vehicle_id UUID REFERENCES vehicles(id);
CREATE INDEX IF NOT EXISTS idx_drivers_vehicle_id ON drivers(vehicle_id);

-- 分配表（MVP） // 2025-09-23 10:05:00
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_assignments_shipment_id ON assignments(shipment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_driver_id ON assignments(driver_id);

-- 时间线事件（MVP） // 2025-09-23 10:05:00
CREATE TABLE IF NOT EXISTS timeline_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    from_status VARCHAR(50),
    to_status VARCHAR(50),
    actor_type VARCHAR(20) NOT NULL, -- system/user/driver
    actor_id UUID,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    extra JSONB DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_timeline_events_shipment_id ON timeline_events(shipment_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_event_type ON timeline_events(event_type);

-- 交付证明（POD）（MVP） // 2025-09-23 10:05:00
CREATE TABLE IF NOT EXISTS proof_of_delivery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    uploaded_by VARCHAR(20) NOT NULL, -- Driver/User
    note TEXT
);
CREATE INDEX IF NOT EXISTS idx_pod_shipment_id ON proof_of_delivery(shipment_id);

-- 通知（Stub）（MVP） // 2025-09-23 10:05:00
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- ASSIGNMENT|STATUS_CHANGE
    target_role VARCHAR(50) NOT NULL, -- DRIVER|FLEET_MANAGER
    shipment_id UUID REFERENCES shipments(id) ON DELETE CASCADE,
    driver_id UUID REFERENCES drivers(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    payload JSONB DEFAULT '{}',
    delivered BOOLEAN DEFAULT false
);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_shipment_id ON notifications(shipment_id);
CREATE INDEX IF NOT EXISTS idx_rules_tenant_id ON rules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rules_type ON rules(type);
CREATE INDEX IF NOT EXISTS idx_rules_status ON rules(status);
CREATE INDEX IF NOT EXISTS idx_rules_priority ON rules(priority);
CREATE INDEX IF NOT EXISTS idx_rule_executions_tenant_id ON rule_executions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_rule_executions_rule_id ON rule_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_tenant_id ON financial_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_financial_records_type ON financial_records(type);
CREATE INDEX IF NOT EXISTS idx_financial_records_status ON financial_records(status);
CREATE INDEX IF NOT EXISTS idx_financial_records_reference_id ON financial_records(reference_id);
CREATE INDEX IF NOT EXISTS idx_statements_tenant_id ON statements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_statements_type ON statements(type);
CREATE INDEX IF NOT EXISTS idx_statements_status ON statements(status);
CREATE INDEX IF NOT EXISTS idx_statements_reference_id ON statements(reference_id);

-- 插入示例数据
INSERT INTO customers (id, tenant_id, name, level, contact_info, billing_info)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '示例客户公司',
    'vip',
    '{"email": "customer@example.com", "phone": "13800138000", "address": {"street": "示例街道123号", "city": "北京", "state": "北京", "postalCode": "100000", "country": "中国"}, "contactPerson": "张经理"}',
    '{"companyName": "示例客户公司", "taxId": "91110000000000000X", "billingAddress": {"street": "示例街道123号", "city": "北京", "state": "北京", "postalCode": "100000", "country": "中国"}, "paymentTerms": "月结30天"}'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO drivers (id, tenant_id, name, phone, license_number, vehicle_info, status, performance)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    '李司机',
    '13900139000',
    'A123456789',
    '{"type": "truck", "licensePlate": "京A12345", "capacity": 10000, "dimensions": {"length": 6, "width": 2.5, "height": 2.8}, "features": ["尾板", "GPS"]}',
    'active',
    '{"rating": 4.8, "totalDeliveries": 150, "onTimeRate": 0.95, "customerSatisfaction": 0.92}'
) ON CONFLICT (id) DO NOTHING;

-- 插入示例规则
INSERT INTO rules (id, tenant_id, name, description, type, priority, conditions, actions, status)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'VIP客户长途折扣',
    'VIP客户运输距离超过500公里时享受15%折扣',
    'pricing',
    100,
    '[{"fact": "customerLevel", "operator": "equal", "value": "vip"}, {"fact": "transportDistance", "operator": "greaterThan", "value": 500}]',
    '[{"type": "applyDiscount", "params": {"percentage": 15}}]',
    'active'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO rules (id, tenant_id, name, description, type, priority, conditions, actions, status)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    '司机基础提成',
    '所有司机基础提成30%',
    'payroll',
    300,
    '[{"fact": "driverId", "operator": "isNotEmpty", "value": ""}]',
    '[{"type": "setDriverCommission", "params": {"percentage": 30}}]',
    'active'
) ON CONFLICT (id) DO NOTHING;

-- 插入初始汇率数据
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, effective_date) VALUES
('CAD', 'USD', 0.140000, 'initial', CURRENT_TIMESTAMP),
('CAD', 'CAD', 0.190000, 'initial', CURRENT_TIMESTAMP),
('CAD', 'EUR', 0.130000, 'initial', CURRENT_TIMESTAMP),
('USD', 'CAD', 7.200000, 'initial', CURRENT_TIMESTAMP),
('USD', 'CAD', 1.350000, 'initial', CURRENT_TIMESTAMP),
('USD', 'EUR', 0.920000, 'initial', CURRENT_TIMESTAMP),
('CAD', 'CAD', 5.300000, 'initial', CURRENT_TIMESTAMP),
('CAD', 'USD', 0.740000, 'initial', CURRENT_TIMESTAMP),
('CAD', 'EUR', 0.680000, 'initial', CURRENT_TIMESTAMP),
('EUR', 'CAD', 7.800000, 'initial', CURRENT_TIMESTAMP),
('EUR', 'USD', 1.090000, 'initial', CURRENT_TIMESTAMP),
('EUR', 'CAD', 1.470000, 'initial', CURRENT_TIMESTAMP);
