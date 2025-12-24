ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS level VARCHAR(50) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS billing_info JSONB DEFAULT '{}'::JSONB,
ADD COLUMN IF NOT EXISTS default_pickup_address JSONB,
ADD COLUMN IF NOT EXISTS default_delivery_address JSONB;

-- 为重要字段增加索引以优化查询
CREATE INDEX IF NOT EXISTS idx_customers_level ON customers(level);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- 补充注释
COMMENT ON COLUMN customers.level IS '客户等级 (standard, premium, vip)';
COMMENT ON COLUMN customers.billing_info IS '账单与税务信息';
COMMENT ON COLUMN customers.phone IS '联系电话';
COMMENT ON COLUMN customers.email IS '电子邮箱';
COMMENT ON COLUMN customers.default_pickup_address IS '默认取货地址';
COMMENT ON COLUMN customers.default_delivery_address IS '默认送货地址';
