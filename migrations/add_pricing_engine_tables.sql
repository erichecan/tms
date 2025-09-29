-- 计费规则引擎数据库扩展
-- 创建时间: 2025-09-29 02:15:00
-- 作用: 为智能计费规则引擎添加必要的数据表

-- =====================================================
-- 1. 运单计费模板表 (业务场景模板)
-- =====================================================
CREATE TABLE public.pricing_templates (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- 模板基本信息
    name varchar(100) NOT NULL,
    description text,
    type varchar(50) NOT NULL, -- WASTE_COLLECTION, WAREHOUSE_TRANSFER, CLIENT_DIRECT
    
    -- 业务条件配置
    business_conditions jsonb NOT NULL DEFAULT '{}',
    
    -- 计费规则配置
    pricing_rules jsonb NOT NULL DEFAULT '[]',
    
    -- 司机薪酬配置
    driver_rules jsonb NOT NULL DEFAULT '[]',
    
    -- 内部成本配置
    cost_allocation jsonb DEFAULT '{}',
    
    -- 状态管理
    status varchar(20) DEFAULT 'active',
    version integer DEFAULT 1,
    
    -- 审计字段
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    created_by uuid,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_by uuid,
    
    CONSTRAINT chk_pricing_template_type CHECK (type IN ('WASTE_COLLECTION', 'WAREHOUSE_TRANSFER', 'CLIENT_DIRECT', 'CUSTOM'))
);

-- =====================================================
-- 2. 计费组件定义表
-- =====================================================
CREATE TABLE public.pricing_components (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- 组件基本信息
    code varchar(32) NOT NULL,
    name varchar(100) NOT NULL,
    description text,
    
    -- 组件分类
    category varchar(20) NOT NULL, -- REVENUE, DRIVER_COMPENSATION, INTERNAL_COST
    
    -- 计算方式
    calculation_type varchar(20) NOT NULL, -- fixed, per_unit, percentage, conditional
    formula text, -- 计算公式JSON
    default_value numeric(12,2) DEFAULT 0,
    
    -- 业务配置
    unit varchar(20), -- km, hours, pieces, kg
    currency char(3) DEFAULT 'CAD',
    is_taxable boolean DEFAULT true,
    
    -- 状态
    status varchar(20) DEFAULT 'active',
    
    -- 审计字段
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

-- =====================================================
-- 3. 价格表 (距离/重量/体积价格配置)
-- =====================================================
CREATE TABLE public.pricing_tables (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- 价格表信息
    name varchar(100) NOT NULL,
    type varchar(20) NOT NULL, -- distance_tier, weight_tier, volume_tier, flat_rate
    
    -- 地理/条件配置
    origin_city varchar(50),
    destination_city varchar(50),
    origin_warehouse_id uuid,
    destination_warehouse_id uuid,
    
    -- 计量范围
    min_value numeric(10,3),
    max_value numeric(10,3),
    unit varchar(20), -- km, kg, m3
    
    -- 价格配置
    rate numeric(12,2) NOT NULL,
    currency char(3) DEFAULT 'CAD',
    
    -- 有效期
    effective_from timestamp DEFAULT CURRENT_TIMESTAMP,
    effective_to timestamp,
    
    -- 状态
    status varchar(20) DEFAULT 'active',
    
    -- 审计字段
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 4. 运单计费详情表 (单个运单的计费明细)
-- =====================================================
CREATE TABLE public.shipment_pricing_details (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    shipment_id uuid NOT NULL REFERENCES public.shipments(id) ON DELETE CASCADE,
    
    -- 计费规则信息
    pricing_template_id uuid REFERENCES public.pricing_templates(id),
    applied_rule_id uuid, -- 引用的规则ID
    applied_component_code varchar(32),
    
    -- 计算输入
    input_values jsonb DEFAULT '{}', -- 规则执行时的输入值: {distance, weight, waitingTime, etc.}
    
    -- 计算结果
    calculated_amount numeric(12,2) NOT NULL,
    currency char(3) DEFAULT 'CAD',
    
    -- 分类
    component_type varchar(20) NOT NULL, -- REVENUE, DRIVER_COMPENSATION, INTERNAL_COST
    
    -- 顺序
    sequence integer NOT NULL DEFAULT 0,
    
    -- 计算元数据
    calculation_formula text,
    execution_time numeric(10,3), -- 毫秒
    
    -- 审计字段
    calculated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_shipment_pricing_shipment_id (shipment_id),
    INDEX idx_shipment_pricing_component_type (component_type),
    INDEX idx_shipment_pricing_calculated_at (calculated_at)
);

-- =====================================================
-- 5. 仓库与地理位置配置表
-- =====================================================
CREATE TABLE public.warehouses (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- 仓库基本信息
    name varchar(100) NOT NULL,
    code varchar(20) NOT NULL, -- WH_07, AMZ_YYZ9
    type varchar(20) NOT NULL, -- OWN_WAREHOUSE, THIRD_PARTY_WAREHOUSE, DISPOSAL_SITE
    
    -- 位置信息
    address jsonb NOT NULL DEFAULT '{}',
    
    -- 业务配置
    operating_hours jsonb DEFAULT '{}',
    appointment_required boolean DEFAULT false,
    waiting_time_limit integer DEFAULT 180, -- 默认等候时间限制(分钟)
    
    -- 计费配置
    handling_cost numeric(12,2) DEFAULT 0,
    dock_fee numeric(12,2) DEFAULT 0,
    
    -- 状态
    status varchar(20) DEFAULT 'active',
    
    -- 审计字段
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, code)
);

-- =====================================================
-- 6. 距离矩阵表 (预计算不同起点终点的距离)
-- =====================================================
CREATE TABLE public.distance_matrix (
    id uuid DEFAULT public.uuid_generate_v4() PRIMARY KEY,
    tenant_id uuid NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    
    -- 起点终点配置
    origin_warehouse_id uuid REFERENCES public.warehouses(id),
    destination_warehouse_id uuid REFERENCES public.warehouses(id),
    origin_address text,
    destination_address text,
    
    -- 距离信息
    distance_km numeric(10,3) NOT NULL,
    estimated_driving_minutes integer,
    
    -- 成本基准
    base_distance_period integer DEFAULT 25, -- 基础距离范围(km)
    base_freight_rate numeric(12,2) DEFAULT 180.00,
    extra_distance_rate numeric(12,2) DEFAULT 20.00, -- 每超20km的费用
    
    -- 状态
    status varchar(20) DEFAULT 'active',
    
    -- 审计字段
    created_at timestamp DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(tenant_id, origin_warehouse_id, destination_warehouse_id)
);

-- =====================================================
-- 索引优化
-- =====================================================
CREATE INDEX idx_pricing_templates_tenant_status ON public.pricing_templates(tenant_id, status);
CREATE INDEX idx_pricing_templates_type ON public.pricing_templates(type);
CREATE INDEX idx_pricing_components_tenant_category ON public.pricing_components(tenant_id, category);
CREATE INDEX idx_pricing_tables_tenant_type ON public.pricing_tables(tenant_id, type);
CREATE INDEX idx_pricing_tables_effective_dates ON public.pricing_tables(effective_from, effective_to);
CREATE INDEX idx_warehouse_tenant_code ON public.warehouses(tenant_id, code);
CREATE INDEX idx_distance_matrix_tenant ON public.distance_matrix(tenant_id);

-- =====================================================
-- 添加运单表的计费相关字段 (扩展现有shipments表)
-- =====================================================
ALTER TABLE public.shipments 
ADD COLUMN pricing_template_id uuid REFERENCES public.pricing_templates(id),
ADD COLUMN pricing_calculated_at timestamp,
ADD COLUMN pricing_version varchar(20),
ADD COLUMN pricing_trace jsonb DEFAULT '{}', -- 规则执行轨迹  
ADD COLUMN pricing_components jsonb DEFAULT '[]', -- 计费组件数组
ADD COLUMN estimated_cost_calculated numeric(12,2), -- 通过规则引擎计算的预估费用
ADD COLUMN pricing_rule_trace jsonb DEFAULT '[]'; -- 规则调用轨迹

CREATE INDEX idx_shipments_pricing_template ON public.shipments(pricing_template_id);
CREATE INDEX idx_shipments_pricing_calculated ON public.shipments(pricing_calculated_at);

-- =====================================================
-- 插入默认的计费模板 (垃圾清运和仓库转运)
-- =====================================================
INSERT INTO public.pricing_templates (tenant_id, name, description, type, business_conditions, pricing_rules, driver_rules, cost_allocation) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '垃圾清运模板',
    '从内部仓库取垃圾，运到垃圾填埋场处理后返回仓库',
    'WASTE_COLLECTION',
    '{
        "pickupType": "OWN_WAREHOUSE",
        "deliveryType": "DISPOSAL_SITE", 
        "isReturnTrip": true,
        "customerType": "INTERNAL"
    }',
    '[
        {
            "ruleId": "waste_base_fee",
            "name": "垃圾清运基础费",
            "component": "BASE_PICKUP_FEE",
            "formula": 40,
            "priority": 100
        }
    ]',
    '[
        {
            "ruleId": "waste_driver_pay",
            "name": "垃圾清运司机工资",
            "component": "WASTE_COLLECTION_PAY",
            "formula": 30,
            "priority": 100
        }
    ]',
    '{
        "WAREHOUSE_COST": 40,
        "FLEET_COST": "auto_calculated"
    }'
),
(
    '00000000-0000-0000-0000-000000000001',
    '亚马逊仓库转运模板',
    '从7号仓库转运货物到亚马逊仓库（如YYZ9）',
    'WAREHOUSE_TRANSFER',
    '{
        "pickupType": "OWN_WAREHOUSE",
        "deliveryType": "THIRD_PARTY_WAREHOUSE",
        "requiresAppointment": true,
        "destinationWarehouse": "AMAZON"
    }',
    '[
        {
            "ruleId": "amazon_base_distance",
            "name": "基础距离费(25km内)",
            "component": "BASE_DISTANCE_FEE",
            "condition": "distance <= 25",
            "formula": 180,
            "priority": 100
        },
        {
            "ruleId": "amazon_extra_distance",
            "name": "超距费(每20km)",
            "component": "EXTRA_DISTANCE_FEE",
            "condition": "distance > 25",
            "formula": "180 + floor((distance-25)/20) * 20",
            "priority": 110
        },
        {
            "ruleId": "amazon_waiting_penalty",
            "name": "等候超时费",
            "component": "WAITING_PENALTY",
            "condition": "waitingTime > 180",
            "formula": 30,
            "priority": 200
        }
    ]',
    '[
        {
            "ruleId": "amazon_driver_base",
            "name": "基础工资",
            "component": "BASE_DRIVER_PAY",
            "formula": 80,
            "priority": 100
        },
        {
            "ruleId": "amazon_driver_waiting_bonus",
            "name": "等候奖金",
            "component": "WAITING_BONUS",
            "condition": "waitingTime > 180",
            "formula": 20,
            "priority": 150
        }
    ]',
    '{
        "WAREHOUSE_COST": 40,
        "FLEET_COST": "auto_calculated",
        "AMAZON_WAITING_SHARE": 20
    }'
);

-- 插入基础计费组件
INSERT INTO public.pricing_components (tenant_id, code, name, description, category, calculation_type, formula, default_value, currency) VALUES
-- 收入侧组件
('00000000-0000-0000-0000-000000000001', 'BASE_PICKUP_FEE', '基础取货费', '垃圾清运的基础费用', 'REVENUE', 'fixed', '40', 40, 'CAD'),
('00000000-0000-0000-0000-000000000000001', 'BASE_DISTANCE_FEE', '基础距离费', '25公里内的基础运费', 'REVENUE', 'fixed', '180', 180, 'CAD'),
('00000000-0000-0000-0000-000000000000001', 'EXTRA_DISTANCE_FEE', '超距费', '超出基础距离的额外费用', 'REVENUE', 'per_unit_tier', '20', 20, 'CAD'),
('00000000-0000-0000-0000-000000000000001', 'WAITING_PENALTY', '等候费', '超时等候的额外收费', 'REVENUE', 'conditional', '30', 30, 'CAD'),

-- 司机薪酬组件
('00000000-0000-0000-0000-000000000000001', 'WASTE_COLLECTION_PAY', '垃圾清运工资', '垃圾清运的司机报酬', 'DRIVER_COMPENSATION', 'fixed', '30', 30, 'CAD'),
('00000000-0000-0000-0000-000000000000001', 'BASE_DRIVER_PAY', '基础工资', '运输司机的基础报酬', 'DRIVER_COMPENSATION', 'fixed', '80', 80, 'CAD'),
('00000000-0000-0000-0000-000000000000001', 'WAITING_BONUS', '等候奖金', '超时等候给司机的奖金', 'DRIVER_COMPENSATION', 'conditional', '20', 20, 'CAD'),

-- 内部成本组件
('00000000-0000-0000-0000-000000000000001', 'WAREHOUSE_COST', '仓库成本', '仓库运营和处理费用', 'INTERNAL_COST', 'fixed', '40', 40, 'CAD');

-- 插入仓库配置
INSERT INTO public.warehouses (tenant_id, name, code, type, address, handling_cost, dock_fee) VALUES
('00000000-0000-0000-0000-000000000000001', '7号仓库', 'WH_07', 'OWN_WAREHOUSE', '{"street": "7号仓库地址", "city": "Toronto", "province": "ON", "postalCode": "M5V1A1"}', 40, 0),
('00000000-0000-0000-0000-000000000000001', '亚马逊YYZ9仓库', 'AMZ_YYZ9', 'THIRD_PARTY_WAREHOUSE', '{"street": "亚马逊仓库地址", "city": "Toronto", "province": "ON", "postalCode": "L3R5W7"}', 0, 0),
('00000000-0000-0000-0000-000000000000001', '垃圾填埋场', 'LANDFILL_01', 'DISPOSAL_SITE', '{"street": "垃圾填埋场地址", "city": "Toronto", "province": "ON"}', 0, 0);

COMMENT ON TABLE public.pricing_templates IS '计费规则模板表 - 支持业务场景驱动的计费规则配置';
COMMENT ON TABLE public.pricing_components IS '计费组件定义表 - 标准化的费用组件管理';
COMMENT ON TABLE public.pricing_tables IS '价格表 - 基于距离/重量/体积的分层价格配置';
COMMENT ON TABLE public.shipment_pricing_details IS '运单计费详情表 - 单个运单的完整计费明细';
COMMENT ON TABLE public.warehouses IS '仓库配置表 - 仓库基本信息和业务规则配置';
COMMENT ON TABLE public.distance_matrix IS '距离矩阵表 - 起终点的距离和计费基础配置';
