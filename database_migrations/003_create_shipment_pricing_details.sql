-- 2025-11-10T09:55:45-05:00 创建 shipment_pricing_details 表，支撑运单计费明细与删除流程
CREATE TABLE IF NOT EXISTS shipment_pricing_details (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shipment_id UUID NOT NULL REFERENCES shipments(id) ON DELETE CASCADE,
    applied_component_code VARCHAR(100) NOT NULL,
    input_values JSONB NOT NULL DEFAULT '{}'::JSONB,
    calculated_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'CAD' CHECK (currency IN ('CAD', 'USD', 'EUR')),
    component_type VARCHAR(50) NOT NULL,
    sequence INTEGER NOT NULL DEFAULT 0,
    calculation_formula TEXT,
    execution_time INTEGER NOT NULL DEFAULT 0,
    calculated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2025-11-10T09:55:45-05:00 建立辅助索引提升查询性能
CREATE INDEX IF NOT EXISTS idx_shipment_pricing_details_shipment_id ON shipment_pricing_details(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_pricing_details_component_code ON shipment_pricing_details(applied_component_code);

