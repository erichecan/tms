-- 最小化 schema，不使用 DROP 语句

-- 创建 UUID 扩展（如果不存在）
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建租户表
CREATE TABLE IF NOT EXISTS tenants (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name character varying(255) NOT NULL,
    domain character varying(255) NOT NULL UNIQUE,
    schema_name character varying(63) NOT NULL,
    status character varying(20) DEFAULT 'active',
    settings jsonb DEFAULT '{}',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    email character varying(255) NOT NULL UNIQUE,
    password_hash character varying(255) NOT NULL,
    role character varying(50) NOT NULL,
    profile jsonb DEFAULT '{}',
    status character varying(20) DEFAULT 'active',
    last_login_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建客户表
CREATE TABLE IF NOT EXISTS customers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    name character varying(255) NOT NULL,
    contact_person character varying(255),
    phone character varying(50),
    email character varying(255),
    address text,
    status character varying(20) DEFAULT 'active',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建车辆表
CREATE TABLE IF NOT EXISTS vehicles (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    plate_number character varying(50) NOT NULL UNIQUE,
    type character varying(50) NOT NULL,
    capacity_kg numeric(10,2),
    status character varying(20) DEFAULT 'available',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建司机表
CREATE TABLE IF NOT EXISTS drivers (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    name character varying(255) NOT NULL,
    phone character varying(50) NOT NULL,
    license_number character varying(100),
    vehicle_id uuid REFERENCES vehicles(id),
    status character varying(20) DEFAULT 'available',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建货运表
CREATE TABLE IF NOT EXISTS shipments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    customer_id uuid REFERENCES customers(id),
    driver_id uuid REFERENCES drivers(id),
    tracking_number character varying(100) NOT NULL UNIQUE,
    origin jsonb NOT NULL,
    destination jsonb NOT NULL,
    cargo_info jsonb DEFAULT '{}',
    status character varying(50) DEFAULT 'pending',
    estimated_delivery timestamp without time zone,
    actual_delivery timestamp without time zone,
    pricing_info jsonb DEFAULT '{}',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建规则表
CREATE TABLE IF NOT EXISTS rules (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    name character varying(255) NOT NULL,
    description text,
    rule_type character varying(50) NOT NULL,
    conditions jsonb NOT NULL,
    actions jsonb NOT NULL,
    priority integer DEFAULT 0,
    enabled boolean DEFAULT true,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 授予 tms_user 所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tms_user;

