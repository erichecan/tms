-- 🎯 Supabase完整测试数据 - 最终工作版本
-- 2025-10-02 17:40:00 - 修复所有语法错误和约束问题

-- =====================================================
-- 1. 创建租户 (APONY Transportation)
-- =====================================================
INSERT INTO public.tenants (id, name, domain, schema_name, status, settings, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'APONY Transportation', 'apony.com', 'public', 'active', 
 '{"companyType": "logistics", "timezone": "Asia/Shanghai", "currency": "CAD"}', 
 NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- =====================================================
-- 2. 创建货币设置
-- =====================================================
INSERT INTO public.currencies (id, tenant_id, code, name, symbol, exchange_rate, is_default, is_active)
VALUES 
('CAD-MAIN', '00000000-0000-0000-0000-000000000001', 'CAD', 'Canadian Dollar', '$', 1.0, true, true),
('USD-SECOND', '00000000-0000-0000-0000-000000000001', 'USD', 'US Dollar', '$', 0.75, false, true)
ON CONFLICT (id) DO UPDATE SET exchange_rate = EXCLUDED.exchange_rate;

-- =====================================================
-- 3. 创建客户数据 (VIP1-VIP5)
-- =====================================================
INSERT INTO public.customers (id, tenant_id, name, level, phone, email, contact_info, billing_info, default_pickup_address, default_delivery_address, created_at, updated_at)
VALUES 
('a1111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'ABC贸易公司', 'VIP1', '13800138001', 'abc@trade.com',
 '{"emergencyContact": "13800138001", "department": "物流部", "notes": "加急客户"}',
 '{"paymentTerms": "prepaid", "creditLimit": 100000, "currency": "CAD"}',
 '{"addressLine1": "朝阳区建国门外大街123号", "city": "北京", "province": "北京市", "postalCode": "100022", "contact": "张三", "phone": "13800138001"}',
 '{"addressLine1": "浦东新区陆家嘴789号", "city": "上海", "province": "上海市", "postalCode": "200120", "contact": "李四", "phone": "13800138002"}',
 NOW(), NOW()),

('a2222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000001', 'XYZ进出口有限公司', 'VIP2', '13800138002', 'xyz@import.com',
 '{"emergencyContact": "13800138002", "department": "进出口部", "notes": "大宗客户"}',
 '{"paymentTerms": "net30", "creditLimit": 200000, "currency": "CAD"}',
 '{"addressLine1": "天河区珠江新城456号", "city": "广州", "province": "广东省", "postalCode": "510623", "contact": "王五", "phone": "13800138003"}',
 '{"addressLine1": "南山区科技园101号", "city": "深圳", "province": "广东省", "postalCode": "518057", "contact": "赵六", "phone": "13800138004"}',
 NOW(), NOW()),

('a3333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000001', 'Quick Logistics Ltd', 'VIP3', '13800138003', 'quicklogistics.com',
 '{"emergencyContact": "13800138005", "department": "运营部", "notes": "长期合作"}',
 '{"paymentTerms": "net15", "creditLimit": 150000, "currency": "CAD"}',
 '{"addressLine1": "西湖区文三路201号", "city": "杭州", "province": "浙江省", "postalCode": "310012", "contact": "陈七", "phone": "13800138005"}',
 '{"addressLine1": "玄武区中山路301号", "city": "南京", "province": "江苏省", "postalCode": "210018", "contact": "刘八", "phone": "13800138006"}',
 NOW(), NOW()),

('a4444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000001', 'Global Shipping Corp', 'VIP4', '13800138004', 'globalship.com',
 '{"emergencyContact": "13800138007", "department": "国际物流", "notes": "进出口专家"}',
 '{"paymentTerms": "prepaid", "creditLimit": 300000, "currency": "CAD"}',
 '{"addressLine1": "和平区南京路501号", "city": "天津", "province": "天津市", "postalCode": "300050", "contact": "黄九", "phone": "13800138007"}',
 '{"addressLine1": "渝中区解放碑601号", "city": "重庆", "province": "重庆市", "postalCode": "400010", "contact": "周十", "phone": "13800138008"}',
 NOW(), NOW()),

('a5555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000001', 'Fast Freight Inc', 'VIP5', '13800138005', 'fastfreight.com',
 '{"emergencyContact": "13800138009", "department": "快速运输", "notes": "紧急运输专家"}',
 '{"paymentTerms": "cash", "creditLimit": 50000, "currency": "CAD"}',
 '{"addressLine1": "青羊区春熙路701号", "city": "成都", "province": "四川省", "postalCode": "610021", "contact": "吴十一", "phone": "13800138009"}',
 '{"addressLine1": "雁塔区高新路801号", "city": "西安", "province": "陕西省", "postalCode": "710065", "contact": "郑十二", "phone": "13800138010"}',
 NOW(), NOW());

-- =====================================================
-- 4. 创建车辆数据
-- =====================================================
INSERT INTO public.vehicles (id, plate_number, type, capacity_kg, status, created_at, updated_at)
VALUES 
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '京A00001', '厢式货车', 2000, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc', '京A00002', '平板车', 3000, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbd', '沪A00003', '卡车', 5000, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbe', '粤A00004', '面包车', 1000, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbf', '苏A00005', '冷藏车', 4000, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb0', '浙A00006', '厢式货车', 2500, 'busy', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', '京B00007', '平板车', 3500, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', '沪B00008', '卡车', 6000, 'maintenance', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb3', '粤B00009', '厢式货车', 2200, 'available', NOW(), NOW()),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb4', '苏B0010', '冷藏车', 4500, 'available', NOW(), NOW());

-- =====================================================
-- 5. 创建司机数据
-- =====================================================
INSERT INTO public.drivers (id, tenant_id, name, phone, license_number, vehicle_info, status, performance, created_at, updated_at)
VALUES 
('cccccccc-cccc-cccc-cccc-cccccccccccc', '00000000-0000-0000-0000-000000000001', '张三', '13800138010', 'D1234567890',
 '{"licenseClass": "G", "experience": "5年", "emergencyContact": "13877138777"}', 'active',
 '{"rating": 4.8, "onTimeRate": 95, "totalDeliveries": 1250, "customerSatisfaction": 92}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-cccccccccccd', '00000000-0000-0000-0000-000000000001', '李四', '13800138011', 'D2345678901',
 '{"licenseClass": "DZ", "experience": "8年", "emergencyContact": "13888138888"}', 'active',
 '{"rating": 4.9, "onTimeRate": 98, "totalDeliveries": 2100, "customerSatisfaction": 96}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-ccccccccccce', '00000000-0000-0000-0000-000000000001', '王五', '13800138012', 'D3456789012',
 '{"licenseClass": "AZ", "experience": "12年", "emergencyContact": "13899138999"}', 'active',
 '{"rating": 4.7, "onTimeRate": 97, "totalDeliveries": 3400, "customerSatisfaction": 94}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-cccccccccccf', '00000000-0000-0000-0000-000000000001', '赵六', '13800138013', 'D4567890123',
 '{"licenseClass": "G", "experience": "3年", "emergencyContact": "13800138000"}', 'active',
 '{"rating": 4.6, "onTimeRate": 92, "totalDeliveries": 680, "customerSatisfaction": 89}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-ccccccccccd0', '00000000-0000-0000-0000-000000000001', '陈七', '13800138014', 'D5678901234',
 '{"licenseClass": "CZ", "experience": "7年", "emergencyContact": "13800138001"}', 'busy',
 '{"rating": 4.8, "onTimeRate": 94, "totalDeliveries": 1890, "customerSatisfaction": 93}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-ccccccccccd1', '00000000-0000-0000-0000-000000000001', '刘八', '13800138015', 'D6789012345',
 '{"licenseClass": "DZ", "experience": "10年", "emergencyContact": "13800138002"}', 'active',
 '{"rating": 4.9, "onTimeRate": 96, "totalDeliveries": 2750, "customerSatisfaction": 95}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-ccccccccccd2', '00000000-0000-0000-0000-000000000001', '黄九', '13800138016', 'D7890123456',
 '{"licenseClass": "G", "experience": "4年", "emergencyContact": "13800138003"}', 'active',
 '{"rating": 4.5, "onTimeRate": 91, "totalDeliveries": 920, "customerSatisfaction": 88}', NOW(), NOW()),

('cccccccc-cccc-cccc-cccc-ccccccccccd3', '00000000-0000-0000-0000-000000000001', '周十', '13800138017', 'D8901234567',
 '{"licenseClass": "CZ", "experience": "9年", "emergencyContact": "13800138004"}', 'active',
 '{"rating": 4.7, "onTimeRate": 93, "totalDeliveries": 2250, "customerSatisfaction": 91}', NOW(), NOW());

-- =====================================================
-- 6. 创建行程数据
-- =====================================================
INSERT INTO public.trips (id, tenant_id, trip_no, status, driver_id, vehicle_id, legs, shipments, start_time_planned, end_time_planned, route_path, created_at, updated_at)
VALUES 
('dddddddd-dddd-dddd-dddd-dddddddddddd', '00000000-0000-0000-0000-000000000001', 'TRIP-20251002-001', 'ongoing', 
 'cccccccc-cccc-cccc-cccc-cccccccccccc', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
 '[{"type": "pickup", "address": {"addressLine1": "朝阳区发货点"}, "estimatedTime": "2025-10-02T09:00:00"}, {"type": "delivery", "address": {"addressLine1": "浦东收货点"}, "estimatedTime": "2025-10-02T14:00:00"}]',
 '[{"shipmentId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee", "status": "inTransit"}]',
 '2025-10-02T08:00:00', '2025-10-02T15:00:00',
 '{"distance": 120, "duration": 420, "fuelCost": 45}', NOW(), NOW()),

('dddddddd-dddd-dddd-dddd-ddddddddddde', '00000000-0000-0000-0000-000000000001', 'TRIP-20251002-002', 'planning', 
 'cccccccc-cccc-cccc-cccc-cccccccccccd', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbc',
 '[{"type": "pickup", "address": {"addressLine1": "天河区发货点"}, "estimatedTime": "2025-10-02T10:00:00"}, {"type": "delivery", "address": {"addressLine1": "南山区收货点"}, "estimatedTime": "2025-10-02T16:00:00"}]',
 '[{"shipmentId": "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef", "status": "planning"}]',
 '2025-10-02T09:30:00', '2025-10-02T17:00:00',
 '{"distance": 85, "duration": 385, "fuelCost": 32}', NOW(), NOW());

-- =====================================================
-- 7. 创建运单数据
-- =====================================================
INSERT INTO public.shipments (id, tenant_id, shipment_number, customer_id, driver_id, pickup_address, delivery_address, cargo_info, estimated_cost, actual_cost, additional_fees, applied_rules, status, timeline, created_at, updated_at)
VALUES 
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '00000000-0000-0000-0000-000000000001', 'TMS20251002001', 'a1111111-1111-1111-1111-111111111111', 'cccccccc-cccc-cccc-cccc-cccccccccccc',
 '{"addressLine1": "朝阳区建国门外大街123号", "city": "北京", "province": "北京市", "postalCode": "100022", "contact": "张三", "phone": "13800138001"}',
 '{"addressLine1": "浦东新区陆家嘴789号", "city": "上海", "province": "上海市", "postalCode": "200120", "contact": "李四", "phone": "13800138002"}',
 '{"description": "电子产品", "weight": 150, "volume": 2.5, "quantity": 5, "value": 15000, "fragile": true}',
 350.00, null, '[{"feeType": "express", "amount": 50}, {"feeType": "fragile", "amount": 25}]',
 '[{"ruleId": "express-delivery", "description": "加急运输规则"}]',
 'in_transit', '{"currentTime": "2025-10-02T08:00:00", "pickedUp": "2025-10-02T09:15:00", "inTransit": "2025-10-02T10:00:00"}', NOW(), NOW()),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeef', '00000000-0000-0000-0000-000000000001', 'TMS20251002002', 'a2222222-2222-2222-2222-222222222222', 'cccccccc-cccc-cccc-cccc-cccccccccccd',
 '{"addressLine1": "天河区珠江新城456号", "city": "广州", "province": "广东省", "postalCode": "510623", "contact": "王五", "phone": "13800138003"}',
 '{"addressLine1": "南山区科技园101号", "city": "深圳", "province": "广东省", "postalCode": "518057", "contact": "赵六", "phone": "13800138004"}',
 '{"description": "纺织品", "weight": 800, "volume": 15.0, "quantity": 20, "value": 8000, "fragile": false}',
 480.00, 485.50, '[{"feeType": "fuel_surcharge", "amount": 15}, {"feeType": "toll", "amount": 25}]',
 '[{"ruleId": "bulk-discount", "description": "大宗运输优惠"}]',
 'completed', '{"currentTime": "2025-10-02T09:00:00", "pickedUp": "2025-10-02T10:00:00", "completed": "2025-10-02T15:30:00"}', NOW(), NOW()),

('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeee0', '00000000-0000-0000-0000-000000000001', 'TMS20251002003', 'a3333333-3333-3333-3333-333333333333', null,
 '{"addressLine1": "西湖区文三路201号", "city": "杭州", "province": "浙江省", "postalCode": "310012", "contact": "陈七", "phone": "13800138005"}',
 '{"addressLine1": "玄武区中山路301号", "city": "南京", "province": "江苏省", "postalCode": "210018", "contact": "刘八", "phone": "13800138006"}',
 '{"description": "食品", "weight": 600, "volume": 8.0, "quantity": 12, "value": 2500, "fragile": false}',
 280.00, null, '[{"feeType": "fuel_surcharge", "amount": 10}]',
 '[{"ruleId": "food-transport", "description": "食品运输规则"}]',
 'pending', '{"currentTime": "2025-10-02T10:00:00"}', NOW(), NOW());

-- =====================================================
-- 📊 统计检查
-- =====================================================
SELECT '🎉 Supabase测试数据创建完成!' as message;

SELECT '👥 客户数量: ' || COUNT(*) as customers FROM public.customers WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

SELECT '🚗 司机数量: ' || COUNT(*) as drivers FROM public.drivers WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

SELECT '🚛 车辆数量: ' || COUNT(*) as vehicles FROM public.vehicles;

SELECT '📦 运单数量: ' || COUNT(*) as shipments FROM public.shipments WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

SELECT '🛣️ 行程数量: ' || COUNT(*) as trips FROM public.trips WHERE tenant_id = '00000000-0000-0000-0000-000000000001';
