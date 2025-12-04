-- 剩余的迁移（需要更高权限）

-- 为 trips 表添加位置字段
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 创建位置跟踪历史表
CREATE TABLE IF NOT EXISTS location_tracking (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_location_tracking_entity 
ON location_tracking(entity_type, entity_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_location_tracking_timestamp 
ON location_tracking(timestamp DESC);

-- 为表的位置字段创建 GIN 索引
CREATE INDEX IF NOT EXISTS idx_trips_current_location 
ON trips USING GIN (current_location);

CREATE INDEX IF NOT EXISTS idx_vehicles_current_location 
ON vehicles USING GIN (current_location);

CREATE INDEX IF NOT EXISTS idx_drivers_current_location 
ON drivers USING GIN (current_location);

-- 创建距离计算函数
CREATE OR REPLACE FUNCTION calculate_distance(
    lat1 NUMERIC, lng1 NUMERIC, 
    lat2 NUMERIC, lng2 NUMERIC
) 
RETURNS NUMERIC AS $$
DECLARE
    R NUMERIC := 6371;
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

-- 授权给neondb_owner（已注释，因为 neondb_owner 已经是超级用户）
-- 2025-12-04 Fixed: 使用 neondb_owner 替代不存在的 tms_user
-- GRANT ALL PRIVILEGES ON TABLE location_tracking TO neondb_owner;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO neondb_owner;

SELECT 'Remaining migrations completed successfully' as status;

