-- 测试数据生成脚本
-- 创建时间: 2025-10-17 23:05:00
-- 描述: 为所有表生成10条测试数据，包含真实的多伦多地区位置信息

-- ====================================
-- 辅助函数：生成随机多伦多地区坐标
-- ====================================

CREATE OR REPLACE FUNCTION random_toronto_location() 
RETURNS JSONB AS $$
DECLARE
    -- 多伦多市中心坐标范围
    -- 北约克: 43.76, -79.41
    -- 市中心: 43.65, -79.38
    -- 士嘉堡: 43.77, -79.23
    base_lat NUMERIC := 43.70;
    base_lng NUMERIC := -79.40;
    lat NUMERIC;
    lng NUMERIC;
BEGIN
    lat := base_lat + (RANDOM() - 0.5) * 0.2;  -- ±0.1度范围
    lng := base_lng + (RANDOM() - 0.5) * 0.3;  -- ±0.15度范围
    
    RETURN jsonb_build_object(
        'latitude', ROUND(lat::numeric, 6),
        'longitude', ROUND(lng::numeric, 6),
        'speed', FLOOR(RANDOM() * 60)::INTEGER,
        'direction', FLOOR(RANDOM() * 360)::INTEGER,
        'timestamp', NOW(),
        'accuracy', ROUND((RANDOM() * 10 + 5)::numeric, 2)
    );
END;
$$ LANGUAGE plpgsql VOLATILE;

-- ====================================
-- 1. Tenants 表（租户）- 添加9条
-- ====================================

INSERT INTO tenants (id, name, domain, schema_name, status, settings, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000002', 'Toronto Logistics Inc', 'toronto-logistics.tms-platform.com', 'tenant_toronto', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'Express Delivery Co', 'express-delivery.tms-platform.com', 'tenant_express', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', 'Fast Freight Services', 'fast-freight.tms-platform.com', 'tenant_freight', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', 'Green Transport Ltd', 'green-transport.tms-platform.com', 'tenant_green', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000006', 'Metro Shipping Co', 'metro-shipping.tms-platform.com', 'tenant_metro', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000007', 'Prime Logistics', 'prime-logistics.tms-platform.com', 'tenant_prime', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000008', 'Swift Movers', 'swift-movers.tms-platform.com', 'tenant_swift', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000009', 'Reliable Transport', 'reliable-transport.tms-platform.com', 'tenant_reliable', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW()),
    ('00000000-0000-0000-0000-00000000000a', 'Elite Delivery Services', 'elite-delivery.tms-platform.com', 'tenant_elite', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 2. Users 表（用户）- 添加8条
-- ====================================

INSERT INTO users (id, tenant_id, email, password_hash, role, profile, status, created_at, updated_at)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'dispatcher@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dispatcher', '{"name": "调度员张三"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'driver@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', '{"name": "司机李四"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'manager@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', '{"name": "经理王五"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000002', 'admin@toronto-logistics.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "John Smith"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'dispatcher@toronto-logistics.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dispatcher', '{"name": "Sarah Johnson"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000003', 'admin@express-delivery.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "Michael Brown"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000004', 'admin@fast-freight.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "Emily Davis"}', 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000005', 'admin@green-transport.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "David Wilson"}', 'active', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- ====================================
-- 3. Customers 表（客户）- 10条
-- ====================================

INSERT INTO customers (id, tenant_id, name, contact_person, email, phone, address, status, created_at, updated_at)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Walmart Canada', 'John Doe', 'john.doe@walmart.ca', '+1 (416) 555-0101', jsonb_build_object('street', '3401 Dufferin St', 'city', 'North York', 'province', 'ON', 'postal_code', 'M6A 2T9', 'country', 'Canada', 'latitude', 43.7615, 'longitude', -79.4635), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Costco Toronto', 'Jane Smith', 'jane.smith@costco.ca', '+1 (416) 555-0102', jsonb_build_object('street', '1411 Warden Ave', 'city', 'Scarborough', 'province', 'ON', 'postal_code', 'M1R 5B7', 'country', 'Canada', 'latitude', 43.7532, 'longitude', -79.2985), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Canadian Tire', 'Bob Johnson', 'bob.johnson@canadiantire.ca', '+1 (416) 555-0103', jsonb_build_object('street', '839 Yonge St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4W 2H2', 'country', 'Canada', 'latitude', 43.6735, 'longitude', -79.3867), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Home Depot', 'Alice Brown', 'alice.brown@homedepot.ca', '+1 (416) 555-0104', jsonb_build_object('street', '50 Bloor St W', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4W 1A1', 'country', 'Canada', 'latitude', 43.6707, 'longitude', -79.3873), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'IKEA Toronto', 'Charlie Davis', 'charlie.davis@ikea.ca', '+1 (416) 555-0105', jsonb_build_object('street', '15 Provost Dr', 'city', 'North York', 'province', 'ON', 'postal_code', 'M2K 2X9', 'country', 'Canada', 'latitude', 43.7735, 'longitude', -79.4042), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Best Buy Toronto', 'Diana Wilson', 'diana.wilson@bestbuy.ca', '+1 (416) 555-0106', jsonb_build_object('street', '2200 Yonge St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4S 2C6', 'country', 'Canada', 'latitude', 43.7068, 'longitude', -79.3983), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Sobeys', 'Edward Martinez', 'edward.martinez@sobeys.ca', '+1 (416) 555-0107', jsonb_build_object('street', '595 Bay St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5G 2C2', 'country', 'Canada', 'latitude', 43.6559, 'longitude', -79.3832), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Metro Grocery', 'Fiona Garcia', 'fiona.garcia@metro.ca', '+1 (416) 555-0108', jsonb_build_object('street', '87 Front St E', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5E 1C3', 'country', 'Canada', 'latitude', 43.6486, 'longitude', -79.3735), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'Loblaws', 'George Lee', 'george.lee@loblaws.ca', '+1 (416) 555-0109', jsonb_build_object('street', '60 Carlton St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5B 1J2', 'country', 'Canada', 'latitude', 43.6615, 'longitude', -79.3792), 'active', NOW(), NOW()),
    ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'Shoppers Drug Mart', 'Hannah Kim', 'hannah.kim@shoppersdrugmart.ca', '+1 (416) 555-0110', jsonb_build_object('street', '123 King St W', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5H 1A1', 'country', 'Canada', 'latitude', 43.6488, 'longitude', -79.3817), 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 4. Vehicles 表（车辆）- 10条（带位置）
-- ====================================

INSERT INTO vehicles (id, tenant_id, plate_number, type, capacity_kg, status, current_location, last_location_update, created_at, updated_at)
VALUES 
    ('30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'CABN-101', 'Box Truck', 3000.00, 'available', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'CABN-102', 'Cargo Van', 1500.00, 'available', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'CABN-103', 'Flatbed Truck', 5000.00, 'busy', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'CABN-104', 'Refrigerated Truck', 4000.00, 'available', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'CABN-105', 'Box Truck', 3500.00, 'busy', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'CATO-201', 'Cargo Van', 1800.00, 'available', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'CATO-202', 'Box Truck', 3200.00, 'busy', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'CAEX-301', 'Flatbed Truck', 6000.00, 'available', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'CAEX-302', 'Refrigerated Truck', 4500.00, 'maintenance', random_toronto_location(), NOW(), NOW(), NOW()),
    ('30000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'CAFF-401', 'Box Truck', 3800.00, 'available', random_toronto_location(), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 5. Drivers 表（司机）- 10条（带位置）
-- ====================================

INSERT INTO drivers (id, tenant_id, name, phone, license_number, status, vehicle_id, current_location, last_location_update, created_at, updated_at)
VALUES 
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'James Wilson', '+1 (416) 123-4501', 'DL-001-2024', 'available', '30000000-0000-0000-0000-000000000001', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Robert Brown', '+1 (416) 123-4502', 'DL-002-2024', 'available', '30000000-0000-0000-0000-000000000002', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Michael Davis', '+1 (416) 123-4503', 'DL-003-2024', 'busy', '30000000-0000-0000-0000-000000000003', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'William Martinez', '+1 (416) 123-4504', 'DL-004-2024', 'available', '30000000-0000-0000-0000-000000000004', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'David Garcia', '+1 (416) 123-4505', 'DL-005-2024', 'busy', '30000000-0000-0000-0000-000000000005', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Richard Rodriguez', '+1 (416) 123-4506', 'DL-006-2024', 'available', '30000000-0000-0000-0000-000000000006', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Joseph Lee', '+1 (416) 123-4507', 'DL-007-2024', 'busy', '30000000-0000-0000-0000-000000000007', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Thomas Kim', '+1 (416) 123-4508', 'DL-008-2024', 'available', '30000000-0000-0000-0000-000000000008', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'Christopher Chen', '+1 (416) 123-4509', 'DL-009-2024', 'on_leave', '30000000-0000-0000-0000-000000000009', random_toronto_location(), NOW(), NOW(), NOW()),
    ('40000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'Daniel Wang', '+1 (416) 123-4510', 'DL-010-2024', 'available', '30000000-0000-0000-0000-00000000000a', random_toronto_location(), NOW(), NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 6. Shipments 表（运单）- 10条
-- ====================================

INSERT INTO shipments (id, tenant_id, customer_id, driver_id, status, pickup_address, delivery_address, cargo_details, scheduled_pickup_time, scheduled_delivery_time, cost, created_at, updated_at)
VALUES 
    ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', 'pending', 
     jsonb_build_object('street', '3401 Dufferin St', 'city', 'North York', 'province', 'ON', 'postal_code', 'M6A 2T9', 'latitude', 43.7615, 'longitude', -79.4635),
     jsonb_build_object('street', '1411 Warden Ave', 'city', 'Scarborough', 'province', 'ON', 'postal_code', 'M1R 5B7', 'latitude', 43.7532, 'longitude', -79.2985),
     jsonb_build_object('weight', 500, 'volume', 2.5, 'description', 'Electronics'), NOW() + INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 150.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', 'in_transit', 
     jsonb_build_object('street', '839 Yonge St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4W 2H2', 'latitude', 43.6735, 'longitude', -79.3867),
     jsonb_build_object('street', '50 Bloor St W', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4W 1A1', 'latitude', 43.6707, 'longitude', -79.3873),
     jsonb_build_object('weight', 300, 'volume', 1.8, 'description', 'Furniture'), NOW() - INTERVAL '1 hour', NOW() + INTERVAL '1 hour', 120.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', 'in_transit', 
     jsonb_build_object('street', '15 Provost Dr', 'city', 'North York', 'province', 'ON', 'postal_code', 'M2K 2X9', 'latitude', 43.7735, 'longitude', -79.4042),
     jsonb_build_object('street', '2200 Yonge St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4S 2C6', 'latitude', 43.7068, 'longitude', -79.3983),
     jsonb_build_object('weight', 800, 'volume', 4.2, 'description', 'Building Materials'), NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '2 hours', 200.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', 'delivered', 
     jsonb_build_object('street', '595 Bay St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5G 2C2', 'latitude', 43.6559, 'longitude', -79.3832),
     jsonb_build_object('street', '87 Front St E', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5E 1C3', 'latitude', 43.6486, 'longitude', -79.3735),
     jsonb_build_object('weight', 250, 'volume', 1.2, 'description', 'Groceries'), NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', 100.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', 'in_transit', 
     jsonb_build_object('street', '60 Carlton St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5B 1J2', 'latitude', 43.6615, 'longitude', -79.3792),
     jsonb_build_object('street', '123 King St W', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5H 1A1', 'latitude', 43.6488, 'longitude', -79.3817),
     jsonb_build_object('weight', 150, 'volume', 0.8, 'description', 'Pharmaceuticals'), NOW() - INTERVAL '20 minutes', NOW() + INTERVAL '40 minutes', 80.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', 'pending', 
     jsonb_build_object('street', '3401 Dufferin St', 'city', 'North York', 'province', 'ON', 'postal_code', 'M6A 2T9', 'latitude', 43.7615, 'longitude', -79.4635),
     jsonb_build_object('street', '595 Bay St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5G 2C2', 'latitude', 43.6559, 'longitude', -79.3832),
     jsonb_build_object('weight', 600, 'volume', 3.0, 'description', 'Appliances'), NOW() + INTERVAL '3 hours', NOW() + INTERVAL '5 hours', 180.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', 'in_transit', 
     jsonb_build_object('street', '839 Yonge St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4W 2H2', 'latitude', 43.6735, 'longitude', -79.3867),
     jsonb_build_object('street', '1411 Warden Ave', 'city', 'Scarborough', 'province', 'ON', 'postal_code', 'M1R 5B7', 'latitude', 43.7532, 'longitude', -79.2985),
     jsonb_build_object('weight', 400, 'volume', 2.0, 'description', 'Office Supplies'), NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '1.5 hours', 140.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', 'pending', 
     jsonb_build_object('street', '15 Provost Dr', 'city', 'North York', 'province', 'ON', 'postal_code', 'M2K 2X9', 'latitude', 43.7735, 'longitude', -79.4042),
     jsonb_build_object('street', '60 Carlton St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5B 1J2', 'latitude', 43.6615, 'longitude', -79.3792),
     jsonb_build_object('weight', 700, 'volume', 3.5, 'description', 'Industrial Equipment'), NOW() + INTERVAL '4 hours', NOW() + INTERVAL '6 hours', 220.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000009', NULL, 'pending', 
     jsonb_build_object('street', '2200 Yonge St', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4S 2C6', 'latitude', 43.7068, 'longitude', -79.3983),
     jsonb_build_object('street', '50 Bloor St W', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M4W 1A1', 'latitude', 43.6707, 'longitude', -79.3873),
     jsonb_build_object('weight', 200, 'volume', 1.0, 'description', 'Books'), NOW() + INTERVAL '5 hours', NOW() + INTERVAL '7 hours', 90.00, NOW(), NOW()),
    
    ('50000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-00000000000a', NULL, 'pending', 
     jsonb_build_object('street', '87 Front St E', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5E 1C3', 'latitude', 43.6486, 'longitude', -79.3735),
     jsonb_build_object('street', '123 King St W', 'city', 'Toronto', 'province', 'ON', 'postal_code', 'M5H 1A1', 'latitude', 43.6488, 'longitude', -79.3817),
     jsonb_build_object('weight', 100, 'volume', 0.5, 'description', 'Documents'), NOW() + INTERVAL '6 hours', NOW() + INTERVAL '8 hours', 60.00, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 7. Trips 表（行程）- 10条（带位置）
-- ====================================

INSERT INTO trips (id, driver_id, vehicle_id, start_time, end_time, status, route, distance_km, current_location, last_location_update, created_at, updated_at)
VALUES 
    ('60000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', NOW(), NOW() + INTERVAL '3 hours', 'planned', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.7615, 'lng', -79.4635), jsonb_build_object('lat', 43.7532, 'lng', -79.2985)]), 
     15.5, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '2 hours', 'ongoing', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.6735, 'lng', -79.3867), jsonb_build_object('lat', 43.6707, 'lng', -79.3873)]), 
     2.8, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '2.5 hours', 'ongoing', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.7735, 'lng', -79.4042), jsonb_build_object('lat', 43.7068, 'lng', -79.3983)]), 
     8.3, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '30000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 hours', NOW() - INTERVAL '1 hour', 'completed', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.6559, 'lng', -79.3832), jsonb_build_object('lat', 43.6486, 'lng', -79.3735)]), 
     1.2, random_toronto_location(), NOW() - INTERVAL '1 hour', NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', '30000000-0000-0000-0000-000000000005', NOW() - INTERVAL '20 minutes', NOW() + INTERVAL '1 hour', 'ongoing', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.6615, 'lng', -79.3792), jsonb_build_object('lat', 43.6488, 'lng', -79.3817)]), 
     1.8, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', '30000000-0000-0000-0000-000000000006', NOW() + INTERVAL '2 hours', NOW() + INTERVAL '5 hours', 'planned', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.7615, 'lng', -79.4635), jsonb_build_object('lat', 43.6559, 'lng', -79.3832)]), 
     12.7, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', '30000000-0000-0000-0000-000000000007', NOW() - INTERVAL '45 minutes', NOW() + INTERVAL '1.5 hours', 'ongoing', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.6735, 'lng', -79.3867), jsonb_build_object('lat', 43.7532, 'lng', -79.2985)]), 
     18.2, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', '30000000-0000-0000-0000-000000000008', NOW() + INTERVAL '3 hours', NOW() + INTERVAL '6 hours', 'planned', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.7735, 'lng', -79.4042), jsonb_build_object('lat', 43.6615, 'lng', -79.3792)]), 
     14.5, random_toronto_location(), NOW(), NOW(), NOW()),
    
    ('60000000-0000-0000-0000-000000000009', NULL, NULL, NOW() + INTERVAL '4 hours', NOW() + INTERVAL '7 hours', 'planned', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.7068, 'lng', -79.3983), jsonb_build_object('lat', 43.6707, 'lng', -79.3873)]), 
     5.2, NULL, NULL, NOW(), NOW()),
    
    ('60000000-0000-0000-0000-00000000000a', NULL, NULL, NOW() + INTERVAL '5 hours', NOW() + INTERVAL '8 hours', 'planned', 
     jsonb_build_object('waypoints', ARRAY[jsonb_build_object('lat', 43.6486, 'lng', -79.3735), jsonb_build_object('lat', 43.6488, 'lng', -79.3817)]), 
     0.8, NULL, NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 8. Rules 表（规则）- 10条
-- ====================================

INSERT INTO rules (id, tenant_id, name, description, conditions, actions, priority, status, created_at, updated_at)
VALUES 
    ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Auto Dispatch High Priority', 'Automatically dispatch high priority shipments', '{"priority": "high", "status": "pending"}', '{"action": "auto_dispatch"}', 10, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Same Day Delivery Alert', 'Alert for same day delivery requests', '{"deliveryType": "same_day"}', '{"action": "notify_dispatcher"}', 9, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Overweight Cargo Check', 'Check for overweight cargo', '{"weight": {"$gt": 5000}}', '{"action": "require_approval"}', 8, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Driver Hours Limit', 'Warn when driver exceeds working hours', '{"driverHours": {"$gt": 10}}', '{"action": "send_warning"}', 7, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Late Delivery Alert', 'Alert when delivery is running late', '{"estimatedDelay": {"$gt": 30}}', '{"action": "notify_customer"}', 6, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Fuel Low Warning', 'Warn when vehicle fuel is low', '{"fuelLevel": {"$lt": 20}}', '{"action": "notify_driver"}', 5, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Maintenance Due', 'Alert when vehicle maintenance is due', '{"maintenanceKm": {"$gt": 5000}}', '{"action": "schedule_maintenance"}', 4, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Customer Preference', 'Apply customer delivery preferences', '{"customerId": {"$in": ["preferred_customers"]}}', '{"action": "assign_preferred_driver"}', 3, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'Route Optimization', 'Optimize route for multiple stops', '{"stops": {"$gt": 3}}', '{"action": "optimize_route"}', 2, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'Weekend Surcharge', 'Apply surcharge for weekend deliveries', '{"dayOfWeek": {"$in": [6, 7]}}', '{"action": "apply_surcharge", "amount": 25}', 1, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 9. Assignments 表（分配）- 10条
-- ====================================

INSERT INTO assignments (id, shipment_id, driver_id, assignment_time, status, created_at, updated_at)
VALUES 
    ('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', NOW(), 'assigned', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', 'in_progress', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes', 'in_progress', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 hours', 'completed', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', NOW() - INTERVAL '20 minutes', 'in_progress', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', NOW(), 'assigned', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', NOW() - INTERVAL '45 minutes', 'in_progress', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', NOW(), 'assigned', NOW(), NOW()),
    ('80000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', NULL, NOW(), 'pending', NOW(), NOW()),
    ('80000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-00000000000a', NULL, NOW(), 'pending', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 10. Notifications 表（通知）- 10条
-- ====================================

INSERT INTO notifications (id, user_id, shipment_id, message, type, is_read, created_at)
VALUES 
    ('90000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'New shipment assigned to James Wilson', 'assignment', false, NOW()),
    ('90000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'Shipment is now in transit', 'status_update', false, NOW() - INTERVAL '1 hour'),
    ('90000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000003', 'Shipment pickup completed', 'pickup', true, NOW() - INTERVAL '30 minutes'),
    ('90000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000004', 'Shipment delivered successfully', 'delivery', true, NOW() - INTERVAL '3 hours'),
    ('90000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000005', 'Estimated arrival in 40 minutes', 'eta_update', false, NOW() - INTERVAL '20 minutes'),
    ('90000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000006', 'New shipment created', 'creation', false, NOW()),
    ('90000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000007', 'Driver delayed - 15 minutes', 'delay', false, NOW() - INTERVAL '45 minutes'),
    ('90000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000008', 'Shipment requires approval', 'approval_required', false, NOW()),
    ('90000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000009', 'Awaiting driver assignment', 'pending_assignment', false, NOW()),
    ('90000000-0000-0000-0000-00000000000a', '10000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-00000000000a', 'Customer requested same-day delivery', 'urgent', false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 11. Timeline Events 表（时间线事件）- 10条
-- ====================================

INSERT INTO timeline_events (id, shipment_id, event_type, description, event_time, location, created_at)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'pickup', 'Package picked up from sender', NOW() - INTERVAL '1 hour', jsonb_build_object('lat', 43.6735, 'lng', -79.3867, 'address', '839 Yonge St'), NOW()),
    ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'in_transit', 'Package in transit', NOW() - INTERVAL '45 minutes', jsonb_build_object('lat', 43.6721, 'lng', -79.3860, 'address', 'On Route'), NOW()),
    ('a0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'pickup', 'Package picked up from warehouse', NOW() - INTERVAL '30 minutes', jsonb_build_object('lat', 43.7735, 'lng', -79.4042, 'address', '15 Provost Dr'), NOW()),
    ('a0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'pickup', 'Package picked up', NOW() - INTERVAL '3 hours', jsonb_build_object('lat', 43.6559, 'lng', -79.3832, 'address', '595 Bay St'), NOW()),
    ('a0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000004', 'delivery', 'Package delivered', NOW() - INTERVAL '1 hour', jsonb_build_object('lat', 43.6486, 'lng', -79.3735, 'address', '87 Front St E'), NOW()),
    ('a0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000005', 'pickup', 'Package picked up', NOW() - INTERVAL '20 minutes', jsonb_build_object('lat', 43.6615, 'lng', -79.3792, 'address', '60 Carlton St'), NOW()),
    ('a0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005', 'in_transit', 'Approaching destination', NOW() - INTERVAL '10 minutes', jsonb_build_object('lat', 43.6551, 'lng', -79.3804, 'address', 'On Route'), NOW()),
    ('a0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000007', 'pickup', 'Package picked up', NOW() - INTERVAL '45 minutes', jsonb_build_object('lat', 43.6735, 'lng', -79.3867, 'address', '839 Yonge St'), NOW()),
    ('a0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000007', 'checkpoint', 'Passed checkpoint', NOW() - INTERVAL '25 minutes', jsonb_build_object('lat', 43.7133, 'lng', -79.3426, 'address', 'Checkpoint A'), NOW()),
    ('a0000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000007', 'in_transit', 'In transit to destination', NOW() - INTERVAL '15 minutes', jsonb_build_object('lat', 43.7432, 'lng', -79.3185, 'address', 'On Route'), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 12. Financial Records 表（财务记录）- 10条
-- ====================================

INSERT INTO financial_records (id, tenant_id, record_type, amount, currency, description, related_shipment_id, record_date, created_at, updated_at)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'income', 150.00, 'CAD', 'Shipment delivery fee', '50000000-0000-0000-0000-000000000001', CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'income', 120.00, 'CAD', 'Shipment delivery fee', '50000000-0000-0000-0000-000000000002', CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'expense', 45.00, 'CAD', 'Fuel cost for trip', '50000000-0000-0000-0000-000000000002', CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'income', 200.00, 'CAD', 'Shipment delivery fee', '50000000-0000-0000-0000-000000000003', CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'income', 100.00, 'CAD', 'Shipment delivery fee', '50000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 day', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'expense', 35.00, 'CAD', 'Fuel cost for trip', '50000000-0000-0000-0000-000000000004', CURRENT_DATE - INTERVAL '1 day', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'income', 180.00, 'CAD', 'Shipment delivery fee', '50000000-0000-0000-0000-000000000006', CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 'expense', 50.00, 'CAD', 'Vehicle maintenance', NULL, CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'income', 140.00, 'CAD', 'Shipment delivery fee', '50000000-0000-0000-0000-000000000007', CURRENT_DATE, NOW(), NOW()),
    ('b0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000003', 'expense', 120.00, 'CAD', 'Driver wages', NULL, CURRENT_DATE, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 13. Statements 表（对账单）- 10条
-- ====================================

INSERT INTO statements (id, tenant_id, statement_type, related_entity_id, start_date, end_date, total_amount, currency, status, created_at, updated_at)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'customer_invoice', '20000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 450.00, 'CAD', 'generated', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'customer_invoice', '20000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 350.00, 'CAD', 'sent', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'driver_payroll', '40000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 3200.00, 'CAD', 'paid', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'driver_payroll', '40000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 2950.00, 'CAD', 'paid', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'customer_invoice', '20000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 580.00, 'CAD', 'generated', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'driver_payroll', '40000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 3100.00, 'CAD', 'pending', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'customer_invoice', '20000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 420.00, 'CAD', 'sent', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'driver_payroll', '40000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 2850.00, 'CAD', 'paid', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'customer_invoice', '20000000-0000-0000-0000-00000000000a', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 280.00, 'CAD', 'generated', NOW(), NOW()),
    ('c0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'driver_payroll', '40000000-0000-0000-0000-00000000000a', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, 3050.00, 'CAD', 'pending', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 14. Proof of Delivery 表（签收证明）- 10条
-- ====================================

INSERT INTO proof_of_delivery (id, shipment_id, delivery_image_url, signature_image_url, recipient_name, delivery_notes, delivered_at, created_at, updated_at)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'https://storage.example.com/pod/001-delivery.jpg', 'https://storage.example.com/pod/001-signature.jpg', 'John Doe', 'Delivered to reception desk', NOW() - INTERVAL '1 hour', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', 'https://storage.example.com/pod/002-delivery.jpg', 'https://storage.example.com/pod/002-signature.jpg', 'Jane Smith', 'Left at front door as requested', NOW() - INTERVAL '1 hour', NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', NULL, NULL, NULL, 'Pending delivery', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', NULL, NULL, NULL, 'In transit', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', NULL, NULL, NULL, 'In transit', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000005', NULL, NULL, NULL, 'In transit', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000006', NULL, NULL, NULL, 'Pending pickup', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000007', NULL, NULL, NULL, 'In transit', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000008', NULL, NULL, NULL, 'Pending pickup', NULL, NOW(), NOW()),
    ('d0000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000009', NULL, NULL, NULL, 'Pending assignment', NULL, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 15. Rule Executions 表（规则执行记录）- 10条
-- ====================================

INSERT INTO rule_executions (id, tenant_id, rule_id, entity_type, entity_id, execution_time, result, status, created_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', 'shipment', '50000000-0000-0000-0000-000000000001', NOW(), '{"action_taken": "auto_dispatched", "driver_id": "40000000-0000-0000-0000-000000000001"}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', 'shipment', '50000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', '{"action_taken": "dispatcher_notified"}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', 'shipment', '50000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes', '{"action_taken": "approval_required"}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', 'driver', '40000000-0000-0000-0000-000000000001', NOW() - INTERVAL '2 hours', '{"action_taken": "warning_sent", "hours": 10.5}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000005', 'shipment', '50000000-0000-0000-0000-000000000005', NOW() - INTERVAL '15 minutes', '{"action_taken": "customer_notified", "delay_minutes": 35}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', 'vehicle', '30000000-0000-0000-0000-000000000003', NOW() - INTERVAL '1 hour', '{"action_taken": "driver_notified", "fuel_level": 18}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000007', 'vehicle', '30000000-0000-0000-0000-000000000009', NOW() - INTERVAL '3 hours', '{"action_taken": "maintenance_scheduled"}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000008', 'shipment', '50000000-0000-0000-0000-000000000008', NOW(), '{"action_taken": "preferred_driver_assigned"}', 'success', NOW()),
    ('e0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000009', 'trip', '60000000-0000-0000-0000-000000000007', NOW() - INTERVAL '45 minutes', '{"action_taken": "route_optimized", "stops": 4}', 'success', NOW()),
    ('e0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-00000000000a', 'shipment', '50000000-0000-0000-0000-00000000000a', NOW(), '{"action_taken": "surcharge_applied", "amount": 25}', 'success', NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 16. 生成位置历史数据（模拟车辆移动轨迹）
-- ====================================

-- 为正在行驶的车辆生成历史轨迹（每5分钟一个位置点，过去2小时）
DO $$
DECLARE
    vehicle_record RECORD;
    time_offset INTEGER;
    loc JSONB;
BEGIN
    FOR vehicle_record IN 
        SELECT id, current_location 
        FROM vehicles 
        WHERE status = 'busy' 
        LIMIT 5
    LOOP
        FOR time_offset IN 0..24 LOOP  -- 24个点，每5分钟一个，共2小时
            loc := random_toronto_location();
            
            INSERT INTO location_tracking (
                entity_type, 
                entity_id, 
                latitude, 
                longitude, 
                speed, 
                direction, 
                timestamp
            ) VALUES (
                'vehicle',
                vehicle_record.id,
                (loc->>'latitude')::NUMERIC,
                (loc->>'longitude')::NUMERIC,
                (loc->>'speed')::NUMERIC,
                (loc->>'direction')::NUMERIC,
                NOW() - INTERVAL '5 minutes' * time_offset
            );
        END LOOP;
    END LOOP;
END$$;

-- ====================================
-- 清理辅助函数
-- ====================================

DROP FUNCTION IF EXISTS random_toronto_location();

-- ====================================
-- 完成统计
-- ====================================

SELECT 
    'Test data generation completed!' as status,
    (SELECT COUNT(*) FROM tenants) as tenants_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM customers) as customers_count,
    (SELECT COUNT(*) FROM vehicles) as vehicles_count,
    (SELECT COUNT(*) FROM drivers) as drivers_count,
    (SELECT COUNT(*) FROM shipments) as shipments_count,
    (SELECT COUNT(*) FROM trips) as trips_count,
    (SELECT COUNT(*) FROM rules) as rules_count,
    (SELECT COUNT(*) FROM assignments) as assignments_count,
    (SELECT COUNT(*) FROM notifications) as notifications_count,
    (SELECT COUNT(*) FROM timeline_events) as timeline_events_count,
    (SELECT COUNT(*) FROM financial_records) as financial_records_count,
    (SELECT COUNT(*) FROM statements) as statements_count,
    (SELECT COUNT(*) FROM proof_of_delivery) as proof_of_delivery_count,
    (SELECT COUNT(*) FROM rule_executions) as rule_executions_count,
    (SELECT COUNT(*) FROM location_tracking) as location_tracking_count;

