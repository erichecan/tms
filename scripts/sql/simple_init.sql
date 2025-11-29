-- TMS 数据库初始化脚本（简化版）
-- 创建时间：2025-10-16 17:30:00
-- 避免权限问题，只创建必要的表结构

-- 创建基本表（如果不存在）
CREATE TABLE IF NOT EXISTS tenants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'US',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS drivers (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    license_number VARCHAR(100),
    license_expiry DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS vehicles (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    make VARCHAR(100),
    model VARCHAR(100),
    year INTEGER,
    license_plate VARCHAR(50) UNIQUE,
    capacity DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS shipments (
    id SERIAL PRIMARY KEY,
    tenant_id INTEGER REFERENCES tenants(id),
    customer_id INTEGER REFERENCES customers(id),
    driver_id INTEGER REFERENCES drivers(id),
    vehicle_id INTEGER REFERENCES vehicles(id),
    tracking_number VARCHAR(100) UNIQUE,
    status VARCHAR(50) DEFAULT 'pending',
    pickup_address TEXT,
    delivery_address TEXT,
    pickup_date TIMESTAMP,
    delivery_date TIMESTAMP,
    estimated_cost DECIMAL(10,2),
    final_cost DECIMAL(10,2),
    weight DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS assignments (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    driver_id INTEGER REFERENCES drivers(id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'assigned'
);

CREATE TABLE IF NOT EXISTS timeline_events (
    id SERIAL PRIMARY KEY,
    shipment_id INTEGER REFERENCES shipments(id),
    event_type VARCHAR(100) NOT NULL,
    description TEXT,
    event_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_shipments_tenant_id ON shipments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(status);
CREATE INDEX IF NOT EXISTS idx_shipments_customer_id ON shipments(customer_id);
CREATE INDEX IF NOT EXISTS idx_shipments_driver_id ON shipments(driver_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_shipment_id ON timeline_events(shipment_id);

-- 插入默认租户
INSERT INTO tenants (name, domain) VALUES ('Default Tenant', 'default.local') ON CONFLICT DO NOTHING;

-- 插入默认用户（密码：admin123）
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role) 
VALUES (1, 'admin@tms.local', '$2b$10$rQZ8KjJ8KjJ8KjJ8KjJ8K.8KjJ8KjJ8KjJ8KjJ8KjJ8KjJ8KjJ8KjJ8K', 'Admin', 'User', 'admin') 
ON CONFLICT (email) DO NOTHING;

-- 显示创建的表
SELECT 'Database initialization completed successfully!' as message;
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
