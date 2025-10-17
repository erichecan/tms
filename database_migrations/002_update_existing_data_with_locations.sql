-- 为现有数据添加位置信息
-- 使用真实多伦多地区坐标

-- 函数：生成随机多伦多位置
CREATE OR REPLACE FUNCTION random_toronto_location() 
RETURNS JSONB AS $$
DECLARE
    base_lat NUMERIC := 43.70;
    base_lng NUMERIC := -79.40;
    lat NUMERIC;
    lng NUMERIC;
BEGIN
    lat := base_lat + (RANDOM() - 0.5) * 0.2;
    lng := base_lng + (RANDOM() - 0.5) * 0.3;
    
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

-- 更新所有vehicles的位置
UPDATE vehicles 
SET current_location = random_toronto_location(),
    last_location_update = NOW()
WHERE current_location = '{}' OR current_location IS NULL;

-- 更新所有drivers的位置
UPDATE drivers 
SET current_location = random_toronto_location(),
    last_location_update = NOW()
WHERE current_location = '{}' OR current_location IS NULL;

-- 清理函数
DROP FUNCTION IF EXISTS random_toronto_location();

-- 报告更新结果
SELECT 
    'Location data updated!' as status,
    (SELECT COUNT(*) FROM vehicles WHERE current_location != '{}') as vehicles_with_location,
    (SELECT COUNT(*) FROM drivers WHERE current_location != '{}') as drivers_with_location;

