-- 2025-11-29T11:25:04Z 成本核算管理表
-- 第三阶段：维护保养与成本管理 - 3.3 成本核算

-- 成本分类表
CREATE TABLE IF NOT EXISTS cost_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    category_code VARCHAR(100) NOT NULL, -- 成本分类编码
    category_name VARCHAR(255) NOT NULL, -- 成本分类名称
    category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('fuel', 'toll', 'labor', 'insurance', 'depreciation', 'other')), -- 成本类型（已移除维护成本，维护成本通过reference_id关联维护记录）
    parent_category_id UUID, -- 父分类ID（支持多级分类）
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, category_code)
);

-- 车辆成本台账表
CREATE TABLE IF NOT EXISTS vehicle_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    cost_category_id UUID NOT NULL, -- 成本分类ID
    cost_date DATE NOT NULL, -- 成本发生日期
    cost_amount NUMERIC(10,2) NOT NULL, -- 成本金额
    currency VARCHAR(10) DEFAULT 'CAD', -- 币种
    cost_type VARCHAR(50) NOT NULL CHECK (cost_type IN ('fuel', 'toll', 'labor', 'insurance', 'depreciation', 'other')), -- 成本类型（已移除维护成本，维护成本通过reference_id关联维护记录）
    description TEXT, -- 成本描述
    reference_id VARCHAR(255), -- 关联单据ID（如：维护记录ID、运单ID等）
    reference_type VARCHAR(50), -- 关联单据类型（如：maintenance_record, shipment, trip等）
    mileage_at_cost NUMERIC(10,2), -- 发生成本时的里程数
    quantity NUMERIC(10,2), -- 数量（如：燃油升数、工时数等）
    unit_price NUMERIC(10,2), -- 单价
    unit VARCHAR(50), -- 单位（如：L, hour, km等）
    provider VARCHAR(255), -- 供应商/服务商
    invoice_number VARCHAR(255), -- 发票号
    payment_status VARCHAR(50) DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')), -- 支付状态
    payment_date DATE, -- 支付日期
    notes TEXT,
    attachments JSONB DEFAULT '[]'::JSONB, -- 附件文件路径列表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cost_categories_tenant_id ON cost_categories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cost_categories_code ON cost_categories(tenant_id, category_code);
CREATE INDEX IF NOT EXISTS idx_cost_categories_type ON cost_categories(tenant_id, category_type);
CREATE INDEX IF NOT EXISTS idx_cost_categories_active ON cost_categories(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_cost_categories_parent ON cost_categories(parent_category_id) WHERE parent_category_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_vehicle_costs_vehicle_id ON vehicle_costs(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_tenant_id ON vehicle_costs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_category_id ON vehicle_costs(cost_category_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_date ON vehicle_costs(tenant_id, cost_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_type ON vehicle_costs(tenant_id, cost_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_reference ON vehicle_costs(tenant_id, reference_type, reference_id) WHERE reference_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_vehicle_costs_payment_status ON vehicle_costs(tenant_id, payment_status);

-- 添加外键约束
DO $$
BEGIN
  -- vehicle_costs 关联 vehicles
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'vehicle_costs_vehicle_id_fkey'
    ) THEN
      ALTER TABLE vehicle_costs 
      ADD CONSTRAINT vehicle_costs_vehicle_id_fkey 
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- vehicle_costs 关联 cost_categories
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'vehicle_costs_category_id_fkey'
    ) THEN
      ALTER TABLE vehicle_costs 
      ADD CONSTRAINT vehicle_costs_category_id_fkey 
      FOREIGN KEY (cost_category_id) REFERENCES cost_categories(id) ON DELETE RESTRICT;
    END IF;
  END IF;

  -- cost_categories 自关联（父分类）
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cost_categories') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'cost_categories_parent_fkey'
    ) THEN
      ALTER TABLE cost_categories 
      ADD CONSTRAINT cost_categories_parent_fkey 
      FOREIGN KEY (parent_category_id) REFERENCES cost_categories(id) ON DELETE SET NULL;
    END IF;
  END IF;
END $$;

-- 添加注释
COMMENT ON TABLE cost_categories IS '成本分类表，定义成本类型和分类';
COMMENT ON TABLE vehicle_costs IS '车辆成本台账表，记录车辆的所有成本明细';

