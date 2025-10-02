-- 检查Supabase表结构
-- 用于了解实际的表字段名称

-- 检查所有表
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;

-- 检查tenants表的具体字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查currencies表的具体字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'currencies' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查pricing_templates表的具体字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pricing_templates' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查pricing_components表的具体字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'pricing_components' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查shipments表的具体字段
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shipments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 查看实际数据样例
SELECT 'tenants sample:' as table_name;
SELECT * FROM tenants LIMIT 2;

SELECT 'currencies sample:' as table_name;
SELECT * FROM currencies LIMIT 5;

SELECT 'pricing_templates sample:' as table_name;
SELECT * FROM pricing_templates LIMIT 3;

SELECT 'pricing_components sample:' as table_name;
SELECT * FROM pricing_components LIMIT 3;

SELECT 'shipments sample:' as table_name;
SELECT * FROM shipments LIMIT 2;
