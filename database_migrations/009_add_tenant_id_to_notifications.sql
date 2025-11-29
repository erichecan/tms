-- 2025-11-29T11:25:04Z 为notifications表添加tenant_id字段
-- 第一阶段：核心主数据完善 - 支持多租户通知

-- 添加tenant_id字段（如果不存在）
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS tenant_id UUID;

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type_tenant ON notifications(type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_delivered ON notifications(delivered);

-- 添加注释
COMMENT ON COLUMN notifications.tenant_id IS '租户ID，用于多租户隔离';

