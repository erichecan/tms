-- 2025-11-29T11:25:04Z 线路与站点管理表
-- 第二阶段：线路与站点管理

-- 线路表
CREATE TABLE IF NOT EXISTS routes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    route_code VARCHAR(100) NOT NULL, -- 线路编码
    route_name VARCHAR(255) NOT NULL, -- 线路名称
    route_type VARCHAR(50) NOT NULL CHECK (route_type IN ('regular', 'express', 'dedicated', 'flexible')), -- 线路类型：常规、快线、专线、灵活
    origin_location VARCHAR(255) NOT NULL, -- 起点位置
    origin_latitude NUMERIC(10, 7), -- 起点纬度
    origin_longitude NUMERIC(10, 7), -- 起点经度
    destination_location VARCHAR(255) NOT NULL, -- 终点位置
    destination_latitude NUMERIC(10, 7), -- 终点纬度
    destination_longitude NUMERIC(10, 7), -- 终点经度
    total_distance_km NUMERIC(10, 2), -- 总里程（公里）
    estimated_duration_hours NUMERIC(5, 2), -- 预估时长（小时）
    toll_fee NUMERIC(10, 2) DEFAULT 0, -- 过路费
    fuel_cost_per_km NUMERIC(10, 2), -- 每公里燃油成本
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, route_code)
);

-- 路段表（线路的详细分段）
CREATE TABLE IF NOT EXISTS route_segments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    segment_order INTEGER NOT NULL, -- 路段顺序
    segment_name VARCHAR(255), -- 路段名称
    start_location VARCHAR(255) NOT NULL, -- 起点
    start_latitude NUMERIC(10, 7),
    start_longitude NUMERIC(10, 7),
    end_location VARCHAR(255) NOT NULL, -- 终点
    end_latitude NUMERIC(10, 7),
    end_longitude NUMERIC(10, 7),
    distance_km NUMERIC(10, 2) NOT NULL, -- 路段里程
    estimated_duration_minutes INTEGER, -- 预估时长（分钟）
    road_type VARCHAR(50), -- 道路类型：highway, city, rural, mountain
    toll_fee NUMERIC(10, 2) DEFAULT 0, -- 路段过路费
    speed_limit INTEGER, -- 限速（km/h）
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 站点表
CREATE TABLE IF NOT EXISTS stations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    station_code VARCHAR(100) NOT NULL, -- 站点编码
    station_name VARCHAR(255) NOT NULL, -- 站点名称
    station_type VARCHAR(50) NOT NULL CHECK (station_type IN ('pickup', 'delivery', 'transit', 'warehouse', 'hub')), -- 站点类型
    address TEXT NOT NULL, -- 详细地址
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Canada',
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 7), -- 纬度
    longitude NUMERIC(10, 7), -- 经度
    contact_person VARCHAR(255), -- 联系人
    contact_phone VARCHAR(50), -- 联系电话
    contact_email VARCHAR(255), -- 联系邮箱
    operating_hours VARCHAR(255), -- 营业时间
    capacity_volume NUMERIC(10, 2), -- 容量（立方米）
    capacity_weight NUMERIC(10, 2), -- 容量（吨）
    facilities JSONB DEFAULT '[]'::JSONB, -- 设施列表（如：装卸设备、停车场等）
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, station_code)
);

-- 枢纽表（大型中转站）
CREATE TABLE IF NOT EXISTS hubs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    hub_code VARCHAR(100) NOT NULL, -- 枢纽编码
    hub_name VARCHAR(255) NOT NULL, -- 枢纽名称
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Canada',
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    operating_hours VARCHAR(255),
    total_capacity_volume NUMERIC(10, 2), -- 总容量（立方米）
    total_capacity_weight NUMERIC(10, 2), -- 总容量（吨）
    parking_spaces INTEGER, -- 停车位数量
    loading_docks INTEGER, -- 装卸口数量
    facilities JSONB DEFAULT '[]'::JSONB, -- 设施列表
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, hub_code)
);

-- 仓库表
CREATE TABLE IF NOT EXISTS warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    warehouse_code VARCHAR(100) NOT NULL, -- 仓库编码
    warehouse_name VARCHAR(255) NOT NULL, -- 仓库名称
    warehouse_type VARCHAR(50) NOT NULL CHECK (warehouse_type IN ('distribution', 'storage', 'cross_dock', 'cold_storage')), -- 仓库类型
    address TEXT NOT NULL,
    city VARCHAR(100),
    province VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Canada',
    postal_code VARCHAR(20),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    operating_hours VARCHAR(255),
    total_area_sqm NUMERIC(10, 2), -- 总面积（平方米）
    storage_capacity_volume NUMERIC(10, 2), -- 存储容量（立方米）
    storage_capacity_weight NUMERIC(10, 2), -- 存储容量（吨）
    temperature_controlled BOOLEAN DEFAULT FALSE, -- 是否温控
    min_temperature NUMERIC(5, 2), -- 最低温度
    max_temperature NUMERIC(5, 2), -- 最高温度
    loading_docks INTEGER, -- 装卸口数量
    facilities JSONB DEFAULT '[]'::JSONB, -- 设施列表
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, warehouse_code)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_routes_tenant_id ON routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routes_code ON routes(tenant_id, route_code);
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_routes_type ON routes(tenant_id, route_type);

CREATE INDEX IF NOT EXISTS idx_route_segments_route_id ON route_segments(route_id);
CREATE INDEX IF NOT EXISTS idx_route_segments_tenant_id ON route_segments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_route_segments_order ON route_segments(route_id, segment_order);

CREATE INDEX IF NOT EXISTS idx_stations_tenant_id ON stations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stations_code ON stations(tenant_id, station_code);
CREATE INDEX IF NOT EXISTS idx_stations_type ON stations(tenant_id, station_type);
CREATE INDEX IF NOT EXISTS idx_stations_active ON stations(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_stations_location ON stations(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_hubs_tenant_id ON hubs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_hubs_code ON hubs(tenant_id, hub_code);
CREATE INDEX IF NOT EXISTS idx_hubs_active ON hubs(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_hubs_location ON hubs(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_warehouses_tenant_id ON warehouses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_warehouses_code ON warehouses(tenant_id, warehouse_code);
CREATE INDEX IF NOT EXISTS idx_warehouses_type ON warehouses(tenant_id, warehouse_type);
CREATE INDEX IF NOT EXISTS idx_warehouses_active ON warehouses(tenant_id, is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_warehouses_location ON warehouses(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- 添加外键约束
DO $$
BEGIN
  -- route_segments 关联 routes
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'routes') THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'route_segments_route_id_fkey'
    ) THEN
      ALTER TABLE route_segments 
      ADD CONSTRAINT route_segments_route_id_fkey 
      FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 添加注释
COMMENT ON TABLE routes IS '线路表，定义运输线路信息';
COMMENT ON TABLE route_segments IS '路段表，定义线路的详细分段信息';
COMMENT ON TABLE stations IS '站点表，定义取货、送货、中转站点';
COMMENT ON TABLE hubs IS '枢纽表，定义大型中转枢纽';
COMMENT ON TABLE warehouses IS '仓库表，定义仓储设施';

