-- Supabase 货币单位更新脚本
-- 将所有 CNY (人民币) 更新为 CAD (加拿大元)
-- 执行时间: 2025-10-02 20:25:00

-- ============================================
-- 1. 更新 currencies 表
-- ============================================
UPDATE currencies 
SET 
  code = 'CAD',
  name = 'Canadian Dollar',
  symbol = '$'
WHERE code = 'CNY';

-- 如果CAD不存在，则插入
INSERT INTO currencies (code, name, symbol, exchange_rate, is_active, created_at, updated_at)
VALUES ('CAD', 'Canadian Dollar', '$', 1.0, true, NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = 'Canadian Dollar',
  symbol = '$',
  exchange_rate = 1.0,
  is_active = true,
  updated_at = NOW();

-- ============================================
-- 2. 更新 tenants 表中的默认货币
-- ============================================
UPDATE tenants 
SET 
  default_currency = 'CAD',
  updated_at = NOW()
WHERE default_currency = 'CNY';

-- ============================================
-- 3. 更新 pricing_templates 表
-- ============================================
UPDATE pricing_templates 
SET 
  currency = 'CAD',
  updated_at = NOW()
WHERE currency = 'CNY';

-- ============================================
-- 4. 更新 pricing_components 表
-- ============================================
UPDATE pricing_components 
SET 
  currency = 'CAD',
  updated_at = NOW()
WHERE currency = 'CNY';

-- ============================================
-- 5. 更新 shipments 表中的货币字段
-- ============================================
-- 更新 estimated_cost_currency
UPDATE shipments 
SET 
  estimated_cost_currency = 'CAD',
  updated_at = NOW()
WHERE estimated_cost_currency = 'CNY';

-- 更新 actual_cost_currency
UPDATE shipments 
SET 
  actual_cost_currency = 'CAD',
  updated_at = NOW()
WHERE actual_cost_currency = 'CNY';

-- ============================================
-- 6. 更新 financial_records 表
-- ============================================
UPDATE financial_records 
SET 
  currency = 'CAD',
  updated_at = NOW()
WHERE currency = 'CNY';

-- ============================================
-- 7. 更新 financial_statements 表
-- ============================================
UPDATE financial_statements 
SET 
  currency = 'CAD',
  updated_at = NOW()
WHERE currency = 'CNY';

-- ============================================
-- 8. 更新 pricing_calculations 表（如果存在）
-- ============================================
UPDATE pricing_calculations 
SET 
  currency = 'CAD',
  updated_at = NOW()
WHERE currency = 'CNY';

-- ============================================
-- 9. 更新 exchange_rates 表
-- ============================================
-- 更新 from_currency
UPDATE exchange_rates 
SET 
  from_currency = 'CAD',
  updated_at = NOW()
WHERE from_currency = 'CNY';

-- 更新 to_currency
UPDATE exchange_rates 
SET 
  to_currency = 'CAD',
  updated_at = NOW()
WHERE to_currency = 'CNY';

-- ============================================
-- 10. 插入新的CAD相关汇率（如果不存在）
-- ============================================
INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
VALUES 
  ('CAD', 'USD', 0.74, 'manual', NOW(), NOW()),
  ('USD', 'CAD', 1.35, 'manual', NOW(), NOW()),
  ('CAD', 'EUR', 0.68, 'manual', NOW(), NOW()),
  ('EUR', 'CAD', 1.47, 'manual', NOW(), NOW()),
  ('CAD', 'GBP', 0.58, 'manual', NOW(), NOW()),
  ('GBP', 'CAD', 1.72, 'manual', NOW(), NOW()),
  ('CAD', 'CAD', 1.00, 'manual', NOW(), NOW())
ON CONFLICT (from_currency, to_currency) DO UPDATE SET
  rate = EXCLUDED.rate,
  updated_at = NOW();

-- ============================================
-- 验证更新结果
-- ============================================
-- 检查是否还有CNY记录
SELECT 'currencies' as table_name, COUNT(*) as cny_count FROM currencies WHERE code = 'CNY'
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants WHERE default_currency = 'CNY'
UNION ALL
SELECT 'pricing_templates', COUNT(*) FROM pricing_templates WHERE currency = 'CNY'
UNION ALL
SELECT 'pricing_components', COUNT(*) FROM pricing_components WHERE currency = 'CNY'
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments WHERE estimated_cost_currency = 'CNY' OR actual_cost_currency = 'CNY'
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records WHERE currency = 'CNY'
UNION ALL
SELECT 'exchange_rates', COUNT(*) FROM exchange_rates WHERE from_currency = 'CNY' OR to_currency = 'CNY';

-- 显示CAD记录数量
SELECT 'CAD Records Count' as info;
SELECT 'currencies' as table_name, COUNT(*) as cad_count FROM currencies WHERE code = 'CAD'
UNION ALL
SELECT 'tenants', COUNT(*) FROM tenants WHERE default_currency = 'CAD'
UNION ALL
SELECT 'pricing_templates', COUNT(*) FROM pricing_templates WHERE currency = 'CAD'
UNION ALL
SELECT 'pricing_components', COUNT(*) FROM pricing_components WHERE currency = 'CAD'
UNION ALL
SELECT 'shipments', COUNT(*) FROM shipments WHERE estimated_cost_currency = 'CAD' OR actual_cost_currency = 'CAD'
UNION ALL
SELECT 'financial_records', COUNT(*) FROM financial_records WHERE currency = 'CAD';

-- 完成提示
SELECT 'Currency update completed! All CNY records have been updated to CAD.' as status;
