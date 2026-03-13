# TMS 报价管理产品需求说明书（完整版 PRD）

**文档版本**：v1.0  
**创建日期**：2026-03-13  
**状态**：待评审  

---

## 目录

1. [文档说明](#一文档说明)
2. [背景与目标](#二背景与目标)
3. [用户角色与权限](#三用户角色与权限)
4. [数据模型](#四数据模型)
5. [用户故事与验收标准](#五用户故事与验收标准)
6. [功能需求详述](#六功能需求详述)
7. [API 接口清单](#七api-接口清单)
8. [前端页面与交互](#八前端页面与交互)
9. [非功能需求](#九非功能需求)
10. [实现清单与迭代](#十实现清单与迭代)
11. [修订记录](#十一修订记录)

---

## 一、文档说明

### 1.1 适用范围

本 PRD 适用于 TMS 2.0 报价管理模块的产品与开发，涵盖：报价与客户整合、费率矩阵、全包价、增值服务、FC 目的地、司机工资标准、快速报价及权限控制。

### 1.2 参考资料

- 现有报价数据来源：Excel《合作单位报价卡》《2026年转运汇总表》已导入生产库。
- 现有代码：`apps/backend/src/routes/pricingRoutes.ts`、`PricingMatrixController.ts`；`apps/frontend/src/PricingManagement.tsx`；`docs/PRD_Pricing_Management.md`（概要版）。

---

## 二、背景与目标

### 2.1 背景

- 报价数据已从 Excel 导入，报价管理页面可展示与部分编辑。
- 业务要求**后续所有报价的维护均在系统内完成**，不再依赖 Excel。

### 2.2 目标

| 目标 | 说明 |
|------|------|
| 统一入口 | 报价的录入、修改、删除、查询均通过系统完成。 |
| 客户整合 | 报价与客户强关联；支持从客户维度管理报价；新客户可立即配置报价。 |
| 权限可控 | 按角色控制谁可查看、谁可编辑/删除报价，与现有用户/角色体系一致。 |
| 数据一致 | 报价被运单、集装箱、快速报价等引用，修改后全系统生效。 |

---

## 三、用户角色与权限

### 3.1 现有角色

| 角色 ID | 名称 | 说明 |
|---------|------|------|
| R-ADMIN | 管理员 | 全部功能 |
| R-DISPATCHER | 调度员 | 运单/客户查看、报价查看与快速报价 |
| R-DRIVER | 司机 | 运单查看 |

### 3.2 新增报价权限

| 权限 ID | 名称 | 说明 | 分配角色 |
|---------|------|------|----------|
| P-PRICING-VIEW | 查看报价 | 查看费率矩阵、全包价、增值服务、FC 目的地、司机工资、快速报价 | R-ADMIN, R-DISPATCHER |
| P-PRICING-MANAGE | 管理报价 | 新增/修改/删除（含归档）所有报价数据 | R-ADMIN |
| P-QUOTE-CALC | 使用快速报价 | 调用报价计算接口、使用报价结果 | R-ADMIN, R-DISPATCHER |

### 3.3 与现有权限关系

- **客户**：报价页客户列表依赖 **P-CUSTOMER-VIEW**；若在报价流程中「快速新建客户」需 **P-CUSTOMER-MANAGE**。
- **报价 API**：GET 类需 P-PRICING-VIEW；POST/PUT/DELETE 类需 P-PRICING-MANAGE；`POST /api/pricing/quote` 需 P-QUOTE-CALC 或 P-PRICING-VIEW。

---

## 四、数据模型

### 4.1 报价相关表

| 表名 | 说明 | 主要字段 |
|------|------|----------|
| pricing_matrices | 客户×目的仓×车型×板数档 费率 | customer_id, destination_code, vehicle_type, pallet_tier, base_price, per_pallet_price, effective_date, status |
| container_allins | 客户全包价 | customer_id, dest_group, container_type, price, includes, notes, effective_date, status |
| addon_services | 增值服务主数据 | code, name, name_en, unit, default_price, description, status |
| customer_addon_rates | 客户×增值服务 定制价 | customer_id, service_id, custom_price |
| driver_cost_baselines | 司机成本基线 | destination_code, vehicle_type, driver_pay, fuel_cost, waiting_* |
| fc_destinations | FC/目的仓主数据 | code, name, type, city, province, region, notes |
| quote_records | 报价记录（可选） | customer_id, destination_code, vehicle_type, base_amount, total_amount, created_at |

### 4.2 客户表

| 表名 | 说明 |
|------|------|
| customers | 客户主数据；报价均通过 customer_id 关联。 |

---

## 五、用户故事与验收标准

### 5.1 客户与报价整合

| ID | 用户故事 | 验收标准 |
|----|----------|----------|
| US-CR-1 | 作为调度员，我希望在报价管理页选择客户时看到与客户管理一致的列表，以便统一数据源。 | 报价管理页客户选择器调用 `/api/customers`，支持分页/搜索。 |
| US-CR-2 | 作为调度员，我希望在客户列表或客户详情中点击「该客户报价」直接进入报价并预选该客户。 | 客户管理页有「该客户报价」按钮，跳转至报价管理并带 `?customerId=xxx` 或等价方式预选客户。 |
| US-CR-3 | 作为管理员，我新建客户后能马上为该客户配置报价。 | 新建客户成功后有「去配置报价」入口，跳转报价管理并预选新客户。 |
| US-CR-4 | 作为调度员，在报价管理未选客户时看到按客户汇总的费率概览，选中客户后仅展示该客户的费率/全包价等。 | 未选客户：客户费率概览；选中客户：各 Tab 仅展示该客户数据。 |

### 5.2 费率矩阵

| ID | 用户故事 | 验收标准 |
|----|----------|----------|
| US-PM-1 | 作为管理员，我能按客户+目的仓+车型+板数档新增一条费率。 | 有「添加费率」表单，必填项校验，保存后调用 `POST /api/pricing/matrices` 并刷新列表。 |
| US-PM-2 | 作为管理员，我能编辑已有费率的 base_price、per_pallet_price。 | 每条费率行有「编辑」按钮，打开表单可修改并保存。 |
| US-PM-3 | 作为管理员，我能归档某条费率（软删除）。 | 有「归档」按钮，二次确认后调用 `DELETE /api/pricing/matrices/:id`，列表默认不显示已归档；可选「显示已归档」。 |
| US-PM-4 | 作为管理员，我能批量导入某客户的费率。 | 支持 CSV/粘贴或文件上传，调用 `POST /api/pricing/matrices/batch`，单次建议 ≤500 条。 |

### 5.3 全包价 / 增值服务 / FC / 司机工资

| ID | 用户故事 | 验收标准 |
|----|----------|----------|
| US-CA-1 | 作为管理员，我能为客户新增、编辑、归档全包价。 | 全包价 Tab 有列表、新增、编辑、归档，与费率矩阵交互一致。 |
| US-AD-1 | 作为管理员，我能维护增值服务主数据（新增/编辑/停用）。 | 增值服务 Tab 有列表与表单，调用 addons 的 GET/POST。 |
| US-AD-2 | 作为管理员，我能为选中客户设置增值服务定制价。 | 客户增值价列表可增删改，调用 addon-rates 接口。 |
| US-FC-1 | 作为管理员，我能维护 FC 目的地（列表、新增、编辑）。 | FC 目的地 Tab 有列表与表单；删除时若有引用则仅停用或提示。 |
| US-DC-1 | 作为管理员，我能维护司机工资标准（列表、新增、编辑、归档）。 | 司机工资 Tab 有完整 CRUD，调用 driver-costs 接口。 |

### 5.4 快速报价与权限

| ID | 用户故事 | 验收标准 |
|----|----------|----------|
| US-Q-1 | 作为调度员，我能使用快速报价计算并看到结果。 | 选择客户、目的仓、车型、板数（及增值服务），调用 `POST /api/pricing/quote`，展示 base/addon/total/driver/margin。 |
| US-PERM-1 | 仅有 P-PRICING-VIEW 的用户不能编辑或删除报价。 | 前端隐藏添加/编辑/删除/归档按钮；后端写接口校验 P-PRICING-MANAGE 返回 403。 |
| US-PERM-2 | 无 P-PRICING-VIEW 的用户不能进入报价管理。 | 导航不展示「报价管理」或进入后提示无权限并跳转。 |

---

## 六、功能需求详述

### 6.1 客户与报价整合（CR）

- **CR-1**：报价管理页客户选择器与客户管理一致（`/api/customers`），支持按名称/公司名搜索。
- **CR-2**：客户管理页（列表行或详情）提供「该客户报价」入口，跳转报价管理并带 `customerId` 查询参数。
- **CR-3**：新建客户成功后，在成功提示或详情页提供「去配置报价」入口，跳转报价管理并预选该客户。
- **CR-4**：报价管理各 Tab 仅展示/操作当前选中客户的数据；未选客户时展示客户费率概览（现有 getAllMatrices 汇总）。

### 6.2 费率矩阵（PM）

- **PM-1**：录入：客户 + 目的仓（fc_destinations）+ 车型（枚举）+ 板数档（枚举）+ base_price、per_pallet_price，可选 effective_date。
- **PM-2**：修改：行级编辑，保存更新 base_price、per_pallet_price、effective_date。
- **PM-3**：删除：软删除（status=ARCHIVED）；列表默认 ACTIVE，可选「显示已归档」。
- **PM-4**：批量：按客户批量导入，格式与 `POST /api/pricing/matrices/batch` 一致，单次上限建议 500。
- **PM-5**：校验：同一客户+目的仓+车型+板数档仅一条 ACTIVE；前端提交前可做存在性校验并提示。

### 6.3 全包价（CA）

- **CA-1**：按客户 + dest_group + container_type 新增，含 price、includes、notes、effective_date。
- **CA-2**：列表支持编辑、归档（软删除）。
- **CA-3**：与费率矩阵共用「当前选中客户」。

### 6.4 增值服务（AD）

- **AD-1**：增值服务主数据：列表、新增、编辑、停用（status），字段 code, name, name_en, unit, default_price, description。
- **AD-2**：客户增值价：在选中客户下展示并维护 customer_addon_rates。
- **AD-3**：报价计算时未配置定制价则使用 addon_services.default_price。

### 6.5 FC 目的地（FC）

- **FC-1**：列表，支持按 code/name/region 搜索。
- **FC-2**：新增/编辑：code, name, type, address, city, province, postal_code, region, notes。
- **FC-3**：若被引用则不允许物理删除，仅停用或提示。

### 6.6 司机工资标准（DC）

- **DC-1**：按目的仓、车型列表。
- **DC-2**：新增/编辑：destination_code, vehicle_type, driver_pay, fuel_cost, waiting_free_hours, waiting_rate_hourly, notes。
- **DC-3**：支持归档（软删除）。

### 6.7 快速报价（Q）

- **Q-1**：选择客户、目的仓、车型、板数、增值服务，调用 `POST /api/pricing/quote`，展示结果。
- **Q-2**（可选）：将结果写入 quote_records，并可选历史列表。

### 6.8 通用交互（UX）

- **UX-1**：所有新增/编辑表单必填项校验、统一错误提示；保存成功后刷新列表或关闭弹窗。
- **UX-2**：删除/归档需二次确认。
- **UX-3**：大列表支持分页或虚拟滚动。
- **UX-4**：主导航保留「报价管理」；客户管理提供「该客户报价」快捷入口。

---

## 七、API 接口清单

### 7.1 报价路由前缀

- 基础路径：`/api/pricing`
- 鉴权：所有接口需 `verifyToken`；读写权限见下。

### 7.2 接口与权限

| 方法 | 路径 | 说明 | 所需权限 |
|------|------|------|----------|
| POST | /calculate | 旧版计价（Legacy） | 同 pricing |
| GET | /matrices | 客户费率汇总（getAllMatrices） | P-PRICING-VIEW |
| GET | /matrices/:customerId | 按客户取费率 | P-PRICING-VIEW |
| POST | /matrices | 新增/更新单条费率 | P-PRICING-MANAGE |
| POST | /matrices/batch | 批量 upsert 费率 | P-PRICING-MANAGE |
| DELETE | /matrices/:id | 归档费率 | P-PRICING-MANAGE |
| GET | /addons | 增值服务列表 | P-PRICING-VIEW |
| POST | /addons | 新增/更新增值服务 | P-PRICING-MANAGE |
| GET | /addon-rates/:customerId | 客户增值价 | P-PRICING-VIEW |
| POST | /addon-rates | 新增/更新客户增值价 | P-PRICING-MANAGE |
| GET | /driver-costs | 司机成本基线列表 | P-PRICING-VIEW |
| POST | /driver-costs | 新增/更新司机成本 | P-PRICING-MANAGE |
| GET | /fc-destinations | FC 目的地列表 | P-PRICING-VIEW |
| POST | /fc-destinations | 新增/更新 FC 目的地 | P-PRICING-MANAGE |
| GET | /container-allins | 全包价列表（可按 customerId 过滤） | P-PRICING-VIEW |
| POST | /container-allins | 新增/更新全包价 | P-PRICING-MANAGE |
| POST | /quote | 快速报价计算 | P-QUOTE-CALC 或 P-PRICING-VIEW |

### 7.3 请求/响应示例（概要）

- **POST /matrices**：body `{ customer_id, destination_code, vehicle_type, pallet_tier, base_price, per_pallet_price [, effective_date ] }`，返回单条 matrix。
- **POST /matrices/batch**：body `{ customer_id, rates: [{ destination_code, vehicle_type, pallet_tier, base_price, per_pallet_price }] }`。
- **DELETE /matrices/:id**：204 No Content。
- **POST /quote**：body 含 customer_id, destination_code, vehicle_type, pallet_count 等，返回 base_amount, addon_amount, total_amount, driver_cost, margin 等。

---

## 八、前端页面与交互

### 8.1 报价管理页（PricingManagement）

- **路由**：`/pricing`（或现有配置）；支持查询参数 `customerId` 预选客户。
- **布局**：顶部客户选择器（必选）；Tab：费率矩阵、增值服务、司机工资、全包价、快速报价、FC 目的地。
- **权限**：
  - 无 P-PRICING-VIEW：不展示菜单或进入后无权限提示。
  - 仅 P-PRICING-VIEW：只读，隐藏所有「添加」「编辑」「删除」「归档」按钮。
  - P-PRICING-MANAGE：展示全部操作。
- **费率矩阵 Tab**：客户费率概览（未选客户）或按目的仓分组的费率列表（选中客户）；每条有「编辑」「归档」；有「添加费率」；可选「显示已归档」。
- **全包价 / 增值服务 / FC / 司机工资 Tab**：各有列表 + 新增/编辑/删除或归档，与现有或扩展 API 一致。
- **快速报价 Tab**：表单选择客户、目的仓、车型、板数、增值服务，提交后展示计算结果。

### 8.2 客户管理页（CustomerManagement）

- 列表每行或详情页增加按钮「该客户报价」：跳转 `/pricing?customerId=当前客户ID`。
- 新建客户成功后的提示或详情中增加「去配置报价」：跳转 `/pricing?customerId=新客户ID`。

### 8.3 导航

- 主导航「报价管理」：仅当用户具备 P-PRICING-VIEW 时展示（或进入后做权限校验）。

---

## 九、非功能需求

### 9.1 性能

- 费率矩阵按客户加载，单客户条数 >200 时考虑分页或虚拟列表。
- 批量导入单次 ≤500 条，超出分批。

### 9.2 安全

- 所有报价写操作需 P-PRICING-MANAGE；后端路由级校验，无权限返回 403。

### 9.3 审计（可选）

- 关键操作可记录操作人、时间、变更前后快照。

---

## 十、实现清单与迭代

### 迭代 1：权限与客户整合（P0）

- [ ] 后端：migrate 新增 P-PRICING-VIEW、P-PRICING-MANAGE、P-QUOTE-CALC；role_permissions 分配给 R-ADMIN、R-DISPATCHER。
- [ ] 后端：pricingRoutes 上 GET 用 P-PRICING-VIEW，POST/PUT/DELETE 用 P-PRICING-MANAGE，/quote 用 P-QUOTE-CALC 或 P-PRICING-VIEW。
- [ ] 前端：报价管理页与导航根据 hasPermission('P-PRICING-VIEW')、hasPermission('P-PRICING-MANAGE') 控制展示与按钮。
- [ ] 前端：客户管理页「该客户报价」「新建客户后去配置报价」入口，跳转带 customerId。

### 迭代 2：费率矩阵完善（P0）

- [ ] 前端：费率矩阵行级「编辑」「归档」按钮；编辑弹窗与保存；归档二次确认；「显示已归档」开关，请求时带 status 参数（若 API 支持）或前端过滤。

### 迭代 3：全包价 / 增值服务 / FC / 司机工资 CRUD（P0）

- [ ] 前端：各 Tab 补齐列表、新增、编辑、删除/归档 UI，与现有 API 对接；表单校验与错误提示。

### 迭代 4：批量导入与体验（P1）

- [ ] 前端：费率矩阵 CSV/粘贴批量导入，调用 matrices/batch；单次上限 500。
- [ ] 列表分页或虚拟滚动（按需）。

---

## 十一、修订记录

| 版本 | 日期 | 修订内容 |
|------|------|----------|
| v1.0 | 2026-03-13 | 完整版 PRD：用户故事、验收标准、API 清单、前端说明、实现清单。 |

---

*本文档为报价管理完整产品需求说明，实现时以当前代码与数据库为准，按迭代交付。*
