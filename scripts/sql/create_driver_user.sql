-- 创建司机用户用于移动端登录
-- 创建时间: 2025-11-30 19:10:00
-- 密码: password

-- 确保租户存在
INSERT INTO tenants (id, name, domain, schema_name, status, settings, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'Demo Company',
    'demo.tms-platform.com',
    'public',
    'active',
    '{}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 创建司机用户
INSERT INTO users (id, tenant_id, email, password_hash, role, profile, status, created_at, updated_at)
VALUES (
    '10000000-0000-0000-0000-000000000002'::uuid,
    '00000000-0000-0000-0000-000000000001'::uuid,
    'driver@demo.tms-platform.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'driver',
    '{"name": "司机李四", "phone": "+1-555-0102"}'::jsonb,
    'active',
    NOW(),
    NOW()
) ON CONFLICT (tenant_id, email) DO UPDATE 
SET 
    password_hash = EXCLUDED.password_hash,
    role = EXCLUDED.role,
    profile = EXCLUDED.profile,
    status = EXCLUDED.status,
    updated_at = NOW();

-- 验证用户已创建
SELECT id, email, role, status, tenant_id 
FROM users 
WHERE email = 'driver@demo.tms-platform.com';

