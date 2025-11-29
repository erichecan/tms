-- 权限修复脚本
-- 创建时间: 2025-10-21 16:10:00
-- 更新时间: 2025-10-21 16:20:00
-- 功能: 授予tms_user完整权限

-- 授予tms_user所有权限
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA public TO tms_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO tms_user;
GRANT USAGE ON SCHEMA public TO tms_user;

SELECT '✅ 权限修复完成！' as status;

