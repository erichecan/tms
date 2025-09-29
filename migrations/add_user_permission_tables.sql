-- 为用户权限和模板工作流创建必要的表
-- 创建时间: 2025-09-29 03:25:00

-- =====================================================
-- 用户角色和权限表
-- =====================================================

-- 租户用户表
CREATE TABLE IF NOT EXISTS public.tenant_users (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role varchar(20) NOT NULL CHECK (role IN ('SYSTEM_ADMIN', 'TENANT_ADMIN', 'OPERATOR', 'FINANCE', 'DRIVER')),
    status varchar(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    granted_permissions text[], -- 额外授予的权限列表
    assigned_at timestamp DEFAULT NOW(),
    assigned_by uuid,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    
    UNIQUE(tenant_id, user_id)
);

CREATE INDEX idx_tenant_users_tenant ON public.tenant_users(tenant_id);
CREATE INDEX idx_tenant_users_role ON public.tenant_users(role);
CREATE INDEX idx_tenant_users_user ON public.tenant_users(user_id);

-- 模板工作流状态表
CREATE TABLE IF NOT EXISTS public.template_workflow_states (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    template_id uuid NOT NULL REFERENCES public.pricing_templates(id) ON DELETE CASCADE,
    state varchar(20) NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'pending_approval', 'approved', 'published', 'archived')),
    requester_user_id uuid NOT NULL,
    approver_user_id uuid,
    rejection_reason text,
    approved_at timestamp,
    published_at timestamp,
    extra_data jsonb DEFAULT '{}',
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    
    UNIQUE(template_id) -- 每个模板只能有一个工作流状态
);

CREATE INDEX idx_template_workflow_template ON public.template_workflow_states(template_id);
CREATE INDEX idx_template_workflow_state ON public.template_workflow_states(state);
CREATE INDEX idx_template_workflow_approver ON public.template_workflow_states(approver_user_id);

-- 租户配置表（扩展原有的tenant_settings）
CREATE TABLE IF NOT EXISTS public.tenant_settings (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    key varchar(100) NOT NULL,
    value jsonb NOT NULL,
    description text,
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    
    UNIQUE(tenant_id, key)
);

CREATE INDEX idx_tenant_settings_tenant ON public.tenant_settings(tenant_id);

-- 审计日志表（扩展原有功能）
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid PRIMARY KEY DEFAULT public.uuid_generate_v4(),
    tenant_id uuid NOT NULL,
    entity_type varchar(255) NOT NULL, -- 如：'shipment', 'pricing_template', 'financial_record'
    entity_id uuid NOT NULL,
    field varchar(100),
    old_value text,
    new_value text,
    actor_id uuid,
    actor_type varchar(50), -- 'user', 'system', 'bulk_operator'
    actor_ip inet,
    user_agent text,
    operation varchar(50), -- 'create', 'update', 'delete', 'approve', 'reject', 'publish'
    extra_data jsonb DEFAULT '{}',
    timestamp timestamp DEFAULT NOW(),
    
    -- 索引建议
    INDEX idx_audit_created_on ON (created_at),
    INDEX idx_audit_entity ON (entity_type, entity_id),
    INDEX idx_audit_tenant ON (tenant_id),
    INDEX idx_audit_actor ON (actor_id),
    INDEX idx_audit_operation ON (operation)
);

CREATE INDEX idx_audit_logs_tenant_timestamp ON public.audit_logs(tenant_id, timestamp);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =====================================================
-- 插入默认租户设置
-- =====================================================

INSERT INTO public.tenant_settings (tenant_id, key, value, description) VALUES
-- 基础计费设置
('00000000-0000-0000-0000-000000000001', 'currency', '"CAD"', '默认币种'),
('00000000-0000-0000-0000-000000000001', 'baseRatePerKm', '2.5', '基础费率（加币/公里）'),
('00000000-0000-0000-0000-000000000001', 'defaultDriverCommissionRate', '0.3', '司机佣金比例'),
('00000000-0000-0000-0000-000000000001', 'maxDailyShipments', '50', '每日最大运单数限制'),

-- 模板限制设置
('00000000-0000-0000-0000-000000000001', 'pricingTemplateLimit', '20', '定价模板数量限制'),
('00000000-0000-0000-0000-000000000001', 'requireApprovalForTemplates', 'true', '模板是否需要审批'),
('00000000-0000-0000-0000-000000000001', 'allowConditionalRules', 'true', '是否允许条件规则'),

-- 财务设置
('00000000-0000-0000-0000-000000000001', 'receivableDefaultDueDays', '30', '应收账默认到期天数'),
('00000000-0000-0000-0000-000000000001', 'payableDefaultDueDays', '7', '应付账默认到期天数'),
('00000000-0000-0000-0000-000000000001', 'automaticFinancialGeneration', 'true', '自动生成财务记录'),

-- 通知设置
('00000000-0000-0000-0000-000000000001', 'notificationEmails', '["admin@example.com"]', '通知邮箱列表'),
('00000000-0000-0000-0000-000000000001', 'realTimeNotifications', 'true', '实时通知开关')
ON CONFLICT (tenant_id, key) DO NOTHING;

-- =====================================================
-- 创建租户管理员用户示例
-- =====================================================

-- 插入示例租户管理员用户
INSERT INTO public.tenant_users (tenant_id, user_id, role, granted_permissions) VALUES
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000100', 'TENANT_ADMIN', ARRAY['pricing:create', 'pricing:edit', 'pricing:publish', 'financial:view', 'report:export']),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'OPERATOR', ARRAY['shipment:manage', 'driver:assign']),
('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'FINANCE', ARRAY['financial:edit', 'report:export', 'audit:view'])
ON CONFLICT (tenant_id, user_id) DO NOTHING;

-- =====================================================
-- 更新现有pricing_templates表，添加状态字段
-- =====================================================

ALTER TABLE public.pricing_templates 
ADD COLUMN IF NOT EXISTS state varchar(20) DEFAULT 'draft' CHECK (state IN ('draft', 'pending_approval', 'approved', 'published', 'archived')),
ADD COLUMN IF NOT EXISTS created_by uuid,
ADD COLUMN IF NOT EXISTS published_by uuid,
ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

CREATE INDEX idx_pricing_templates_state ON public.pricing_templates(state);
CREATE INDEX idx_pricing_templates_tenant_state ON public.pricing_templates(tenant_id, state);

-- =====================================================
-- 创建权限检查函数
-- =====================================================

-- 检查用户是否有特定权限
CREATE OR REPLACE FUNCTION public.check_user_permission(
    p_user_id uuid,
    p_template_id uuid DEFAULT NULL,
    p_needed_permission varchar DEFAULT NULL
)
RETURNS boolean AS $$
DECLARE
    v_user_role varchar;
    v_tenant_id uuid;
    v_is_admin boolean := false;
    v_has_explicit_permission boolean := false;
BEGIN
    -- 获取用户角色和租户
    SELECT tu.role, tu.tenant_id, 'SYSTEM_ADMIN' = ANY(tu.granted_permissions) AS is_system_admin
    INTO v_user_role, v_tenant_id, v_is_admin
    FROM public.tenant_users tu 
    WHERE tu.user_id = p_user_id AND tu.status = 'active';
    
    -- 用户不存在
    IF v_user_role IS NULL THEN
        RETURN false;
    END IF;
    
    -- 系统管理员拥有所有权限
    IF v_user_role = 'SYSTEM_ADMIN' OR v_is_admin THEN
        RETURN true;
    END IF;
    
    -- 租户管理员权限检查
    IF v_user_role = 'TENANT_ADMIN' THEN
        -- 如果有specific permission要求，检查是否有该权限
        IF p_needed_permission IS NOT NULL THEN
            SELECT v_needed_permission = ANY(tu.granted_permissions)
            INTO v_has_explicit_permission
            FROM public.tenant_users tu
            WHERE tu.user_id = p_user_id;
            RETURN v_has_explicit_permission;
        END IF;
        RETURN true;
    END IF;
    
    -- 其他角色需要具体权限检查
    IF p_needed_permission IS NOT NULL THEN
        SELECT p_needed_permission = ANY(tu.granted_permissions)
        INTO v_has_explicit_permission
        FROM public.tenant_users tu
        WHERE tu.user_id = p_user_id;
        RETURN v_has_explicit_permission;
    END IF;
    
    RETURN false;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 创建审计触发器函数
-- =====================================================

-- 计费模板变更审计
CREATE OR REPLACE FUNCTION public.pricing_template_audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        INSERT INTO public.audit_logs (tenant_id, entity_type, entity_id, actor_id, actor_type, operation, old_value)
        VALUES (OLD.tenant_id, 'pricing_template', OLD.id, NULL, 'system', 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO public.audit_logs (tenant_id, entity_type, entity_id, actor_id, actor_type, operation, extra_data)
        VALUES (NEW.tenant_id, 'pricing_template', NEW.id, NULL, 'system', 'UPDATE', 
                jsonb_build_object(
                    'old_state', OLD.state,
                    'new_state', NEW.state,
                    'changed_fields', (SELECT jsonb_object_agg(key, value) FROM jsonb_each(to_jsonb(NEW)) WHERE key != 'updated_at')
                ));
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO public.audit_logs (tenant_id, entity_type, entity_id, actor_id, actor_type, operation, extra_data)
        VALUES (NEW.tenant_id, 'pricing_template', NEW.id, NEW.created_by, 'user', 'CREATE', 
                jsonb_build_object('template_name', NEW.name, 'scenario_type', NEW.businessScenario));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建审计触发器
DROP TRIGGER IF EXISTS pricing_template_audit ON public.pricing_templates;
CREATE TRIGGER pricing_template_audit
    AFTER INSERT OR UPDATE OR DELETE ON public.pricing_templates
    FOR EACH ROW EXECUTE FUNCTION public.pricing_template_audit_trigger();

-- =====================================================
-- 创建计费预览功能的函数（符合PRD要求）
-- =====================================================

CREATE OR REPLACE FUNCTION public.preview_pricing_calculation_v1(
    p_tenant_id uuid,
    p_scenario_type varchar DEFAULT 'WAREHOUSE_TRANSFER'
)
RETURNS jsonb AS $$
DECLARE
    v_result jsonb;
BEGIN
    -- 根据PRD要求，此功能当前返回"NOT_IMPLEMENTED"
    -- 但在基础设施准备好后，这里可以调用定价引擎进行计算
    
    RETURN jsonb_build_object(
        'status', 'NOT_IMPLEMENTED',
        'message', '定价预览功能暂未启用',
        'estimated_cost', NULL,
        'pricing_components', NULL,
        'note', '该功能将在规则引擎启用后提供实时计算'
    );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 创建财务报表生成函数
-- =====================================================

CREATE OR REPLACE FUNCTION public.generate_financial_summary(
    p_tenant_id uuid,
    p_start_date date DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date date DEFAULT CURRENT_DATE
)
RETURNS jsonb AS $$
DECLARE
    v_summary record;
BEGIN
    SELECT 
        COUNT(s.id) AS total_shipments,
        COUNT(fr.id) FILTER (WHERE fr.type = 'receivable') AS total_receivables,
        COUNT(fr.id) FILTER (WHERE fr.type = 'payable') AS total_payables,
        COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'receivable'), 0) AS total_receivable_amount,
        COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'payable'), 0) AS total_payable_amount,
        COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'receivable'), 0) - 
        COALESCE(SUM(fr.amount) FILTER (WHERE fr.type = 'payable'), 0) AS gross_profit
    INTO v_summary
    FROM public.shipments s
    LEFT JOIN public.financial_records fr ON s.id = fr.reference_id
    WHERE s.tenant_id = p_tenant_id
      AND DATE(s.created_at) BETWEEN p_start_date AND p_end_date;
    
    RETURN to_jsonb(v_summary);
END;
$$ LANGUAGE plpgsql;
