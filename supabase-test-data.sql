-- Supabase测试数据SQL脚本 - 2025-10-02 17:02:00
-- 为TMS系统生成完整的测试数据

-- 确保有租户数据
INSERT INTO tenants (id, name, status, created_at, updated_at)
VALUES 
('00000000-0000-0000-0000-000000000001', 'APONY Transportation', 'active', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 生成客户数据 (VIP1-VIP5)
INSERT INTO customers (id, tenant_id, name, phone, email, level, address, status, created_at, updated_at)
VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'ABC贸易公司', '13800138001', 'abc@trade.com', 'VIP1', '{"addressLine1":"朝阳区123号","city":"北京","province":"北京市","postalCode":"100000"}', 'active', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'XYZ进出口有限公司', '13800138002', 'xyz@import.com', 'VIP2', '{"addressLine1":"浦东新区456号","city":"上海","province":"上海市","postalCode":"200000"}', 'active', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Quick Logistics Ltd', '13800138003', 'quick@logistics.com', 'VIP3', '{"addressLine1":"天河区789号","city":"广州","province":"广东省","postalCode":"510000"}', 'active', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Global Shipping Corp', '13800138004', 'global@ship.com', 'VIP4', '{"addressLine1":"南山区101号","city":"深圳","province":"广东省","postalCode":"518000"}', 'active', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'Fast Freight Inc', '13800138005', 'fast@freight.com', 'VIP5', '{"addressLine1":"西湖区201号","city":"杭州","province":"浙江省","postalCode":"310000"}', 'active', NOW(), NOW());

-- 生成司机数据 (15个司机)
INSERT INTO drivers (id, tenant_id, name, phone, status, age, english_proficiency, other_languages, license_class, created_at, updated_at)
VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '张三', '13800138010', 'available', 28, 'basic', '["普通话"]', 'G', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '李四', '13800138011', 'available', 32, 'intermediate', '["普通话", "粤语"]', 'DZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '王五', '13800138012', 'available', 35, 'fluent', '["普通话", "英语"]', 'AZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '赵六', '13800138013', 'available', 29, 'basic', '["普通话"]', 'G', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '陈七', '13800138014', 'available', 33, 'intermediate', '["普通话", "江苏话"]', 'CZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '刘八', '13800138015', 'available', 30, 'fluent', '["普通话", "英语", "法语"]', 'AZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '黄九', '13800138016', 'available', 27, 'basic', '["普通话"]', 'G2', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '周十', '13800138017', 'busy', 31, 'intermediate', '["普通话", "粤语"]', 'DZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '吴十一', '13800138018', 'available', 34, 'fluent', '["普通话", "英语"]', 'AZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '郑十二', '13800138019', 'available', 36, 'basic', '["普通话"]', 'G', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '王十三', '13800138020', 'available', 28, 'intermediate', '["普通话", "四川话"]', 'BZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '李十四', '13800138021', 'available', 32, 'fluent', '["普通话", "英语", "广东话"]', 'DZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '张十五', '13800138022', 'available', 29, 'basic', '["普通话"]', 'G1', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '刘十六', '13800138023', 'busy', 35, 'intermediate', '["普通话", "粤语"]', 'CZ', NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', '陈十七', '13800138024', 'available', 33, 'fluent', '["普通话", "英语"]', 'M', NOW(), NOW());

-- 检查司机数据插入情况
SELECT '司机数量: ' || COUNT(*) as result FROM drivers WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 生成车辆数据 (20个车辆)
INSERT INTO vehicles (id, plate_number, type, capacity_kg, status, dimensions, created_at, modified_at, created_by, modified_by)
VALUES 
(gen_random_uuid(), '京A00001', '厢式货车', 2000, 'available', '{"length": 4.2, "width": 1.8, "height": 2.1}', NOW(), NOW(), '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000001'),
(gen_random_uuid(), '京A00002', '平板车', 3000, 'available', '{"length": 5.0, "width": 2.2, "height": 1.5}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '沪A00003', '卡车', 5000, 'available', '{"length": 6.5, "width": 2.5, "height": 2.8}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '粤A00004', '面包车', 1000, 'available', '{"length": 3.8, "width": 1.6, "height": 1.9}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '苏A00005', '冷藏车', 4000, 'available', '{"length": 6.0, "width": 2.3, "height": 2.5}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '浙A00006', '厢式货车', 2500, 'available', '{"length": 4.5, "width": 1.9, "height": 2.2}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '京B00007', '平板车', 3500, 'available', '{"length": 5.2, "width": 2.3, "height": 1.6}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '沪B00008', '卡车', 6000, 'available', '{"length": 6.8, "width": 2.6, "height": 2.9}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '粤B00009', '厢式货车', 2200, 'available', '{"length": 4.3, "width": 1.8, "height": 2.1}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '苏B00010', '冷藏车', 4500, 'available', '{"length": 6.2, "width": 2.4, "height": 2.6}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '浙B00011', '面包车', 1200, 'available', '{"length": 3.9, "width": 1.7, "height": 1.95}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '京C00012', '平板车', 3200, 'available', '{"length": 5.1, "width": 2.2, "height": 1.55}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '沪C00013', '卡车', 5500, 'available', '{"length": 6.6, "width": 2.5, "height": 2.85}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '粤C00014', '厢式货车', 2300, 'available', '{"length": 4.4, "width": 1.85, "height": 2.15}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '苏C00015', '冷藏车', 4200, 'available', '{"length": 6.1, "width": 2.35, "height": 2.55}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '浙C00016', '面包车', 1100, 'available', '{"length": 3.85, "width": 1.65, "height": 1.9}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '京D00017', '平板车', 2800, 'available', '{"length": 4.9, "width": 2.1, "height": 1.45}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '沪D00018', '卡车', 4800, 'available', '{"length": 6.3, "width": 2.4, "height": 2.7}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '粤D00019', '厢式货车', 2100, 'available', '{"length": 4.1, "width": 1.75, "height": 2.05}', NOW(), NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0'),
(gen_random_uuid(), '苏D00020', '冷藏车', 3800, 'available', '{"length": 5.9, "width": 2.3, "height": 2.4}', NOW(), '00000000-0000-0000-0', '00000000-0000-0000-0');

-- 检查车辆数据插入情况
SELECT '车辆数量: ' || COUNT(*) as result FROM vehicles;

-- 生成运单数据 (10个运单)
INSERT INTO shipments (id, tenant_id, shipment_number, customer_id, shipper_address, receiver_address, cargo_description, cargo_weight, cargo_quantity, status, estimated_cost, created_at, updated_at)
SELECT 
gen_random_uuid(),
'00000000-0000-0000-0000-000000000001',
'TMS202510020' || LPAD(ROW_NUMBER() OVER()::text, 3, '0'),
c.id,
'{"addressLine1":"发货地址' || ROW_NUMBER() OVER() || '","city":"北京","province":"北京市"}',
'{"addressLine1":"收货地址' || ROW_NUMBER() OVER() || '","city":"上海","province":"上海市"}',
'测试货物' || ROW_NUMBER() OVER(),
ROUND(RANDOM() * 1000 + 500)::integer,
ROUND(RANDOM() * 10 + 1)::integer,
'pending',
ROUND(RANDOM() * 500 + 200)::decimal(10,2),
NOW(),
NOW()
FROM customers c
WHERE c.tenant_id = '00000000-0000-0000-0000-000000000001'
LIMIT 5;

-- 添加更多运单数据
INSERT INTO shipments (id, tenant_id, shipment_number, customer_id, shiper_address, receiver_address, cargo_description, cargo_weight, cargo_quantity, status, estimated_cost, created_at, updated_at)
VALUES 
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'TMS20251002006', (SELECT id FROM customers LIMIT 1), '{"addressLine1":"苏州工业园区","city":"苏州","province":"江苏省"}', '{"addressLine1":"杭州高新技术区","city":"杭州","province":"浙江省"}', '电子产品', 800, 5, 'in_transit', 350.00, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'TMS20251002007', (SELECT id FROM customers LIMIT 1 OFFSET 1), '{"addressLine1":"广州物流中心","city":"广州","province":"广东省"}', '{"addressLine1":"深圳港口","city":"深圳","province":"广东省"}', '纺织品', 1200, 8, 'completed', 480.00, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'TMS20251002008', (SELECT id FROM customers LIMIT 1 OFFSET 2), '{"addressLine1":"成都生产基地","city":"成都","province":"四川省"}', '{"addressLine1":"重庆分发中心","city":"重庆","province":"重庆市"}', '食品', 600, 3, 'pending', 280.00, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'TMS20251002009', (SELECT id FROM customers LIMIT 1 OFFSET 3), '{"addressLine1":"天津保税区","city":"天津","province":"天津市"}', '{"addressLine1":"北京仓库","city":"北京","province":"北京市"}', '机械设备', 2000, 2, 'in_transit', 650.00, NOW(), NOW()),
(gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'TMS20251002010', (SELECT id FROM customers LIMIT 1 OFFSET 4), '{"addressLine1":"大连港","city":"大连","province":"辽宁省"}', '{"addressLine1":"沈阳配送中心","city":"沈阳","province":"辽宁省"}', '化工产品', 1500, 4, 'pending', 420.00, NOW(), NOW());

-- 检查运单数据插入情况
SELECT '运单数量: ' || COUNT(*) as result FROM shipments WHERE tenant_id = '00000000-0000-0000-0000-000000000001';

-- 最终统计
SELECT 
'📊 Supabase测试数据生成完成:' as info,
'👥 客户: ' || COUNT(DISTINCT c.id) as customers,
'🚗 司机: ' || COUNT(DISTINCT d.id) as drivers,
'🚛 车辆: ' || COUNT(DISTINCT v.id) as vehicles,
'📦 运单: ' || COUNT(DISTINCT s.id) as shipments
FROM tenants t
LEFT JOIN customers c ON c.tenant_id = t.id
LEFT JOIN drivers d ON d.tenant_id = t.id  
LEFT JOIN vehicles v ON 1=1
LEFT JOIN shipments s ON s.tenant_id = t.id
WHERE t.id = '00000000-0000-0000-0000-000000000001';
