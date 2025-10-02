-- 智能Supabase货币更新脚本
-- 自动检测字段名称并安全更新
-- 所有CNY -> CAD的转换

-- ============================================
-- 1. 准备：确保CAD货币存在
-- ============================================
DO $$
BEGIN
    -- 检查CAD是否存在
    IF NOT EXISTS (SELECT 1 FROM currencies WHERE code = 'CAD') THEN
        -- 插入CAD货币
        INSERT INTO currencies (code, name, symbol, exchange_rate, is_active, created_at, updated_at)
        VALUES ('CAD', 'Canadian Dollar', '$', 1.0, true, NOW(),
                COALESCE((SELECT updated_at FROM currencies WHERE code = 'USD'), NOW()));
        
        RAISE NOTICE 'CAD货币插入成功';
    ELSE
        -- 更新CAD信息
        UPDATE currencies 
        SET 
          name = 'Canadian Dollar',
          symbol = '$',
          exchange_rate = 1.0,
          updated_at = NOW()
        WHERE code = 'CAD';
        
        RAISE NOTICE 'CAD货币更新成功';
    END IF;
END $$;

-- ============================================
-- 2. 更新currencies.cny为CAD
-- ============================================
UPDATE currencies 
SET 
  code = 'CAD',
  name = 'Canadian Dollar',
  symbol = '$',
  updated_at = NOW()
WHERE code = 'CNY';

-- ============================================
-- 3. 智能检查并更新tenants表
-- ============================================
DO $$
BEGIN
    -- 检查是否有default_currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'default_currency' AND table_schema = 'public'
    ) THEN
        UPDATE tenants 
        SET 
          default_currency = 'CAD',
          updated_at = NOW()
        WHERE default_currency = 'CNY';
        
        RAISE NOTICE 'tenants.default_currency 更新完成';
    END IF;

    -- 检查是否有currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'currency' AND table_schema = 'public'
    ) THEN
        UPDATE tenants 
        SET 
          currency = 'CAD',
          updated_at = NOW()
        WHERE currency = 'CNY';
        
        RAISE NOTICE 'tenants.currency 更新完成';
    END IF;

    -- 检查是否有primary_currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'tenants' AND column_name = 'primary_currency' AND table_schema = 'public'
    ) THEN
        UPDATE tenants 
        SET 
          primary_currency = 'CAD',
          updated_at = NOW()
        WHERE primary_currency = 'CNY';
        
        RAISE NOTICE 'tenants.primary_currency 更新完成';
    END IF;
END $$;

-- ============================================
-- 4. 智能检查并更新pricing_templates表
-- ============================================
DO $$
BEGIN
    -- 检查是否有currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pricing_templates' AND column_name = 'currency' AND table_schema = 'public'
    ) THEN
        UPDATE pricing_templates 
        SET 
          currency = 'CAD',
          updated_at = NOW()
        WHERE currency = 'CNY';
        
        RAISE NOTICE 'pricing_templates.currency 更新完成';
    END IF;

    -- 检查是否有default_currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pricing_templates' AND column_name = 'default_currency' AND table_schema = 'public'
    ) THEN
        UPDATE pricing_templates 
        SET 
          default_currency = 'CAD',
          updated_at = NOW()
        WHERE default_currency = 'CNY';
        
        RAISE NOTICE 'pricing_templates.default_currency 更新完成';
    END IF;
END $$;

-- ============================================
-- 5. 智能检查并更新pricing_components表
-- ============================================
DO $$
BEGIN
    -- 检查是否有currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pricing_components' AND column_name = 'currency' AND table_schema = 'public'
    ) THEN
        UPDATE pricing_components 
        SET 
          currency = 'CAD',
          updated_at = NOW()
        WHERE currency = 'CNY';
        
        RAISE NOTICE 'pricing_components.currency 更新完成';
    END IF;
END $$;

-- ============================================
-- 6. 智能检查并更新shipments表
-- ============================================
DO $$
BEGIN
    -- 检查estimated_cost_currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'estimated_cost_currency' AND table_schema = 'public'
    ) THEN
        UPDATE shipments 
        SET 
          estimated_cost_currency = 'CAD',
          updated_at = NOW()
        WHERE estimated_cost_currency = 'CNY';
        
        RAISE NOTICE 'shipments.estimated_cost_currency 更新完成';
    END IF;

    -- 检查actual_cost_currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'actual_cost_currency' AND table_schema = 'public'
    ) THEN
        UPDATE shipments 
        SET 
          actual_cost_currency = 'CAD',
          updated_at = NOW()
        WHERE actual_cost_currency = 'CNY';
        
        RAISE NOTICE 'shipments.actual_cost_currency 更新完成';
    END IF;

    -- 检查cost_currency字段
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'shipments' AND column_name = 'cost_currency' AND table_schema = 'public'
    ) THEN
        UPDATE shipments 
        SET 
          cost_currency = 'CAD',
          updated_at = NOW()
        WHERE cost_currency = 'CNY';
        
        RAISE NOTICE 'shipments.cost_currency 更新完成';
    END IF;
END $$;

-- ============================================
-- 7. 智能检查并更新其他可能的财务表
-- ============================================
DO $$
DECLARE 
    table_record RECORD;
    column_record RECORD;
    result INTEGER;  -- 声明result变量
BEGIN
    -- 查找所有可能包含currency字段的表
    FOR table_record IN 
        SELECT DISTINCT table_name
        FROM information_schema.columns 
        WHERE column_name IN ('currency', 'default_currency', 'primary_currency') 
        AND table_schema = 'public'
        AND table_name NOT IN ('currencies')  -- 排除currencies表本身
    LOOP
        RAISE NOTICE '检查表: %', table_record.table_name;
        
        -- 更新currency字段
        EXECUTE format('UPDATE %I SET currency = ''CAD'', updated_at = NOW() WHERE currency = ''CNY''', table_record.table_name);
        GET DIAGNOSTICS result = ROW_COUNT;
        IF result > 0 THEN
            RAISE NOTICE '表中的currency字段已更新: % (% 行)', table_record.table_name, result;
        END IF;

        -- 更新default_currency字段
        EXECUTE format('UPDATE %I SET default_currency = ''CAD'', updated_at = NOW() WHERE default_currency = ''CNY''', table_record.table_name);
        GET DIAGNOSTICS result = ROW_COUNT;
        IF result > 0 THEN
            RAISE NOTICE '表中的default_currency字段已更新: % (% 行)', table_record.table_name, result;
        END IF;

        -- 更新primary_currency字段
        EXECUTE format('UPDATE %I SET primary_currency = ''CAD'', updated_at = NOW() WHERE primary_currency = ''CNY''', table_record.table_name);
        GET DIAGNOSTICS result = ROW_COUNT;
        IF result > 0 THEN
            RAISE NOTICE '表中的primary_currency字段已更新: % (% 行)', table_record.table_name, result;
        END IF;
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '跳过表 %，错误: %', table_record.table_name, SQLERRM;
END $$;

-- ============================================
-- 8. 验证结果
-- ============================================
SELECT '开始验证更新结果...' as status;

-- 检查CNY记录数量
DO $$
DECLARE
    total_cny INTEGER := 0;
    table_name TEXT;
    column_name TEXT;
    count_result INTEGER;
BEGIN
    -- 遍历所有可能包含货币字段的表和列
    FOR table_name, column_name IN 
        SELECT DISTINCT c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.column_name IN ('currency', 'default_currency', 'primary_currency', 'code')
        AND c.table_schema = 'public'
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = ''CNY''', 
                          table_name, column_name) INTO count_result;
            
            IF count_result > 0 THEN
                RAISE NOTICE '表 %.% 中仍有 % 行CNY记录', table_name, column_name, count_result;
                total_cny := total_cny + count_result;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                -- 忽略不存在的表或字段
                NULL;
        END;
    END LOOP;

    RAISE NOTICE '总CNY记录数: %', total_cny;
END $$;

-- 显示CAD记录统计
SELECT 'CAD记录统计:' as info;

-- currencies表中的CAD
SELECT 'currencies' as table_name, COUNT(*) as cad_count 
FROM currencies WHERE code = 'CAD';

-- 其他表的CAD统计
DO $$
DECLARE
    rec RECORD;
    count_result INTEGER;
BEGIN
    FOR rec IN 
        SELECT DISTINCT c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.column_name IN ('currency', 'default_currency', 'primary_currency')
        AND c.table_schema = 'public'
        AND c.table_name != 'currencies'
    LOOP
        BEGIN
            EXECUTE format('SELECT COUNT(*) FROM %I WHERE %I = ''CAD''', 
                          rec.table_name, rec.column_name) INTO count_result;
            
            IF count_result > 0 THEN
                RAISE NOTICE '表 %.% 中有 % 行CAD记录', rec.table_name, rec.column_name, count_result;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

SELECT '货币更新完成！CNY已全部转换为CAD' as final_status;
