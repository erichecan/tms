-- 检查Supabase表结构的SQL
-- 先运行这个来了解实际表结构，然后再生成正确的测试数据

-- 检查customers表结构
SELECT 'customers表结构:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查drivers表结构  
SELECT 'drivers表结构:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'drivers' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查vehicles表结构
SELECT 'vehicles表结构:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'vehicles' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查shipments表结构
SELECT 'shipments表结构:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'shipments' AND table_schema = 'public'
ORDER BY ordinal_position;

-- 检查tenants表结构
SELECT 'tenants表结构:' as table_name;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'tenants' AND table_schema = 'public'
ORDER BY ordinal_position;
