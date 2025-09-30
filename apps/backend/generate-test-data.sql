-- 测试数据生成SQL脚本
-- 创建时间: 2025-09-30 10:45:00
-- 作用: 生成完整的测试数据，包含各种状态和时间

-- 清理现有测试数据
DELETE FROM trips WHERE id LIKE 'trip_%';
DELETE FROM shipments WHERE id LIKE 'shipment_%';
DELETE FROM vehicles WHERE id LIKE 'vehicle_%';
DELETE FROM drivers WHERE id LIKE 'driver_%';
DELETE FROM customers WHERE id LIKE 'customer_%';

-- 插入测试客户数据
INSERT INTO customers (id, name, email, phone, level, contact_info, billing_info, created_at, updated_at) VALUES
('customer_1', '客户1', 'customer1@example.com', '13800000001', 'standard', 
 '{"address": {"street": "北京市1号大街1号", "city": "北京市", "state": "北京", "postalCode": "100001", "country": "中国"}}',
 '{"companyName": "北京市贸易公司1", "taxId": "TAX000001", "billingAddress": {"street": "北京市1号大街1号", "city": "北京市", "state": "北京", "postalCode": "100001", "country": "中国"}}',
 NOW() - INTERVAL '25 days', NOW() - INTERVAL '5 days'),

('customer_2', '客户2', 'customer2@example.com', '13800000002', 'premium',
 '{"address": {"street": "上海市2号大街2号", "city": "上海市", "state": "上海", "postalCode": "100002", "country": "中国"}}',
 '{"companyName": "上海市贸易公司2", "taxId": "TAX000002", "billingAddress": {"street": "上海市2号大街2号", "city": "上海市", "state": "上海", "postalCode": "100002", "country": "中国"}}',
 NOW() - INTERVAL '20 days', NOW() - INTERVAL '3 days'),

('customer_3', '客户3', 'customer3@example.com', '13800000003', 'vip',
 '{"address": {"street": "广州市3号大街3号", "city": "广州市", "state": "广东", "postalCode": "100003", "country": "中国"}}',
 '{"companyName": "广州市贸易公司3", "taxId": "TAX000003", "billingAddress": {"street": "广州市3号大街3号", "city": "广州市", "state": "广东", "postalCode": "100003", "country": "中国"}}',
 NOW() - INTERVAL '15 days', NOW() - INTERVAL '2 days'),

('customer_4', '客户4', 'customer4@example.com', '13800000004', 'standard',
 '{"address": {"street": "深圳市4号大街4号", "city": "深圳市", "state": "广东", "postalCode": "100004", "country": "中国"}}',
 '{"companyName": "深圳市贸易公司4", "taxId": "TAX000004", "billingAddress": {"street": "深圳市4号大街4号", "city": "深圳市", "state": "广东", "postalCode": "100004", "country": "中国"}}',
 NOW() - INTERVAL '12 days', NOW() - INTERVAL '1 day'),

('customer_5', '客户5', 'customer5@example.com', '13800000005', 'premium',
 '{"address": {"street": "杭州市5号大街5号", "city": "杭州市", "state": "浙江", "postalCode": "100005", "country": "中国"}}',
 '{"companyName": "杭州市贸易公司5", "taxId": "TAX000005", "billingAddress": {"street": "杭州市5号大街5号", "city": "杭州市", "state": "浙江", "postalCode": "100005", "country": "中国"}}',
 NOW() - INTERVAL '8 days', NOW() - INTERVAL '4 hours'),

('customer_6', '客户6', 'customer6@example.com', '13800000006', 'vip',
 '{"address": {"street": "南京市6号大街6号", "city": "南京市", "state": "江苏", "postalCode": "100006", "country": "中国"}}',
 '{"companyName": "南京市贸易公司6", "taxId": "TAX000006", "billingAddress": {"street": "南京市6号大街6号", "city": "南京市", "state": "江苏", "postalCode": "100006", "country": "中国"}}',
 NOW() - INTERVAL '6 days', NOW() - INTERVAL '2 hours'),

('customer_7', '客户7', 'customer7@example.com', '13800000007', 'standard',
 '{"address": {"street": "成都市7号大街7号", "city": "成都市", "state": "四川", "postalCode": "100007", "country": "中国"}}',
 '{"companyName": "成都市贸易公司7", "taxId": "TAX000007", "billingAddress": {"street": "成都市7号大街7号", "city": "成都市", "state": "四川", "postalCode": "100007", "country": "中国"}}',
 NOW() - INTERVAL '4 days', NOW() - INTERVAL '1 hour'),

('customer_8', '客户8', 'customer8@example.com', '13800000008', 'premium',
 '{"address": {"street": "武汉市8号大街8号", "city": "武汉市", "state": "湖北", "postalCode": "100008", "country": "中国"}}',
 '{"companyName": "武汉市贸易公司8", "taxId": "TAX000008", "billingAddress": {"street": "武汉市8号大街8号", "city": "武汉市", "state": "湖北", "postalCode": "100008", "country": "中国"}}',
 NOW() - INTERVAL '2 days', NOW() - INTERVAL '30 minutes');

-- 插入测试司机数据
INSERT INTO drivers (id, name, phone, email, status, license_number, license_expiry, created_at, updated_at) VALUES
('driver_1', '司机1', '13900000001', 'driver1@example.com', 'available', 'A0000000001', DATE_ADD(NOW(), INTERVAL 365 DAY), NOW() - INTERVAL '45 days', NOW() - INTERVAL '5 days'),
('driver_2', '司机2', '13900000002', 'driver2@example.com', 'busy', 'A0000000002', DATE_ADD(NOW(), INTERVAL 300 DAY), NOW() - INTERVAL '40 days', NOW() - INTERVAL '3 days'),
('driver_3', '司机3', '13900000003', 'driver3@example.com', 'available', 'A0000000003', DATE_ADD(NOW(), INTERVAL 400 DAY), NOW() - INTERVAL '35 days', NOW() - INTERVAL '2 days'),
('driver_4', '司机4', '13900000004', 'driver4@example.com', 'offline', 'A0000000004', DATE_ADD(NOW(), INTERVAL 200 DAY), NOW() - INTERVAL '30 days', NOW() - INTERVAL '1 day'),
('driver_5', '司机5', '13900000005', 'driver5@example.com', 'available', 'A0000000005', DATE_ADD(NOW(), INTERVAL 500 DAY), NOW() - INTERVAL '25 days', NOW() - INTERVAL '6 hours');

-- 插入测试车辆数据
INSERT INTO vehicles (id, plate_number, type, capacity_kg, status, year, make, model, created_at, updated_at) VALUES
('vehicle_1', '京A00001', '厢式货车', 5000, 'available', 2022, '东风', '天龙', NOW() - INTERVAL '50 days', NOW() - INTERVAL '5 days'),
('vehicle_2', '京B00002', '平板车', 8000, 'busy', 2021, '解放', 'J6', NOW() - INTERVAL '45 days', NOW() - INTERVAL '3 days'),
('vehicle_3', '京C00003', '冷藏车', 6000, 'available', 2023, '重汽', '豪沃', NOW() - INTERVAL '40 days', NOW() - INTERVAL '2 days'),
('vehicle_4', '京D00004', '危险品运输车', 4000, 'maintenance', 2020, '陕汽', '德龙', NOW() - INTERVAL '35 days', NOW() - INTERVAL '1 day'),
('vehicle_5', '京E00005', '厢式货车', 7000, 'available', 2022, '福田', '欧曼', NOW() - INTERVAL '30 days', NOW() - INTERVAL '4 hours'),
('vehicle_6', '京F00006', '平板车', 9000, 'busy', 2021, '东风', '天龙', NOW() - INTERVAL '25 days', NOW() - INTERVAL '2 hours');

-- 插入测试运单数据（20条，包含各种状态）
INSERT INTO shipments (id, shipment_number, customer_id, status, shipper_address, receiver_address, weight_kg, length_cm, width_cm, height_cm, description, estimated_cost, final_cost, created_at, updated_at) VALUES
-- 今天创建的运单
('shipment_1', CONCAT('SHIP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-001'), 'customer_1', 'pending', 
 '{"country": "中国", "province": "北京", "city": "北京市", "postalCode": "100001", "addressLine1": "北京市发货地址1号", "isResidential": false}',
 '{"country": "中国", "province": "上海", "city": "上海市", "postalCode": "200001", "addressLine1": "上海市收货地址1号", "isResidential": true}',
 150, 100, 80, 60, '电子产品', 800, NULL, NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),

('shipment_2', CONCAT('SHIP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-002'), 'customer_2', 'quoted',
 '{"country": "中国", "province": "上海", "city": "上海市", "postalCode": "100002", "addressLine1": "上海市发货地址2号", "isResidential": false}',
 '{"country": "中国", "province": "广东", "city": "广州市", "postalCode": "200002", "addressLine1": "广州市收货地址2号", "isResidential": true}',
 200, 120, 90, 70, '服装', 1200, NULL, NOW() - INTERVAL '4 hours', NOW() - INTERVAL '1 hour'),

-- 昨天创建的运单
('shipment_3', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 1 DAY, '%Y%m%d'), '-003'), 'customer_3', 'confirmed',
 '{"country": "中国", "province": "广东", "city": "广州市", "postalCode": "100003", "addressLine1": "广州市发货地址3号", "isResidential": false}',
 '{"country": "中国", "province": "广东", "city": "深圳市", "postalCode": "200003", "addressLine1": "深圳市收货地址3号", "isResidential": false}',
 300, 150, 100, 80, '食品', 1500, NULL, NOW() - INTERVAL 1 DAY - INTERVAL '3 hours', NOW() - INTERVAL '2 hours'),

('shipment_4', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 1 DAY, '%Y%m%d'), '-004'), 'customer_4', 'assigned',
 '{"country": "中国", "province": "广东", "city": "深圳市", "postalCode": "100004", "addressLine1": "深圳市发货地址4号", "isResidential": false}',
 '{"country": "中国", "province": "浙江", "city": "杭州市", "postalCode": "200004", "addressLine1": "杭州市收货地址4号", "isResidential": true}',
 180, 110, 85, 65, '家具', 900, NULL, NOW() - INTERVAL 1 DAY - INTERVAL '6 hours', NOW() - INTERVAL '1 hour'),

-- 本周创建的运单
('shipment_5', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 2 DAY, '%Y%m%d'), '-005'), 'customer_5', 'picked_up',
 '{"country": "中国", "province": "浙江", "city": "杭州市", "postalCode": "100005", "addressLine1": "杭州市发货地址5号", "isResidential": false}',
 '{"country": "中国", "province": "江苏", "city": "南京市", "postalCode": "200005", "addressLine1": "南京市收货地址5号", "isResidential": true}',
 250, 140, 95, 75, '建材', 1100, NULL, NOW() - INTERVAL 2 DAY - INTERVAL '2 hours', NOW() - INTERVAL '3 hours'),

('shipment_6', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 2 DAY, '%Y%m%d'), '-006'), 'customer_6', 'in_transit',
 '{"country": "中国", "province": "江苏", "city": "南京市", "postalCode": "100006", "addressLine1": "南京市发货地址6号", "isResidential": false}',
 '{"country": "中国", "province": "四川", "city": "成都市", "postalCode": "200006", "addressLine1": "成都市收货地址6号", "isResidential": true}',
 320, 160, 110, 85, '化工产品', 1800, NULL, NOW() - INTERVAL 2 DAY - INTERVAL '5 hours', NOW() - INTERVAL '2 hours'),

('shipment_7', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 3 DAY, '%Y%m%d'), '-007'), 'customer_7', 'delivered',
 '{"country": "中国", "province": "四川", "city": "成都市", "postalCode": "100007", "addressLine1": "成都市发货地址7号", "isResidential": false}',
 '{"country": "中国", "province": "湖北", "city": "武汉市", "postalCode": "200007", "addressLine1": "武汉市收货地址7号", "isResidential": true}',
 190, 115, 88, 68, '机械零件', 950, 950, NOW() - INTERVAL 3 DAY - INTERVAL '4 hours', NOW() - INTERVAL 1 DAY - INTERVAL '2 hours'),

('shipment_8', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 3 DAY, '%Y%m%d'), '-008'), 'customer_8', 'completed',
 '{"country": "中国", "province": "湖北", "city": "武汉市", "postalCode": "100008", "addressLine1": "武汉市发货地址8号", "isResidential": false}',
 '{"country": "中国", "province": "北京", "city": "北京市", "postalCode": "200008", "addressLine1": "北京市收货地址8号", "isResidential": false}',
 280, 145, 98, 78, '图书', 1300, 1300, NOW() - INTERVAL 3 DAY - INTERVAL '6 hours', NOW() - INTERVAL 1 DAY - INTERVAL '1 hour'),

-- 上周创建的运单
('shipment_9', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 7 DAY, '%Y%m%d'), '-009'), 'customer_1', 'completed',
 '{"country": "中国", "province": "北京", "city": "北京市", "postalCode": "100001", "addressLine1": "北京市发货地址9号", "isResidential": false}',
 '{"country": "中国", "province": "上海", "city": "上海市", "postalCode": "200009", "addressLine1": "上海市收货地址9号", "isResidential": true}',
 220, 130, 92, 72, '日用品', 1050, 1050, NOW() - INTERVAL 7 DAY - INTERVAL '3 hours', NOW() - INTERVAL 5 DAY - INTERVAL '2 hours'),

('shipment_10', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 8 DAY, '%Y%m%d'), '-010'), 'customer_2', 'completed',
 '{"country": "中国", "province": "上海", "city": "上海市", "postalCode": "100002", "addressLine1": "上海市发货地址10号", "isResidential": false}',
 '{"country": "中国", "province": "广东", "city": "广州市", "postalCode": "200010", "addressLine1": "广州市收货地址10号", "isResidential": true}',
 350, 170, 120, 90, '医疗器械', 2000, 2000, NOW() - INTERVAL 8 DAY - INTERVAL '4 hours', NOW() - INTERVAL 6 DAY - INTERVAL '3 hours'),

('shipment_11', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 9 DAY, '%Y%m%d'), '-011'), 'customer_3', 'completed',
 '{"country": "中国", "province": "广东", "city": "广州市", "postalCode": "100003", "addressLine1": "广州市发货地址11号", "isResidential": false}',
 '{"country": "中国", "province": "广东", "city": "深圳市", "postalCode": "200011", "addressLine1": "深圳市收货地址11号", "isResidential": false}',
 160, 105, 82, 62, '电子产品', 850, 850, NOW() - INTERVAL 9 DAY - INTERVAL '2 hours', NOW() - INTERVAL 7 DAY - INTERVAL '1 hour'),

('shipment_12', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 10 DAY, '%Y%m%d'), '-012'), 'customer_4', 'completed',
 '{"country": "中国", "province": "广东", "city": "深圳市", "postalCode": "100004", "addressLine1": "深圳市发货地址12号", "isResidential": false}',
 '{"country": "中国", "province": "浙江", "city": "杭州市", "postalCode": "200012", "addressLine1": "杭州市收货地址12号", "isResidential": true}',
 290, 155, 105, 80, '服装', 1400, 1400, NOW() - INTERVAL 10 DAY - INTERVAL '5 hours', NOW() - INTERVAL 8 DAY - INTERVAL '2 hours'),

-- 本月创建的运单
('shipment_13', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 15 DAY, '%Y%m%d'), '-013'), 'customer_5', 'completed',
 '{"country": "中国", "province": "浙江", "city": "杭州市", "postalCode": "100005", "addressLine1": "杭州市发货地址13号", "isResidential": false}',
 '{"country": "中国", "province": "江苏", "city": "南京市", "postalCode": "200013", "addressLine1": "南京市收货地址13号", "isResidential": true}',
 240, 135, 88, 70, '食品', 1150, 1150, NOW() - INTERVAL 15 DAY - INTERVAL '3 hours', NOW() - INTERVAL 13 DAY - INTERVAL '4 hours'),

('shipment_14', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 18 DAY, '%Y%m%d'), '-014'), 'customer_6', 'completed',
 '{"country": "中国", "province": "江苏", "city": "南京市", "postalCode": "100006", "addressLine1": "南京市发货地址14号", "isResidential": false}',
 '{"country": "中国", "province": "四川", "city": "成都市", "postalCode": "200014", "addressLine1": "成都市收货地址14号", "isResidential": true}',
 310, 165, 112, 82, '建材', 1700, 1700, NOW() - INTERVAL 18 DAY - INTERVAL '4 hours', NOW() - INTERVAL 16 DAY - INTERVAL '3 hours'),

('shipment_15', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 20 DAY, '%Y%m%d'), '-015'), 'customer_7', 'completed',
 '{"country": "中国", "province": "四川", "city": "成都市", "postalCode": "100007", "addressLine1": "成都市发货地址15号", "isResidential": false}',
 '{"country": "中国", "province": "湖北", "city": "武汉市", "postalCode": "200015", "addressLine1": "武汉市收货地址15号", "isResidential": true}',
 200, 125, 85, 65, '化工产品', 1000, 1000, NOW() - INTERVAL 20 DAY - INTERVAL '2 hours', NOW() - INTERVAL 18 DAY - INTERVAL '2 hours'),

-- 取消的运单
('shipment_16', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 5 DAY, '%Y%m%d'), '-016'), 'customer_8', 'cancelled',
 '{"country": "中国", "province": "湖北", "city": "武汉市", "postalCode": "100008", "addressLine1": "武汉市发货地址16号", "isResidential": false}',
 '{"country": "中国", "province": "北京", "city": "北京市", "postalCode": "200016", "addressLine1": "北京市收货地址16号", "isResidential": false}',
 270, 150, 95, 75, '机械零件', 1250, NULL, NOW() - INTERVAL 5 DAY - INTERVAL '4 hours', NOW() - INTERVAL 3 DAY - INTERVAL '2 hours'),

('shipment_17', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 12 DAY, '%Y%m%d'), '-017'), 'customer_1', 'cancelled',
 '{"country": "中国", "province": "北京", "city": "北京市", "postalCode": "100001", "addressLine1": "北京市发货地址17号", "isResidential": false}',
 '{"country": "中国", "province": "上海", "city": "上海市", "postalCode": "200017", "addressLine1": "上海市收货地址17号", "isResidential": true}',
 180, 120, 80, 60, '图书', 900, NULL, NOW() - INTERVAL 12 DAY - INTERVAL '3 hours', NOW() - INTERVAL 10 DAY - INTERVAL '1 hour'),

-- 更多运单
('shipment_18', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 4 DAY, '%Y%m%d'), '-018'), 'customer_2', 'assigned',
 '{"country": "中国", "province": "上海", "city": "上海市", "postalCode": "100002", "addressLine1": "上海市发货地址18号", "isResidential": false}',
 '{"country": "中国", "province": "广东", "city": "广州市", "postalCode": "200018", "addressLine1": "广州市收货地址18号", "isResidential": true}',
 260, 140, 90, 70, '日用品', 1200, NULL, NOW() - INTERVAL 4 DAY - INTERVAL '5 hours', NOW() - INTERVAL '2 hours'),

('shipment_19', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 6 DAY, '%Y%m%d'), '-019'), 'customer_3', 'picked_up',
 '{"country": "中国", "province": "广东", "city": "广州市", "postalCode": "100003", "addressLine1": "广州市发货地址19号", "isResidential": false}',
 '{"country": "中国", "province": "广东", "city": "深圳市", "postalCode": "200019", "addressLine1": "深圳市收货地址19号", "isResidential": false}',
 330, 175, 115, 85, '医疗器械', 1900, NULL, NOW() - INTERVAL 6 DAY - INTERVAL '3 hours', NOW() - INTERVAL '4 hours'),

('shipment_20', CONCAT('SHIP-', DATE_FORMAT(NOW() - INTERVAL 1 DAY, '%Y%m%d'), '-020'), 'customer_4', 'in_transit',
 '{"country": "中国", "province": "广东", "city": "深圳市", "postalCode": "100004", "addressLine1": "深圳市发货地址20号", "isResidential": false}',
 '{"country": "中国", "province": "浙江", "city": "杭州市", "postalCode": "200020", "addressLine1": "杭州市收货地址20号", "isResidential": true}',
 210, 130, 88, 68, '家具', 1100, NULL, NOW() - INTERVAL 1 DAY - INTERVAL '7 hours', NOW() - INTERVAL '3 hours');

-- 插入测试行程数据
INSERT INTO trips (id, trip_no, status, driver_id, vehicle_id, shipments, start_time_planned, end_time_planned, start_time_actual, end_time_actual, created_at, updated_at) VALUES
('trip_1', CONCAT('TRIP-', DATE_FORMAT(NOW() - INTERVAL 2 DAY, '%Y%m%d'), '-001'), 'completed', 'driver_1', 'vehicle_1', 
 '["shipment_7", "shipment_8"]', 
 DATE_SUB(NOW() - INTERVAL 2 DAY, INTERVAL 2 HOUR), 
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 2 DAY, INTERVAL 2 HOUR), INTERVAL 8 HOUR),
 DATE_SUB(NOW() - INTERVAL 2 DAY, INTERVAL 1 HOUR 30 MINUTE),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 2 DAY, INTERVAL 2 HOUR), INTERVAL 8 HOUR 30 MINUTE),
 DATE_SUB(NOW() - INTERVAL 2 DAY, INTERVAL 1 DAY), NOW() - INTERVAL 1 DAY),

('trip_2', CONCAT('TRIP-', DATE_FORMAT(NOW() - INTERVAL 1 DAY, '%Y%m%d'), '-002'), 'ongoing', 'driver_2', 'vehicle_2',
 '["shipment_5", "shipment_6"]',
 DATE_SUB(NOW() - INTERVAL 1 DAY, INTERVAL 1 HOUR),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 1 DAY, INTERVAL 1 HOUR), INTERVAL 6 HOUR),
 DATE_SUB(NOW() - INTERVAL 1 DAY, INTERVAL 30 MINUTE),
 NULL,
 DATE_SUB(NOW() - INTERVAL 1 DAY, INTERVAL 1 DAY), NOW() - INTERVAL '2 hours'),

('trip_3', CONCAT('TRIP-', DATE_FORMAT(NOW(), '%Y%m%d'), '-003'), 'ongoing', 'driver_3', 'vehicle_3',
 '["shipment_19", "shipment_20"]',
 DATE_SUB(NOW(), INTERVAL 3 HOUR),
 DATE_ADD(DATE_SUB(NOW(), INTERVAL 3 HOUR), INTERVAL 7 HOUR),
 DATE_SUB(NOW(), INTERVAL 2 HOUR 30 MINUTE),
 NULL,
 DATE_SUB(NOW(), INTERVAL 1 DAY), NOW() - INTERVAL '1 hour'),

('trip_4', CONCAT('TRIP-', DATE_FORMAT(NOW() + INTERVAL 1 DAY, '%Y%m%d'), '-004'), 'planning', 'driver_1', 'vehicle_1',
 '["shipment_18"]',
 DATE_ADD(NOW(), INTERVAL 1 DAY),
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 5 HOUR),
 NULL,
 NULL,
 NOW() - INTERVAL '2 hours', NOW() - INTERVAL '30 minutes'),

('trip_5', CONCAT('TRIP-', DATE_FORMAT(NOW() - INTERVAL 3 DAY, '%Y%m%d'), '-005'), 'completed', 'driver_4', 'vehicle_4',
 '["shipment_9", "shipment_10"]',
 DATE_SUB(NOW() - INTERVAL 3 DAY, INTERVAL 3 HOUR),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 3 DAY, INTERVAL 3 HOUR), INTERVAL 9 HOUR),
 DATE_SUB(NOW() - INTERVAL 3 DAY, INTERVAL 2 HOUR 30 MINUTE),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 3 DAY, INTERVAL 3 HOUR), INTERVAL 9 HOUR 15 MINUTE),
 DATE_SUB(NOW() - INTERVAL 3 DAY, INTERVAL 1 DAY), NOW() - INTERVAL 2 DAY),

('trip_6', CONCAT('TRIP-', DATE_FORMAT(NOW() - INTERVAL 5 DAY, '%Y%m%d'), '-006'), 'completed', 'driver_5', 'vehicle_5',
 '["shipment_11", "shipment_12"]',
 DATE_SUB(NOW() - INTERVAL 5 DAY, INTERVAL 4 HOUR),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 5 DAY, INTERVAL 4 HOUR), INTERVAL 6 HOUR),
 DATE_SUB(NOW() - INTERVAL 5 DAY, INTERVAL 3 HOUR 30 MINUTE),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 5 DAY, INTERVAL 4 HOUR), INTERVAL 6 HOUR 45 MINUTE),
 DATE_SUB(NOW() - INTERVAL 5 DAY, INTERVAL 1 DAY), NOW() - INTERVAL 4 DAY),

('trip_7', CONCAT('TRIP-', DATE_FORMAT(NOW() - INTERVAL 8 DAY, '%Y%m%d'), '-007'), 'completed', 'driver_1', 'vehicle_6',
 '["shipment_13", "shipment_14", "shipment_15"]',
 DATE_SUB(NOW() - INTERVAL 8 DAY, INTERVAL 2 HOUR),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 8 DAY, INTERVAL 2 HOUR), INTERVAL 10 HOUR),
 DATE_SUB(NOW() - INTERVAL 8 DAY, INTERVAL 1 HOUR 15 MINUTE),
 DATE_ADD(DATE_SUB(NOW() - INTERVAL 8 DAY, INTERVAL 2 HOUR), INTERVAL 10 HOUR 30 MINUTE),
 DATE_SUB(NOW() - INTERVAL 8 DAY, INTERVAL 1 DAY), NOW() - INTERVAL 7 DAY),

('trip_8', CONCAT('TRIP-', DATE_FORMAT(NOW() + INTERVAL 2 DAY, '%Y%m%d'), '-008'), 'planning', 'driver_2', 'vehicle_2',
 '["shipment_1", "shipment_2", "shipment_3"]',
 DATE_ADD(NOW(), INTERVAL 2 DAY),
 DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 8 HOUR),
 NULL,
 NULL,
 NOW() - INTERVAL '1 hour', NOW() - INTERVAL '15 minutes');

-- 显示生成结果
SELECT 'Customers' as table_name, COUNT(*) as count FROM customers WHERE id LIKE 'customer_%'
UNION ALL
SELECT 'Drivers', COUNT(*) FROM drivers WHERE id LIKE 'driver_%'
UNION ALL
SELECT 'Vehicles', COUNT(*) FROM vehicles WHERE id LIKE 'vehicle_%'
UNION ALL
SELECT 'Shipments', COUNT(*) FROM shipments WHERE id LIKE 'shipment_%'
UNION ALL
SELECT 'Trips', COUNT(*) FROM trips WHERE id LIKE 'trip_%';

-- 显示运单状态分布
SELECT status, COUNT(*) as count FROM shipments WHERE id LIKE 'shipment_%' GROUP BY status ORDER BY count DESC;

-- 显示行程状态分布
SELECT status, COUNT(*) as count FROM trips WHERE id LIKE 'trip_%' GROUP BY status ORDER BY count DESC;

-- 显示按日期分布的运单
SELECT DATE(created_at) as date, COUNT(*) as count FROM shipments WHERE id LIKE 'shipment_%' GROUP BY DATE(created_at) ORDER BY date DESC;
