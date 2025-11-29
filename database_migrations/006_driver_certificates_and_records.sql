-- 2025-11-29T11:25:04Z 司机资质证照和记录管理表
-- 第一阶段：核心主数据完善 - 1.2 司机档案完善

-- 司机证照表
CREATE TABLE IF NOT EXISTS driver_certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    certificate_type VARCHAR(50) NOT NULL CHECK (certificate_type IN ('driving_license', 'professional_qualification', 'hazardous_license', 'other')),
    certificate_number VARCHAR(100) NOT NULL,
    license_class VARCHAR(50), -- 驾照等级，如 A1, A2, B1, B2, C1, C2
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

-- 司机违章记录表
CREATE TABLE IF NOT EXISTS driver_violations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    violation_type VARCHAR(50) NOT NULL CHECK (violation_type IN ('speeding', 'overload', 'red_light', 'parking', 'license', 'other')),
    violation_date DATE NOT NULL,
    location VARCHAR(255),
    description TEXT,
    fine_amount NUMERIC(10,2), -- 罚款金额
    points_deducted INTEGER DEFAULT 0, -- 扣分
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'appealed', 'dismissed')),
    file_path TEXT, -- 违章单文件存储路径
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
    expiry_date DATE, -- 体检有效期
    file_path TEXT, -- 体检报告文件存储路径
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
    duration_hours NUMERIC(5,2), -- 培训时长（小时）
    score NUMERIC(5,2), -- 培训成绩/分数
    result VARCHAR(50) NOT NULL CHECK (result IN ('passed', 'failed', 'incomplete')),
    certificate_number VARCHAR(100), -- 培训证书编号
    expiry_date DATE, -- 培训证书有效期
    file_path TEXT, -- 培训证书文件存储路径
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 创建索引
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

-- 添加注释
COMMENT ON TABLE driver_certificates IS '司机证照管理表，存储驾照、从业资格等证照信息';
COMMENT ON TABLE driver_violations IS '司机违章记录表，存储违章信息及处理状态';
COMMENT ON TABLE driver_medical_records IS '司机体检记录表，存储体检信息及有效期';
COMMENT ON TABLE driver_training_records IS '司机培训记录表，存储培训信息及证书';

