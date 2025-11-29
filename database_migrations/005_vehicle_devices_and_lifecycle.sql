-- 2025-11-29T11:25:04Z 车辆设备绑定和生命周期状态扩展
-- 第一阶段：核心主数据完善 - 1.1 车辆档案完善

-- 车辆设备表
CREATE TABLE IF NOT EXISTS vehicle_devices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    device_type VARCHAR(50) NOT NULL CHECK (device_type IN ('gps', 'obd', 'temp_sensor', 'tire_pressure', 'camera', 'other')),
    device_serial VARCHAR(100) NOT NULL,
    device_model VARCHAR(255),
    manufacturer VARCHAR(255),
    install_date DATE,
    last_maintenance_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'replaced')),
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100), -- 电池电量百分比
    last_signal_time TIMESTAMP WITH TIME ZONE, -- 最后信号时间
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, device_serial) -- 同一租户内设备序列号唯一
);

-- 扩展 vehicles 表，添加生命周期状态和设备信息字段
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'in_service' CHECK (lifecycle_status IN ('in_service', 'in_transit', 'maintenance', 'parked', 'scrapped')),
ADD COLUMN IF NOT EXISTS lifecycle_status_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifecycle_status_change_reason TEXT,
ADD COLUMN IF NOT EXISTS odometer_km NUMERIC(10,2) DEFAULT 0, -- 里程表读数（公里）
ADD COLUMN IF NOT EXISTS last_service_km NUMERIC(10,2), -- 上次保养里程
ADD COLUMN IF NOT EXISTS last_service_date DATE, -- 上次保养日期
ADD COLUMN IF NOT EXISTS purchase_date DATE, -- 购买日期
ADD COLUMN IF NOT EXISTS registration_date DATE, -- 注册日期
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255), -- 制造商
ADD COLUMN IF NOT EXISTS model VARCHAR(255), -- 车型
ADD COLUMN IF NOT EXISTS year INTEGER, -- 年份
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'lng', 'other')), -- 燃料类型
ADD COLUMN IF NOT EXISTS capacity_volume NUMERIC(10,2), -- 容积（立方米）
ADD COLUMN IF NOT EXISTS dimensions JSONB, -- 尺寸信息 {length, width, height}
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::JSONB, -- 特性列表，如 ['GPS', '尾板', '冷藏']
ADD COLUMN IF NOT EXISTS cold_chain_certified BOOLEAN DEFAULT FALSE, -- 冷链资质
ADD COLUMN IF NOT EXISTS hazardous_certified BOOLEAN DEFAULT FALSE; -- 危化资质

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_vehicle_id ON vehicle_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_tenant_id ON vehicle_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_type ON vehicle_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_status ON vehicle_devices(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_serial ON vehicle_devices(device_serial);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_lifecycle_status ON vehicles(lifecycle_status);

-- 添加注释
COMMENT ON TABLE vehicle_devices IS '车辆设备绑定表，存储GPS、OBD、温控设备等设备信息';
COMMENT ON COLUMN vehicles.lifecycle_status IS '车辆生命周期状态：在库/在途/维修/停驶/报废';
COMMENT ON COLUMN vehicles.odometer_km IS '里程表读数（公里）';
COMMENT ON COLUMN vehicles.cold_chain_certified IS '是否具有冷链运输资质';
COMMENT ON COLUMN vehicles.hazardous_certified IS '是否具有危险品运输资质';

