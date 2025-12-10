-- 运单计费模式和时间段支持
-- 创建时间: 2025-12-10 19:00:00
-- 用途: 添加计费模式（路程/时间）和时间段（取货/送货）字段

-- 添加计费模式字段
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS pricing_mode VARCHAR(20) CHECK (pricing_mode IN ('distance-based', 'time-based'));

-- 添加时间点字段（当不使用时间段时）
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS pickup_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS delivery_at TIMESTAMP WITH TIME ZONE;

-- 添加时间段字段（当使用时间段时，存储为 JSONB）
ALTER TABLE shipments 
ADD COLUMN IF NOT EXISTS pickup_window JSONB,
ADD COLUMN IF NOT EXISTS delivery_window JSONB;

-- 添加注释
COMMENT ON COLUMN shipments.pricing_mode IS '计费模式：distance-based（路程计费）或 time-based（时间计费）';
COMMENT ON COLUMN shipments.pickup_at IS '取货时间点（当不使用时间段时）';
COMMENT ON COLUMN shipments.delivery_at IS '送货时间点（当不使用时间段时）';
COMMENT ON COLUMN shipments.pickup_window IS '取货时间段 JSON: {"start": "ISO8601", "end": "ISO8601"}';
COMMENT ON COLUMN shipments.delivery_window IS '送货时间段 JSON: {"start": "ISO8601", "end": "ISO8601"}';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_shipments_pricing_mode ON shipments(pricing_mode);
CREATE INDEX IF NOT EXISTS idx_shipments_pickup_at ON shipments(pickup_at);
CREATE INDEX IF NOT EXISTS idx_shipments_delivery_at ON shipments(delivery_at);

