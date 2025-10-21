-- 测试数据生成脚本 - 为所有表生成10条测试数据（含位置信息）
-- 创建时间: 2025-10-20 23:05:00
-- 描述: 基于当前database_schema.sql创建的测试数据，包含真实的多伦多地区位置信息

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
-- 1. Tenants 表（租户）- 10条
-- ====================================

INSERT INTO tenants (id, name, domain, schema_name, status, settings, created_at, updated_at)
VALUES 
    ('00000000-0000-0000-0000-000000000001', 'Demo Company', 'demo.tms-platform.com', 'public', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000002', 'Toronto Logistics Inc', 'toronto-logistics.tms-platform.com', 'tenant_toronto', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000003', 'Express Delivery Co', 'express-delivery.tms-platform.com', 'tenant_express', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000004', 'Fast Freight Services', 'fast-freight.tms-platform.com', 'tenant_freight', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000005', 'Green Transport Ltd', 'green-transport.tms-platform.com', 'tenant_green', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000006', 'Metro Shipping Co', 'metro-shipping.tms-platform.com', 'tenant_metro', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000007', 'Prime Logistics', 'prime-logistics.tms-platform.com', 'tenant_prime', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000008', 'Swift Movers', 'swift-movers.tms-platform.com', 'tenant_swift', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-000000000009', 'Reliable Transport', 'reliable-transport.tms-platform.com', 'tenant_reliable', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW()),
    ('00000000-0000-0000-0000-00000000000a', 'Elite Delivery Services', 'elite-delivery.tms-platform.com', 'tenant_elite', 'active', '{"currency": "CAD", "timezone": "America/Toronto"}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 2. Users 表（用户）- 10条
-- ====================================

INSERT INTO users (id, tenant_id, email, password_hash, role, profile, status, created_at, updated_at)
VALUES 
    ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'admin@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "Admin User", "phone": "+1-416-555-0100"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'dispatcher@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dispatcher', '{"name": "张三", "phone": "+1-416-555-0101"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'driver@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'driver', '{"name": "李四", "phone": "+1-416-555-0102"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'manager@demo.tms-platform.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'manager', '{"name": "王五", "phone": "+1-416-555-0103"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'admin@toronto-logistics.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "John Smith", "phone": "+1-416-555-0104"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'dispatcher@toronto-logistics.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'dispatcher', '{"name": "Sarah Johnson", "phone": "+1-416-555-0105"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'admin@express-delivery.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "Michael Brown", "phone": "+1-416-555-0106"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000004', 'admin@fast-freight.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "Emily Davis", "phone": "+1-416-555-0107"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000005', 'admin@green-transport.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "David Wilson", "phone": "+1-416-555-0108"}'::jsonb, 'active', NOW(), NOW()),
    ('10000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000006', 'admin@metro-shipping.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', '{"name": "Jennifer Lee", "phone": "+1-416-555-0109"}'::jsonb, 'active', NOW(), NOW())
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ====================================
-- 3. Customers 表（客户）- 10条
-- ====================================

INSERT INTO customers (id, tenant_id, name, level, contact_info, billing_info, created_at, updated_at)
VALUES 
    ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Walmart Canada', 'premium', 
     '{"email": "john.doe@walmart.ca", "phone": "+1-416-555-0201", "address": "3401 Dufferin St, North York, ON M6A 2T9", "latitude": 43.7615, "longitude": -79.4635}'::jsonb, 
     '{"payment_terms": "NET30", "credit_limit": 50000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Costco Toronto', 'premium', 
     '{"email": "jane.smith@costco.ca", "phone": "+1-416-555-0202", "address": "1411 Warden Ave, Scarborough, ON M1R 5B7", "latitude": 43.7532, "longitude": -79.2985}'::jsonb, 
     '{"payment_terms": "NET30", "credit_limit": 45000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Canadian Tire', 'standard', 
     '{"email": "bob.johnson@canadiantire.ca", "phone": "+1-416-555-0203", "address": "839 Yonge St, Toronto, ON M4W 2H2", "latitude": 43.6735, "longitude": -79.3867}'::jsonb, 
     '{"payment_terms": "NET15", "credit_limit": 30000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Home Depot', 'premium', 
     '{"email": "alice.brown@homedepot.ca", "phone": "+1-416-555-0204", "address": "50 Bloor St W, Toronto, ON M4W 1A1", "latitude": 43.6707, "longitude": -79.3873}'::jsonb, 
     '{"payment_terms": "NET30", "credit_limit": 40000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'IKEA Toronto', 'standard', 
     '{"email": "charlie.davis@ikea.ca", "phone": "+1-416-555-0205", "address": "15 Provost Dr, North York, ON M2K 2X9", "latitude": 43.7735, "longitude": -79.4042}'::jsonb, 
     '{"payment_terms": "NET15", "credit_limit": 25000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Best Buy Toronto', 'standard', 
     '{"email": "diana.wilson@bestbuy.ca", "phone": "+1-416-555-0206", "address": "2200 Yonge St, Toronto, ON M4S 2C6", "latitude": 43.7068, "longitude": -79.3983}'::jsonb, 
     '{"payment_terms": "NET15", "credit_limit": 28000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Sobeys', 'standard', 
     '{"email": "edward.martinez@sobeys.ca", "phone": "+1-416-555-0207", "address": "595 Bay St, Toronto, ON M5G 2C2", "latitude": 43.6559, "longitude": -79.3832}'::jsonb, 
     '{"payment_terms": "NET15", "credit_limit": 22000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Metro Grocery', 'standard', 
     '{"email": "fiona.garcia@metro.ca", "phone": "+1-416-555-0208", "address": "87 Front St E, Toronto, ON M5E 1C3", "latitude": 43.6486, "longitude": -79.3735}'::jsonb, 
     '{"payment_terms": "NET15", "credit_limit": 20000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'Loblaws', 'premium', 
     '{"email": "george.lee@loblaws.ca", "phone": "+1-416-555-0209", "address": "60 Carlton St, Toronto, ON M5B 1J2", "latitude": 43.6615, "longitude": -79.3792}'::jsonb, 
     '{"payment_terms": "NET30", "credit_limit": 35000}'::jsonb, NOW(), NOW()),
    
    ('20000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'Shoppers Drug Mart', 'standard', 
     '{"email": "hannah.kim@shoppersdrugmart.ca", "phone": "+1-416-555-0210", "address": "123 King St W, Toronto, ON M5H 1A1", "latitude": 43.6488, "longitude": -79.3817}'::jsonb, 
     '{"payment_terms": "NET15", "credit_limit": 18000}'::jsonb, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 4. Vehicles 表（车辆）- 10条
-- ====================================

INSERT INTO vehicles (id, plate_number, type, capacity_kg, status, created_at, updated_at)
VALUES 
    ('30000000-0000-0000-0000-000000000001', 'CABN-101', 'Box Truck', 3000.00, 'available', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000002', 'CABN-102', 'Cargo Van', 1500.00, 'available', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000003', 'CABN-103', 'Flatbed Truck', 5000.00, 'busy', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000004', 'CABN-104', 'Refrigerated Truck', 4000.00, 'available', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000005', 'CABN-105', 'Box Truck', 3500.00, 'busy', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000006', 'CATO-201', 'Cargo Van', 1800.00, 'available', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000007', 'CATO-202', 'Box Truck', 3200.00, 'busy', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000008', 'CAEX-301', 'Flatbed Truck', 6000.00, 'available', NOW(), NOW()),
    ('30000000-0000-0000-0000-000000000009', 'CAEX-302', 'Refrigerated Truck', 4500.00, 'maintenance', NOW(), NOW()),
    ('30000000-0000-0000-0000-00000000000a', 'CAFF-401', 'Box Truck', 3800.00, 'available', NOW(), NOW())
ON CONFLICT (plate_number) DO NOTHING;

-- ====================================
-- 5. Drivers 表（司机）- 10条
-- ====================================

INSERT INTO drivers (id, tenant_id, name, phone, license_number, vehicle_info, status, performance, created_at, updated_at, vehicle_id)
VALUES 
    ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'James Wilson', '+1-416-123-4501', 'DL-001-2024', '{"type": "Box Truck", "plate": "CABN-101"}'::jsonb, 'available', '{"rating": 4.8, "trips_completed": 120}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000001'),
    ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Robert Brown', '+1-416-123-4502', 'DL-002-2024', '{"type": "Cargo Van", "plate": "CABN-102"}'::jsonb, 'available', '{"rating": 4.9, "trips_completed": 150}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000002'),
    ('40000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Michael Davis', '+1-416-123-4503', 'DL-003-2024', '{"type": "Flatbed Truck", "plate": "CABN-103"}'::jsonb, 'busy', '{"rating": 4.7, "trips_completed": 110}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000003'),
    ('40000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'William Martinez', '+1-416-123-4504', 'DL-004-2024', '{"type": "Refrigerated Truck", "plate": "CABN-104"}'::jsonb, 'available', '{"rating": 4.6, "trips_completed": 95}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000004'),
    ('40000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'David Garcia', '+1-416-123-4505', 'DL-005-2024', '{"type": "Box Truck", "plate": "CABN-105"}'::jsonb, 'busy', '{"rating": 4.8, "trips_completed": 130}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000005'),
    ('40000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Richard Rodriguez', '+1-416-123-4506', 'DL-006-2024', '{"type": "Cargo Van", "plate": "CATO-201"}'::jsonb, 'available', '{"rating": 4.5, "trips_completed": 80}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000006'),
    ('40000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Joseph Lee', '+1-416-123-4507', 'DL-007-2024', '{"type": "Box Truck", "plate": "CATO-202"}'::jsonb, 'busy', '{"rating": 4.9, "trips_completed": 145}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000007'),
    ('40000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Thomas Kim', '+1-416-123-4508', 'DL-008-2024', '{"type": "Flatbed Truck", "plate": "CAEX-301"}'::jsonb, 'available', '{"rating": 4.7, "trips_completed": 105}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000008'),
    ('40000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'Christopher Chen', '+1-416-123-4509', 'DL-009-2024', '{"type": "Refrigerated Truck", "plate": "CAEX-302"}'::jsonb, 'on_leave', '{"rating": 4.6, "trips_completed": 90}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-000000000009'),
    ('40000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'Daniel Wang', '+1-416-123-4510', 'DL-010-2024', '{"type": "Box Truck", "plate": "CAFF-401"}'::jsonb, 'available', '{"rating": 4.8, "trips_completed": 125}'::jsonb, NOW(), NOW(), '30000000-0000-0000-0000-00000000000a')
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 6. Shipments 表（运单）- 10条（含位置信息）
-- ====================================

INSERT INTO shipments (id, tenant_id, shipment_number, customer_id, driver_id, pickup_address, delivery_address, cargo_info, estimated_cost, actual_cost, status, created_at, updated_at)
VALUES 
    ('50000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'SHP-2025-0001', '20000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001',
     '{"street": "3401 Dufferin St", "city": "North York", "province": "ON", "postal_code": "M6A 2T9", "country": "Canada", "latitude": 43.7615, "longitude": -79.4635}'::jsonb,
     '{"street": "1411 Warden Ave", "city": "Scarborough", "province": "ON", "postal_code": "M1R 5B7", "country": "Canada", "latitude": 43.7532, "longitude": -79.2985}'::jsonb,
     '{"weight_kg": 500, "volume_m3": 2.5, "description": "Electronics", "items": 10}'::jsonb, 150.00, NULL, 'pending', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'SHP-2025-0002', '20000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002',
     '{"street": "839 Yonge St", "city": "Toronto", "province": "ON", "postal_code": "M4W 2H2", "country": "Canada", "latitude": 43.6735, "longitude": -79.3867}'::jsonb,
     '{"street": "50 Bloor St W", "city": "Toronto", "province": "ON", "postal_code": "M4W 1A1", "country": "Canada", "latitude": 43.6707, "longitude": -79.3873}'::jsonb,
     '{"weight_kg": 300, "volume_m3": 1.8, "description": "Furniture", "items": 5}'::jsonb, 120.00, 125.00, 'in_transit', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'SHP-2025-0003', '20000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003',
     '{"street": "15 Provost Dr", "city": "North York", "province": "ON", "postal_code": "M2K 2X9", "country": "Canada", "latitude": 43.7735, "longitude": -79.4042}'::jsonb,
     '{"street": "2200 Yonge St", "city": "Toronto", "province": "ON", "postal_code": "M4S 2C6", "country": "Canada", "latitude": 43.7068, "longitude": -79.3983}'::jsonb,
     '{"weight_kg": 800, "volume_m3": 4.2, "description": "Building Materials", "items": 20}'::jsonb, 200.00, NULL, 'in_transit', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'SHP-2025-0004', '20000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004',
     '{"street": "595 Bay St", "city": "Toronto", "province": "ON", "postal_code": "M5G 2C2", "country": "Canada", "latitude": 43.6559, "longitude": -79.3832}'::jsonb,
     '{"street": "87 Front St E", "city": "Toronto", "province": "ON", "postal_code": "M5E 1C3", "country": "Canada", "latitude": 43.6486, "longitude": -79.3735}'::jsonb,
     '{"weight_kg": 250, "volume_m3": 1.2, "description": "Groceries", "items": 15}'::jsonb, 100.00, 95.00, 'delivered', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'SHP-2025-0005', '20000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005',
     '{"street": "60 Carlton St", "city": "Toronto", "province": "ON", "postal_code": "M5B 1J2", "country": "Canada", "latitude": 43.6615, "longitude": -79.3792}'::jsonb,
     '{"street": "123 King St W", "city": "Toronto", "province": "ON", "postal_code": "M5H 1A1", "country": "Canada", "latitude": 43.6488, "longitude": -79.3817}'::jsonb,
     '{"weight_kg": 150, "volume_m3": 0.8, "description": "Pharmaceuticals", "items": 8}'::jsonb, 80.00, NULL, 'in_transit', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'SHP-2025-0006', '20000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006',
     '{"street": "3401 Dufferin St", "city": "North York", "province": "ON", "postal_code": "M6A 2T9", "country": "Canada", "latitude": 43.7615, "longitude": -79.4635}'::jsonb,
     '{"street": "595 Bay St", "city": "Toronto", "province": "ON", "postal_code": "M5G 2C2", "country": "Canada", "latitude": 43.6559, "longitude": -79.3832}'::jsonb,
     '{"weight_kg": 600, "volume_m3": 3.0, "description": "Appliances", "items": 12}'::jsonb, 180.00, NULL, 'pending', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'SHP-2025-0007', '20000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007',
     '{"street": "839 Yonge St", "city": "Toronto", "province": "ON", "postal_code": "M4W 2H2", "country": "Canada", "latitude": 43.6735, "longitude": -79.3867}'::jsonb,
     '{"street": "1411 Warden Ave", "city": "Scarborough", "province": "ON", "postal_code": "M1R 5B7", "country": "Canada", "latitude": 43.7532, "longitude": -79.2985}'::jsonb,
     '{"weight_kg": 400, "volume_m3": 2.0, "description": "Office Supplies", "items": 18}'::jsonb, 140.00, NULL, 'in_transit', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'SHP-2025-0008', '20000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008',
     '{"street": "15 Provost Dr", "city": "North York", "province": "ON", "postal_code": "M2K 2X9", "country": "Canada", "latitude": 43.7735, "longitude": -79.4042}'::jsonb,
     '{"street": "60 Carlton St", "city": "Toronto", "province": "ON", "postal_code": "M5B 1J2", "country": "Canada", "latitude": 43.6615, "longitude": -79.3792}'::jsonb,
     '{"weight_kg": 700, "volume_m3": 3.5, "description": "Industrial Equipment", "items": 25}'::jsonb, 220.00, NULL, 'pending', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'SHP-2025-0009', '20000000-0000-0000-0000-000000000009', NULL,
     '{"street": "2200 Yonge St", "city": "Toronto", "province": "ON", "postal_code": "M4S 2C6", "country": "Canada", "latitude": 43.7068, "longitude": -79.3983}'::jsonb,
     '{"street": "50 Bloor St W", "city": "Toronto", "province": "ON", "postal_code": "M4W 1A1", "country": "Canada", "latitude": 43.6707, "longitude": -79.3873}'::jsonb,
     '{"weight_kg": 200, "volume_m3": 1.0, "description": "Books", "items": 30}'::jsonb, 90.00, NULL, 'created', NOW(), NOW()),
    
    ('50000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'SHP-2025-0010', '20000000-0000-0000-0000-00000000000a', NULL,
     '{"street": "87 Front St E", "city": "Toronto", "province": "ON", "postal_code": "M5E 1C3", "country": "Canada", "latitude": 43.6486, "longitude": -79.3735}'::jsonb,
     '{"street": "123 King St W", "city": "Toronto", "province": "ON", "postal_code": "M5H 1A1", "country": "Canada", "latitude": 43.6488, "longitude": -79.3817}'::jsonb,
     '{"weight_kg": 100, "volume_m3": 0.5, "description": "Documents", "items": 5}'::jsonb, 60.00, NULL, 'created', NOW(), NOW())
ON CONFLICT (shipment_number) DO NOTHING;

-- ====================================
-- 7. Assignments 表（分配）- 10条
-- ====================================

INSERT INTO assignments (id, shipment_id, driver_id, assigned_at)
VALUES 
    ('80000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', NOW()),
    ('80000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour'),
    ('80000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes'),
    ('80000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 hours'),
    ('80000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', NOW() - INTERVAL '20 minutes'),
    ('80000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', NOW()),
    ('80000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', NOW() - INTERVAL '45 minutes'),
    ('80000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', NOW()),
    ('80000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000009', NULL, NOW()),
    ('80000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-00000000000a', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 8. Notifications 表（通知）- 10条
-- ====================================

INSERT INTO notifications (id, type, target_role, shipment_id, driver_id, payload, delivered, created_at)
VALUES 
    ('90000000-0000-0000-0000-000000000001', 'assignment', 'driver', '50000000-0000-0000-0000-000000000001', '40000000-0000-0000-0000-000000000001', '{"message": "New shipment assigned", "shipment_number": "SHP-2025-0001"}'::jsonb, false, NOW()),
    ('90000000-0000-0000-0000-000000000002', 'status_update', 'dispatcher', '50000000-0000-0000-0000-000000000002', '40000000-0000-0000-0000-000000000002', '{"message": "Shipment in transit", "shipment_number": "SHP-2025-0002"}'::jsonb, false, NOW() - INTERVAL '1 hour'),
    ('90000000-0000-0000-0000-000000000003', 'pickup', 'driver', '50000000-0000-0000-0000-000000000003', '40000000-0000-0000-0000-000000000003', '{"message": "Pickup completed", "shipment_number": "SHP-2025-0003"}'::jsonb, true, NOW() - INTERVAL '30 minutes'),
    ('90000000-0000-0000-0000-000000000004', 'delivery', 'customer', '50000000-0000-0000-0000-000000000004', '40000000-0000-0000-0000-000000000004', '{"message": "Shipment delivered", "shipment_number": "SHP-2025-0004"}'::jsonb, true, NOW() - INTERVAL '3 hours'),
    ('90000000-0000-0000-0000-000000000005', 'eta_update', 'customer', '50000000-0000-0000-0000-000000000005', '40000000-0000-0000-0000-000000000005', '{"message": "ETA 40 minutes", "shipment_number": "SHP-2025-0005"}'::jsonb, false, NOW() - INTERVAL '20 minutes'),
    ('90000000-0000-0000-0000-000000000006', 'creation', 'dispatcher', '50000000-0000-0000-0000-000000000006', '40000000-0000-0000-0000-000000000006', '{"message": "New shipment created", "shipment_number": "SHP-2025-0006"}'::jsonb, false, NOW()),
    ('90000000-0000-0000-0000-000000000007', 'delay', 'customer', '50000000-0000-0000-0000-000000000007', '40000000-0000-0000-0000-000000000007', '{"message": "Delivery delayed 15 min", "shipment_number": "SHP-2025-0007"}'::jsonb, false, NOW() - INTERVAL '45 minutes'),
    ('90000000-0000-0000-0000-000000000008', 'approval_required', 'manager', '50000000-0000-0000-0000-000000000008', '40000000-0000-0000-0000-000000000008', '{"message": "Approval required", "shipment_number": "SHP-2025-0008"}'::jsonb, false, NOW()),
    ('90000000-0000-0000-0000-000000000009', 'pending_assignment', 'dispatcher', '50000000-0000-0000-0000-000000000009', NULL, '{"message": "Awaiting driver", "shipment_number": "SHP-2025-0009"}'::jsonb, false, NOW()),
    ('90000000-0000-0000-0000-00000000000a', 'urgent', 'dispatcher', '50000000-0000-0000-0000-00000000000a', NULL, '{"message": "Same-day delivery", "shipment_number": "SHP-2025-0010"}'::jsonb, false, NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 9. Timeline Events 表（时间线事件）- 10条（含位置）
-- ====================================

INSERT INTO timeline_events (id, shipment_id, event_type, from_status, to_status, actor_type, actor_id, timestamp, extra)
VALUES 
    ('a0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002', 'pickup', 'created', 'in_transit', 'driver', '40000000-0000-0000-0000-000000000002', NOW() - INTERVAL '1 hour', '{"location": {"lat": 43.6735, "lng": -79.3867, "address": "839 Yonge St"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000002', 'checkpoint', 'in_transit', 'in_transit', 'system', NULL, NOW() - INTERVAL '45 minutes', '{"location": {"lat": 43.6721, "lng": -79.3860, "address": "On Route"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000003', 'pickup', 'created', 'in_transit', 'driver', '40000000-0000-0000-0000-000000000003', NOW() - INTERVAL '30 minutes', '{"location": {"lat": 43.7735, "lng": -79.4042, "address": "15 Provost Dr"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000004', 'pickup', 'created', 'in_transit', 'driver', '40000000-0000-0000-0000-000000000004', NOW() - INTERVAL '3 hours', '{"location": {"lat": 43.6559, "lng": -79.3832, "address": "595 Bay St"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000004', 'delivery', 'in_transit', 'delivered', 'driver', '40000000-0000-0000-0000-000000000004', NOW() - INTERVAL '1 hour', '{"location": {"lat": 43.6486, "lng": -79.3735, "address": "87 Front St E"}, "signature": true}'::jsonb),
    ('a0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000005', 'pickup', 'created', 'in_transit', 'driver', '40000000-0000-0000-0000-000000000005', NOW() - INTERVAL '20 minutes', '{"location": {"lat": 43.6615, "lng": -79.3792, "address": "60 Carlton St"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000005', 'checkpoint', 'in_transit', 'in_transit', 'system', NULL, NOW() - INTERVAL '10 minutes', '{"location": {"lat": 43.6551, "lng": -79.3804, "address": "On Route"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000007', 'pickup', 'created', 'in_transit', 'driver', '40000000-0000-0000-0000-000000000007', NOW() - INTERVAL '45 minutes', '{"location": {"lat": 43.6735, "lng": -79.3867, "address": "839 Yonge St"}}'::jsonb),
    ('a0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000007', 'checkpoint', 'in_transit', 'in_transit', 'system', NULL, NOW() - INTERVAL '25 minutes', '{"location": {"lat": 43.7133, "lng": -79.3426, "address": "Checkpoint A"}}'::jsonb),
    ('a0000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000007', 'checkpoint', 'in_transit', 'in_transit', 'system', NULL, NOW() - INTERVAL '15 minutes', '{"location": {"lat": 43.7432, "lng": -79.3185, "address": "On Route"}}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 10. Financial Records 表（财务记录）- 10条
-- ====================================

INSERT INTO financial_records (id, tenant_id, type, reference_id, amount, currency, status, description, created_at, updated_at)
VALUES 
    ('b0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'revenue', '50000000-0000-0000-0000-000000000001', 150.00, 'CAD', 'pending', 'Shipment SHP-2025-0001 delivery fee', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'revenue', '50000000-0000-0000-0000-000000000002', 125.00, 'CAD', 'paid', 'Shipment SHP-2025-0002 delivery fee', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'expense', '50000000-0000-0000-0000-000000000002', 45.00, 'CAD', 'paid', 'Fuel cost for SHP-2025-0002', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'revenue', '50000000-0000-0000-0000-000000000003', 200.00, 'CAD', 'pending', 'Shipment SHP-2025-0003 delivery fee', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'revenue', '50000000-0000-0000-0000-000000000004', 95.00, 'CAD', 'paid', 'Shipment SHP-2025-0004 delivery fee', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000001', 'expense', '50000000-0000-0000-0000-000000000004', 35.00, 'CAD', 'paid', 'Fuel cost for SHP-2025-0004', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'revenue', '50000000-0000-0000-0000-000000000006', 180.00, 'CAD', 'pending', 'Shipment SHP-2025-0006 delivery fee', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000002', 'expense', NULL, 50.00, 'CAD', 'paid', 'Vehicle maintenance', NOW(), NOW()),
    ('b0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'revenue', '50000000-0000-0000-0000-000000000007', 140.00, 'CAD', 'pending', 'Shipment SHP-2025-0007 delivery fee', NOW(), NOW()),
    ('b0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000003', 'expense', NULL, 120.00, 'CAD', 'paid', 'Driver wages payment', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 11. Statements 表（对账单）- 10条
-- ====================================

INSERT INTO statements (id, tenant_id, type, reference_id, period_start, period_end, items, total_amount, status, generated_at, generated_by, created_at, updated_at)
VALUES 
    ('c0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'customer_invoice', '20000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 450.00, 'draft', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'customer_invoice', '20000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 350.00, 'sent', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'driver_settlement', '40000000-0000-0000-0000-000000000001', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 3200.00, 'paid', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'driver_settlement', '40000000-0000-0000-0000-000000000002', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 2950.00, 'paid', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000002', 'customer_invoice', '20000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 580.00, 'draft', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'driver_settlement', '40000000-0000-0000-0000-000000000006', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 3100.00, 'pending', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000003', 'customer_invoice', '20000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 420.00, 'sent', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'driver_settlement', '40000000-0000-0000-0000-000000000008', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 2850.00, 'paid', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000004', 'customer_invoice', '20000000-0000-0000-0000-00000000000a', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 280.00, 'draft', NOW(), 'system', NOW(), NOW()),
    ('c0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'driver_settlement', '40000000-0000-0000-0000-00000000000a', CURRENT_DATE - INTERVAL '30 days', CURRENT_DATE, '[]'::jsonb, 3050.00, 'pending', NOW(), 'system', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 12. Proof of Delivery 表（签收证明）- 10条
-- ====================================

INSERT INTO proof_of_delivery (id, shipment_id, file_path, uploaded_at, uploaded_by, note)
VALUES 
    ('d0000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000004', 'https://storage.googleapis.com/tms-pod/SHP-2025-0004-delivery.jpg', NOW() - INTERVAL '1 hour', 'driver', 'Delivered to reception desk'),
    ('d0000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000004', 'https://storage.googleapis.com/tms-pod/SHP-2025-0004-signature.jpg', NOW() - INTERVAL '1 hour', 'driver', 'Signature obtained'),
    ('d0000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', 'https://storage.googleapis.com/tms-pod/SHP-2025-0001-pickup.jpg', NOW(), 'driver', 'Pickup photo'),
    ('d0000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', 'https://storage.googleapis.com/tms-pod/SHP-2025-0002-transit.jpg', NOW() - INTERVAL '30 minutes', 'driver', 'In transit verification'),
    ('d0000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'https://storage.googleapis.com/tms-pod/SHP-2025-0003-pickup.jpg', NOW() - INTERVAL '25 minutes', 'driver', 'Pickup completed'),
    ('d0000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000005', 'https://storage.googleapis.com/tms-pod/SHP-2025-0005-transit.jpg', NOW() - INTERVAL '15 minutes', 'driver', 'Approaching destination'),
    ('d0000000-0000-0000-0000-000000000007', '50000000-0000-0000-0000-000000000006', 'https://storage.googleapis.com/tms-pod/SHP-2025-0006-cargo.jpg', NOW(), 'dispatcher', 'Cargo inspection photo'),
    ('d0000000-0000-0000-0000-000000000008', '50000000-0000-0000-0000-000000000007', 'https://storage.googleapis.com/tms-pod/SHP-2025-0007-pickup.jpg', NOW() - INTERVAL '40 minutes', 'driver', 'Pickup verification'),
    ('d0000000-0000-0000-0000-000000000009', '50000000-0000-0000-0000-000000000008', 'https://storage.googleapis.com/tms-pod/SHP-2025-0008-cargo.jpg', NOW(), 'dispatcher', 'Cargo loaded'),
    ('d0000000-0000-0000-0000-00000000000a', '50000000-0000-0000-0000-000000000009', 'https://storage.googleapis.com/tms-pod/SHP-2025-0009-warehouse.jpg', NOW(), 'dispatcher', 'Warehouse storage')
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 13. Rules 表（规则）- 10条
-- ====================================

INSERT INTO rules (id, tenant_id, name, description, type, priority, conditions, actions, status, created_at, updated_at)
VALUES 
    ('70000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', 'Auto Dispatch High Priority', 'Automatically dispatch high priority shipments', 'dispatch', 10, '{"priority": "high", "status": "pending"}'::jsonb, '{"action": "auto_dispatch"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'Same Day Delivery Alert', 'Alert for same day delivery requests', 'notification', 9, '{"deliveryType": "same_day"}'::jsonb, '{"action": "notify_dispatcher"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', 'Overweight Cargo Check', 'Check for overweight cargo', 'validation', 8, '{"weight_kg": {"$gt": 5000}}'::jsonb, '{"action": "require_approval"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', 'Driver Hours Limit', 'Warn when driver exceeds working hours', 'compliance', 7, '{"driverHours": {"$gt": 10}}'::jsonb, '{"action": "send_warning"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', 'Late Delivery Alert', 'Alert when delivery is running late', 'notification', 6, '{"estimatedDelay": {"$gt": 30}}'::jsonb, '{"action": "notify_customer"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', 'Fuel Low Warning', 'Warn when vehicle fuel is low', 'maintenance', 5, '{"fuelLevel": {"$lt": 20}}'::jsonb, '{"action": "notify_driver"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', 'Maintenance Due', 'Alert when vehicle maintenance is due', 'maintenance', 4, '{"maintenanceKm": {"$gt": 5000}}'::jsonb, '{"action": "schedule_maintenance"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', 'Customer Preference', 'Apply customer delivery preferences', 'dispatch', 3, '{"customerId": {"$in": ["preferred_customers"]}}'::jsonb, '{"action": "assign_preferred_driver"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', 'Route Optimization', 'Optimize route for multiple stops', 'optimization', 2, '{"stops": {"$gt": 3}}'::jsonb, '{"action": "optimize_route"}'::jsonb, 'active', NOW(), NOW()),
    ('70000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', 'Weekend Surcharge', 'Apply surcharge for weekend deliveries', 'pricing', 1, '{"dayOfWeek": {"$in": [6, 7]}}'::jsonb, '{"action": "apply_surcharge", "amount": 25}'::jsonb, 'active', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 14. Rule Executions 表（规则执行记录）- 10条
-- ====================================

INSERT INTO rule_executions (id, tenant_id, rule_id, context, result, execution_time, created_at)
VALUES 
    ('e0000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000001', '{"shipment_id": "50000000-0000-0000-0000-000000000001", "priority": "high"}'::jsonb, '{"action_taken": "auto_dispatched", "driver_id": "40000000-0000-0000-0000-000000000001"}'::jsonb, 45, NOW()),
    ('e0000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000002', '{"shipment_id": "50000000-0000-0000-0000-000000000002", "deliveryType": "same_day"}'::jsonb, '{"action_taken": "dispatcher_notified"}'::jsonb, 32, NOW() - INTERVAL '1 hour'),
    ('e0000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000003', '{"shipment_id": "50000000-0000-0000-0000-000000000003", "weight_kg": 800}'::jsonb, '{"action_taken": "approval_required"}'::jsonb, 28, NOW() - INTERVAL '30 minutes'),
    ('e0000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000004', '{"driver_id": "40000000-0000-0000-0000-000000000001", "hours": 10.5}'::jsonb, '{"action_taken": "warning_sent"}'::jsonb, 15, NOW() - INTERVAL '2 hours'),
    ('e0000000-0000-0000-0000-000000000005', '00000000-0000-0000-0000-000000000001', '70000000-0000-0000-0000-000000000005', '{"shipment_id": "50000000-0000-0000-0000-000000000005", "delay_minutes": 35}'::jsonb, '{"action_taken": "customer_notified"}'::jsonb, 22, NOW() - INTERVAL '15 minutes'),
    ('e0000000-0000-0000-0000-000000000006', '00000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000006', '{"vehicle_id": "30000000-0000-0000-0000-000000000003", "fuel_level": 18}'::jsonb, '{"action_taken": "driver_notified"}'::jsonb, 18, NOW() - INTERVAL '1 hour'),
    ('e0000000-0000-0000-0000-000000000007', '00000000-0000-0000-0000-000000000002', '70000000-0000-0000-0000-000000000007', '{"vehicle_id": "30000000-0000-0000-0000-000000000009", "maintenance_km": 5200}'::jsonb, '{"action_taken": "maintenance_scheduled"}'::jsonb, 35, NOW() - INTERVAL '3 hours'),
    ('e0000000-0000-0000-0000-000000000008', '00000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000008', '{"shipment_id": "50000000-0000-0000-0000-000000000008", "customer_id": "20000000-0000-0000-0000-000000000008"}'::jsonb, '{"action_taken": "preferred_driver_assigned"}'::jsonb, 42, NOW()),
    ('e0000000-0000-0000-0000-000000000009', '00000000-0000-0000-0000-000000000003', '70000000-0000-0000-0000-000000000009', '{"trip_id": "60000000-0000-0000-0000-000000000007", "stops": 4}'::jsonb, '{"action_taken": "route_optimized"}'::jsonb, 125, NOW() - INTERVAL '45 minutes'),
    ('e0000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000004', '70000000-0000-0000-0000-00000000000a', '{"shipment_id": "50000000-0000-0000-0000-00000000000a", "day_of_week": 6}'::jsonb, '{"action_taken": "surcharge_applied", "amount": 25}'::jsonb, 38, NOW())
ON CONFLICT (id) DO NOTHING;

-- ====================================
-- 清理辅助函数
-- ====================================

DROP FUNCTION IF EXISTS random_toronto_location();

-- ====================================
-- 完成统计
-- ====================================

SELECT 
    '✅ Test data generation completed!' as status,
    (SELECT COUNT(*) FROM tenants) as tenants_count,
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM customers) as customers_count,
    (SELECT COUNT(*) FROM vehicles) as vehicles_count,
    (SELECT COUNT(*) FROM drivers) as drivers_count,
    (SELECT COUNT(*) FROM shipments) as shipments_count,
    (SELECT COUNT(*) FROM assignments) as assignments_count,
    (SELECT COUNT(*) FROM notifications) as notifications_count,
    (SELECT COUNT(*) FROM timeline_events) as timeline_events_count,
    (SELECT COUNT(*) FROM financial_records) as financial_records_count,
    (SELECT COUNT(*) FROM statements) as statements_count,
    (SELECT COUNT(*) FROM proof_of_delivery) as proof_of_delivery_count,
    (SELECT COUNT(*) FROM rules) as rules_count,
    (SELECT COUNT(*) FROM rule_executions) as rule_executions_count;


