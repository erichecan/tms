# TMS 报价管理产品需求文档（PRD）

**文档版本**：v1.0  
**创建日期**：2026-03-13  
**状态**：待评审  

---

## 一、背景与目标

### 1.1 背景

- 当前报价数据已从 Excel（《合作单位报价卡》《2026年转运汇总表》）导入生产库，报价管理页面可展示数据。
- 业务希望**后续所有报价的维护与管理均在 TMS 系统内完成**，不再依赖 Excel 线下维护。

### 1.2 目标

- **统一入口**：报价的录入、修改、删除、查询均通过系统完成。
- **与客户体系整合**：报价与「客户」强关联，支持从客户维度管理报价；新客户可立即配置报价。
- **权限可控**：按角色控制谁可查看、谁可编辑/删除报价，与现有用户/角色体系一致。
- **数据一致**：报价数据被运单、集装箱、快速报价等模块引用，需保证修改后全系统生效。

---

## 二、用户角色与权限

### 2.1 现有角色（沿用）

| 角色 ID   | 名称     | 说明           |
|-----------|----------|----------------|
| R-ADMIN   | 管理员   | 全部功能       |
| R-DISPATCHER | 调度员 | 运单/客户查看等 |
| R-DRIVER  | 司机     | 运单查看等     |

### 2.2 报价相关权限（新增建议）

在现有权限表中新增以下权限，并挂到对应角色：

| 权限 ID         | 名称           | 说明                     | 建议角色     |
|-----------------|----------------|--------------------------|--------------|
| P-PRICING-VIEW  | 查看报价       | 查看费率矩阵、全包价、增值服务、FC 目的地、司机工资、快速报价 | R-ADMIN, R-DISPATCHER |
| P-PRICING-MANAGE| 管理报价       | 新增/修改/删除（含归档） 所有报价数据 | R-ADMIN      |
| P-QUOTE-CALC    | 使用快速报价   | 调用报价计算接口、使用报价结果       | R-ADMIN, R-DISPATCHER |

**与现有权限的关系**：

- **客户**：报价管理中的「客户」列表与筛选依赖现有 **P-CUSTOMER-VIEW**；新建报价时选择客户需 **P-CUSTOMER-VIEW**；若允许在报价流程中「快速新建客户」则需 **P-CUSTOMER-MANAGE**。
- **报价 API**：建议 `/api/pricing/*` 在现有 `verifyToken` 基础上，按接口区分：
  - 只读接口（如 GET matrices、fc-destinations、addons 等）：校验 **P-PRICING-VIEW**。
  - 写接口（POST/PUT/DELETE matrices、allins、addons 等）：校验 **P-PRICING-MANAGE**。
  - 快速报价 POST `/api/pricing/quote`：校验 **P-QUOTE-CALC** 或 **P-PRICING-VIEW**。

---

## 三、数据模型与现有能力

### 3.1 报价相关表（已存在）

| 表名                   | 说明                     | 主要字段 |
|------------------------|--------------------------|----------|
| pricing_matrices       | 客户×目的仓×车型×板数档 的费率 | customer_id, destination_code, vehicle_type, pallet_tier, base_price, per_pallet_price, effective_date, status |
| container_allins       | 客户全包价（按目的组/柜型）   | customer_id, dest_group, container_type, price, includes, notes, effective_date, status |
| addon_services         | 增值服务主数据（全局）       | code, name, name_en, unit, default_price, description |
| customer_addon_rates   | 客户×增值服务 定制价        | customer_id, service_id, custom_price |
| driver_cost_baselines  | 司机成本基线（目的仓×车型）  | destination_code, vehicle_type, driver_pay, fuel_cost, waiting_* |
| fc_destinations        | FC/目的仓主数据            | code, name, type, city, province, region, notes |
| quote_records          | 报价记录（可选，用于历史）   | customer_id, destination_code, vehicle_type, base_amount, total_amount, status, created_at |

### 3.2 客户表（已存在，与报价整合）

| 表名       | 说明     | 与报价的关系 |
|------------|----------|--------------|
| customers  | 客户主数据 | 所有报价均通过 customer_id 关联；列表/筛选/新建报价均依赖客户。 |

---

## 四、功能需求

### 4.1 客户与报价的整合

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| CR-1    | 报价管理页：客户选择器与「客户管理」中的客户列表一致（调用现有 `/api/customers`），支持按名称/公司名搜索。 | P0 |
| CR-2    | 客户管理页：在客户列表或客户详情中提供「该客户报价」入口，跳转到报价管理并自动带上当前客户筛选（或直接展示该客户费率/全包价）。 | P0 |
| CR-3    | 新建客户后：在成功提示或详情页提供「去配置报价」入口，跳转报价管理并预选该客户。 | P1 |
| CR-4    | 报价管理各 Tab（费率矩阵、全包价、客户增值服务等）仅展示/操作当前选中客户的数据；未选客户时展示「按客户汇总」视图（现有客户费率概览）。 | P0 |

### 4.2 费率矩阵（pricing_matrices）

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| PM-1    | **录入**：支持按「客户 + 目的仓 + 车型 + 板数档」新增一条费率（base_price、per_pallet_price，可选 effective_date）。目的仓来自 fc_destinations，车型/板数档为系统枚举。 | P0 |
| PM-2    | **修改**：列表或卡片中每条费率可编辑，保存后更新 base_price、per_pallet_price、effective_date。 | P0 |
| PM-3    | **删除**：支持单条归档（软删除，status=ARCHIVED）；列表默认只显示 ACTIVE，可选「显示已归档」。 | P0 |
| PM-4    | **批量**：支持按客户批量导入/覆盖费率（如 Excel 粘贴或 CSV），格式与现有 `POST /api/pricing/matrices/batch` 一致。 | P1 |
| PM-5    | **校验**：同一客户 + 目的仓 + 车型 + 板数档 仅允许一条 ACTIVE 记录；前端提交前做存在性校验并提示。 | P1 |

### 4.3 全包价（container_allins）

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| CA-1    | **录入**：按客户 + 目的组（dest_group）+ 柜型（container_type）新增全包价，含 price、includes（JSON 或文本）、notes、effective_date。 | P0 |
| CA-2    | **修改/删除**：列表支持编辑、归档（软删除）；逻辑与费率矩阵一致。 | P0 |
| CA-3    | 列表支持按客户筛选，与费率矩阵共用「当前选中客户」。 | P0 |

### 4.4 增值服务与客户增值价

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| AD-1    | **增值服务主数据**：列表展示所有 addon_services；支持新增/编辑/停用（status），字段：code, name, name_en, unit, default_price, description。 | P0 |
| AD-2    | **客户增值价**：在选中客户下展示该客户在 customer_addon_rates 中的定制价；支持按服务选择并填写 custom_price，保存后写入 customer_addon_rates。 | P0 |
| AD-3    | 未配置定制价的客户，报价计算时使用 addon_services.default_price。 | P0 |

### 4.5 FC 目的地（fc_destinations）

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| FC-1    | **列表**：展示所有 FC 目的地，支持按 code/name/region 搜索。 | P0 |
| FC-2    | **新增/编辑**：支持新增或按 code 编辑 name, type, address, city, province, postal_code, region, notes。 | P0 |
| FC-3    | **删除**：若被 pricing_matrices 或其它报价数据引用，不允许物理删除，仅允许停用或标注「停用」状态（若表有 status 字段）。 | P1 |

### 4.6 司机工资标准（driver_cost_baselines）

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| DC-1    | **列表**：按目的仓、车型展示司机成本基线。 | P0 |
| DC-2    | **新增/编辑**：支持按 destination_code + vehicle_type 新增或编辑 driver_pay, fuel_cost, waiting_free_hours, waiting_rate_hourly, notes。 | P0 |
| DC-3    | **删除/归档**：支持软删除或归档，避免被报价/运单引用时误删。 | P1 |

### 4.7 快速报价（Quote）

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| Q-1     | **计算**：选择客户、目的仓、车型、板数（及可选增值服务），调用 `POST /api/pricing/quote`，展示 base_amount、addon_amount、total_amount、driver_cost、margin 等。 | P0 |
| Q-2     | **记录**（可选）：将每次报价结果写入 quote_records，便于历史查询与对账。 | P2 |

### 4.8 通用交互与体验

| 需求 ID | 描述 | 优先级 |
|---------|------|--------|
| UX-1    | 所有「新增/编辑」表单必填项校验、错误提示统一；保存成功后刷新列表或关闭弹窗。 | P0 |
| UX-2    | 删除/归档操作需二次确认（如「确定归档该费率？」）。 | P0 |
| UX-3    | 列表支持分页或虚拟滚动，避免单页数据过大。 | P1 |
| UX-4    | 报价管理入口：主导航保留「报价管理」；客户详情/列表内提供「该客户报价」快捷入口。 | P0 |

---

## 五、权限控制实现要点

### 5.1 后端

- 在权限表中新增 **P-PRICING-VIEW**、**P-PRICING-MANAGE**、**P-QUOTE-CALC**，并分配给 R-ADMIN、R-DISPATCHER（按上表）。
- `/api/pricing` 下：
  - GET 类：校验 `verifyToken` + 具备 P-PRICING-VIEW。
  - POST/PUT/DELETE 类：校验 `verifyToken` + 具备 P-PRICING-MANAGE。
  - `POST /api/pricing/quote`：校验 P-QUOTE-CALC 或 P-PRICING-VIEW。
- 客户相关：继续使用现有 P-CUSTOMER-VIEW / P-CUSTOMER-MANAGE；报价页拉取客户列表时沿用现有 `/api/customers` 及权限。

### 5.2 前端

- 根据当前用户权限动态展示：
  - 仅 P-PRICING-VIEW：只读，隐藏「添加」「编辑」「删除」「归档」等按钮。
  - P-PRICING-MANAGE：展示全部操作。
- 无 P-PRICING-VIEW 时，导航不展示「报价管理」或进入后提示无权限。

---

## 六、与现有功能的衔接

### 6.1 已具备能力（可复用）

- 报价管理页多 Tab：费率矩阵、增值服务、司机工资、全包价、快速报价、FC 目的地。
- 客户下拉与客户费率概览（getAllMatrices）。
- 费率矩阵的「添加费率」弹窗、按客户加载费率、保存（upsertMatrix）。
- 后端：getMatricesByCustomer、getAllMatrices、upsertMatrix、batchUpsertMatrix、deleteMatrix；addons、customer addon rates、driver costs、fc-destinations、container_allins 的 GET/POST；calculateQuote。

### 6.2 需要补齐的能力（建议实现顺序）

1. **权限**：新增 P-PRICING-* 权限与路由级校验；前端按权限控制按钮与菜单。
2. **客户整合**：客户管理页增加「该客户报价」入口；新建客户后「去配置报价」入口。
3. **费率矩阵**：行级「编辑」「归档」按钮与弹窗；可选「显示已归档」。
4. **全包价 / 增值服务 / FC / 司机工资**：补齐各 Tab 内的新增、编辑、删除/归档入口与表单（部分已有 API，仅缺前端表单或列表操作）。
5. **批量导入**：费率矩阵支持 CSV/Excel 粘贴导入（调用现有 batch 接口或扩展）。
6. **快速报价**：可选将结果写入 quote_records，并增加简单历史列表（P2）。

---

## 七、非功能需求

### 7.1 性能与数据

- 费率矩阵按客户分页或按需加载，单客户费率条数较多时（如 >200）考虑分页或虚拟列表。
- 批量导入时单次请求条数上限建议 500，超出可分批。

### 7.2 审计与追溯（可选）

- 关键操作（新建/修改/归档报价）可记录操作人、时间、变更前后快照到审计表或日志，便于后续对账与争议处理。

### 7.3 生效日期与历史

- pricing_matrices、container_allins 等已支持 effective_date；若业务需要「生效期」与「过期」，可在前端展示 effective_date / expiry_date，并在计算报价时按日期过滤。

---

## 八、验收标准（概要）

- 管理员可对任意客户完成：费率矩阵、全包价、客户增值价的完整增删改查（含归档）。
- 管理员可管理：FC 目的地、增值服务主数据、司机工资标准。
- 调度员可查看所有报价数据，可使用快速报价，但不能编辑/删除。
- 客户管理页可进入「该客户报价」并预选客户；新建客户后可一键进入报价配置。
- 无 P-PRICING-* 权限的用户无法访问报价管理或仅能访问被明确放行的接口。

---

## 九、文档修订记录

| 版本 | 日期       | 修订内容     |
|------|------------|--------------|
| v1.0 | 2026-03-13 | 初稿：目标、角色权限、数据模型、功能需求、与现有能力衔接、非功能与验收概要。 |

---

*本文档为报价管理整体规划，具体接口与字段以当前代码与数据库为准，实现时可按优先级分迭代交付。*
