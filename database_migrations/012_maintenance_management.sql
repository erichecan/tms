-- 2025-11-29T11:25:04Z 维护保养管理表
-- 第三阶段：维护保养与成本管理 - 3.1 维护保养完整功能

-- 维护记录表
CREATE TABLE IF NOT EXISTS maintenance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'emergency')),
    description TEXT NOT NULL,
    cost NUMERIC(10,2) DEFAULT 0,
    mileage NUMERIC(10,2), -- 维护时的里程数
    maintenance_date DATE NOT NULL,
    next_maintenance_date DATE, -- 下次维护日期
    next_maintenance_mileage NUMERIC(10,2), -- 下次维护里程
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'scheduled', 'in_progress', 'cancelled', 'overdue')),
    provider VARCHAR(255), -- 维修服务商
    technician_name VARCHAR(255), -- 维修技师
    work_order_id UUID, -- 关联工单ID
    notes TEXT,
    attachments JSONB DEFAULT '[]'::JSONB, -- 附件文件路径列表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 保养计划表
CREATE TABLE IF NOT EXISTS maintenance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    plan_name VARCHAR(255) NOT NULL, -- 计划名称
    maintenance_type VARCHAR(50) NOT NULL CHECK (maintenance_type IN ('routine', 'repair', 'inspection', 'emergency')),
    interval_type VARCHAR(50) NOT NULL CHECK (interval_type IN ('mileage', 'time', 'both')), -- 间隔类型：里程、时间、两者
    interval_mileage NUMERIC(10,2), -- 间隔里程（公里）
    interval_months INTEGER, -- 间隔月数
    estimated_cost NUMERIC(10,2), -- 预估费用
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_maintenance_date DATE, -- 上次执行日期
    last_maintenance_mileage NUMERIC(10,2), -- 上次执行里程
    next_maintenance_date DATE, -- 下次计划日期
    next_maintenance_mileage NUMERIC(10,2), -- 下次计划里程
    auto_create_work_order BOOLEAN DEFAULT FALSE, -- 是否自动创建工单
    reminder_days_ahead INTEGER DEFAULT 7, -- 提前提醒天数
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 维修工单表
CREATE TABLE IF NOT EXISTS maintenance_work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    work_order_number VARCHAR(100) NOT NULL, -- 工单号
    maintenance_plan_id UUID, -- 关联保养计划ID
    maintenance_record_id UUID, -- 关联维护记录ID
    work_order_type VARCHAR(50) NOT NULL CHECK (work_order_type IN ('routine', 'repair', 'inspection', 'emergency')),
    priority VARCHAR(50) NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold')),
    description TEXT NOT NULL,
    reported_by VARCHAR(255), -- 报告人
    assigned_to VARCHAR(255), -- 分配给（技师/服务商）
    scheduled_date DATE, -- 计划日期
    scheduled_time TIME, -- 计划时间
    started_at TIMESTAMP WITH TIME ZONE, -- 开始时间
    completed_at TIMESTAMP WITH TIME ZONE, -- 完成时间
    estimated_duration_hours NUMERIC(5,2), -- 预估工时
    actual_duration_hours NUMERIC(5,2), -- 实际工时
    estimated_cost NUMERIC(10,2), -- 预估费用
    actual_cost NUMERIC(10,2), -- 实际费用
    labor_cost NUMERIC(10,2), -- 人工费用
    parts_cost NUMERIC(10,2), -- 配件费用
    diagnosis TEXT, -- 诊断结果
    work_performed TEXT, -- 执行的工作
    notes TEXT,
    attachments JSONB DEFAULT '[]'::JSONB, -- 附件文件路径列表
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, work_order_number)
);

-- 备件管理表
CREATE TABLE IF NOT EXISTS spare_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    part_number VARCHAR(100) NOT NULL, -- 配件编号
    part_name VARCHAR(255) NOT NULL, -- 配件名称
    part_category VARCHAR(100), -- 配件类别（如：发动机、制动系统、轮胎等）
    manufacturer VARCHAR(255), -- 制造商
    supplier VARCHAR(255), -- 供应商
    unit_price NUMERIC(10,2) NOT NULL, -- 单价
    quantity_in_stock INTEGER DEFAULT 0, -- 库存数量
    min_stock_level INTEGER DEFAULT 0, -- 最低库存水平
    max_stock_level INTEGER, -- 最高库存水平
    unit VARCHAR(50) DEFAULT 'piece', -- 单位（件、套、升等）
    location VARCHAR(255), -- 存放位置
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, part_number)
);

-- 工单配件使用记录表（多对多关系）
CREATE TABLE IF NOT EXISTS work_order_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID NOT NULL,
    spare_part_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1, -- 使用数量
    unit_price NUMERIC(10,2), -- 使用时的单价（可能变化）
    total_cost NUMERIC(10,2), -- 总成本
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_maintenance_records_vehicle_id ON maintenance_records(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_tenant_id ON maintenance_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_status ON maintenance_records(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_date ON maintenance_records(tenant_id, maintenance_date);
CREATE INDEX IF NOT EXISTS idx_maintenance_records_next_date ON maintenance_records(tenant_id, next_maintenance_date) WHERE next_maintenance_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_plans_vehicle_id ON maintenance_plans(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_tenant_id ON maintenance_plans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_active ON maintenance_plans(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_maintenance_plans_next_date ON maintenance_plans(tenant_id, next_maintenance_date) WHERE next_maintenance_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_vehicle_id ON maintenance_work_orders(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_tenant_id ON maintenance_work_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_status ON maintenance_work_orders(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_number ON maintenance_work_orders(tenant_id, work_order_number);
CREATE INDEX IF NOT EXISTS idx_maintenance_work_orders_scheduled_date ON maintenance_work_orders(tenant_id, scheduled_date) WHERE scheduled_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_spare_parts_tenant_id ON spare_parts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_spare_parts_part_number ON spare_parts(tenant_id, part_number);
CREATE INDEX IF NOT EXISTS idx_spare_parts_category ON spare_parts(tenant_id, part_category);
CREATE INDEX IF NOT EXISTS idx_spare_parts_stock_level ON spare_parts(tenant_id, quantity_in_stock) WHERE quantity_in_stock <= min_stock_level;

CREATE INDEX IF NOT EXISTS idx_work_order_parts_work_order_id ON work_order_parts(work_order_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_spare_part_id ON work_order_parts(spare_part_id);
CREATE INDEX IF NOT EXISTS idx_work_order_parts_tenant_id ON work_order_parts(tenant_id);

-- 添加外键约束（如果 vehicles 表存在）
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'vehicles') THEN
    -- maintenance_records 外键
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'maintenance_records_vehicle_id_fkey'
    ) THEN
      ALTER TABLE maintenance_records 
      ADD CONSTRAINT maintenance_records_vehicle_id_fkey 
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    END IF;

    -- maintenance_plans 外键
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'maintenance_plans_vehicle_id_fkey'
    ) THEN
      ALTER TABLE maintenance_plans 
      ADD CONSTRAINT maintenance_plans_vehicle_id_fkey 
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    END IF;

    -- maintenance_work_orders 外键
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'maintenance_work_orders_vehicle_id_fkey'
    ) THEN
      ALTER TABLE maintenance_work_orders 
      ADD CONSTRAINT maintenance_work_orders_vehicle_id_fkey 
      FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 添加表间外键约束
DO $$
BEGIN
  -- maintenance_work_orders 关联 maintenance_plans
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_plans') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'maintenance_work_orders_plan_id_fkey'
    ) THEN
      ALTER TABLE maintenance_work_orders 
      ADD CONSTRAINT maintenance_work_orders_plan_id_fkey 
      FOREIGN KEY (maintenance_plan_id) REFERENCES maintenance_plans(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- maintenance_work_orders 关联 maintenance_records
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_records') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'maintenance_work_orders_record_id_fkey'
    ) THEN
      ALTER TABLE maintenance_work_orders 
      ADD CONSTRAINT maintenance_work_orders_record_id_fkey 
      FOREIGN KEY (maintenance_record_id) REFERENCES maintenance_records(id) ON DELETE SET NULL;
    END IF;
  END IF;

  -- work_order_parts 关联 maintenance_work_orders
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'maintenance_work_orders') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'work_order_parts_work_order_id_fkey'
    ) THEN
      ALTER TABLE work_order_parts 
      ADD CONSTRAINT work_order_parts_work_order_id_fkey 
      FOREIGN KEY (work_order_id) REFERENCES maintenance_work_orders(id) ON DELETE CASCADE;
    END IF;
  END IF;

  -- work_order_parts 关联 spare_parts
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spare_parts') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'work_order_parts_spare_part_id_fkey'
    ) THEN
      ALTER TABLE work_order_parts 
      ADD CONSTRAINT work_order_parts_spare_part_id_fkey 
      FOREIGN KEY (spare_part_id) REFERENCES spare_parts(id) ON DELETE RESTRICT;
    END IF;
  END IF;
END $$;

-- 添加注释
COMMENT ON TABLE maintenance_records IS '维护记录表，记录车辆的所有维护保养历史';
COMMENT ON TABLE maintenance_plans IS '保养计划表，定义车辆的定期保养计划';
COMMENT ON TABLE maintenance_work_orders IS '维修工单表，管理维修任务的执行流程';
COMMENT ON TABLE spare_parts IS '备件管理表，管理配件库存';
COMMENT ON TABLE work_order_parts IS '工单配件使用记录表，记录工单使用的配件';

