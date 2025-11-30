-- 修复移动端司机运单数据
-- 创建时间: 2025-11-30T20:10:00Z
-- 1. 删除新创建的4个运单
-- 2. 将桌面端的运单分配给移动端司机
-- 3. 将地址改为加拿大信息

-- 删除新创建的4个运单
DELETE FROM shipments 
WHERE shipment_number LIKE 'SH20251130%' 
  AND driver_id = '10000000-0000-0000-0000-000000000002';

-- 将桌面端的运单分配给移动端司机（选择前4个合适的运单）
DO $$
DECLARE
  v_driver_id UUID := '10000000-0000-0000-0000-000000000002';
  v_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
  v_shipment_rec RECORD;
  v_counter INTEGER := 0;
  
  -- 加拿大城市和坐标
  v_canadian_cities JSONB := '[
    {"city": "Toronto", "province": "Ontario", "lat": 43.6532, "lng": -79.3832, "postal": "M5H 2N2"},
    {"city": "Vancouver", "province": "British Columbia", "lat": 49.2827, "lng": -123.1207, "postal": "V6B 1A1"},
    {"city": "Montreal", "province": "Quebec", "lat": 45.5017, "lng": -73.5673, "postal": "H2Y 1A6"},
    {"city": "Calgary", "province": "Alberta", "lat": 51.0447, "lng": -114.0719, "postal": "T2P 1M9"},
    {"city": "Ottawa", "province": "Ontario", "lat": 45.4215, "lng": -75.6972, "postal": "K1A 0A6"},
    {"city": "Edmonton", "province": "Alberta", "lat": 53.5461, "lng": -113.4938, "postal": "T5J 2R7"}
  ]'::jsonb;
  
  v_pickup_city JSONB;
  v_delivery_city JSONB;
  v_pickup_street TEXT;
  v_delivery_street TEXT;
BEGIN
  -- 选择前4个未分配的运单或已确认的运单
  FOR v_shipment_rec IN 
    SELECT id, shipment_number, pickup_address, delivery_address
    FROM shipments
    WHERE tenant_id = v_tenant_id
      AND (driver_id IS NULL OR driver_id = v_driver_id)
      AND status IN ('confirmed', 'scheduled', 'created')
    ORDER BY created_at DESC
    LIMIT 4
  LOOP
    -- 随机选择取货城市（前3个）
    v_pickup_city := v_canadian_cities->>((v_counter % 3)::integer);
    
    -- 随机选择送货城市（后3个，不能和取货城市相同）
    v_delivery_city := v_canadian_cities->>((3 + (v_counter % 3))::integer);
    
    -- 生成街道地址
    v_pickup_street := (v_counter + 1)::text || ' ' || (v_pickup_city->>'city')::text || ' Street';
    v_delivery_street := (v_counter + 1)::text || ' ' || (v_delivery_city->>'city')::text || ' Avenue';
    
    -- 更新运单：分配司机和更新地址为加拿大信息
    UPDATE shipments
    SET 
      driver_id = v_driver_id,
      pickup_address = jsonb_build_object(
        'addressLine1', v_pickup_street,
        'city', v_pickup_city->>'city',
        'province', v_pickup_city->>'province',
        'postalCode', v_pickup_city->>'postal',
        'country', 'Canada',
        'latitude', (v_pickup_city->>'lat')::numeric,
        'longitude', (v_pickup_city->>'lng')::numeric
      ),
      delivery_address = jsonb_build_object(
        'addressLine1', v_delivery_street,
        'city', v_delivery_city->>'city',
        'province', v_delivery_city->>'province',
        'postalCode', v_delivery_city->>'postal',
        'country', 'Canada',
        'latitude', (v_delivery_city->>'lat')::numeric,
        'longitude', (v_delivery_city->>'lng')::numeric
      ),
      status = CASE 
        WHEN status = 'created' THEN 'confirmed'
        ELSE status
      END,
      updated_at = NOW()
    WHERE id = v_shipment_rec.id;
    
    v_counter := v_counter + 1;
    
    RAISE NOTICE 'Updated shipment %: % -> %', 
      v_shipment_rec.shipment_number,
      v_pickup_city->>'city',
      v_delivery_city->>'city';
  END LOOP;
  
  RAISE NOTICE 'Completed: Updated % shipments for driver %', v_counter, v_driver_id;
END $$;

-- 验证结果
SELECT 
  shipment_number,
  status,
  pickup_address->>'city' as pickup_city,
  delivery_address->>'city' as delivery_city,
  pickup_address->>'country' as pickup_country,
  delivery_address->>'country' as delivery_country
FROM shipments
WHERE driver_id = '10000000-0000-0000-0000-000000000002'
ORDER BY updated_at DESC;

