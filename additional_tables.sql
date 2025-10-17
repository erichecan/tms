-- 添加缺失的表

-- 创建行程表
CREATE TABLE IF NOT EXISTS trips (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id uuid REFERENCES drivers(id),
    vehicle_id uuid REFERENCES vehicles(id),
    start_time timestamp without time zone,
    end_time timestamp without time zone,
    status character varying(50) DEFAULT 'planned',
    route jsonb DEFAULT '{}',
    distance_km numeric(10,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建分配表
CREATE TABLE IF NOT EXISTS assignments (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id uuid REFERENCES drivers(id),
    shipment_id uuid REFERENCES shipments(id),
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    status character varying(50) DEFAULT 'pending',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建通知表
CREATE TABLE IF NOT EXISTS notifications (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    driver_id uuid REFERENCES drivers(id),
    shipment_id uuid REFERENCES shipments(id),
    message text,
    type character varying(50),
    status character varying(20) DEFAULT 'unread',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建时间线事件表
CREATE TABLE IF NOT EXISTS timeline_events (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    shipment_id uuid REFERENCES shipments(id),
    event_type character varying(100) NOT NULL,
    description text,
    metadata jsonb DEFAULT '{}',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建财务记录表
CREATE TABLE IF NOT EXISTS financial_records (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid REFERENCES tenants(id),
    record_type character varying(50),
    amount numeric(12,2),
    currency character varying(3) DEFAULT 'CAD',
    reference_id uuid,
    reference_type character varying(50),
    description text,
    status character varying(20) DEFAULT 'pending',
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- 创建规则执行记录表
CREATE TABLE IF NOT EXISTS rule_executions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    rule_id uuid REFERENCES rules(id),
    tenant_id uuid REFERENCES tenants(id),
    execution_time timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    input_data jsonb,
    output_data jsonb,
    status character varying(20),
    error_message text
);

-- 授予权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tms_user;

