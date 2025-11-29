-- 2025-11-29T11:25:04Z 第一阶段完整迁移文件
-- 合并所有第一阶段数据库迁移，便于一次性执行

-- ============================================
-- 004: 车辆证照和保险管理表
-- ============================================

-- 车辆证照表
CREATE TABLE IF NOT EXISTS vehicle_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('driving_license', 'operation_permit', 'etc', 'hazardous_permit', 'other')),
    certificate_number VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiry_date DATE NOT NULL,
    issuing_authority VARCHAR(255),
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 车辆保险表
CREATE TABLE IF NOT EXISTS vehicle_insurance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    insurance_type VARCHAR(50) NOT NULL CHECK (insurance_type IN ('liability', 'comprehensive', 'collision', 'cargo', 'third_party', 'other')),
    insurance_company VARCHAR(255) NOT NULL,
    policy_number VARCHAR(100) NOT NULL,
    coverage_amount NUMERIC(12,2),
    premium_amount NUMERIC(12,2),
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 车辆年检表
CREATE TABLE IF NOT EXISTS vehicle_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    inspection_type VARCHAR(50) NOT NULL CHECK (inspection_type IN ('annual', 'safety', 'emission', 'roadworthiness', 'other')),
    inspection_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    inspection_station VARCHAR(255),
    inspector_name VARCHAR(255),
    result VARCHAR(50) NOT NULL CHECK (result IN ('passed', 'failed', 'conditional')),
    mileage_at_inspection NUMERIC(10,2),
    next_inspection_date DATE,
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- ============================================
-- 005: 车辆设备绑定和生命周期状态扩展
-- ============================================

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
    battery_level INTEGER CHECK (battery_level >= 0 AND battery_level <= 100),
    last_signal_time TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, device_serial)
);

-- 扩展 vehicles 表
ALTER TABLE vehicles 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS lifecycle_status VARCHAR(50) DEFAULT 'in_service' CHECK (lifecycle_status IN ('in_service', 'in_transit', 'maintenance', 'parked', 'scrapped')),
ADD COLUMN IF NOT EXISTS lifecycle_status_changed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS lifecycle_status_change_reason TEXT,
ADD COLUMN IF NOT EXISTS odometer_km NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_service_km NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS last_service_date DATE,
ADD COLUMN IF NOT EXISTS purchase_date DATE,
ADD COLUMN IF NOT EXISTS registration_date DATE,
ADD COLUMN IF NOT EXISTS manufacturer VARCHAR(255),
ADD COLUMN IF NOT EXISTS model VARCHAR(255),
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS fuel_type VARCHAR(50) CHECK (fuel_type IN ('gasoline', 'diesel', 'electric', 'hybrid', 'cng', 'lng', 'other')),
ADD COLUMN IF NOT EXISTS capacity_volume NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::JSONB,
ADD COLUMN IF NOT EXISTS cold_chain_certified BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS hazardous_certified BOOLEAN DEFAULT FALSE;

-- ============================================
-- 006: 司机资质证照和记录管理表
-- ============================================

-- 司机证照表
CREATE TABLE IF NOT EXISTS driver_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('driving_license', 'professional_qualification', 'hazardous_license', 'other')),
    certificate_number VARCHAR(100) NOT NULL,
    license_class VARCHAR(50),
    issue_date DATE,
    expiry_date DATE NOT NULL,
    issuing_authority VARCHAR(255),
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 司机违章记录表
CREATE TABLE IF NOT EXISTS driver_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('speeding', 'overload', 'red_light', 'parking', 'license', 'other')),
    violation_date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    fine_amount NUMERIC(10,2),
    points_deducted INTEGER DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'appealed', 'dismissed')),
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 司机体检记录表
CREATE TABLE IF NOT EXISTS driver_medical_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    examination_date DATE NOT NULL,
    examination_type VARCHAR(50) NOT NULL CHECK (examination_type IN ('annual', 'pre_employment', 'periodic', 'special')),
    medical_institution VARCHAR(255),
    doctor_name VARCHAR(255),
    result VARCHAR(50) NOT NULL CHECK (result IN ('passed', 'failed', 'conditional')),
    expiry_date DATE,
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 司机培训记录表
CREATE TABLE IF NOT EXISTS driver_training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    training_type VARCHAR(50) NOT NULL CHECK (training_type IN ('safety', 'regulation', 'skill', 'certification', 'other')),
    training_date DATE NOT NULL,
    training_provider VARCHAR(255),
    instructor_name VARCHAR(255),
    duration_hours NUMERIC(5,2),
    score NUMERIC(5,2),
    result VARCHAR(50) NOT NULL CHECK (result IN ('passed', 'failed', 'incomplete')),
    certificate_number VARCHAR(100),
    expiry_date DATE,
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- ============================================
-- 007: 司机排班和班组管理表
-- ============================================

-- 司机排班表
CREATE TABLE IF NOT EXISTS driver_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    schedule_date DATE NOT NULL,
    shift_type VARCHAR(50) NOT NULL CHECK (shift_type IN ('day', 'night', 'overtime', 'on_call', 'off')),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    planned_hours NUMERIC(5,2),
    actual_hours NUMERIC(5,2),
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
    code VARCHAR(50),
    group_type VARCHAR(50) CHECK (group_type IN ('region', 'route', 'cargo_type', 'shift', 'other')),
    leader_id UUID REFERENCES drivers(id),
    region VARCHAR(255),
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, name)
);

-- 司机班组关联表
CREATE TABLE IF NOT EXISTS driver_group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    group_id UUID NOT NULL REFERENCES driver_groups(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('leader', 'deputy', 'member')),
    joined_date DATE DEFAULT CURRENT_DATE,
    left_date DATE,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(driver_id, group_id)
);

-- ============================================
-- 008: 承运商管理表
-- ============================================

-- 承运商基本信息表
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50),
    company_type VARCHAR(50) CHECK (company_type IN ('individual', 'company', 'cooperative', 'other')),
    registration_number VARCHAR(100),
    tax_id VARCHAR(100),
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address JSONB,
    business_scope TEXT,
    service_level VARCHAR(50) DEFAULT 'standard' CHECK (service_level IN ('standard', 'premium', 'vip')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
    rating_score NUMERIC(3,2) DEFAULT 0 CHECK (rating_score >= 0 AND rating_score <= 5),
    total_shipments INTEGER DEFAULT 0,
    on_time_rate NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, name)
);

-- 承运商证照表
CREATE TABLE IF NOT EXISTS carrier_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('business_license', 'transport_permit', 'hazardous_permit', 'cold_chain', 'insurance', 'other')),
    certificate_number VARCHAR(100) NOT NULL,
    issue_date DATE,
    expiry_date DATE NOT NULL,
    issuing_authority VARCHAR(255),
    file_path TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 承运商评分表
CREATE TABLE IF NOT EXISTS carrier_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    shipment_id UUID REFERENCES shipments(id),
    rating_type VARCHAR(50) NOT NULL CHECK (rating_type IN ('service', 'punctuality', 'safety', 'communication', 'overall')),
    score NUMERIC(3,2) NOT NULL CHECK (score >= 0 AND score <= 5),
    comment TEXT,
    rated_by VARCHAR(255),
    rated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 承运商报价表
CREATE TABLE IF NOT EXISTS carrier_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    shipment_id UUID REFERENCES shipments(id),
    route_from VARCHAR(255),
    route_to VARCHAR(255),
    distance_km NUMERIC(10,2),
    cargo_weight_kg NUMERIC(10,2),
    cargo_volume_m3 NUMERIC(10,2),
    quoted_price NUMERIC(12,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    estimated_days INTEGER,
    validity_days INTEGER DEFAULT 7,
    quote_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (quote_status IN ('pending', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- ============================================
-- 009: 通知表添加租户支持
-- ============================================

ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS tenant_id UUID,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- ============================================
-- 创建所有索引
-- ============================================

-- 车辆相关索引
CREATE INDEX IF NOT EXISTS idx_vehicle_certificates_vehicle_id ON vehicle_certificates(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_certificates_tenant_id ON vehicle_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_certificates_expiry_date ON vehicle_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_certificates_type ON vehicle_certificates(certificate_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_vehicle_id ON vehicle_insurance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_tenant_id ON vehicle_insurance(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_expiry_date ON vehicle_insurance(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_insurance_type ON vehicle_insurance(insurance_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_vehicle_id ON vehicle_inspections(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_tenant_id ON vehicle_inspections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_expiry_date ON vehicle_inspections(expiry_date);
CREATE INDEX IF NOT EXISTS idx_vehicle_inspections_type ON vehicle_inspections(inspection_type);

CREATE INDEX IF NOT EXISTS idx_vehicle_devices_vehicle_id ON vehicle_devices(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_tenant_id ON vehicle_devices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_type ON vehicle_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_status ON vehicle_devices(status);
CREATE INDEX IF NOT EXISTS idx_vehicle_devices_serial ON vehicle_devices(device_serial);

CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vehicles_lifecycle_status ON vehicles(lifecycle_status);

-- 司机相关索引
CREATE INDEX IF NOT EXISTS idx_driver_certificates_driver_id ON driver_certificates(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_certificates_tenant_id ON driver_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_certificates_expiry_date ON driver_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_driver_certificates_type ON driver_certificates(certificate_type);

CREATE INDEX IF NOT EXISTS idx_driver_violations_driver_id ON driver_violations(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_violations_tenant_id ON driver_violations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_violations_date ON driver_violations(violation_date);
CREATE INDEX IF NOT EXISTS idx_driver_violations_type ON driver_violations(violation_type);

CREATE INDEX IF NOT EXISTS idx_driver_medical_records_driver_id ON driver_medical_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_medical_records_tenant_id ON driver_medical_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_medical_records_date ON driver_medical_records(examination_date);
CREATE INDEX IF NOT EXISTS idx_driver_medical_records_expiry ON driver_medical_records(expiry_date);

CREATE INDEX IF NOT EXISTS idx_driver_training_records_driver_id ON driver_training_records(driver_id);
CREATE INDEX IF NOT EXISTS idx_driver_training_records_tenant_id ON driver_training_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_driver_training_records_date ON driver_training_records(training_date);
CREATE INDEX IF NOT EXISTS idx_driver_training_records_type ON driver_training_records(training_type);

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

-- 承运商相关索引
CREATE INDEX IF NOT EXISTS idx_carriers_tenant_id ON carriers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carriers_status ON carriers(status);
CREATE INDEX IF NOT EXISTS idx_carriers_service_level ON carriers(service_level);
CREATE INDEX IF NOT EXISTS idx_carriers_rating_score ON carriers(rating_score);

CREATE INDEX IF NOT EXISTS idx_carrier_certificates_carrier_id ON carrier_certificates(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_certificates_tenant_id ON carrier_certificates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carrier_certificates_expiry_date ON carrier_certificates(expiry_date);
CREATE INDEX IF NOT EXISTS idx_carrier_certificates_type ON carrier_certificates(certificate_type);

CREATE INDEX IF NOT EXISTS idx_carrier_ratings_carrier_id ON carrier_ratings(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_ratings_tenant_id ON carrier_ratings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carrier_ratings_shipment_id ON carrier_ratings(shipment_id);
CREATE INDEX IF NOT EXISTS idx_carrier_ratings_type ON carrier_ratings(rating_type);
CREATE INDEX IF NOT EXISTS idx_carrier_ratings_date ON carrier_ratings(rated_at);

CREATE INDEX IF NOT EXISTS idx_carrier_quotes_carrier_id ON carrier_quotes(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_quotes_tenant_id ON carrier_quotes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_carrier_quotes_shipment_id ON carrier_quotes(shipment_id);
CREATE INDEX IF NOT EXISTS idx_carrier_quotes_status ON carrier_quotes(quote_status);
CREATE INDEX IF NOT EXISTS idx_carrier_quotes_date ON carrier_quotes(created_at);

-- 通知表索引
CREATE INDEX IF NOT EXISTS idx_notifications_tenant_id ON notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type_tenant ON notifications(type, tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_delivered ON notifications(delivered);

-- ============================================
-- 添加表注释
-- ============================================

COMMENT ON TABLE vehicle_certificates IS '车辆证照管理表，存储行驶证、营运证、ETC、危化许可等证照信息';
COMMENT ON TABLE vehicle_insurance IS '车辆保险管理表，存储各类保险信息及到期日期';
COMMENT ON TABLE vehicle_inspections IS '车辆年检管理表，存储年检记录及下次年检日期';
COMMENT ON TABLE vehicle_devices IS '车辆设备绑定表，存储GPS、OBD、温控设备等设备信息';
COMMENT ON COLUMN vehicles.lifecycle_status IS '车辆生命周期状态：在库/在途/维修/停驶/报废';
COMMENT ON COLUMN vehicles.odometer_km IS '里程表读数（公里）';
COMMENT ON COLUMN vehicles.cold_chain_certified IS '是否具有冷链运输资质';
COMMENT ON COLUMN vehicles.hazardous_certified IS '是否具有危险品运输资质';

COMMENT ON TABLE driver_certificates IS '司机证照管理表，存储驾照、从业资格等证照信息';
COMMENT ON TABLE driver_violations IS '司机违章记录表，存储违章信息及处理状态';
COMMENT ON TABLE driver_medical_records IS '司机体检记录表，存储体检信息及有效期';
COMMENT ON TABLE driver_training_records IS '司机培训记录表，存储培训信息及证书';
COMMENT ON TABLE driver_schedules IS '司机排班表，存储司机出勤计划和实际工时';
COMMENT ON TABLE driver_groups IS '司机班组表，用于司机分组管理';
COMMENT ON TABLE driver_group_members IS '司机班组关联表，管理司机与班组的关联关系';

COMMENT ON TABLE carriers IS '承运商基本信息表';
COMMENT ON TABLE carrier_certificates IS '承运商证照管理表，存储资质证照信息';
COMMENT ON TABLE carrier_ratings IS '承运商评分表，记录服务评分';
COMMENT ON TABLE carrier_quotes IS '承运商报价表，记录报价信息';

COMMENT ON COLUMN notifications.tenant_id IS '租户ID，用于多租户隔离';

