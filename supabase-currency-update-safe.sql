-- Supabase 货币单位更新脚本 (安全版本)
-- 将所有 CNY (人民币) 更新为 CAD (加拿大元)
-- 执行时间: 2025-10-02 20:30:00
-- 注意: 此脚本避免使用 ON CONFLICT，更加安全

-- ============================================
-- 1. 更新 currencies 表
-- ============================================
-- 先检查CAD是否存在
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM currencies WHERE code = 'CAD') THEN
        -- CAD已存在，更新它
        UPDATE currencies 
        SET 
          name = 'Canadian Dollar',
          symbol = '$',
          exchange_rate = 1.0,
          is_active = true,
          updated_at = NOW()
        WHERE code = 'CAD';
    ELSE
        -- CAD不存在，插入它
        INSERT INTO currencies (code, name, symbol, exchange_rate, is_active, created_at, updated_at)
        VALUES ('CAD', 'Canadian Dollar', '$', 1.0, true, NOW(), NOW());
    END IF;
END $$;

-- 更新所有CNY记录为CAD
UPDATE currencies 
SET 
  code = 'CAD',
  name = 'Canadian Dollar',
  symbol = '$',
  updated_at = NOW()
WHERE code = 'CNY';

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
-- 更新 estimated_cost_currency (如果字段存在)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'estimated_cost_currency'
    ) THEN
        UPDATE shipments 
        SET 
          estimated_cost_currency = 'CAD',
          updated_at = NOW()
        WHERE estimated_cost_currency = 'CNY';
    END IF;
END $$;

-- 更新 actual_cost_currency (如果字段存在)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'actual_cost_currency'
    ) THEN
        UPDATE shipments 
        SET 
          actual_cost_currency = 'CAD',
          updated_at = NOW()
        WHERE actual_cost_currency = 'CNY';
    END IF;
END $$;

-- ============================================
-- 6. 更新 financial_records 表 (如果存在)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_records') THEN
        UPDATE financial_records 
        SET 
          currency = 'CAD',
          updated_at = NOW()
        WHERE currency = 'CNY';
    END IF;
END $$;

-- ============================================
-- 7. 更新 financial_statements 表 (如果存在)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'financial_statements') THEN
        UPDATE financial_statements 
        SET 
          currency = 'CAD',
          updated_at = NOW()
        WHERE currency = 'CNY';
    END IF;
END $$;

-- ============================================
-- 8. 更新 pricing_calculations 表（如果存在）
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pricing_calculations') THEN
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'pricing_calculations' AND column_name = 'currency'
        ) THEN
            UPDATE pricing_calculations 
            SET 
              currency = 'CAD',
              updated_at = NOW()
            WHERE currency = 'CNY';
        END IF;
    END IF;
END $$;

-- ============================================
-- 9. 更新 exchange_rates 表 (如果存在)
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exchange_rates') THEN
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
    END IF;
END $$;

-- ============================================
-- 10. 插入新的CAD相关汇率（如果exchange_rates表存在）
-- ============================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'exchange_rates') THEN
        -- CAD to USD
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'CAD' AND to_currency = 'USD') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('CAD', 'USD', 0.74, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 0.74, updated_at = NOW()
            WHERE from_currency = 'CAD' AND to_currency = 'USD';
        END IF;

        -- USD to CAD
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'USD' AND to_currency = 'CAD') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('USD', 'CAD', 1.35, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 1.35, updated_at = NOW()
            WHERE from_currency = 'USD' AND to_currency = 'CAD';
        END IF;

        -- CAD to EUR
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'CAD' AND to_currency = 'EUR') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('CAD', 'EUR', 0.68, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 0.68, updated_at = NOW()
            WHERE from_currency = 'CAD' AND to_currency = 'EUR';
        END IF;

        -- EUR to CAD
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'EUR' AND to_currency = 'CAD') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('EUR', 'CAD', 1.47, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 1.47, updated_at = NOW()
            WHERE from_currency = 'EUR' AND to_currency = 'CAD';
        END IF;

        -- CAD to GBP
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'CAD' AND to_currency = 'GBP') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('CAD', 'GBP', 0.58, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 0.58, updated_at = NOW()
            WHERE from_currency = 'CAD' AND to_currency = 'GBP';
        END IF;

        -- GBP to CAD
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'GBP' AND to_currency = 'CAD') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('GBP', 'CAD', 1.72, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 1.72, updated_at = NOW()
            WHERE from_currency = 'GBP' AND to_currency = 'CAD';
        END IF;

        -- CAD to CAD
        IF NOT EXISTS (SELECT 1 FROM exchange_rates WHERE from_currency = 'CAD' AND to_currency = 'CAD') THEN
            INSERT INTO exchange_rates (from_currency, to_currency, rate, source, created_at, updated_at)
            VALUES ('CAD', 'CAD', 1.00, 'manual', NOW(), NOW());
        ELSE
            UPDATE exchange_rates SET rate = 1.00, updated_at = NOW()
            WHERE from_currency = 'CAD' AND to_currency = 'CAD';
        END IF;
    END IF;
END $$;

-- ============================================
-- 验证更新结果
-- ============================================
-- 提示开始验证
SELECT 'Starting verification...' as status;

-- 检查是否还有CNY记录
SELECT 'Checking for remaining CNY records...' as status;

-- 检查 currencies 表
DO $$
DECLARE
    cny_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cny_count FROM currencies WHERE code = 'CNY';
    RAISE NOTICE 'currencies表中CNY记录数: %', cny_count;
END $$;

-- 检查 tenants 表
DO $$
DECLARE
    cny_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO cny_count FROM tenants WHERE default_currency = 'CNY';
    RAISE NOTICE 'tenants表中CNY记录数: %', cny_count;
END $$;

-- 显示CAD记录数量
SELECT 'Checking CAD records...' as status;

-- 检查 currencies 表中的CAD
SELECT 'currencies' as table_name, COUNT(*) as cad_count 
FROM currencies WHERE code = 'CAD';

-- 检查 tenants 表中的CAD
SELECT 'tenants' as table_name, COUNT(*) as cad_count 
FROM tenants WHERE default_currency = 'CAD';

-- 完成提示
SELECT 'Currency update completed! All CNY records have been updated to CAD.' as status;
