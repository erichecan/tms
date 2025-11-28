-- 添加实体唯一性约束迁移脚本
-- 创建时间: 2025-11-24T17:15:00Z
-- 目的: 确保所有实体（客户、司机、车辆、运单、财务记录）在数据库层面具备唯一性约束

-- =============================================================================
-- 1. 客户表 (customers) 唯一性约束
-- =============================================================================

-- 添加 email 字段（从 contact_info JSONB 中提取）
ALTER TABLE customers ADD COLUMN IF NOT EXISTS email VARCHAR(255);

-- 更新 email 字段（从 contact_info JSONB 中提取）
UPDATE customers 
SET email = contact_info->>'email' 
WHERE email IS NULL AND contact_info->>'email' IS NOT NULL;

-- 添加唯一性约束：同一租户内 email 唯一（如果 email 存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_tenant_id_email_key'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_tenant_id_email_key 
        UNIQUE (tenant_id, email) 
        WHERE email IS NOT NULL;
    END IF;
END $$;

-- 添加唯一性约束：同一租户内 name 唯一（作为业务唯一标识）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'customers_tenant_id_name_key'
    ) THEN
        ALTER TABLE customers 
        ADD CONSTRAINT customers_tenant_id_name_key 
        UNIQUE (tenant_id, name);
    END IF;
END $$;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email) WHERE email IS NOT NULL;

-- =============================================================================
-- 2. 司机表 (drivers) 唯一性约束
-- =============================================================================

-- 添加唯一性约束：同一租户内 phone 唯一（如果 phone 存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'drivers_tenant_id_phone_key'
    ) THEN
        ALTER TABLE drivers 
        ADD CONSTRAINT drivers_tenant_id_phone_key 
        UNIQUE (tenant_id, phone) 
        WHERE phone IS NOT NULL;
    END IF;
END $$;

-- 添加唯一性约束：同一租户内 license_number 唯一（如果 license_number 存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'drivers_tenant_id_license_number_key'
    ) THEN
        ALTER TABLE drivers 
        ADD CONSTRAINT drivers_tenant_id_license_number_key 
        UNIQUE (tenant_id, license_number) 
        WHERE license_number IS NOT NULL;
    END IF;
END $$;

-- =============================================================================
-- 3. 车辆表 (vehicles) 唯一性约束
-- =============================================================================

-- 注意：vehicles 表当前没有 tenant_id 字段
-- 如果需要多租户支持，需要先添加 tenant_id 字段
-- 这里先检查是否有 tenant_id，如果没有则添加

ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE;

-- 为现有车辆设置默认租户（如果 tenant_id 为空）
UPDATE vehicles 
SET tenant_id = '00000000-0000-0000-0000-000000000001' 
WHERE tenant_id IS NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_vehicles_tenant_id ON vehicles(tenant_id);

-- 删除旧的 plate_number 唯一约束（如果存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vehicles_plate_number_key'
    ) THEN
        ALTER TABLE vehicles DROP CONSTRAINT vehicles_plate_number_key;
    END IF;
END $$;

-- 添加新的唯一性约束：同一租户内 plate_number 唯一
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'vehicles_tenant_id_plate_number_key'
    ) THEN
        ALTER TABLE vehicles 
        ADD CONSTRAINT vehicles_tenant_id_plate_number_key 
        UNIQUE (tenant_id, plate_number);
    END IF;
END $$;

-- =============================================================================
-- 4. 运单表 (shipments) 唯一性约束
-- =============================================================================

-- 删除旧的 shipment_number 唯一约束（如果存在）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'shipments_shipment_number_key'
    ) THEN
        ALTER TABLE shipments DROP CONSTRAINT shipments_shipment_number_key;
    END IF;
END $$;

-- 添加新的唯一性约束：同一租户内 shipment_number 唯一
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'shipments_tenant_id_shipment_number_key'
    ) THEN
        ALTER TABLE shipments 
        ADD CONSTRAINT shipments_tenant_id_shipment_number_key 
        UNIQUE (tenant_id, shipment_number);
    END IF;
END $$;

-- =============================================================================
-- 5. 财务记录表 (financial_records) 唯一性约束
-- =============================================================================

-- 添加唯一性约束：同一租户内，同一 reference_id 和 type 组合唯一
-- 这确保每个运单不会重复生成相同类型的财务记录
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'financial_records_tenant_id_reference_id_type_key'
    ) THEN
        ALTER TABLE financial_records 
        ADD CONSTRAINT financial_records_tenant_id_reference_id_type_key 
        UNIQUE (tenant_id, reference_id, type);
    END IF;
END $$;

-- =============================================================================
-- 完成
-- =============================================================================

-- 输出完成信息
DO $$
BEGIN
    RAISE NOTICE '唯一性约束添加完成！';
    RAISE NOTICE '- customers: UNIQUE(tenant_id, email), UNIQUE(tenant_id, name)';
    RAISE NOTICE '- drivers: UNIQUE(tenant_id, phone), UNIQUE(tenant_id, license_number)';
    RAISE NOTICE '- vehicles: UNIQUE(tenant_id, plate_number)';
    RAISE NOTICE '- shipments: UNIQUE(tenant_id, shipment_number)';
    RAISE NOTICE '- financial_records: UNIQUE(tenant_id, reference_id, type)';
END $$;

