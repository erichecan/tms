-- 创建询价请求相关表
-- 创建时间: 2025-12-05 12:00:00
-- 作用: 支持客户下单询价功能，包括询价记录和跟进记录

-- =====================================================
-- 1. 创建询价请求表 (quote_requests)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_requests (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    code varchar(50) NOT NULL UNIQUE, -- 询价编号：QR-YYYYMMDD-XXXX
    tenant_id uuid, -- 租户ID（可选，支持多租户）
    customer_id uuid, -- 客户ID（如果客户已登录）
    
    -- 联系方式
    company varchar(255), -- 公司名（可选）
    contact_name varchar(100) NOT NULL, -- 联系人姓名
    email varchar(255) NOT NULL, -- 邮箱
    phone varchar(50), -- 电话（可选）
    
    -- 货物信息
    origin text NOT NULL, -- 起始地
    destination text NOT NULL, -- 目的地
    ship_date date NOT NULL, -- 预计发货日期
    weight_kg decimal(10, 2) NOT NULL, -- 重量（kg）
    volume decimal(10, 2), -- 体积（可选）
    pieces integer, -- 件数（可选）
    services jsonb NOT NULL DEFAULT '[]', -- 服务类型：['FTL','LTL','AIR','SEA','EXPRESS','COLD']
    note text, -- 备注（最多500字）
    
    -- 状态与分配
    status varchar(20) NOT NULL DEFAULT 'open', -- 状态：open/pending/contacted/closed
    assignee_id uuid, -- 分配负责人ID
    
    -- 时间戳
    created_at timestamp DEFAULT NOW(),
    updated_at timestamp DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT quote_requests_status_check CHECK (status IN ('open', 'pending', 'contacted', 'closed'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_quote_requests_code ON public.quote_requests(code);
CREATE INDEX IF NOT EXISTS idx_quote_requests_tenant_id ON public.quote_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_customer_id ON public.quote_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_status ON public.quote_requests(status);
CREATE INDEX IF NOT EXISTS idx_quote_requests_created_at ON public.quote_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_requests_assignee_id ON public.quote_requests(assignee_id);
CREATE INDEX IF NOT EXISTS idx_quote_requests_email ON public.quote_requests(email);

-- =====================================================
-- 2. 创建询价跟进记录表 (quote_request_followups)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.quote_request_followups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    quote_request_id uuid NOT NULL REFERENCES public.quote_requests(id) ON DELETE CASCADE,
    assignee_id uuid, -- 跟进人ID
    note text NOT NULL, -- 跟进备注
    next_action_at timestamp, -- 下次跟进时间
    created_at timestamp DEFAULT NOW(),
    
    -- 索引
    CONSTRAINT quote_request_followups_quote_request_id_fkey FOREIGN KEY (quote_request_id) 
        REFERENCES public.quote_requests(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_quote_request_followups_quote_request_id ON public.quote_request_followups(quote_request_id);
CREATE INDEX IF NOT EXISTS idx_quote_request_followups_assignee_id ON public.quote_request_followups(assignee_id);
CREATE INDEX IF NOT EXISTS idx_quote_request_followups_created_at ON public.quote_request_followups(created_at DESC);

-- =====================================================
-- 3. 创建序列用于生成询价编号（如果使用序列方式）
-- =====================================================
-- 注意：也可以使用日期+计数的方式生成编号，这里提供序列作为备选
CREATE SEQUENCE IF NOT EXISTS public.quote_request_sequence
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- =====================================================
-- 4. 创建更新 updated_at 的触发器函数
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_quote_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quote_requests_updated_at
    BEFORE UPDATE ON public.quote_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_quote_requests_updated_at();

-- =====================================================
-- 5. 验证表创建
-- =====================================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quote_requests'
    ) THEN
        RAISE NOTICE '✓ quote_requests 表创建成功';
    ELSE
        RAISE WARNING '✗ quote_requests 表创建失败';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quote_request_followups'
    ) THEN
        RAISE NOTICE '✓ quote_request_followups 表创建成功';
    ELSE
        RAISE WARNING '✗ quote_request_followups 表创建失败';
    END IF;
END $$;

