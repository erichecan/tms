-- 1. 先创建租户
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

-- 2. 创建管理员用户
INSERT INTO users (id, email, password_hash, role, profile, status, tenant_id, created_at, updated_at) 
VALUES (
    '00000000-0000-0000-0000-000000000001'::uuid,
    'admin@demo.tms-platform.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'admin',
    '{"name": "Admin User", "phone": "+1-555-0100"}'::jsonb,
    'active',
    '00000000-0000-0000-0000-000000000001'::uuid,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. 创建测试用户
INSERT INTO users (id, email, password_hash, role, profile, status, tenant_id, created_at, updated_at) 
VALUES (
    gen_random_uuid(),
    'user@demo.tms-platform.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'user',
    '{"name": "Test User", "phone": "+1-555-0101"}'::jsonb,
    'active',
    '00000000-0000-0000-0000-000000000001'::uuid,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

