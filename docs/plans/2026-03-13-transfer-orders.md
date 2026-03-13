# Transfer Order v0.1 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 在现有 TMS 上新增“转运单（头）+ 明细 + HOLD 管理 + 从明细生成运单 + 报价预览”的完整 v0.1 能力，使运营从“Excel 录入一行转运记录”迁移为在系统内录入和编排。参考业务与测试理解见 `docs/testing-business-flow-notes.md`，产品行为详见 `docs/transfer-order-prd.md`。

**Architecture:** 后端基于 Node.js/TypeScript + Express + PostgreSQL，在现有 `waybills` / `trips` 等模型之上新增 `transfer_orders` 与 `transfer_order_lines` 两张表，以及对应的 Service / Controller / Routes 与定价预览 API，并在创建运单时写入来源引用。前端基于 React + Vite 的后台管理界面，在现有报价与运单管理 UI 旁新增“转运单列表 + 详情/编辑页 + 明细表 + HOLD 操作 + 从勾选明细生成运单 + 调用报价预览”的页面与组件。整体采用 TDD 风格，优先补齐关键 API 的集成测试，确保“转运单 → 运单 → Trip → 财务”闭环可在测试中跑通。

**Tech Stack:** Node.js, TypeScript, Express, PostgreSQL, React, Vite, REST APIs, Jest/集成测试（沿用后端现有测试框架），浏览器端基于现有后台 UI 组件体系。参考 `apps/backend` 与 `apps/frontend` 现有实现风格。

---

### Task 1: 阅读 PRD 与测试理解，对齐范围

**Files:**
- Read: `docs/transfer-order-prd.md`
- Read: `docs/testing-business-flow-notes.md`

**Step 1: 通读 PRD 关键章节**
- 重点关注：2.2 本期范围、4.1/4.2 字段定义、5 关键业务流程、6 报价卡集成、8 异常与边界。

**Step 2: 通读测试理解文档**
- 重点关注：4 “业务起点”统一理解、5/6 中对“转运单 → 运单 → Trip → 财务”闭环的锚点。

**Step 3: 在开发笔记中记录统一理解**
- 记录一句话目标、关键实体（Transfer Order / Line / HOLD / Waybill 来源）、最小联动范围。

**How to verify**
- 能用自己的话复述 v0.1 的范围，并准确指出后端/前端各自要完成的最小闭环。

---

### Task 2: 设计后端数据库表结构（纸面/文档设计）

**Files:**
- Modify: `docs/transfer-order-prd.md`（如需微调字段命名时，与产品确认后再更新）
- (未来实现时参考) `apps/backend/src/migrate.ts`

**Step 1: 从 PRD 提炼表字段**
- 头表 `transfer_orders`：对应 PRD 4.1 的所有字段（业务字段 + 系统字段）。
- 明细表 `transfer_order_lines`：对应 PRD 4.2 的所有字段（含 HOLD、计费预留、生成运单关联字段）。

**Step 2: 在本计划或单独设计笔记中列出字段清单**
- 为每个字段标注：类型（text/int/numeric/date/jsonb）、是否可空、默认值、索引需求。

**Step 3: 明确与现有表关系**
- `transfer_orders.customer_id` / `cooperator` 与现有 `customers` / 合作单位配置表的关系。
- `transfer_order_lines` 与 `waybills` 的多对多/多对一来源关系（例如在明细表中记录已生成托数/方数与关联运单列表）。

**How to verify**
- 字段设计完全覆盖 `docs/transfer-order-prd.md` 4.1/4.2 的需求，并与 5.3 生成运单流程字段一一对应。

---

### Task 3: 在迁移脚本中新增 Transfer Order 相关表（失败测试优先）

**Files:**
- Modify: `apps/backend/src/migrate.ts`
- Possibly Create: `apps/backend/src/sql/transfer-orders.sql`（如项目中已有 SQL 片段模式）
- Test: `apps/backend/tests/integration/migrate-transfer-orders.test.ts`（新建）

**Step 1: 为迁移编写失败测试骨架**
- 在 `apps/backend/tests/integration` 下新建 `migrate-transfer-orders.test.ts`，断言迁移之后存在 `transfer_orders` 与 `transfer_order_lines` 表及关键字段。

**Step 2: 运行测试确保目前失败**
- 命令示例：`cd apps/backend && npm test -- migrate-transfer-orders`（按项目实际测试脚本调整）。

**Step 3: 在 `migrate.ts` 中实现创建表逻辑**
- 遵循现有迁移风格：增加创建表 SQL、索引、外键，以及幂等/重跑安全性（参考现有 Waybill/Trip 相关迁移）。

**Step 4: 再次运行测试，确认通过**

**How to verify**
- 测试通过，数据库中可查询到两张新表，字段与设计完全一致。

---

### Task 4: 定义后端 Transfer Order TypeScript 类型与枚举

**Files:**
- Create: `apps/backend/src/types/transferOrderTypes.ts`
- Modify: `apps/backend/src/types.ts`（如需共享枚举）
- Test: `apps/backend/tests/unit/transfer-order-types.test.ts`

**Step 1: 在新文件中定义类型**
- 定义 `TransferOrderStatus` 枚举：`DRAFT` / `PARTIAL_WAYBILLED` / `COMPLETED` / `CANCELLED`。
- 定义 `HoldStatus` 枚举：`NORMAL` / `HOLD_PENDING` / `HOLD_LONGTERM` / `RELEASED`。
- 定义 `TransferOrder` 与 `TransferOrderLine` 接口，对应 PRD 字段。

**Step 2: 导出并在需要的地方引入**
- 若需要在其他模块（controller/service）复用，导入这些类型。

**Step 3: 编写简单单元测试断言**
- 枚举值字符串与 PRD 一致，类型中必填字段存在。

**How to verify**
- TypeScript 编译通过，测试通过，且 IDE 中能智能提示所有字段。

---

### Task 5: 实现 Transfer Order Repository/Service（基础 CRUD）

**Files:**
- Create: `apps/backend/src/services/TransferOrderService.ts`
- Modify: `apps/backend/src/db-postgres.ts`（如需添加通用查询封装）
- Test: `apps/backend/tests/integration/transfer-order-service.test.ts`

**Step 1: 设计 Service 接口**
- 方法包括：`createOrderWithLines`, `getOrderByIdWithLines`, `listOrdersWithFilters`, `updateOrderHeader`, `updateLines`, `markLineHoldStatus`, `recordWaybillGenerationForLines`。

**Step 2: 使用现有 `query` 封装实现 Service**
- 确保所有写操作在事务中执行（特别是创建头+明细、拆分明细、生成运单回写时）。

**Step 3: 为核心方法编写集成测试**
- 使用测试数据库：创建一张转运单+多条明细，断言读回结构与字段正确。

**How to verify**
- Service 集成测试通过，能完成基本 CRUD 和状态字段更新。

---

### Task 6: 设计并注册 Transfer Order REST 路由骨架

**Files:**
- Create: `apps/backend/src/controllers/TransferOrderController.ts`
- Create: `apps/backend/src/routes/transferOrderRoutes.ts`
- Modify: `apps/backend/src/main.ts`（挂载新路由，如 `/api/transfer-orders`）
- Test: `apps/backend/tests/integration/transfer-order-routes-smoke.test.ts`

**Step 1: 在 Controller 中定义方法签名**
- `list`, `getDetail`, `create`, `updateHeaderAndLines`, `toggleHold`, `splitLine`, `generateWaybills`.

**Step 2: 在 Routes 中声明路径与 HTTP 方法**
- `/api/transfer-orders`：GET 列表、POST 创建。
- `/api/transfer-orders/:id`：GET 详情、PUT 更新头部/明细。
- `/api/transfer-orders/:id/lines/:lineId/hold`：POST/PUT 标记或解除 HOLD。
- `/api/transfer-orders/:id/lines/:lineId/split`：POST 拆分明细。

**Step 3: 在 `main.ts` 中挂载并保护路由**
- 与现有 `/api/containers` 等一致，使用 `verifyToken` 中间件。

**Step 4: 写一个最简 smoke 集成测试**
- 调用 `/api/transfer-orders` 的 GET/POST，至少返回 200/201 或合适错误。

**How to verify**
- 后端启动后，`/api/transfer-orders` 系列路由可被调用（即使暂时返回 TODO 占位），集成测试通过。

---

### Task 7: 实现创建转运单 API（头 + 多行明细）

**Files:**
- Modify: `apps/backend/src/controllers/TransferOrderController.ts`
- Modify: `apps/backend/src/services/TransferOrderService.ts`
- Test: `apps/backend/tests/integration/transfer-order-create.test.ts`

**Step 1: 在 Controller `create` 中解析请求体**
- 按 PRD 5.1 的步骤，校验必填字段（柜号/仓库/到仓日/客户/合作单位等），附带明细数组。

**Step 2: 调用 Service 新增头+明细（事务）**
- 自动生成 `转运单号`（例如 `TO-YYYYMMDD-XXXX`），记录创建人/时间。

**Step 3: 返回完整的转运单对象**
- 包含头部与明细列表，方便前端立即渲染。

**Step 4: 为成功/失败路径编写集成测试**
- 覆盖：成功创建、缺少必填字段返回 400。

**How to verify**
- 测试通过，实际调用时能创建并在数据库中持久化记录。

---

### Task 8: 实现转运单列表与详情查询 API

**Files:**
- Modify: `apps/backend/src/controllers/TransferOrderController.ts`
- Modify: `apps/backend/src/services/TransferOrderService.ts`
- Test: `apps/backend/tests/integration/transfer-order-read.test.ts`

**Step 1: 列表查询实现**
- 支持按：柜号、仓库、目的仓、合作单位、状态、时间区间等过滤（对应 PRD 7.1）。

**Step 2: 详情查询实现**
- 返回头信息 + 明细数组 + 每条明细的 HOLD 状态、已生成/剩余托数/方数及关联运单列表。

**Step 3: 集成测试覆盖列表与详情**
- 插入若干测试数据，断言过滤逻辑与返回结构。

**How to verify**
- 列表分页与筛选正确；详情能完整展示一张转运单的数据。

---

### Task 9: 实现 HOLD 标记与解除 API

**Files:**
- Modify: `apps/backend/src/controllers/TransferOrderController.ts`
- Modify: `apps/backend/src/services/TransferOrderService.ts`
- Test: `apps/backend/tests/integration/transfer-order-hold.test.ts`

**Step 1: 实现标记 HOLD 的接口**
- 校验 `hold 仓库` 与 `hold 原因` 必填，按 PRD 5.2/4.2 字段更新 `hold_status` / `hold_warehouse` / `hold_reason` 等。

**Step 2: 实现解除 HOLD 的接口**
- 根据请求选择 `RELEASED` 或恢复 `NORMAL`，并记录预计释放日期（如有）。

**Step 3: 编写集成测试**
- 创建一条明细，标记为 HOLD，再解除，断言状态变化正确。

**How to verify**
- API 调用后数据库中 HOLD 字段与 PRD 定义完全一致，且前端可见状态变化。

---

### Task 10: 实现明细拆分 API（支持部分 HOLD）

**Files:**
- Modify: `apps/backend/src/controllers/TransferOrderController.ts`
- Modify: `apps/backend/src/services/TransferOrderService.ts`
- Test: `apps/backend/tests/integration/transfer-order-split-line.test.ts`

**Step 1: 实现拆分逻辑**
- 接受拆分后的托数/方数等数量，确保总和等于原行；在事务中插入新行并更新原行数量。

**Step 2: 支持将拆分出的行标记为 HOLD**
- 按 PRD 5.2 中“部分 HOLD 场景”，支持拆分后立即对某一行标记 HOLD。

**Step 3: 编写集成测试**
- 拆分前后总托数/方数不变，一行变两行，HOLD 状态符合预期。

**How to verify**
- 数据库层面，拆分后明细合法且可被前端正确展示与选择。

---

### Task 11: 设计并实现报价预览 API（v0.1 钩子）

**Files:**
- Create: `apps/backend/src/controllers/TransferPricingController.ts`
- Create: `apps/backend/src/routes/transferPricingRoutes.ts`
- Modify: `apps/backend/src/main.ts`（挂载 `/api/pricing/transfer/preview`）
- Test: `apps/backend/tests/integration/transfer-pricing-preview.test.ts`

**Step 1: 设计请求/响应模型**
- 输入：单条转运明细必要信息（合作单位、仓号/目的仓、托数、运输类型等），参考 PRD 6.2。
- 输出：建议客户报价、建议成本价、匹配规则 ID/说明，及匹配失败时的错误提示。

**Step 2: 实现 v0.1 简化匹配**
- 复用现有报价矩阵/司机成本数据（见 `apps/backend/src/services/RuleEngineService.ts` 及定价相关路由），按 PRD 6.2 只做“最小可用”匹配。

**Step 3: 编写集成测试**
- 至少覆盖：成功匹配一条报价、匹配失败返回“未匹配价格规则”。

**How to verify**
- 前端调用时，可在转运明细编辑界面展示建议价格与失败提示。

---

### Task 12: 从转运明细生成运单的后端 API 设计

**Files:**
- Modify: `apps/backend/src/controllers/TransferOrderController.ts`
- Modify: `apps/backend/src/services/TransferOrderService.ts`
- Modify: `apps/backend/src/main.ts`（如需单独路由 `/api/transfer-orders/:id/generate-waybills`）
- Test: `apps/backend/tests/integration/transfer-order-generate-waybills.test.ts`

**Step 1: 定义生成运单 API**
- 支持：单票生成（针对当前转运单）与批量生成（可选多张转运单的明细进行分组）。

**Step 2: 在内部调用现有 `POST /api/waybills`**
- 组装 Waybill 请求体时，汇总托数/方数，并在 `details` 或扩展字段中写入 `transfer_sources: [{ transferOrderId, lineId, pallets, cbm }]`（参见 PRD 5.3）。

**Step 3: 更新明细与头部状态**
- 根据生成结果更新 `已生成托数/方数` 与 `剩余可用托数/方数`，并维护 `状态 = PARTIAL_WAYBILLED/COMPLETED`。

**Step 4: 编写集成测试**
- 使用测试数据库预置数据，调用生成接口后断言：Waybill 被创建、转运明细剩余数量正确、状态更新符合 PRD。

**How to verify**
- 测试通过，并且通过 API 手工调用可完成“转运单 → 运单”最小闭环。

---

### Task 13: 在现有 Waybill API 中暴露 Transfer 来源字段

**Files:**
- Modify: `apps/backend/src/main.ts` (`GET /api/waybills/:id` 查询字段扩展)
- Modify: 相关 SQL 查询（包含 `details.transfer_sources` 或等效字段）
- Test: `apps/backend/tests/integration/waybill-transfer-sources.test.ts`

**Step 1: 扩展 Waybill 查询结果**
- 确保 `GET /api/waybills/:id` 返回中包含来源 `transfer_sources` 信息，便于 Trip/司机端与后续报表追溯。

**Step 2: 编写测试**
- 创建带 `transfer_sources` 的 Waybill 记录，断言 API 返回值中包含该字段。

**How to verify**
- 现有前端在需要查看来源时可读取该字段，不破坏旧用例。

---

### Task 14: 后端端到端流程测试（转运单 → 运单 → Trip/财务）

**Files:**
- Create: `apps/backend/tests/integration/transfer-order-end-to-end.test.ts`
- Read: `TMS_TESTING_PLAN.md`（现有 P0 流程）

**Step 1: 设计端到端测试场景**
- 从“创建转运单（头+明细）”开始，经过 HOLD 过滤、生成运单、指派 Trip、签收、生成财务记录等完整路径。

**Step 2: 编写集成测试实现**
- 复用已有 P0 Flow 中的调用方式，将“转运单前置步骤”加入链路。

**Step 3: 运行集成测试套件**
- 确保新增用例不破坏现有 P0 用例。

**How to verify**
- 测试通过，体现“业务起点从 Excel 行迁移到系统内转运单”的闭环。

---

### Task 15: 设计前端转运单路由与菜单入口

**Files:**
- Modify: `apps/frontend/src/App.tsx` 或路由配置文件（添加 `TransferOrders` 路由）
- Create: `apps/frontend/src/TransferOrders.tsx`
- Test: 手工浏览器测试 + 前端测试（如项目已有）

**Step 1: 在前端路由中添加新页面**
- 路径建议：`/transfer-orders`，位于后台运营菜单下的“转运管理”中。

**Step 2: 在侧边栏/导航中加入入口**
- 标签示例：“转运单”，角色限制为运营/管理员。

**Step 3: 手工启动前端确认路由可访问**
- 示例：`cd apps/frontend && npm run dev` 后在浏览器访问 `/transfer-orders`。

**How to verify**
- 登录后台后可在菜单中看到“转运单”，点击能进入空白占位页。

---

### Task 16: 实现转运单列表页面 UI

**Files:**
- Modify: `apps/frontend/src/TransferOrders.tsx`
- Test: 手工浏览器测试

**Step 1: 设计列表表格布局**
- 列参照 PRD 7.1：转运单号、柜号、所在仓库、到仓日、合作单位、主目的仓、状态、总托数/已生成托数/HOLD 托数、创建时间/人。

**Step 2: 实现筛选与分页**
- 支持按柜号、仓库、目的仓、合作单位、状态、时间区间筛选，对应后端列表 API 参数。

**Step 3: 行操作与跳转**
- 每行提供“查看/编辑”“从此单生成运单”入口。

**How to verify**
- 页面加载时能正确调用 `/api/transfer-orders`，数据展示清晰，筛选条件工作正常。

---

### Task 17: 实现转运单详情/编辑页头部表单

**Files:**
- Modify: `apps/frontend/src/TransferOrders.tsx`（拆分为头部/明细子组件）
- Create: `apps/frontend/src/components/TransferOrderHeaderForm.tsx`
- Test: 手工浏览器测试

**Step 1: 根据 PRD 4.1 实现表单字段**
- 包含：转运单号（只读）、客户/业务方、合作单位、柜号、所在仓库、进仓方式、到仓日期、主目的仓、币种、整体备注等。

**Step 2: 实现新建/编辑两种模式**
- 新建：空表单，保存后调用后端创建 API。
- 编辑：加载详情数据，填充表单，保存时调用更新 API。

**Step 3: 表单校验与错误提示**
- 必填字段缺失时禁用保存按钮并在前端给出明确错误提示。

**How to verify**
- 在浏览器中能创建一张新的转运单，并在列表中看到，刷新后数据保持一致。

---

### Task 18: 实现明细列表表格 UI 与行内编辑

**Files:**
- Create: `apps/frontend/src/components/TransferOrderLinesTable.tsx`
- Modify: `apps/frontend/src/TransferOrders.tsx`
- Test: 手工浏览器测试

**Step 1: 实现明细表格列**
- 字段参照 PRD 4.2：SKU、FBA、PoList、件数、托数、方数、重量、目的仓、派送类型、合作单位（可覆盖）、预计发车日期等。

**Step 2: 支持行内编辑/新增/删除**
- 可在表格底部添加“新增一行”，支持复制/粘贴多行（v0.1 可先实现单行编辑，Excel 粘贴可放到后续）。

**Step 3: 在前端维护明细状态并与头部一起提交**
- 使用本地 state 或表单管理库，保证与后端请求体结构一致。

**How to verify**
- 手工创建一张带多行明细的转运单，保存后刷新详情页面，表格内容与后端一致。

---

### Task 19: 在前端实现 HOLD 标记/解除交互

**Files:**
- Modify: `apps/frontend/src/components/TransferOrderLinesTable.tsx`
- Test: 手工浏览器测试

**Step 1: 为每行增加 HOLD 显示与操作按钮**
- 根据 `hold_status` 显示不同颜色/标签（NORMAL/HOLD_PENDING/HOLD_LONGTERM/RELEASED）。

**Step 2: 实现标记 HOLD 的弹窗表单**
- 必填：`hold 仓库` 与 `hold 原因`，可选预计释放日期；提交调用后端 HOLD API。

**Step 3: 实现解除 HOLD 操作**
- 提供“解除 HOLD”按钮，调用后端解除接口，刷新当前行状态。

**How to verify**
- HOLD 行在 UI 中明显标记，无法被选中用于生成运单（见后续 Task 21），状态变更后刷新页面仍然正确。

---

### Task 20: 集成报价预览 API 到明细编辑 UI

**Files:**
- Modify: `apps/frontend/src/components/TransferOrderLinesTable.tsx`
- Possibly Create: `apps/frontend/src/components/TransferPricingBadge.tsx`
- Test: 手工浏览器测试

**Step 1: 在行编辑时调用 `/api/pricing/transfer/preview`**
- 当合作单位/目的仓/托数/派送类型等关键字段齐备时触发请求。

**Step 2: 在表格中展示建议价格**
- 显示“建议客户报价/成本价”，匹配失败时以红色文案提示“未匹配价格规则”。

**Step 3: 决定是否阻止生成运单**
- 按 PRD 6.2：匹配失败时，生成运单前必须有手工填价与备注（可在生成运单弹窗中校验）。

**How to verify**
- 修改明细字段后，报价徽标/提示能及时更新；请求失败时有明显反馈。

---

### Task 21: 实现前端“从明细生成运单”单票流程

**Files:**
- Modify: `apps/frontend/src/TransferOrders.tsx`
- Create: `apps/frontend/src/components/GenerateWaybillModal.tsx`
- Test: 手工浏览器测试

**Step 1: 在详情页底部添加“生成运单”按钮**
- 允许勾选若干条非 HOLD 且有剩余托/方的明细，汇总显示勾选数量。

**Step 2: 弹出生成运单预览弹窗**
- 展示合作单位、始发仓、目的仓、选中明细总托数/方数、建议客户报价/成本价（如有）。
- 提供价格微调与运单级备注输入。

**Step 3: 调用后端生成运单 API**
- 成功后在 UI 中提示新运单号，并刷新当前转运单详情。

**How to verify**
- 从一张转运单中勾选明细生成一张运单；刷新后看到明细的已生成/剩余数量更新，状态从 DRAFT 变为 PARTIAL/COMPLETED。

---

### Task 22: 实现前端批量生成运单（跨转运单明细）

**Files:**
- Modify: `apps/frontend/src/TransferOrders.tsx`（列表多选）
- Modify: `apps/frontend/src/components/GenerateWaybillModal.tsx`（支持批量分组展示）
- Test: 手工浏览器测试

**Step 1: 支持在列表/详情中跨多张转运单选择明细**
- 设计选择交互（例如在列表页选中多张转运单后进入“批量生成”模式）。

**Step 2: 在弹窗中按“合作单位 + 目的仓 + 发车日期”分组**
- 每一组代表一张待生成的运单，可允许手工合并/拆分组。

**Step 3: 一次性提交所有分组到后端 API**
- 后端按组生成多张运单，并返回摘要结果（成功/失败数量）。

**How to verify**
- 实际操作中能一键从多张转运单中生成多张运单，失败时有清晰错误提示且不留下半生成的脏数据。

---

### Task 23: 前端端到端业务验证（手工）

**Files:**
- Read: `docs/testing-business-flow-notes.md`
- Read: `docs/transfer-order-prd.md`

**Step 1: 按业务流程走一条完整链路**
- 登录后台 → 新建转运单（头+多行明细）→ 标记部分托盘为 HOLD → 从剩余明细生成一张运单 → 使用现有 UI 分配 Trip 与执行 → 检查财务记录。

**Step 2: 对照测试理解文档中的锚点**
- 确认“业务起点”已从 Excel 行迁移到“系统内转运单创建”。

**Step 3: 记录发现的问题与改进点**
- 将任何与 PRD 不符或体验问题记录为后续迭代任务。

**How to verify**
- 完整链路可在浏览器中顺畅完成，无阻塞性 BUG，且关键状态与金额与预期一致。

---

### Task 24: 文档与计划回链更新

**Files:**
- Modify: `docs/transfer-order-prd.md`（仅在需求变化得到确认时）
- Modify: `docs/testing-business-flow-notes.md`（增加“已实现 v0.1 能力”说明）
- Modify: 本计划文件（勾选完成/调整任务顺序时）

**Step 1: 回写实现现状到业务理解文档**
- 在 `docs/testing-business-flow-notes.md` 中记录：转运单 v0.1 已上线的字段与边界。

**Step 2: 确认 PRD 与实现保持同步**
- 若实现中对字段/交互做了必要微调，与产品对齐后在 `docs/transfer-order-prd.md` 中更新。

**Step 3: 更新本计划完成状态**
- 在后续迭代中，可在每个 Task 标注完成日期/负责人，便于追踪。

**How to verify**
- 三份文档（本计划 + PRD + 测试理解）之间没有冲突，能为后续 subagent 执行与测试设计提供统一真相来源。

---
