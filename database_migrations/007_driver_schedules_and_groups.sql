-- 2025-11-29T11:25:04Z 司机排班和班组管理表
-- 第一阶段：核心主数据完善 - 1.2 司机档案完善

-- 司机排班表
CREATE TABLE IF NOT EXISTS driver_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    schedule_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL CHECK (shift_type IN ('day', 'night', 'overtime', 'on_call', 'off')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    planned_hours NUMERIC(5,2), -- 计划工时
    actual_hours NUMERIC(5,2), -- 实际工时
    status VARCHAR(50) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'absent')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 司机班组表
CREATE TABLE IF NOT EXISTS driver_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- 班组代码
    group_type VARCHAR(50) CHECK (group_type IN ('region', 'route', 'cargo_type', 'shift', 'other')), -- 分组类型
    leader_id UUID REFERENCES drivers(id), -- 班长/队长ID
    region VARCHAR(255), -- 所属区域
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, name) -- 同一租户内班组名称唯一
);

-- 司机班组关联表（多对多关系）
CREATE TABLE IF NOT EXISTS driver_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES driver_groups(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('leader', 'deputy', 'member')), -- 在班组中的角色
    joined_date DATE DEFAULT CURRENT_DATE,
    left_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, group_id) -- 一个司机在同一时间只能属于一个班组
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_driver_schedules_driver_id ON driver_schedules(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_tenant_id ON driver_schedules(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_date ON driver_schedules(schedule_date);
CREATE INDEX IF NOT EXISTS idx_driver_schedules_status ON driver_schedules(status);

CREATE INDEX IF NOT EXISTS idx_driver_groups_tenant_id ON driver_groups(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_groups_leader_id ON driver_groups(leader_id);
CREATE INDEX IF NOT EXISTS idx_driver_groups_type ON driver_groups(group_type);
CREATE INDEX IF NOT EXISTS idx_driver_groups_status ON driver_groups(status);

CREATE INDEX IF NOT EXISTS idx_driver_group_members_driver_id ON driver_group_members(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_group_members_group_id ON driver_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_driver_group_members_status ON driver_group_members(status);

-- 添加注释
COMMENT ON TABLE driver_schedules IS '司机排班表，存储司机出勤计划和实际工时';
COMMENT ON TABLE driver_groups IS '司机班组表，用于司机分组管理';
COMMENT ON TABLE driver_group_members IS '司机班组关联表，管理司机与班组的关联关系';

