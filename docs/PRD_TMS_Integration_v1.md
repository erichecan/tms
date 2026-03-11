# TMS 一体化升级 —— 产品需求文档 (PRD)

**版本**: v1.0  
**日期**: 2026-03-10  
**状态**: 待审阅  

---

## 1. 背景与目标

### 1.1 业务背景

APONY（小马物流）是一家加拿大本土的 FBA 头程 + 末端派送物流公司。当前核心业务流程分散在两张 Excel 中：

- **转运汇总表**：管理集装箱到港 → 拆柜 → FBA派送的全流程
- **合作单位报价卡**：管理 40+ 客户的差异化报价（51个工作表）

现有 TMS 系统已实现运单/车队/财务基础功能，但与上述核心业务数据**完全断裂**。

### 1.2 项目目标

将三大系统完整打通，实现：

1. **消除手工台账**：集装箱/货物追踪全部在线化
2. **报价自动化**：创建运单时自动匹配客户报价，零手工查询
3. **薪酬自动化**：派送完成自动计算司机工资
4. **利润可视化**：每单毛利实时可查

---

## 2. 用户角色与故事

### 2.1 角色定义

| 角色 | 说明 | 代表用户 |
|------|------|---------|
| **操作员** | 日常录入、拆柜、排预约 | Mason, Stella |
| **调度员** | 指派司机车辆、管理运单 | Tom |
| **司机** | 执行派送、上传回执 | LH, LW, AD, AF |
| **财务** | 对账、开票、薪酬核算 | Stella |
| **管理层** | 看利润、调报价 | Mark, Eric |

### 2.2 核心用户故事

#### 转运管理

| US# | 作为 | 我希望 | 以便 |
|-----|------|--------|------|
| T-01 | 操作员 | 录入新到港集装箱信息 | 开始跟踪拆柜进度 |
| T-02 | 操作员 | 逐条录入柜内货物明细(SKU/FBA/件数/方数/目的仓) | 分拣后准确记录 |
| T-03 | 操作员 | 批量导入 Excel 转运数据 | 快速录入历史和大批量数据 |
| T-04 | 操作员 | 为每条货物安排派送预约(时间+司机代码) | 协调 FBA 入仓 |
| T-05 | 操作员 | 标记预约被拒收并重新预约 | 处理异常流程 |
| T-06 | 操作员 | 从货物明细一键生成运单 | 无需重复录入 |
| T-07 | 管理层 | 查看某个柜的整体拆柜/派送进度 | 监控作业效率 |

#### 报价管理

| US# | 作为 | 我希望 | 以便 |
|-----|------|--------|------|
| P-01 | 管理层 | 维护每个客户的专属费率矩阵(目的仓×车型×板数) | 差异化定价 |
| P-02 | 管理层 | 维护增值服务目录和客户定制费率 | 透明计费 |
| P-03 | 操作员 | 创建运单时系统自动查询报价并填入预估价 | 减少人工查询 |
| P-04 | 管理层 | 批量导入现有 Excel 报价卡 | 快速迁移已有数据 |
| P-05 | 管理层 | 维护司机工资标准(目的仓×车型) | 自动计算薪酬 |
| P-06 | 管理层 | 设定最低毛利率，系统自动告警 | 利润管控 |

#### 现有模块增强

| US# | 作为 | 我希望 | 以便 |
|-----|------|--------|------|
| E-01 | 调度员 | 录入/管理车辆时指定车型(26ft/53ft) | 匹配报价维度 |
| E-02 | 调度员 | 司机信息包含短代码(LH/AD) | 快速识别和排班 |
| E-03 | 调度员 | 指派运单时按车型筛选可用车辆 | 精确匹配 |
| E-04 | 调度员 | 指派运单后自动计算司机薪酬(查工资标准表) | 替代手工计算 |
| E-05 | 财务 | 运单完成后自动生成应收(客户报价)和应付(司机薪酬) | 自动化对账 |
| E-06 | 管理层 | 看到每单的毛利(应收-应付-增值服务成本) | 利润分析 |

---

## 3. 功能规格

### 3.1 模块一：转运管理

#### 3.1.1 集装箱管理

**集装箱列表页**
- 表格展示：柜号、仓库、进仓方式、到仓日、状态、货物数、总方数
- 筛选：按状态(NEW/UNLOADING/SORTING/DELIVERING/COMPLETED)、日期范围
- 搜索：柜号模糊匹配
- 操作：新增、查看详情、导入Excel

**集装箱状态机**
```
NEW → UNLOADING → SORTING → DELIVERING → COMPLETED
                                ↑
                      如果有拒收重新预约
```

**集装箱详情页**
- 顶部卡片：柜号、仓库、到仓日、进度条(已派送/总数)
- 货物明细表格(可编辑)
- 派送预约时间线
- 费用/开票状态
- 「批量生成运单」按钮

#### 3.1.2 货物明细 (ContainerItem)

字段列表：

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sku | varchar(50) | 否 | 分货SKU编号 |
| fba_shipment_id | varchar(50) | 是 | FBA Shipment ID |
| po_list | varchar(50) | 否 | PO 号 |
| piece_count | integer | 是 | 件/箱数 |
| cbm | numeric | 否 | 体积(立方米) |
| dest_warehouse | varchar(20) | 是 | 目的仓代码(YYZ3等) |
| delivery_address | text | 否 | 非FC时的完整地址 |
| pallet_count | varchar(10) | 否 | 托数(如"5P") |
| notes | text | 否 | 备注 |
| waybill_id | FK | 否 | 关联运单(生成后) |

#### 3.1.3 派送预约 (DeliveryAppointment)

| 字段 | 类型 | 说明 |
|------|------|------|
| appointment_time | timestamp | 预约时间 |
| operator_code | varchar(10) | 操作员/司机代码 |
| attempt_number | integer | 第几次预约(1/2/3) |
| status | enum | SCHEDULED/CONFIRMED/REJECTED/COMPLETED |
| rejection_reason | text | 拒收原因 |

#### 3.1.4 一键生成运单

当操作员点击「生成运单」时，系统自动：
1. 用 `customer_id`（柜归属客户）+ `dest_warehouse` + 推断车型 + `pallet_count` 查 `pricing_matrices`
2. 填充 `waybill.destination` = 目的仓, `waybill.pallet_count` = 托数
3. 填充 `waybill.price_estimated` = 匹配到的报价 + 增值服务费
4. 填充 `waybill.container_item_id` = 关联源货物
5. 状态设为 NEW，等待调度员指派

---

### 3.2 模块二：报价管理

#### 3.2.1 费率矩阵管理

**列表页**
- 按客户分组显示各客户的费率表数量
- 搜索：客户名
- 操作：新增客户费率、编辑、复制(基于模板)、归档

**矩阵编辑页**（核心页面）

可视化表格编辑器，行=目的仓，列=车型×板数阶梯：

```
客户：Eynex                    生效日期：2024-01-01
─────────────────────────────────────────────────
目的仓    │ 26ft(1-4P) │ 26ft(5-13P) │ 散板/P  │ 53ft
──────────┼────────────┼─────────────┼─────────┼───────
YYZ3/4/7  │ $180       │ +$10/板     │ $30     │ $345
YYZ9      │ $160       │ +$10/板     │ $30     │ $315
YOO1      │ $180       │ +$10/板     │ $40     │ $345
YHM1      │ $400       │ -           │ $50     │ $490
YXU1      │ $520       │ -           │ $50     │ $720
YGK1      │ $500       │ -           │ $50     │ $700
YOW1/3    │ $1,150     │ -           │ $80     │ $1,350
──────────┴────────────┴─────────────┴─────────┴───────
PA(GTA)   │ $180 首板 + $10/加板
PA(远程)  │ $3.0-3.2/km
─────────────────────────────────────────────────
```

#### 3.2.2 增值服务管理

**服务目录页**
- 列表：服务名、代码、默认单价、计费单位
- 15+ 项标准服务预置(贴标、换板、尾板、缠膜等)

**客户定制费率**
- 为特定客户覆盖默认费率
- 例：Eynex 的贴标费 $0.25/张，而 JWAPWH 的是 $0.45/张

#### 3.2.3 司机工资标准

可视化表格，行=目的仓，列=车型(26ft/53ft)：

```
目的仓      │ 26ft │ 53ft │ 等候费
────────────┼──────┼──────┼────────
YYZ3/4/7/9  │ $80  │ $120 │ 免1+$25/hr
YOO1        │ $80  │ $120 │ 免1+$25/hr
YHM1        │ $120 │ $150 │ 免1+$25/hr
YGK1        │ $160 │ $200 │ 免1+$25/hr
YXU1        │ $180 │ $220 │ 免1+$25/hr
YOW1/3      │ $350 │ $400 │ 免2+$25/hr
PA(范围内)  │ $60  │ $100 │ 免1+$25/hr
────────────┴──────┴──────┴────────
```

#### 3.2.4 报价引擎（自动计算）

输入参数：
- `customer_id`：客户
- `destination_code`：目的仓
- `vehicle_type`：车型
- `pallet_count`：板数
- `addons[]`：增值服务列表（含数量）

输出：
```json
{
  "base_price": 180,
  "pallet_surcharge": 10,
  "addon_total": 42.5,
  "addon_breakdown": [
    {"code": "LABELING", "qty": 120, "unit_price": 0.25, "total": 30},
    {"code": "TAILGATE", "qty": 1, "unit_price": 10, "total": 10},
    {"code": "SORTING", "qty": 10, "unit_price": 0.25, "total": 2.5}
  ],
  "grand_total": 232.5,
  "driver_cost": 80,
  "gross_margin": 152.5,
  "margin_rate": "65.6%"
}
```

#### 3.2.5 整柜全包价

- 按客户+目的地组合维护全包价
- 支持体积占比分摊算法
- 例：总60CBM，YYZ占20CBM → YYZ费用 = 20/60 × $1,600

---

### 3.3 模块三：现有模块增强

#### 3.3.1 车辆管理增加车型

- 新增字段：`vehicle_type`（STRAIGHT_26 / STRAIGHT_28 / TRAILER_53）
- 车辆创建/编辑表单增加车型下拉
- 运单指派时按车型筛选可用车辆
- 列表页增加车型列和筛选

#### 3.3.2 司机管理增加代码

- 新增字段：`code`（短代码如 LH/AD）、`hourly_rate`、`default_vehicle_id`
- 司机创建/编辑表单增加代码输入
- 运单指派界面显示司机代码
- 转运管理中预约直接选司机代码

#### 3.3.3 运单创建自动查报价

**现有行为**：`price_estimated` 手动输入  
**新增行为**：

1. 用户选择 `customer_id` + `destination`(从 FC 目的地字典选) + `pallet_count`
2. 系统自动调用报价引擎 API
3. 自动填充 `price_estimated` 和报价明细
4. 用户可手动调整最终价格
5. 增值服务通过复选框勾选，自动叠加费用

#### 3.3.4 运单指派自动计算薪酬

**现有行为**：通过 RuleEngine 计算  
**增强行为**：

1. 指派时根据 `destination` + `vehicle_type` 查 `driver_cost_baselines`
2. 自动填入 `driver_pay_calculated`
3. 如有等候费(超时)，自动按费率叠加
4. 毛利 = `price_estimated` - `driver_pay_total` 实时显示

---

## 4. 数据模型

### 4.1 新增表

#### containers（集装箱主表）
```sql
CREATE TABLE containers (
  id VARCHAR(50) PRIMARY KEY,
  container_no VARCHAR(50) NOT NULL,       -- 柜号
  warehouse_id VARCHAR(10),                -- 仓库编号
  entry_method VARCHAR(20),                -- '整柜' / '散货入库'
  arrival_date DATE,                       -- 到仓日
  unload_status TEXT,                      -- 卸柜情况
  customer_id VARCHAR(50),                 -- 归属客户
  total_cbm NUMERIC(10,3) DEFAULT 0,      -- 总方数(自动汇总)
  total_pieces INTEGER DEFAULT 0,          -- 总件数(自动汇总)
  status VARCHAR(20) DEFAULT 'NEW',        -- NEW/UNLOADING/SORTING/DELIVERING/COMPLETED
  billing_amount NUMERIC(10,2),            -- 费用
  billing_status VARCHAR(20),              -- 未开票/已开票
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### container_items（货物明细）
```sql
CREATE TABLE container_items (
  id VARCHAR(50) PRIMARY KEY,
  container_id VARCHAR(50) NOT NULL REFERENCES containers(id),
  sku VARCHAR(100),                        -- 分货SKU
  fba_shipment_id VARCHAR(50),             -- FBA Shipment ID
  po_list VARCHAR(50),                     -- PO号
  piece_count INTEGER DEFAULT 0,           -- 件/箱数
  cbm NUMERIC(10,5),                       -- 方数
  dest_warehouse VARCHAR(20),              -- 目的仓代码
  delivery_address TEXT,                   -- 非FC时完整地址
  pallet_count VARCHAR(10),                -- 托数(如"5P")
  pallet_count_num INTEGER,                -- 纯数字托数(计算用)
  notes TEXT,
  waybill_id VARCHAR(50),                  -- 关联运单(生成后填入)
  status VARCHAR(20) DEFAULT 'PENDING',    -- PENDING/APPOINTED/DISPATCHED/DELIVERED
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### delivery_appointments（派送预约）
```sql
CREATE TABLE delivery_appointments (
  id VARCHAR(50) PRIMARY KEY,
  container_item_id VARCHAR(50) NOT NULL REFERENCES container_items(id),
  appointment_time TIMESTAMP,              -- 预约时间
  operator_code VARCHAR(10),               -- 操作员代码(LH/AD/AF)
  attempt_number INTEGER DEFAULT 1,        -- 第几次预约
  status VARCHAR(20) DEFAULT 'SCHEDULED',  -- SCHEDULED/CONFIRMED/REJECTED/COMPLETED
  rejection_reason TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### fc_destinations（FC目的地字典）
```sql
CREATE TABLE fc_destinations (
  code VARCHAR(20) PRIMARY KEY,            -- 'YYZ3'
  name VARCHAR(100),                       -- 'Amazon YYZ3'
  type VARCHAR(20) DEFAULT 'AMAZON_FC',    -- AMAZON_FC/PRIVATE/WALMART
  address TEXT,
  city VARCHAR(50),
  province VARCHAR(10),
  postal_code VARCHAR(10),
  region VARCHAR(20),                      -- GTA/EASTERN_ON/OTTAWA
  notes TEXT
);
```

#### pricing_matrices（客户费率矩阵）
```sql
CREATE TABLE pricing_matrices (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  destination_code VARCHAR(20) NOT NULL,   -- 'YYZ3', 'YHM1'
  vehicle_type VARCHAR(20) NOT NULL,       -- 'STRAIGHT_26', 'TRAILER_53'
  pallet_tier VARCHAR(20) NOT NULL,        -- '1-4', '5-13', '14-28', 'LOOSE'
  base_price NUMERIC(10,2),                -- 基础价
  per_pallet_price NUMERIC(10,2),          -- 加板单价(5-13板阶梯)
  effective_date DATE,
  expiry_date DATE,
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(customer_id, destination_code, vehicle_type, pallet_tier, status)
);
```

#### addon_services（增值服务目录）
```sql
CREATE TABLE addon_services (
  id VARCHAR(50) PRIMARY KEY,
  code VARCHAR(30) UNIQUE NOT NULL,        -- 'LABELING', 'TAILGATE'
  name VARCHAR(100) NOT NULL,              -- '贴标费'
  name_en VARCHAR(100),                    -- 'Labeling'
  unit VARCHAR(20) NOT NULL,               -- 'PER_PIECE', 'PER_PALLET', 'PER_TICKET'
  default_price NUMERIC(10,2) NOT NULL,
  description TEXT,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);
```

#### customer_addon_rates（客户增值服务费率）
```sql
CREATE TABLE customer_addon_rates (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  service_id VARCHAR(50) NOT NULL REFERENCES addon_services(id),
  custom_price NUMERIC(10,2) NOT NULL,     -- 客户定制价格
  conditions JSONB,                        -- 特殊条件
  UNIQUE(customer_id, service_id)
);
```

#### container_allins（整柜全包价）
```sql
CREATE TABLE container_allins (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  dest_group VARCHAR(50) NOT NULL,         -- 'YYZ_ALL', 'YHM1'
  container_type VARCHAR(20),              -- '40GP', '40HQ', '45HQ'
  price NUMERIC(10,2) NOT NULL,
  includes JSONB,                          -- 包含哪些服务
  notes TEXT,
  effective_date DATE,
  status VARCHAR(20) DEFAULT 'ACTIVE'
);
```

#### driver_cost_baselines（司机工资标准）
```sql
CREATE TABLE driver_cost_baselines (
  id VARCHAR(50) PRIMARY KEY,
  destination_code VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20) NOT NULL,       -- 'STRAIGHT_26' / 'TRAILER_53'
  driver_pay NUMERIC(10,2) NOT NULL,       -- 司机实际工资
  fuel_cost NUMERIC(10,2) DEFAULT 0,       -- 燃油成本估计
  waiting_free_hours NUMERIC(3,1) DEFAULT 1, -- 免费等待时间(小时)
  waiting_rate_hourly NUMERIC(10,2) DEFAULT 25, -- 等候费率($/hr)
  total_cost NUMERIC(10,2),                -- 总成本
  notes TEXT,
  UNIQUE(destination_code, vehicle_type)
);
```

#### market_benchmarks（市场比价数据）
```sql
CREATE TABLE market_benchmarks (
  id VARCHAR(50) PRIMARY KEY,
  destination_code VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(20),
  pallet_tier VARCHAR(20),
  min_price NUMERIC(10,2),
  max_price NUMERIC(10,2),
  avg_price NUMERIC(10,2),
  source VARCHAR(50),                      -- 数据来源
  collected_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP                     -- 过期时间(30天)
);
```

#### quote_records（报价记录）
```sql
CREATE TABLE quote_records (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50),
  quoted_by VARCHAR(50),
  destination_code VARCHAR(20),
  vehicle_type VARCHAR(20),
  pallet_count INTEGER,
  base_amount NUMERIC(10,2),
  addon_amount NUMERIC(10,2),
  total_amount NUMERIC(10,2),
  driver_cost NUMERIC(10,2),
  margin_amount NUMERIC(10,2),
  margin_rate NUMERIC(5,2),
  pricing_snapshot JSONB,                  -- 报价时的费率快照
  status VARCHAR(20) DEFAULT 'DRAFT',      -- DRAFT/SENT/ACCEPTED/EXPIRED
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 4.2 现有表变更

```sql
-- vehicles 表
ALTER TABLE vehicles 
  ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(20) DEFAULT 'STRAIGHT_26',
  ADD COLUMN IF NOT EXISTS max_pallets INTEGER DEFAULT 13;

-- drivers 表
ALTER TABLE drivers 
  ADD COLUMN IF NOT EXISTS code VARCHAR(10),
  ADD COLUMN IF NOT EXISTS hourly_rate NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS default_vehicle_id VARCHAR(50);

-- waybills 表
ALTER TABLE waybills 
  ADD COLUMN IF NOT EXISTS container_item_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS pricing_matrix_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS addon_services JSONB,
  ADD COLUMN IF NOT EXISTS driver_cost NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS gross_margin NUMERIC(10,2);
```

---

## 5. API 设计

### 5.1 转运管理 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/containers` | 集装箱列表(分页/筛选) |
| POST | `/api/containers` | 新增集装箱 |
| GET | `/api/containers/:id` | 集装箱详情(含货物明细) |
| PUT | `/api/containers/:id` | 更新集装箱 |
| POST | `/api/containers/:id/items` | 添加货物明细 |
| PUT | `/api/container-items/:id` | 更新货物明细 |
| DELETE | `/api/container-items/:id` | 删除货物明细 |
| POST | `/api/container-items/:id/appointments` | 创建派送预约 |
| PUT | `/api/appointments/:id` | 更新预约(含拒收) |
| POST | `/api/containers/:id/generate-waybills` | 批量生成运单 |
| POST | `/api/containers/import` | Excel 导入 |

### 5.2 报价管理 API

| 方法 | 路由 | 说明 |
|------|------|------|
| GET | `/api/pricing/matrices` | 费率矩阵列表 |
| GET | `/api/pricing/matrices/:customerId` | 客户费率详情 |
| POST | `/api/pricing/matrices` | 新增/更新费率 |
| DELETE | `/api/pricing/matrices/:id` | 删除费率 |
| GET | `/api/pricing/addons` | 增值服务目录 |
| POST | `/api/pricing/addons` | 新增增值服务 |
| GET | `/api/pricing/driver-costs` | 司机工资标准 |
| POST | `/api/pricing/driver-costs` | 新增/更新工资标准 |
| POST | `/api/pricing/quote` | **报价引擎**：计算报价 |
| POST | `/api/pricing/import` | Excel 报价卡导入 |
| GET | `/api/pricing/fc-destinations` | FC 目的地列表 |

### 5.3 增强 API

| 方法 | 路由 | 变更 |
|------|------|------|
| POST/PUT | `/api/vehicles` | 支持 `vehicle_type` 字段 |
| POST/PUT | `/api/drivers` | 支持 `code`, `hourly_rate` 字段 |
| POST | `/api/waybills` | 自动调用报价引擎 |
| POST | `/api/waybills/:id/assign` | 自动查司机工资标准 |
| GET | `/api/analytics/profit` | **新增**：利润分析 |

---

## 6. 验收标准

### 6.1 转运管理

- [ ] 能创建新集装箱并录入至少 5 条货物明细
- [ ] 能为货物创建最多 3 次预约（含拒收重新预约）
- [ ] 能一键从货物明细批量生成运单
- [ ] 生成的运单自动包含目的仓、托数和预估报价
- [ ] 能通过 Excel 导入转运数据

### 6.2 报价管理

- [ ] 能为客户维护完整的费率矩阵(8个FC × 3个车型/板数阶梯)
- [ ] 报价引擎 API 能根据输入参数返回精确报价+明细
- [ ] 增值服务能按客户定制费率
- [ ] 能通过 Excel 导入现有报价卡

### 6.3 现有模块增强

- [ ] 车辆管理能按 26ft/53ft 分类显示和筛选
- [ ] 司机管理能显示短代码(LH/AD)
- [ ] 运单创建时，选择客户+目的仓后自动填入报价
- [ ] 运单指派后，司机薪酬自动按工资标准表计算
- [ ] 运单完成后，利润(=客户报价 - 司机薪酬)实时可查
