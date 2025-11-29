-- 2025-11-29T11:25:04Z 承运商管理表
-- 第一阶段：核心主数据完善 - 1.3 承运商管理

-- 承运商基本信息表
CREATE TABLE IF NOT EXISTS carriers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50), -- 承运商代码
    company_type VARCHAR(50) CHECK (company_type IN ('individual', 'company', 'cooperative', 'other')), -- 公司类型
    registration_number VARCHAR(100), -- 工商注册号
    tax_id VARCHAR(100), -- 税号
    contact_person VARCHAR(255),
    contact_phone VARCHAR(50),
    contact_email VARCHAR(255),
    address JSONB, -- 地址信息 {country, province, city, postalCode, addressLine1, addressLine2}
    business_scope TEXT, -- 经营范围
    service_level VARCHAR(50) DEFAULT 'standard' CHECK (service_level IN ('standard', 'premium', 'vip')), -- 服务等级
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'blacklisted')),
    rating_score NUMERIC(3,2) DEFAULT 0 CHECK (rating_score >= 0 AND rating_score <= 5), -- 综合评分（0-5分）
    total_shipments INTEGER DEFAULT 0, -- 总运单数
    on_time_rate NUMERIC(5,2) DEFAULT 0, -- 准点率（百分比）
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255),
    UNIQUE(tenant_id, name) -- 同一租户内承运商名称唯一
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
    file_path TEXT, -- 证照文件存储路径
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
    shipment_id UUID REFERENCES shipments(id), -- 关联运单（可选）
    rating_type VARCHAR(50) NOT NULL CHECK (rating_type IN ('service', 'punctuality', 'safety', 'communication', 'overall')),
    score NUMERIC(3,2) NOT NULL CHECK (score >= 0 AND score <= 5), -- 评分（0-5分）
    comment TEXT,
    rated_by VARCHAR(255), -- 评分人
    rated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 承运商报价表
CREATE TABLE IF NOT EXISTS carrier_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrier_id UUID NOT NULL REFERENCES carriers(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL,
    shipment_id UUID REFERENCES shipments(id), -- 关联运单（可选）
    route_from VARCHAR(255), -- 起点
    route_to VARCHAR(255), -- 终点
    distance_km NUMERIC(10,2), -- 距离（公里）
    cargo_weight_kg NUMERIC(10,2), -- 货物重量
    cargo_volume_m3 NUMERIC(10,2), -- 货物体积
    quoted_price NUMERIC(12,2) NOT NULL, -- 报价金额
    currency VARCHAR(3) DEFAULT 'CNY',
    estimated_days INTEGER, -- 预计天数
    validity_days INTEGER DEFAULT 7, -- 报价有效期（天）
    quote_status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (quote_status IN ('pending', 'accepted', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255),
    updated_by VARCHAR(255)
);

-- 创建索引
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

-- 添加注释
COMMENT ON TABLE carriers IS '承运商基本信息表';
COMMENT ON TABLE carrier_certificates IS '承运商证照管理表，存储资质证照信息';
COMMENT ON TABLE carrier_ratings IS '承运商评分表，记录服务评分';
COMMENT ON TABLE carrier_quotes IS '承运商报价表，记录报价信息';

