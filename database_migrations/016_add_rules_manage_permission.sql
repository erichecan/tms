-- 添加规则管理权限 (rules:manage) 并给 dispatcher 角色赋权
-- 创建时间: 2025-12-10T20:00:00Z
-- 作用: 为规则管理功能添加权限支持，并给调度员角色授予该权限

-- =====================================================
-- 1. 更新 tenant_users 表，为 dispatcher 角色用户添加 rules:manage 权限
-- =====================================================

-- 检查 tenant_users 表是否存在，如果存在则更新权限
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_users'
  ) THEN
    -- 为所有 dispatcher 角色的用户添加 rules:manage 权限
    UPDATE public.tenant_users
    SET granted_permissions = array_append(
      COALESCE(granted_permissions, ARRAY[]::text[]),
      'rules:manage'
    )
    WHERE role = 'dispatcher'
      AND ('rules:manage' = ANY(granted_permissions)) IS NOT TRUE;
    
    RAISE NOTICE 'Updated tenant_users table with rules:manage permission for dispatcher role';
  ELSE
    RAISE NOTICE 'tenant_users table does not exist, skipping tenant_users update';
  END IF;
END $$;

-- 如果用户没有 tenant_users 记录，需要根据 users 表的 role 创建
-- 这里假设需要为 dispatcher 角色的用户创建 tenant_users 记录
-- 注意：这需要根据实际的数据结构进行调整
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_users'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    INSERT INTO public.tenant_users (tenant_id, user_id, role, granted_permissions, status)
    SELECT 
      u.tenant_id,
      u.id,
      'dispatcher',
      ARRAY['rules:manage']::text[],
      'active'
    FROM public.users u
    WHERE u.role = 'dispatcher'
      AND NOT EXISTS (
        SELECT 1 FROM public.tenant_users tu 
        WHERE tu.user_id = u.id AND tu.tenant_id = u.tenant_id
      )
    ON CONFLICT (tenant_id, user_id) DO UPDATE
    SET granted_permissions = array_append(
      COALESCE(tenant_users.granted_permissions, ARRAY[]::text[]),
      'rules:manage'
    )
    WHERE ('rules:manage' = ANY(tenant_users.granted_permissions)) IS NOT TRUE;
    
    RAISE NOTICE 'Created tenant_users records for dispatcher users if needed';
  ELSE
    RAISE NOTICE 'tenant_users or users table does not exist, skipping user record creation';
  END IF;
END $$;

-- =====================================================
-- 2. 如果存在独立的权限表，插入 rules:manage 权限
-- =====================================================

-- 检查是否存在 permissions 表，如果存在则插入权限
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'permissions'
  ) THEN
    -- 插入 rules:manage 权限（如果不存在）
    INSERT INTO public.permissions (code, name, description, type, created_at, updated_at)
    VALUES (
      'rules:manage',
      '规则管理',
      '管理计费规则和司机薪酬规则',
      'action',
      NOW(),
      NOW()
    )
    ON CONFLICT (code) DO NOTHING;
    
    -- 如果存在 role_permissions 表，为 dispatcher 角色添加权限
    IF EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'role_permissions'
    ) THEN
      INSERT INTO public.role_permissions (role_code, permission_code, created_at)
      SELECT 'dispatcher', 'rules:manage', NOW()
      WHERE NOT EXISTS (
        SELECT 1 FROM public.role_permissions 
        WHERE role_code = 'dispatcher' AND permission_code = 'rules:manage'
      );
    END IF;
  END IF;
END $$;

-- =====================================================
-- 3. 验证迁移结果
-- =====================================================

-- 验证 dispatcher 角色用户是否拥有 rules:manage 权限
DO $$
DECLARE
  dispatcher_count INTEGER;
  has_permission_count INTEGER;
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_users'
  ) THEN
    SELECT COUNT(*) INTO dispatcher_count
    FROM public.tenant_users
    WHERE role = 'dispatcher';
    
    SELECT COUNT(*) INTO has_permission_count
    FROM public.tenant_users
    WHERE role = 'dispatcher'
      AND 'rules:manage' = ANY(granted_permissions);
    
    RAISE NOTICE 'Dispatcher 用户总数: %', dispatcher_count;
    RAISE NOTICE '拥有 rules:manage 权限的 dispatcher 用户数: %', has_permission_count;
    
    IF dispatcher_count > 0 AND has_permission_count = dispatcher_count THEN
      RAISE NOTICE '✓ 所有 dispatcher 用户已成功授予 rules:manage 权限';
    ELSIF dispatcher_count = 0 THEN
      RAISE NOTICE '⚠ 未找到 dispatcher 角色用户，权限将在用户创建时自动授予';
    ELSE
      RAISE WARNING '⚠ 部分 dispatcher 用户可能未成功授予权限';
    END IF;
  ELSE
    RAISE NOTICE 'tenant_users 表不存在，跳过验证步骤';
  END IF;
END $$;
