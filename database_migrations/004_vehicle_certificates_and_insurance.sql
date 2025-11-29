-- 2025-11-29T11:25:04Z 车辆证照和保险管理表
-- 第一阶段：核心主数据完善 - 1.1 车辆档案完善

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
    file_path TEXT, -- 证照文件存储路径
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
    coverage_amount NUMERIC(12,2), -- 保额
    premium_amount NUMERIC(12,2), -- 保费
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    file_path TEXT, -- 保险单文件存储路径
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
    mileage_at_inspection NUMERIC(10,2), -- 年检时里程数
    next_inspection_date DATE,
    file_path TEXT, -- 年检报告文件存储路径
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 创建索引
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

-- 添加注释
COMMENT ON TABLE vehicle_certificates IS '车辆证照管理表，存储行驶证、营运证、ETC、危化许可等证照信息';
COMMENT ON TABLE vehicle_insurance IS '车辆保险管理表，存储各类保险信息及到期日期';
COMMENT ON TABLE vehicle_inspections IS '车辆年检管理表，存储年检记录及下次年检日期';

