-- 修复唯一性约束 migration
-- 创建时间: 2025-12-23
-- 目的: 确保 email/phone/license_number 等字段的唯一性约束只针对非空值生效 (Partial Index)

-- 1. 修复 Customers unique email constraint
ALTER TABLE customers DROP CONSTRAINT IF EXISTS customers_tenant_id_email_key;
DROP INDEX IF EXISTS customers_tenant_id_email_key;

-- 创建正确的 Partial Unique Index
CREATE UNIQUE INDEX IF NOT EXISTS customers_tenant_id_email_key 
ON customers(tenant_id, email) 
WHERE email IS NOT NULL;


-- 2. 修复 Drivers unique phone constraint
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_tenant_id_phone_key;
DROP INDEX IF EXISTS drivers_tenant_id_phone_key;

CREATE UNIQUE INDEX IF NOT EXISTS drivers_tenant_id_phone_key 
ON drivers(tenant_id, phone) 
WHERE phone IS NOT NULL;


-- 3. 修复 Drivers unique license_number constraint
ALTER TABLE drivers DROP CONSTRAINT IF EXISTS drivers_tenant_id_license_number_key;
DROP INDEX IF EXISTS drivers_tenant_id_license_number_key;

CREATE UNIQUE INDEX IF NOT EXISTS drivers_tenant_id_license_number_key 
ON drivers(tenant_id, license_number) 
WHERE license_number IS NOT NULL;
