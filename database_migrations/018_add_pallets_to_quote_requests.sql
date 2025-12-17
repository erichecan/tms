-- 添加托盘数量字段到询价请求表
-- 创建时间: 2025-12-12 00:15:00
-- 作用: 在客户下单查询时支持托盘数量字段

-- 添加 pallets 字段（托盘数量，可选）
ALTER TABLE public.quote_requests 
ADD COLUMN IF NOT EXISTS pallets integer;

-- 添加注释
COMMENT ON COLUMN public.quote_requests.pallets IS '托盘数量（可选）';

-- 验证字段添加
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quote_requests'
        AND column_name = 'pallets'
    ) THEN
        RAISE NOTICE '✓ pallets 字段添加成功';
    ELSE
        RAISE WARNING '✗ pallets 字段添加失败';
    END IF;
END $$;
