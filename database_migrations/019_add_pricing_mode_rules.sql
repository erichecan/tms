-- 添加计费模式规则（距离计费和时间计费）
-- 创建时间: 2025-12-05 13:00:00
-- 用途: 为所有租户添加距离计费和时间计费规则，支持按距离或时间计算运费

-- 为所有现有租户创建距离计费规则
INSERT INTO rules (tenant_id, name, description, type, priority, conditions, actions, status, created_at, updated_at)
SELECT 
  id as tenant_id,
  '距离计费规则 - 基础费率' as name,
  '按距离计费：基础费率 $5/公里，超过25公里后每20公里增加 $20' as description,
  'pricing' as type,
  100 as priority,
  '[
    {"fact": "type", "operator": "equal", "value": "distance"},
    {"fact": "distanceKm", "operator": "greaterThan", "value": 0}
  ]'::jsonb as conditions,
  '[
    {"type": "setBaseRate", "params": {"amount": 180, "baseRate": 180, "ruleId": "distance-based-base", "ruleName": "距离计费-基础费率"}}
  ]'::jsonb as actions,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM rules 
  WHERE rules.tenant_id = tenants.id 
  AND rules.name = '距离计费规则 - 基础费率'
)
ON CONFLICT DO NOTHING;

-- 为所有现有租户创建时间计费规则
INSERT INTO rules (tenant_id, name, description, type, priority, conditions, actions, status, created_at, updated_at)
SELECT 
  id as tenant_id,
  '时间计费规则 - 基础费率' as name,
  '按时间计费：基础费率 $150/小时，超过1小时后每30分钟增加 $30' as description,
  'pricing' as type,
  100 as priority,
  '[
    {"fact": "type", "operator": "equal", "value": "time"},
    {"fact": "serviceMinutes", "operator": "greaterThan", "value": 0}
  ]'::jsonb as conditions,
  '[
    {"type": "setBaseRate", "params": {"amount": 150, "baseRate": 150, "ruleId": "time-based-base", "ruleName": "时间计费-基础费率"}}
  ]'::jsonb as actions,
  'active' as status,
  NOW() as created_at,
  NOW() as updated_at
FROM tenants
WHERE NOT EXISTS (
  SELECT 1 FROM rules 
  WHERE rules.tenant_id = tenants.id 
  AND rules.name = '时间计费规则 - 基础费率'
)
ON CONFLICT DO NOTHING;

-- 添加注释
COMMENT ON TABLE rules IS '规则表：存储计费规则和薪酬规则';
COMMENT ON COLUMN rules.conditions IS '规则条件 JSONB 数组，每个条件包含 fact, operator, value';
COMMENT ON COLUMN rules.actions IS '规则动作 JSONB 数组，每个动作包含 type 和 params';

