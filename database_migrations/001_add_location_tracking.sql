-- 数据库迁移脚本: 添加位置跟踪功能
-- 创建时间: 2025-10-17 23:00:00
-- 描述: 为 trips, vehicles, drivers 表添加位置字段，创建位置历史表

-- ====================================
-- 1. 更新现有表结构
-- ====================================

-- 添加位置字段到 trips 表
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 添加位置字段到 vehicles 表
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 添加位置字段到 drivers 表
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- ====================================
-- 2. 创建位置跟踪历史表
-- ====================================

CREATE TABLE IF NOT EXISTS location_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL, -- 'trip', 'vehicle', 'driver'
    entity_id uuid NOT NULL,
    latitude NUMERIC(10, 7) NOT NULL,
    longitude NUMERIC(10, 7) NOT NULL,
    speed NUMERIC(5, 2) DEFAULT 0,
    direction NUMERIC(5, 2) DEFAULT 0,
    accuracy NUMERIC(5, 2) DEFAULT 10,
    altitude NUMERIC(10, 2),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ====================================
-- 3. 创建索引优化查询性能
-- ====================================

-- 为位置历史表创建复合索引
CREATE INDEX IF NOT EXISTS idx_location_tracking_entity 
ON location_tracking(entity_type, entity_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_location_tracking_timestamp 
ON location_tracking(timestamp DESC);

-- 为表的位置字段创建 GIN 索引（优化 JSONB 查询）
CREATE INDEX IF NOT EXISTS idx_trips_current_location 
ON trips USING GIN (current_location);

CREATE INDEX IF NOT EXISTS idx_vehicles_current_location 
ON vehicles USING GIN (current_location);

CREATE INDEX IF NOT EXISTS idx_drivers_current_location 
ON drivers USING GIN (current_location);

-- ====================================
-- 4. 创建视图：实时位置概览
-- ====================================

CREATE OR REPLACE VIEW v_realtime_tracking AS
SELECT 
    v.id as vehicle_id,
    v.plate_number,
    v.type as vehicle_type,
    v.capacity_kg,
    v.status as vehicle_status,
    v.current_location,
    v.last_location_update,
    d.id as driver_id,
    d.name as driver_name,
    d.phone as driver_phone,
    d.status as driver_status,
    t.id as trip_id,
    t.trip_no,
    t.status as trip_status,
    CASE 
        WHEN v.last_location_update IS NULL THEN 'never_updated'
        WHEN v.last_location_update < NOW() - INTERVAL '5 minutes' THEN 'stale'
        WHEN v.last_location_update < NOW() - INTERVAL '30 seconds' THEN 'delayed'
        ELSE 'active'
    END as location_freshness
FROM vehicles v
LEFT JOIN drivers d ON d.vehicle_id = v.id
LEFT JOIN trips t ON t.driver_id = d.id AND t.status IN ('planned', 'ongoing');

-- ====================================
-- 5. 创建函数：计算两点距离（哈弗辛公式）
-- ====================================

CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC, lng1 NUMERIC, 
    lat2 NUMERIC, lng2 NUMERIC
) 
RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 6371; -- 地球半径（公里）
    dLat NUMERIC;
    dLng NUMERIC;
    a NUMERIC;
    c NUMERIC;
BEGIN
    dLat := RADIANS(lat2 - lat1);
    dLng := RADIANS(lng2 - lng1);
    
    a := SIN(dLat/2) * SIN(dLat/2) + 
         COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * 
         SIN(dLng/2) * SIN(dLng/2);
    
    c := 2 * ATAN2(SQRT(a), SQRT(1-a));
    
    RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ====================================
-- 6. 添加注释
-- ====================================

COMMENT ON TABLE location_tracking IS '位置跟踪历史表，记录车辆、司机、行程的位置轨迹';
COMMENT ON COLUMN location_tracking.entity_type IS '实体类型: trip, vehicle, driver';
COMMENT ON COLUMN location_tracking.entity_id IS '实体ID';
COMMENT ON COLUMN location_tracking.latitude IS '纬度';
COMMENT ON COLUMN location_tracking.longitude IS '经度';
COMMENT ON COLUMN location_tracking.speed IS '速度 (km/h)';
COMMENT ON COLUMN location_tracking.direction IS '方向 (0-360度)';
COMMENT ON COLUMN location_tracking.accuracy IS '精度 (米)';

COMMENT ON COLUMN trips.current_location IS '当前位置 JSONB: {latitude, longitude, speed, direction, timestamp}';
COMMENT ON COLUMN vehicles.current_location IS '当前位置 JSONB: {latitude, longitude, speed, direction, timestamp}';
COMMENT ON COLUMN drivers.current_location IS '当前位置 JSONB: {latitude, longitude, speed, direction, timestamp}';

-- 完成
SELECT 'Location tracking migration completed successfully' as status;

