-- 简化版迁移脚本（tms_user权限）
-- 只包含可以执行的部分

-- 为 vehicles 表添加位置字段
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

-- 为 drivers 表添加位置字段
ALTER TABLE drivers 
ADD COLUMN IF NOT EXISTS current_location JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_location_update TIMESTAMP;

SELECT 'Basic location fields added to vehicles and drivers tables' as status;

