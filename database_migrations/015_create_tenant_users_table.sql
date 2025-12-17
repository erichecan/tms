-- 创建 tenant_users 表
-- 创建时间: 2025-12-11T14:40:00Z
-- 作用: 创建租户用户表，用于存储用户的租户角色和权限

-- =====================================================
-- 创建 tenant_users 表
-- =====================================================

CREATE TABLE IF NOT EXISTS public.tenant_users (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'FINANCE', 'DRIVER', 'dispatcher', 'admin', 'manager', 'ceo', 'general_manager', 'fleet_manager', 'customer')),
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    granted_permissions text[], -- 额外授予的权限列表
    assigned_at timestamp DEFAULT NOW(),
    assigned_by uuid,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON public.tenant_users(role);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON public.tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_status ON public.tenant_users(status);

-- 添加外键约束（如果 users 表存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- 添加外键约束
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'tenant_users_user_id_fkey'
    ) THEN
      ALTER TABLE public.tenant_users
      ADD CONSTRAINT tenant_users_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 添加外键约束（如果 tenants 表存在）
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenants'
  ) THEN
    -- 添加外键约束
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'tenant_users_tenant_id_fkey'
    ) THEN
      ALTER TABLE public.tenant_users
      ADD CONSTRAINT tenant_users_tenant_id_fkey
      FOREIGN KEY (tenant_id) REFERENCES public.tenants(id) ON DELETE CASCADE;
    END IF;
  END IF;
END $$;

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.update_tenant_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tenant_users_updated_at ON public.tenant_users;
CREATE TRIGGER trigger_update_tenant_users_updated_at
    BEFORE UPDATE ON public.tenant_users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_tenant_users_updated_at();

-- 验证表创建
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'tenant_users'
  ) THEN
    RAISE NOTICE '✓ tenant_users 表创建成功';
  ELSE
    RAISE EXCEPTION 'tenant_users 表创建失败';
  END IF;
END $$;
