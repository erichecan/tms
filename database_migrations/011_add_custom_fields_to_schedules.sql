-- 2025-11-29T11:25:04Z 为排班表添加自定义字段支持
-- 产品需求：排班管理支持自定义字段（数字、日期、时间、列表、文本、电话等类型）

-- 扩展 driver_schedules 表，添加自定义字段存储
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_schedules') THEN
    ALTER TABLE driver_schedules 
    ADD COLUMN IF NOT EXISTS custom_fields JSONB DEFAULT '{}'::JSONB;
  END IF;
END $$;

-- 创建自定义字段配置表（用于定义字段类型和选项）
CREATE TABLE IF NOT EXISTS schedule_custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    field_key VARCHAR(100) NOT NULL, -- 字段键名（如：customer_name, destination, priority）
    field_label VARCHAR(255) NOT NULL, -- 字段显示名称（如：客户名称、目的地、任务优先级）
    field_type VARCHAR(50) NOT NULL CHECK (field_type IN ('text', 'number', 'date', 'time', 'list', 'phone', 'textarea')),
    field_options JSONB, -- 列表类型字段的选项（如：['高优先级', '中优先级', '低优先级']）
    is_required BOOLEAN DEFAULT FALSE,
    default_value JSONB, -- 默认值
    sort_order INTEGER DEFAULT 0, -- 排序顺序
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, field_key)
);

-- 创建索引
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_schedules') THEN
    CREATE INDEX IF NOT EXISTS idx_schedule_custom_fields ON driver_schedules USING GIN (custom_fields);
  END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_schedule_custom_field_definitions_tenant_id ON schedule_custom_field_definitions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_schedule_custom_field_definitions_active ON schedule_custom_field_definitions(tenant_id, is_active);

-- 添加注释
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'driver_schedules') THEN
    COMMENT ON COLUMN driver_schedules.custom_fields IS '自定义字段存储，JSON格式，如：{"customer_name": "ABC公司", "destination": "北京", "priority": "高优先级", "mileage": 150}';
  END IF;
END $$;
COMMENT ON TABLE schedule_custom_field_definitions IS '排班自定义字段定义表，用于配置字段类型和选项';

