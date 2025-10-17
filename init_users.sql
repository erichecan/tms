-- 创建默认管理员用户
INSERT INTO users (id, email, password_hash, name, role, status, created_at, updated_at) 
VALUES (
    gen_random_uuid(),
    'admin@demo.tms-platform.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    '系统管理员',
    'admin',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 创建测试用户
INSERT INTO users (id, email, password_hash, name, role, status, created_at, updated_at) 
VALUES (
    gen_random_uuid(),
    'user@demo.tms-platform.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    '测试用户',
    'user',
    'active',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;
