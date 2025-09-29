
# 智能物流运营平台 (TMS SaaS) - 数据库设计文档

**版本:** 2.1 (与 PRD/TDD 同步)
**最后更新:** 2025-09-29 09:12:36
**数据库类型:** PostgreSQL

## 1. 设计理念

本数据库设计严格遵循 `packages/shared-types/src/index.ts` 中定义的TypeScript接口, 确保数据模型与应用程序的类型定义保持一致. 设计的核心是支持多租户、结构化存储业务数据, 并为复杂查询和分析提供基础.

## 2. 核心表设计

*(注: 表名和字段名是基于代码逻辑推断的蛇形命名法 `snake_case`, 实际可能由ORM决定)*

### `tenants` (租户表)

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | 租户唯一标识 |
| `name` | VARCHAR(255) | NOT NULL | 租户公司名称 |
| `schema_name`| VARCHAR(63) | NOT NULL, UNIQUE | 数据库Schema名, 用于数据隔离 |
| `status` | VARCHAR(20) | | 租户状态 (`active`, `inactive`) |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

### `users` (用户表)

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | 用户唯一标识 |
| `tenant_id` | UUID | FK -> tenants(id) | 所属租户ID |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE(tenant_id, email) | 登录邮箱, 在同一租户下唯一 |
| `password_hash`| VARCHAR(255) | NOT NULL | 加密后的密码 |
| `role` | VARCHAR(50) | NOT NULL | 用户角色 (`admin`, `operator`, `driver`) |
| `status` | VARCHAR(20) | NOT NULL | 用户状态 (`active`, `inactive`) |
| `last_login_at`| TIMESTAMPTZ | | 最后登录时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

### `rules` (规则表)

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | 规则唯一标识 |
| `tenant_id` | UUID | FK -> tenants(id) | 所属租户ID |
| `name` | VARCHAR(255) | NOT NULL | 规则名称 |
| `type` | VARCHAR(50) | NOT NULL | 规则类型 (`pricing`, `payroll`) |
| `priority` | INTEGER | NOT NULL, DEFAULT 0 | 执行优先级, 数字越小优先级越高 |
| `conditions` | JSONB | NOT NULL | 规则的条件 (符合json-rules-engine) |
| `actions` | JSONB | NOT NULL | 规则的动作 |
| `status` | VARCHAR(20) | NOT NULL | 规则状态 (`active`, `inactive`) |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

### `shipments` (运单表)

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | 运单唯一标识 |
| `tenant_id` | UUID | FK -> tenants(id) | 所属租户ID |
| `shipment_number`| VARCHAR(50) | NOT NULL, UNIQUE(tenant_id, shipment_number) | 运单号, 在同一租户下唯一 |
| `customer_id` | UUID | FK -> customers(id) | 客户ID |
| `driver_id` | UUID | FK -> drivers(id), NULLABLE | 司机ID |
| `status` | VARCHAR(50) | NOT NULL | 运单状态 (来自`ShipmentStatus`枚举) |
| `pickup_address` | JSONB | NOT NULL | 取货地址对象 (符合`Address`接口) |
| `delivery_address`| JSONB | NOT NULL | 送货地址对象 (符合`Address`接口) |
| `cargo_info` | JSONB | NOT NULL | 货物信息对象 (符合`CargoInfo`接口) |
| `estimated_cost`| DECIMAL(12,2) | NOT NULL | 预估费用 |
| `actual_cost` | DECIMAL(12,2) | NULLABLE | 最终实际费用 |
| `additional_fees`| JSONB | | 附加费用数组 (符合`AdditionalFee[]`) |
| `applied_rules`| JSONB | | 命中规则的ID数组 `string[]` |
| `timeline` | JSONB | | 运单生命周期时间戳 (符合`ShipmentTimeline`) |
| `notes` | TEXT | | 备注 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

### `financial_records` (财务记录表)

| 字段名 | 数据类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PRIMARY KEY | 记录唯一标识 |
| `tenant_id` | UUID | FK -> tenants(id) | 所属租户ID |
| `type` | VARCHAR(50) | NOT NULL | 记录类型 (`receivable`, `payable`) |
| `reference_id` | UUID | NOT NULL | 关联对象ID (运单ID, 司机ID, 客户ID) |
| `description` | VARCHAR(255) | | 描述 (如 "运单TMS...应收款") |
| `amount` | DECIMAL(12,2) | NOT NULL | 金额 |
| `status` | VARCHAR(20) | NOT NULL | 状态 (`pending`, `paid`, `overdue`) |
| `due_date` | DATE | NULLABLE | 支付截止日期 |
| `paid_at` | TIMESTAMPTZ | NULLABLE | 实际支付时间 |
| `created_at` | TIMESTAMPTZ | NOT NULL | 创建时间 |
| `updated_at` | TIMESTAMPTZ | NOT NULL | 更新时间 |

## 3. 索引策略

为保证查询性能, 需要在以下关键字段上创建索引:

- **`shipments`表:** `tenant_id`, `customer_id`, `driver_id`, `status`, `created_at`.
- **`users`表:** `tenant_id`, `email`.
- **`financial_records`表:** `tenant_id`, `reference_id`, `status`, `due_date`.
- **`rules`表:** `tenant_id`, `type`, `status`.

---

<!-- Added by assistant @ 2025-09-29 09:12:36 10:52:00 -->
## 4. 运单相关表 DDL 草案（与 PRD 第24节一致）

方言：PostgreSQL；金额 NUMERIC(12,2)；时间 TIMESTAMPTZ。

```sql
-- 仅节选核心字段，完整见 PRD 24
CREATE TABLE shipment (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  shipment_no VARCHAR(20) NOT NULL UNIQUE,
  status VARCHAR(20) NOT NULL,
  driver_id UUID,
  estimated_cost NUMERIC(12,2),
  final_cost NUMERIC(12,2),
  cost_currency CHAR(3) DEFAULT 'CNY',
  pricing_components JSONB DEFAULT '[]',
  pricing_rule_trace JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_shipment_tenant_status_created ON shipment(tenant_id, status, created_at DESC);

CREATE TABLE shipment_timeline (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  event_type VARCHAR(32) NOT NULL,
  from_status VARCHAR(20),
  to_status VARCHAR(20),
  actor_type VARCHAR(16) NOT NULL,
  actor_id UUID,
  ts TIMESTAMPTZ NOT NULL DEFAULT now(),
  extra JSONB
);
CREATE INDEX idx_timeline_shipment_ts ON shipment_timeline(shipment_id, ts DESC);

CREATE TABLE financial_record (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'CNY',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_financial_shipment_type ON financial_record(shipment_id, type);
```

一致性与幂等：
- 状态+时间线同事务提交；完成前校验 `final_cost`。
- 财务记录唯一约束 `(shipment_id, type)` 确保幂等。

---

<!-- Added by assistant @ 2025-09-29 09:12:36 10:52:00 -->
## 5. 约束与数据质量

- 金额与单位：NUMERIC 精度统一；服务层控制银行家舍入。
- JSONB 字段：对 `pricing_components`、`pricing_rule_trace` 进行 JSON Schema 校验（应用层）。
- 外键策略：子表 `ON DELETE CASCADE`，便于删除测试数据；生产慎用。

