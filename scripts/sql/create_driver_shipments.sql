-- 为移动端司机创建运单数据
-- 创建时间: 2025-11-30T20:05:00Z

-- 首先找到或创建与用户 ID 10000000-0000-0000-0000-000000000002 关联的司机
-- 如果不存在，创建一个新的司机记录
INSERT INTO drivers (id, tenant_id, name, phone, license_number, status, created_at, updated_at)
SELECT 
  '10000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000001',
  '李四',
  '13800000002',
  'DL2024000002',
  'available',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM drivers WHERE id = '10000000-0000-0000-0000-000000000002'
);

-- 获取第一个可用的车辆ID（如果存在）
DO $$
DECLARE
  v_vehicle_id UUID;
  v_customer_id UUID;
  v_driver_id UUID := '10000000-0000-0000-0000-000000000002';
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- 获取第一个可用的车辆
  SELECT id INTO v_vehicle_id 
  FROM vehicles 
  WHERE tenant_id = v_tenant_id 
  LIMIT 1;
  
  -- 如果没有车辆，创建一个
  IF v_vehicle_id IS NULL THEN
    INSERT INTO vehicles (id, tenant_id, plate_number, type, capacity_kg, status, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_tenant_id,
      '京A12345',
      'truck',
      5000,
      'available',
      NOW(),
      NOW()
    )
    RETURNING id INTO v_vehicle_id;
  END IF;
  
  -- 更新司机关联车辆
  UPDATE drivers 
  SET vehicle_id = v_vehicle_id, updated_at = NOW()
  WHERE id = v_driver_id;
  
  -- 获取第一个客户ID
  SELECT id INTO v_customer_id 
  FROM customers 
  WHERE tenant_id = v_tenant_id 
  LIMIT 1;
  
  -- 如果没有客户，创建一个
  IF v_customer_id IS NULL THEN
    INSERT INTO customers (id, tenant_id, name, level, contact_info, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      v_tenant_id,
      '示例客户',
      'standard',
      '{"phone": "13800138000", "email": "customer@example.com"}'::jsonb,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_customer_id;
  END IF;
  
  -- 创建多个运单，状态适合移动端显示
  -- 1. 已分配待确认的运单
  INSERT INTO shipments (
    id, tenant_id, shipment_number, customer_id, driver_id,
    pickup_address, delivery_address, cargo_info,
    estimated_cost, status, timeline, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'SH' || TO_CHAR(NOW(), 'YYYYMMDD') || '0001',
    v_customer_id,
    v_driver_id,
    '{"addressLine1": "北京市朝阳区三里屯路1号", "city": "北京", "province": "北京", "postalCode": "100027", "country": "中国", "latitude": 39.9042, "longitude": 116.4074}'::jsonb,
    '{"addressLine1": "上海市黄浦区南京东路100号", "city": "上海", "province": "上海", "postalCode": "200001", "country": "中国", "latitude": 31.2304, "longitude": 121.4737}'::jsonb,
    '{"weightKg": 150, "volume": 2.5, "description": "电子产品", "items": [{"name": "手机", "quantity": 50}]}'::jsonb,
    800.00,
    'assigned',
    json_build_object(
      'created', NOW()::text,
      'assigned', NOW()::text
    )::jsonb,
    NOW(),
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  -- 2. 已确认的运单
  INSERT INTO shipments (
    id, tenant_id, shipment_number, customer_id, driver_id,
    pickup_address, delivery_address, cargo_info,
    estimated_cost, status, timeline, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'SH' || TO_CHAR(NOW(), 'YYYYMMDD') || '0002',
    v_customer_id,
    v_driver_id,
    '{"addressLine1": "北京市海淀区中关村大街1号", "city": "北京", "province": "北京", "postalCode": "100080", "country": "中国", "latitude": 39.9836, "longitude": 116.3184}'::jsonb,
    '{"addressLine1": "广州市天河区天河路200号", "city": "广州", "province": "广东", "postalCode": "510620", "country": "中国", "latitude": 23.1291, "longitude": 113.2644}'::jsonb,
    '{"weightKg": 200, "volume": 3.0, "description": "服装", "items": [{"name": "T恤", "quantity": 100}]}'::jsonb,
    1200.00,
    'confirmed',
    json_build_object(
      'created', (NOW() - INTERVAL '1 hour')::text,
      'assigned', (NOW() - INTERVAL '1 hour')::text,
      'confirmed', NOW()::text
    )::jsonb,
    NOW() - INTERVAL '1 hour',
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  -- 3. 取货中的运单
  INSERT INTO shipments (
    id, tenant_id, shipment_number, customer_id, driver_id,
    pickup_address, delivery_address, cargo_info,
    estimated_cost, status, timeline, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'SH' || TO_CHAR(NOW(), 'YYYYMMDD') || '0003',
    v_customer_id,
    v_driver_id,
    '{"addressLine1": "北京市西城区西单大街1号", "city": "北京", "province": "北京", "postalCode": "100032", "country": "中国", "latitude": 39.9087, "longitude": 116.3736}'::jsonb,
    '{"addressLine1": "深圳市南山区科技园南区1号", "city": "深圳", "province": "广东", "postalCode": "518057", "country": "中国", "latitude": 22.5431, "longitude": 113.9344}'::jsonb,
    '{"weightKg": 300, "volume": 4.5, "description": "家具", "items": [{"name": "椅子", "quantity": 20}]}'::jsonb,
    1500.00,
    'pickup_in_progress',
    json_build_object(
      'created', (NOW() - INTERVAL '2 hours')::text,
      'assigned', (NOW() - INTERVAL '2 hours')::text,
      'confirmed', (NOW() - INTERVAL '2 hours')::text,
      'pickup_in_progress', NOW()::text
    )::jsonb,
    NOW() - INTERVAL '2 hours',
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  -- 4. 运输中的运单
  INSERT INTO shipments (
    id, tenant_id, shipment_number, customer_id, driver_id,
    pickup_address, delivery_address, cargo_info,
    estimated_cost, status, timeline, created_at, updated_at
  ) VALUES (
    gen_random_uuid(),
    v_tenant_id,
    'SH' || TO_CHAR(NOW(), 'YYYYMMDD') || '0004',
    v_customer_id,
    v_driver_id,
    '{"addressLine1": "北京市东城区王府井大街1号", "city": "北京", "province": "北京", "postalCode": "100006", "country": "中国", "latitude": 39.9084, "longitude": 116.4177}'::jsonb,
    '{"addressLine1": "杭州市西湖区文三路1号", "city": "杭州", "province": "浙江", "postalCode": "310012", "country": "中国", "latitude": 30.2741, "longitude": 120.1551}'::jsonb,
    '{"weightKg": 180, "volume": 2.8, "description": "食品", "items": [{"name": "零食", "quantity": 80}]}'::jsonb,
    900.00,
    'in_transit',
    json_build_object(
      'created', (NOW() - INTERVAL '3 hours')::text,
      'assigned', (NOW() - INTERVAL '3 hours')::text,
      'confirmed', (NOW() - INTERVAL '3 hours')::text,
      'picked_up', (NOW() - INTERVAL '2 hours')::text,
      'in_transit', (NOW() - INTERVAL '1 hour')::text
    )::jsonb,
    NOW() - INTERVAL '3 hours',
    NOW()
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE '运单创建完成，司机ID: %, 车辆ID: %, 客户ID: %', v_driver_id, v_vehicle_id, v_customer_id;
END $$;

