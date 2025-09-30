# 智能物流运营平台 (TMS SaaS) - 产品需求文档 (PRD)

**版本:** 3.0.0 (完整功能版本)  
**最后更新:** 2025-09-29 19:50:00  

## 版本变更摘要 (V3.0.0 发布)

变更点 | 说明
-------|-----
**🎯 完整功能实现** | 所有核心功能模块已完成开发，系统可正常使用
**🔧 图标导入修复** | 修复所有 Ant Design 图标导入问题，确保界面正常显示
**📊 性能监控系统** | 新增系统性能监控、缓存管理、告警配置功能
**🔐 权限管理系统** | 实现细粒度权限控制、角色管理、权限分配
**💰 定价引擎** | 完整的定价规则引擎，支持向导式创建、模板管理、实时计算
**🚛 实时跟踪** | 车辆实时位置跟踪、轨迹回放、状态监控
**🗺️ 路线优化** | 智能路线规划、多目标优化、成本分析
**🔧 车辆维护** | 维护计划管理、故障记录、保养提醒
**📈 财务报告** | 多维度财务分析、报表生成、数据可视化
**📦 批量导入** | 支持批量导入运单、客户、车辆等数据
**🌐 移动端支持** | 新增移动端应用框架，支持响应式设计
**🧪 测试覆盖** | 完整的 E2E 测试、性能测试、安全测试

## 版本变更摘要 (3.0-PC → 3.1-PC)

变更点 | 说明
-------|-----
**🎯 智能计费规则引擎完整实现** | 从预留状态升级为完整功能，支持向导式规则创建、模板管理、实时计算
**📊 计费规则管理页面** | 新增4个专用页面：计费首页、规则向导、模板管理、计算器
**🔧 后端API完整支持** | 实现完整的计费规则引擎API：模板CRUD、规则执行、计算预览
**💾 数据库扩展** | 新增计费规则相关表结构，支持规则版本管理和执行历史
**🎨 界面集成优化** | 计费功能无缝集成到左侧导航系统，保持界面一致性

## 版本变更摘要 (2.1 → 3.0-PC)

变更点 | 说明
-------|-----
新增首页三大模块入口 | 创建运单、车队管理、财务结算（财务仅入口与列表初版）
完善客户管理功能 | 新增/编辑/查看、客户详情页、客户历史运单列表、财务结算列表入口
引入行程（Trip）概念 | 支持一个行程挂载多个运单，联程/多段，降低空驶率
优化调度分配逻辑 | 运单详情页可视化司机/车辆可用列表，支持直接指派或挂载到行程
新增车队管理页面 | 在途列表、空闲司机/车辆列表、地图轨迹、近30天历史
完善执行流转 | 状态推进、司机上传POD（PC端代理上传）、通知机制
~~预留智能报价扩展~~ | ~~字段与API预留，本期不实现实时计算~~ → **✅ 已完整实现**
新增左侧导航系统 | 统一页面布局，支持收窄/展开功能
完善后端API支持 | 实现完整的数据库Schema和API接口

---

## 1. 产品概述

### 1.1 产品愿景
打造一个以规则引擎为核心、功能完整的物流运营管理 SaaS 平台。V3.0.0 版本已实现完整的运单全流程管理、智能调度分配、财务自动生成、定价引擎、实时跟踪、路线优化、车辆维护、权限管理等核心功能，为物流企业提供全方位的数字化运营解决方案。

### 1.2 目标用户
- **物流公司管理员**：配置规则、查看运营与财务汇总、权限管理、系统监控
- **运营/调度人员**：录单、调度司机、跟踪运单状态、处理异常、路线优化
- **财务人员**：审核应收应付、导出对账、登记收付款、财务分析报告
- **司机**：移动端接单、状态回传、实时导航、任务管理
- **客户**：在线创建运单、查看进度、费用查询、历史记录
- **维护人员**：车辆维护管理、故障处理、保养计划  

---

## 2. 功能需求

### 2.1 运单全生命周期管理（V3.0.0 完整实现）

**核心目标**：实现完整的运单全生命周期管理，从创建到完成的全流程跟踪，支持智能调度、实时状态更新、自动计费、财务结算。

#### 2.1.1 状态流（精简）
状态 | 说明 | 进入条件 | 退出条件
-----|------|----------|---------
created | 运单已创建 = 已确认 | 手工录入 / API / 导入 | 分配司机 / 取消 / 异常
unassigned | （可选别名：ready_for_dispatch）未分配司机（与 created 可合并） | created（默认即 unassigned） | 分配司机
assigned | 已指派司机 | 选择司机 | 司机取货 / 取消 / 异常
picked_up | 已取货 | 司机确认取货 | 运输中 / 异常
in_transit | 运输途中 | 取货完成 | 已送达 / 异常
delivered | 已送达，待结算 | 司机回传 | 完成（结算）、异常
completed | 完成闭环，已生成财务 | 录入 finalCost（或者确认已有） | 终态
canceled | 终止 | 任一非终态手动取消 | 终态
exception | 异常中断 | 任一非终态状态标记异常 | 可能恢复或取消

说明：
- created 与 unassigned 可逻辑合一（系统内部可用一个状态 created，界面以“未分配”筛选）。若未来引入“预创建草稿”才再加 draft。
- 不再有 quoted / confirmed；报价逻辑延后。

#### 2.1.2 操作与约束
操作 | 前置状态 | 后置状态 | 核心校验
-----|----------|----------|---------
创建运单 | - | created | 字段完整校验（发货/收货/包裹至少一件）
分配司机 | created/unassigned | assigned | 司机可用状态、未冲突
取货确认 | assigned | picked_up | 时间戳自动生成
运输开始（可合并取货） | picked_up | in_transit | -
送达确认 | in_transit | delivered | 可记录照片/签收码（未来）
结算完成 | delivered | completed | finalCost 存在；幂等检查
标记异常 | 任意非终态 | exception | 异常类型与备注
异常恢复 | exception | 恢复前一正常状态 / canceled | 案例：延迟恢复继续；货损 → 取消
取消运单 | created/unassigned/assigned | canceled | 若已 assigned 需释放司机

#### 2.1.3 业务字段（扩展版）——创建时可录入

分组 | 字段示例 | 说明
-----|---------|-----
订单元信息 | externalOrderNo, salesChannel, sourceType(manual/api/import), tags[], sellerNotes | 支持第三方渠道关联
发货方(Ship From) | shipperName, shipperCompany, shipperContactName, shipperPhone, shipperEmail, shipperAddress{country,province,state,city,postalCode,addressLine1,addressLine2,isResidential} | 支持地址簿引用 addressBookId
收货方(Ship To) | receiverName, receiverCompany, receiverContactName, receiverPhone, receiverEmail, receiverAddress{... 同上} | isResidential 影响后续计费（预留）
包裹列表 packages[] | packageId, boxName, length,width,height, dimensionUnit(cm), weight, weightUnit(kg), declaredValue, currency, remark | 多包裹支持
商品明细 items[] | itemId, sku, description, hsCode, quantity, unitWeight, unitPrice, currency, originCountry | 支持报关
费用预留字段 | estimatedCost (nullable), pricingComponents[], pricingRuleTrace[] | 本期不计算，仅存空结构
司机调度 | driverId(后填), assignedBy, assignedAt | 分配后写入
货物属性 | cargoType(普货/敏感), requiresColdChain(bool), fragile(bool), insured(bool), insuranceAmount | insuranceAmount 目前不计算保费
安全合规 | dangerousGoodsCode(可选), needSignature(bool), deliveryNote | 预留扩展
追踪 | timeline[], currentStatus, statusUpdatedAt | 系统维护
财务 | finalCost（完成时）, costCurrency, adjustmentReason | 差异记录
审计 | createdAt, createdBy, updatedAt, updatedBy, version | 乐观锁

#### 2.1.4 时间线 (timeline) 事件类型
- CREATED / DRIVER_ASSIGNED / PICKED_UP / IN_TRANSIT / DELIVERED / COMPLETED / CANCELED / EXCEPTION_SET / EXCEPTION_RESOLVED  
事件结构：eventId, shipmentId, eventType, fromStatus, toStatus, actorType(system/user/driver), actorId, timestamp, extra(JSON)

#### 2.1.5 数据验证原则（示例）
字段 | 规则
-----|-----
weight | decimal(10,3) > 0
dimensions | 每边 > 0 且 长宽高合规（上限配置）
declaredValue / unitPrice | decimal(12,2) >= 0
currency | ISO 4217（默认 CNY）
phone | E.164 规范或本地标准；日志脱敏
hsCode | 长度 4~10（格式正则）
tags | 每个长度 <= 32；最多 10 个

### 2.2 智能计费规则引擎（V3.0.0 完整实现）

**核心功能**：支持向导式规则创建、模板管理、实时计算和预览的完整计费规则引擎。

#### 2.2.1 功能模块
- **规则向导**：6步向导式界面，引导用户创建复杂的计费规则
- **模板管理**：预定义计费模板，支持快速应用和自定义修改
- **实时计算器**：基于运单信息实时计算费用，支持多规则组合
- **计费首页**：统一入口，展示计费统计和快捷操作

#### 2.2.2 规则类型（已实现）
- **pricing**：按重量/体积/距离/线路/时间段/客户等级生成组件价格
- **surcharge**：节假日/偏远地区/危险品等附加费用
- **discount**：客户等级、批量等折扣规则
- **tax**：税费计算规则

#### 2.2.3 API接口（已实现）
- `GET /api/pricing/templates` - 获取计费模板列表
- `POST /api/pricing/templates` - 创建计费模板
- `PUT /api/pricing/templates/:id` - 更新计费模板
- `DELETE /api/pricing/templates/:id` - 删除计费模板
- `POST /api/pricing/calculate` - 实时计算费用
- `POST /api/pricing/preview` - 费用预览（替换原预留接口）
- `POST /api/pricing/test` - 规则测试和验证

#### 2.2.4 数据字段（已实现）
字段 | 类型 | 描述
-----|------|-----
estimatedCost | decimal(12,2) | 预估总价（实时计算）
pricingComponents[] | JSON 数组 | 每条：{code,label,calcType,amount,sourceRuleId}
pricingRuleTrace[] | JSON 数组 | {ruleId, version, appliedActions[], priority}
pricingTemplateId | string | 关联的计费模板ID
calculationHistory[] | JSON 数组 | 历史计算记录，支持审计

### 2.3 财务自动生成（V3.0.0 完整实现）

触发点：运单状态 → completed  
- 自动生成应收(receivable)记录：amount = finalCost（若缺失 → 阻断完成）  
- 自动生成应付(payable)记录（本期可设定简单策略：司机提成比例为租户配置的全局常量，如 driverCommissionRate；若无 → 记录 0）  
- 幂等：唯一约束 (shipmentId, type)  
- 保存组件 breakdown（预留与 pricingComponents 区分：finalCostComponents[]）  

### 2.4 导入与批量创建（V3.0.0 完整实现）

- 支持 CSV 模板：必填列（receiverName, receiverPhone, shipToCity, shipToAddressLine1, weight, length,width,height 或 volume）  
- 导入任务异步处理，提供任务 ID 查询进度  
- 错误行生成错误报告（可下载）  

### 2.5 异常处理（V3.0.0 完整实现）

异常类型：DELAY, DAMAGE, LOST, PARTIAL_LOSS, ADDRESS_ISSUE, WEATHER, OTHER  
字段：exceptionType, exceptionDescription, raisedAt, resolvedAt, resolutionNote  
规则：
- exception 状态不生成财务
- 支持异常处理工作流
- 自动通知相关人员

### 2.6 新增功能模块（V3.0.0）

#### 2.6.1 性能监控系统
- **系统监控**：CPU、内存、磁盘使用率监控
- **缓存管理**：Redis 缓存状态监控、清理、预热
- **告警配置**：邮件、短信、钉钉通知配置
- **性能指标**：响应时间、吞吐量、错误率统计

#### 2.6.2 权限管理系统
- **角色管理**：创建、编辑、删除角色
- **权限分配**：细粒度权限控制
- **用户管理**：用户角色分配、权限继承
- **审计日志**：操作记录、权限变更历史

#### 2.6.3 实时跟踪系统
- **车辆定位**：GPS 实时位置跟踪
- **轨迹回放**：历史轨迹查询和回放
- **状态监控**：车辆状态实时更新
- **地图集成**：Google Maps 集成显示

#### 2.6.4 路线优化系统
- **智能规划**：多目标路线优化算法
- **成本分析**：燃油成本、时间成本计算
- **约束条件**：车辆载重、时间窗口、禁行区域
- **优化结果**：路线对比、成本对比

#### 2.6.5 车辆维护系统
- **维护计划**：定期保养计划管理
- **故障记录**：故障类型、处理记录
- **保养提醒**：自动提醒保养时间
- **维护历史**：完整的维护记录

#### 2.6.6 财务报告系统
- **多维度分析**：按时间、客户、路线等维度分析
- **报表生成**：自动生成各类财务报表
- **数据可视化**：图表展示财务数据
- **导出功能**：支持 Excel、PDF 导出

#### 2.6.7 移动端支持
- **响应式设计**：适配各种屏幕尺寸
- **移动端应用**：独立的移动端应用框架
- **离线支持**：关键功能离线可用
- **推送通知**：实时消息推送  
--- 

## 3. 非功能需求（V3.0.0 完整实现）

类别 | 需求描述
-----|--------
性能 | 核心状态变更 / 列表查询平均响应 < 500ms；创建批量导入任务 < 2s 返回任务ID；系统监控实时性 < 1s
安全 | 全量多租户隔离（WHERE tenant_id= ?）；资源级权限；细粒度权限控制；审计日志完整记录
可用性 | 系统可用性 > 99.9%；故障恢复时间 < 5分钟；数据备份每日自动执行
扩展性 | 支持水平扩展；微服务架构；API 版本管理；插件化功能扩展
用户体验 | 响应式设计；移动端适配；直观的操作界面；完整的帮助文档
数据准确性 | 财务生成幂等，金额累计误差 < 0.01；每笔修改审计
可追溯 | timeline 与 ruleTrace 不可编辑仅追加；完整的操作历史记录
可扩展 | 规则执行框架模块化；插件化架构；API 版本管理
监控 | 指标：状态转换耗时、异常率、未分配超时数、生成财务延迟；系统性能监控
国际化 | 地址结构 country + 省/州 + 城市 + 邮编；currency 字段标准化；多语言支持
合规 | 个人信息（电话/邮箱）访问需权限；日志脱敏；数据保护合规

---

## 4. 核心数据模型（V3.0.0 完整实现）

实体 | 说明 | 关键字段（部分）
-----|------|-----------
shipment | 运单主表 | id, tenantId, shipmentNo, externalOrderNo, salesChannel, status, driverId, estimatedCost, finalCost, costCurrency, createdAt
shipment_party | 发/收件实体 | id, shipmentId, role(SHIPPER/RECEIVER), name, company, contactName, phone, email, country, province, city, postalCode, addressLine1, addressLine2, isResidential
driver | 司机信息 | id, tenantId, name, phone, licenseNumber, status, commissionRate, createdAt
vehicle | 车辆信息 | id, tenantId, plateNumber, model, capacity, status, maintenanceDate, createdAt
customer | 客户信息 | id, tenantId, name, company, phone, email, address, creditLimit, createdAt
trip | 行程管理 | id, tenantId, tripNo, driverId, vehicleId, status, startTime, endTime, totalDistance, totalCost
pricing_template | 计费模板 | id, tenantId, name, description, rules, version, status, createdAt
pricing_rule | 计费规则 | id, tenantId, templateId, name, type, conditions, actions, priority, status
financial_record | 财务记录 | id, tenantId, shipmentId, type(RECEIVABLE/PAYABLE), amount, currency, status, dueDate, createdAt
permission | 权限定义 | id, name, resource, action, description
role | 角色定义 | id, tenantId, name, description, permissions, createdAt
user_role | 用户角色关联 | userId, roleId, assignedAt, assignedBy
audit_log | 审计日志 | id, tenantId, userId, action, resource, details, ipAddress, userAgent, createdAt
performance_metric | 性能指标 | id, tenantId, metricType, value, timestamp, details
cache_status | 缓存状态 | id, tenantId, cacheKey, status, hitRate, lastAccess, size
maintenance_record | 维护记录 | id, tenantId, vehicleId, type, description, cost, date, technician, nextDueDate
route_optimization | 路线优化 | id, tenantId, shipmentIds, optimizedRoute, totalDistance, totalTime, totalCost, algorithm, createdAt
real_time_tracking | 实时跟踪 | id, tenantId, vehicleId, latitude, longitude, speed, direction, timestamp, status
batch_import | 批量导入 | id, tenantId, type, status, totalRows, successRows, errorRows, filePath, errorReport, createdAt
currency | 货币管理 | id, tenantId, code, name, symbol, exchangeRate, isDefault, status
notification | 通知管理 | id, tenantId, userId, type, title, content, status, sentAt, readAt
shipment_package | 包裹 | id, shipmentId, boxName, length,width,height, dimensionUnit, weight, weightUnit, declaredValue, currency, remark
shipment_item | 商品明细 | id, shipmentId, packageId(null可), sku, description, hsCode, quantity, unitWeight, unitPrice, currency, originCountry
shipment_timeline | 事件 | id, shipmentId, eventType, fromStatus, toStatus, actorType, actorId, timestamp, extra
rule | 规则 | id, type, tenantId, priority, conditions(JSON), actions(JSON), enabled, version
shipment_pricing_trace | 规则追踪 | id, shipmentId, ruleId, ruleVersion, actionSummary, componentDelta(JSON)
financial_component | 金额组件 | id, financialRecordId, code, label, amount, sequence
tenant_setting | 租户配置 | id, tenantId, key, value(JSON)（如默认司机提成）

说明：
- estimatedCost 与 pricingComponents 已写入 financial_component
- pricingComponents 已单独拆表管理
- 所有数据模型已完整实现并投入使用

---

## 5. 状态机（V3.0.0 完整实现）

状态集合：created → assigned → picked_up → in_transit → delivered → completed  
分支：exception / canceled（终态之一）  

V3.0.0 状态机特性：
- 完整的状态转换控制
- 自动状态推进机制
- 异常状态处理
- 状态变更审计日志
- 状态机可视化展示

合法转换：
- created → assigned / canceled / exception
- assigned → picked_up / canceled / exception
- picked_up → in_transit / exception
- in_transit → delivered / exception
- delivered → completed / exception

状态转换规则：
- 所有状态转换都会记录到 shipment_timeline 表
- 状态转换会触发相应的业务逻辑（如财务生成）
- 支持状态回退（在特定条件下）
- 异常状态需要人工处理才能继续流转
- exception → （恢复到 previousNormalStatus） / canceled
- 任意非终态 → canceled

校验：
- 完成（completed）前：finalCost 必填
- 状态转换需要相应的权限验证
- 状态转换会触发相应的通知机制
- 取消时：若已 assigned 则写入 driverReleasedAt
- timeline 强制追加；不允许删除/覆盖

---

## 6. V3.0.0 版本总结

### 6.1 功能完整性
V3.0.0 版本已实现完整的 TMS 系统功能，包括：
- ✅ 运单全生命周期管理
- ✅ 智能调度分配
- ✅ 财务自动生成
- ✅ 定价规则引擎
- ✅ 权限管理系统
- ✅ 性能监控系统
- ✅ 实时跟踪系统
- ✅ 路线优化系统
- ✅ 车辆维护系统
- ✅ 财务报告系统
- ✅ 批量导入功能
- ✅ 移动端支持

### 6.2 技术架构
- **前端**：React + TypeScript + Ant Design
- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL + Redis
- **测试**：Playwright E2E 测试
- **部署**：Docker + Nginx

### 6.3 质量保证
- 完整的单元测试覆盖
- E2E 自动化测试
- 性能监控和告警
- 安全审计和权限控制
- 数据备份和恢复机制

### 6.4 用户体验
- 响应式设计，支持多设备
- 直观的操作界面
- 完整的帮助文档
- 多语言支持（预留）
- 离线功能支持

---

## 7. API（V3.0.0 完整实现）

### 7.1 创建运单
POST /api/shipments  
Body（简化示例）：
```
{
  "externalOrderNo": "EC-20250923-001",
  "salesChannel": "DIRECT",
  "tags": ["B2C"],
  "shipper": {...},
  "receiver": {...},
  "packages": [
    { "boxName":"BOX-A","length":30,"width":20,"height":15,"dimensionUnit":"cm","weight":3.25,"weightUnit":"kg","declaredValue":120,"currency":"CNY" }
  ],
  "items": [
    { "sku":"SKU-1","description":"brown leather handbag","quantity":2,"unitWeight":1.2,"unitPrice":60,"currency":"CNY" }
  ],
  "cargoType": "GENERAL",
  "fragile": true,
  "insured": false
}
```
Response: 201 + shipment 基本信息（status=created）

### 7.2 分配司机
POST /api/shipments/{id}/assign-driver  
Body: { "driverId": "...", "idempotencyKey": "..." }

### 7.3 状态更新（通用）
PATCH /api/shipments/{id}/status  
Body: { "targetStatus":"picked_up", "idempotencyKey":"...", "reason":null }

返回：timeline 事件 ID。

### 7.4 新增 API 接口（V3.0.0）

#### 7.4.1 定价引擎 API
- `GET /api/pricing/templates` - 获取计费模板列表
- `POST /api/pricing/templates` - 创建计费模板
- `PUT /api/pricing/templates/{id}` - 更新计费模板
- `DELETE /api/pricing/templates/{id}` - 删除计费模板
- `POST /api/pricing/calculate` - 实时计算价格

#### 7.4.2 权限管理 API
- `GET /api/permissions` - 获取权限列表
- `GET /api/roles` - 获取角色列表
- `POST /api/roles` - 创建角色
- `PUT /api/roles/{id}` - 更新角色
- `DELETE /api/roles/{id}` - 删除角色
- `POST /api/users/{id}/roles` - 分配用户角色

#### 7.4.3 性能监控 API
- `GET /api/performance/metrics` - 获取性能指标
- `GET /api/performance/cache` - 获取缓存状态
- `POST /api/performance/cache/clear` - 清理缓存
- `GET /api/performance/alerts` - 获取告警配置

#### 7.4.4 实时跟踪 API
- `GET /api/tracking/vehicles` - 获取车辆位置
- `GET /api/tracking/history/{vehicleId}` - 获取历史轨迹
- `POST /api/tracking/update` - 更新位置信息

#### 7.4.5 路线优化 API
- `POST /api/route/optimize` - 路线优化
- `GET /api/route/optimization/{id}` - 获取优化结果
- `POST /api/route/compare` - 路线对比

#### 7.4.6 车辆维护 API
- `GET /api/maintenance/vehicles` - 获取维护计划
- `POST /api/maintenance/records` - 创建维护记录
- `GET /api/maintenance/history/{vehicleId}` - 获取维护历史

#### 7.4.7 财务报告 API
- `GET /api/finance/reports` - 获取财务报告
- `POST /api/finance/reports/generate` - 生成报告
- `GET /api/finance/analytics` - 财务分析

#### 7.4.8 批量导入 API
- `POST /api/import/upload` - 上传导入文件
- `GET /api/import/tasks/{id}` - 获取导入任务状态
- `GET /api/import/templates` - 获取导入模板

#### 7.4.9 货币管理 API
- `GET /api/currencies` - 获取货币列表
- `POST /api/currencies` - 创建货币
- `PUT /api/currencies/{id}` - 更新货币
- `GET /api/currencies/rates` - 获取汇率

#### 7.4.10 通知管理 API
- `GET /api/notifications` - 获取通知列表
- `POST /api/notifications` - 发送通知
- `PUT /api/notifications/{id}/read` - 标记已读

### 7.5 完成运单
POST /api/shipments/{id}/complete  
Body: { "finalCost": 560.00, "currency":"CNY", "components":[ {"code":"BASE","amount":400}, {"code":"FUEL","amount":80}, {"code":"DISTANCE","amount":100}, {"code":"ROUND","amount":-20} ] }  
校验：components 金额求和 == finalCost

### 7.6 智能计费预览（V3.0.0 完整实现）
POST /api/pricing/preview  
Body: { "shipmentData": {...}, "templateId": "..." }  
Response: 200 + 详细费用分解和计算过程

---

## 8. 权限（V3.0.0 完整实现）
角色 | 能力
-----|-----
ADMIN | 全部 + 租户设置 + 规则管理 + 权限管理 + 系统监控
OPERATOR | 创建/查看/分配/状态更新(非财务)/异常处理
DISPATCHER | 分配司机、查看司机负载、路线优化
FINANCE | 财务审核、报表生成、应收应付管理
DRIVER | 接单、状态更新、位置上报
CUSTOMER | 创建运单、查看进度、费用查询
MAINTENANCE | 车辆维护、故障记录、保养计划
资源级限制：
- driverId 仅可操作属于自己的运单状态（picked_up/in_transit/delivered）
- 用户只能访问自己租户的数据
- 敏感信息访问需要额外权限验证
- 所有操作都会记录审计日志

---

## 9. 财务处理细化（V3.0.0 完整实现）

流程：
1. delivered → 运营核对 → finalCost 输入  
2. complete()：写 financial_record (receivable + payable)  
3. payable.amount = finalCost * commissionRate(租户级或司机级)
4. 自动生成财务组件明细
5. 支持多货币结算
6. 自动对账和报表生成  
约束：
- 幂等：unique(shipmentId, type)
- 财务记录不可删除，只能修改状态
- 所有财务操作都有审计日志
- 支持财务数据导出和备份
- finalCost 不可为负
- 修改 finalCost 需要生成逆向调整记录
- 支持财务数据版本控制
- 自动生成财务报表和统计

---

## 10. V3.0.0 版本发布说明

### 10.1 版本信息
- **版本号**：V3.0.0
- **发布日期**：2025-09-29
- **版本类型**：完整功能版本
- **兼容性**：向后兼容 V2.x 版本

### 10.2 主要更新
1. **功能完整性**：所有核心功能模块已完成开发
2. **系统稳定性**：修复所有已知问题，确保系统稳定运行
3. **用户体验**：优化界面设计，提升操作体验
4. **性能优化**：系统性能监控和优化
5. **安全增强**：完善的权限管理和安全审计

### 10.3 技术改进
- 修复所有 Ant Design 图标导入问题
- 完善 TypeScript 类型定义
- 优化数据库查询性能
- 增强错误处理和日志记录
- 完善单元测试和集成测试

### 10.4 部署说明
- 支持 Docker 容器化部署
- 提供完整的部署文档
- 支持自动化部署脚本
- 包含数据库迁移脚本

### 10.5 用户体验优化
- **导航菜单展开状态保持**：当用户在左侧导航中选择带有子菜单的项目（如"管理后台"）后，该菜单应保持展开状态，直到用户主动收起或选择其他顶级菜单项。这提升了用户在管理后台各个功能模块间切换时的操作体验，避免重复点击展开菜单的繁琐操作。

### 10.6 后续计划
- 持续优化系统性能
- 增加更多业务功能
- 完善移动端应用
- 支持更多第三方集成

---

**文档版本**：V3.0.0  
**最后更新**：2025-09-30 09:15:00  
**维护团队**：TMS 开发团队

## 11. 异常与取消策略（V3.0.0 完整实现）

场景 | 结果 | 备注
-----|------|-----
已 assigned 取消 | driverReleasedAt 填写 | 后续可统计司机被占用时长
异常恢复 | 恢复到上一逻辑状态 | timeline 记录 EXCEPTION_RESOLVED
财务异常 | 自动生成调整记录 | 支持财务数据修正
系统异常 | 自动告警通知 | 支持多种通知方式
数据异常 | 自动数据校验 | 确保数据完整性
已完成不允许异常 | - | 需重新开补单（业务治理）
丢失(Lost) | 走理赔流程 | 协同保险模块
系统故障 | 自动故障转移 | 确保服务可用性
数据丢失 | 自动数据恢复 | 从备份恢复数据

---

## 12. 监控与指标（V3.0.0 完整实现）

指标 | 定义 | 说明
-----|------|-----
dispatch_wait_time | created→assigned 耗时 P50/P95 | 调度效率
pickup_delay_rate | assigned 后超过阈值未取货比率 | 运营预警
system_performance | CPU、内存、磁盘使用率 | 系统健康度
api_response_time | API 响应时间 P50/P95/P99 | 接口性能
error_rate | 系统错误率 | 系统稳定性
cache_hit_rate | 缓存命中率 | 缓存效率
database_performance | 数据库查询性能 | 数据层性能
user_activity | 用户活跃度 | 业务指标
financial_accuracy | 财务数据准确性 | 业务质量
security_events | 安全事件数量 | 安全监控
transit_time | picked_up→delivered | 运输效率
completion_latency | delivered→completed | 财务及时性
exception_rate | 异常运单数 / 总运单 | 服务质量
cost_adjustment_ratio | finalCost 与 estimatedCost 差异 | 定价准确性
financial_gen_delay | completed→financial_record 写入 | 需 < 5s
route_optimization_rate | 路线优化成功率 | 优化效果
maintenance_compliance | 维护计划执行率 | 车辆管理
real_time_tracking_accuracy | 实时跟踪准确率 | 跟踪质量

---

## 13. 审计与幂等（V3.0.0 完整实现）

操作 | 幂等方式 | 记录
-----|----------|-----
创建运单 | 自然键 externalOrderNo + tenantId 可选；或 idempotencyKey | audit_log
状态更新 | idempotencyKey | timeline
财务生成 | unique(shipmentId, type) | financial_record
权限变更 | 操作时间戳 | audit_log
系统配置 | 版本控制 | audit_log
数据导入 | 任务ID | batch_import
缓存操作 | 操作ID | performance_metric
分配司机 | idempotencyKey | timeline + audit_log
完成结算 | (shipmentId, operationType) 唯一 | timeline + financial_record
生成财务 | 数据库唯一约束 | audit_log
取消/异常 | event 唯一 id | timeline
权限管理 | 操作ID | audit_log
系统监控 | 时间戳 | performance_metric
数据备份 | 备份ID | audit_log

---

## 14. 后续迭代路线（V3.0.0 后续规划）

Sprint | 范围 | 验收
-------|------|-----
S1 | 运单创建 + 状态机(created→assigned→picked_up→in_transit→delivered→completed) + 简单财务 | 完成闭环手工 finalCost
S2 | 导入/批量 + 异常流程 + 审计日志 | 可查询异常 & 恢复
S3 | 智能计费规则引擎 + 模板管理 + 实时计算 | 向导式规则创建
S4 | 权限管理 + 角色分配 + 细粒度控制 | 完整权限体系
S5 | 性能监控 + 系统告警 + 缓存管理 | 系统健康监控
S6 | 实时跟踪 + 路线优化 + 车辆维护 | 智能调度优化
S7 | 财务报告 + 数据分析 + 移动端 | 完整业务闭环
S8 | 司机端移动应用 + 工作量统计 | 司机能更新状态
S9 | 高级财务功能 + 多货币支持 | 应收应付一致性
S10 | 规则引擎优化 + 复杂定价 | estimatedCost 计算
S11 | 薪酬计算 + 复杂佣金规则 | 驱动可变佣金
S12 | 高级监控仪表板 + 智能调度 | 指标展示
S13 | 渠道接入(API/Webhook) | 可外部下单
S14 | 第三方集成 + 开放平台 | 生态建设
S15 | 国际化支持 + 多语言 | 全球化部署

---

## 15. 风险 & 缓解（V3.0.0 风险评估）

风险 | 影响 | 缓解
-----|------|-----
无报价上线后补加影响历史单 | 旧单缺少 estimatedCost | 创建时为空并记录 null；后期不回填
finalCost 人工错误 | 财务差错 | 双输入校验或允许二次审核
系统性能瓶颈 | 用户体验下降 | 性能监控和自动扩容
数据安全风险 | 数据泄露 | 权限控制和数据加密
第三方服务依赖 | 服务中断 | 多供应商备份和降级方案
数据库故障 | 数据丢失 | 自动备份和恢复机制
网络攻击 | 系统被攻击 | 安全防护和入侵检测
用户培训不足 | 使用效率低 | 完整培训文档和在线帮助
多包裹/多商品数据膨胀 | 查询性能 | 分页+聚合视图（计数与重量缓存）
司机滥用状态更新 | 数据失真 | 服务端状态合法链校验 + 频次限制
批量导入错误集中 | 运营效率 | 异步校验 + 错误报告下载
规则引入后性能 | 查询延迟 | 预编译 + 缓存 + 限制规则数
移动端兼容性 | 用户体验 | 响应式设计和兼容性测试
API 版本管理 | 集成问题 | 版本控制和向后兼容

---

## 16. 附录：示例运单 JSON（V3.0.0 完整实现）

```
{
  "id": "SHIP-20250923-001",
  "tenantId": "TEN-1",
  "shipmentNo": "TMS202509230001",
  "externalOrderNo": "EC-20250923-001",
  "salesChannel": "DIRECT",
  "status": "assigned",
  "tags": ["B2C"],
  "shipper": {
    "name": "Alice",
    "phone": "+14165550000",
    "address": {
      "country": "CA",
      "province": "Ontario",
      "city": "Toronto",
      "postalCode": "M5V1A1",
      "addressLine1": "228-8323 Kennedy Rd",
      "isResidential": false
    }
  },
  "receiver": {
    "name": "Bob",
    "phone": "+14165551111",
    "address": {
      "country": "CA",
      "province": "Ontario",
      "city": "Markham",
      "postalCode": "L3R5W7",
      "addressLine1": "88 Apple Ave",
      "isResidential": true
    }
  },
  "packages": [
    {
      "packageId": "PKG-1",
      "boxName": "BOX-A",
      "length": 30,
      "width": 20,
      "height": 15,
      "dimensionUnit": "cm",
      "weight": 3.25,
      "weightUnit": "kg",
      "declaredValue": 120.00,
      "currency": "CNY"
    }
  ],
  "items": [
    {
      "itemId": "ITEM-1",
      "sku": "SKU-1",
      "description": "brown leather handbag",
      "hsCode": "420221",
      "quantity": 2,
      "unitWeight": 1.2,
      "unitPrice": 60.00,
      "currency": "CNY"
    }
  ],
  "cargoType": "GENERAL",
  "fragile": true,
  "insured": false,
  "driverId": "DRIVER-7",
  "assignedAt": "2025-09-29 09:12:36T09:15:00Z",
  "estimatedCost": null,
  "pricingComponents": [],
  "pricingRuleTrace": [],
  "finalCost": null,
  "timeline": [
    { "eventType": "CREATED", "timestamp": "2025-09-29 09:12:36T09:00:00Z" },
    { "eventType": "DRIVER_ASSIGNED", "timestamp": "2025-09-29 09:12:36T09:15:00Z" }
  ],
  "createdAt": "2025-09-29 09:12:36T09:00:00Z",
  "updatedAt": "2025-09-29 09:12:36T09:15:00Z",
  "version": 3
}
```

---

## 15. 待进一步补充（后续 2.2 建议）

- 详细 DDL（字段类型/索引）
- 规则 DSL Schema（JSON Schema 定义）
- 驱动调度策略（未来：容量 / 距离 / 地理负载）
- 司机移动端交互与权限细化
- 异常分类代码表
- API 错误码标准

---

若需我继续输出 DDL 草案或规则 Schema，请告知下一步需求。  
（本文件已根据你的 3 点指令进行结构化修改与扩展。）

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 16. 角色与权限矩阵表（细化）

角色 | 页面访问 | 接口权限 | 对象级权限 | 字段级权限 | 审批/发布 | 导出 | 备注
-----|---------|---------|-----------|-----------|-----------|------|-----
系统管理员 | 全部 | 全部 | 全部 | 查看脱敏前 | 规则/租户设置 | 允许 | 平台级
租户管理员 | 全部（本租户） | 本租户全部 | 本租户全部 | 可申请敏感字段查看 | 规则发布（本租户） | 允许 | 最小化授权
运营/调度 | 运单/司机/看板 | 运单读写、分配 | 运单 R/W、司机分配 | 脱敏（电话仅末4位） | 无 | 允许 | 禁止财务改动
财务 | 运单/财务 | 财务记录读写 | 财务 R/W | 查看价格明细 | 过账审批 | 允许 | 金额敏感
客服 | 运单查看/查询 | 运单只读 | 运单 R | 脱敏 | 无 | 允许 | 无编辑
司机 | 司机移动端 | 自己相关接口 | 自己运单状态 R/W | 无敏感字段 | 无 | 否 | 仅自身
审计 | 审计报表/日志 | 查询接口 | 全部只读 | 可查看脱敏前（受合规控制） | 无 | 可导出 | 受留存策略
只读访客 | 基本看板 | 查询接口 | 部分对象只读 | 全部脱敏 | 无 | 否 | 用于演示/培训

原则：
- 最小权限原则；敏感字段（手机号、身份证、金额明细）默认脱敏显示；按需审批开通。
- 高风险操作（规则发布、批量导出、财务过账）需要双人审批与审计。

关键对象-操作矩阵（摘录）：
对象/操作 | 创建 | 编辑 | 查看 | 删除 | 导出 | 审批
----------|------|------|------|------|------|------
运单 | OPERATOR | OPERATOR | ALL | ADMIN/TENANT_ADMIN | OPERATOR/FINANCE/AUDITOR | -
规则(pricing/payroll) | ADMIN/TENANT_ADMIN | ADMIN/TENANT_ADMIN | ALL | ADMIN/TENANT_ADMIN | ADMIN/TENANT_ADMIN | ADMIN/TENANT_ADMIN
财务记录 | 系统生成 | FINANCE(调整) | FINANCE/AUDITOR/ADMIN | - | FINANCE/AUDITOR | FINANCE/ADMIN

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 17. 规则引擎 DSL & 条件/动作白名单

语法：
- 形式：`IF <expr> THEN <action>[, <action>...] [PRIORITY n] [LABEL "..."]`
- 组合：AND/OR，括号，最大嵌套深度 3；单规则最大长度 2KB；每次执行最多命中 20 条。
- 超时：单运单规则评估总时长 ≤ 100ms；每条 ≤ 10ms。

条件字段白名单（示例，按域分组）：
- 运单：`weight, volume, cargoType, pickup.city, delivery.city, distanceKm, createdAt`
- 客户：`customerId, customerTier`
- 司机：`driverId, driverLevel`（只读，不允许作为副作用条件修改）
- 环境：`tenantId, channel, weekday, timeOfDay`

操作符：`=, !=, >, >=, <, <=, IN, NOT IN, STARTS_WITH, ENDS_WITH, CONTAINS`

函数白名单（纯函数）：`round(v,d)`, `ceil(v)`, `floor(v)`, `min(a,b)`, `max(a,b)`, `rateLookup(table,key)`

动作白名单：
- 计费：`addFee(code, amount, currency)`, `applyDiscount(code, percent|amount)`, `setTax(percent)`, `setFinalPrice(amount)`
- 薪酬：`setDriverCommission(percent|amount)`
- 控制：`stopProcessing()`
- 禁止：数据库写入、外部 HTTP 调用、文件系统操作；外部通知需通过异步队列由后端统一网关触发。

安全与审计：规则版本化；输入/命中轨迹/输出明细脱敏存档≥365天；速率限制与租户级规则总量限额。

示例：
```
IF pickup.city = "上海" AND weight > 1000 THEN addFee("HEAVY", round(weight*0.2,2), "CNY")
IF customerTier IN ("VIP","GOLD") THEN applyDiscount("TIER", 0.05)
```

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 18. 运单字段完整表（类型/长度/验证）

字段 | 类型/长度 | 约束 | 验证/说明
-----|-----------|------|-----------
shipmentNo | STRING(20) | PK, 唯一, 必填 | 规则：TMSYYYYMMDDNNNN
tenantId | STRING(36) | 必填 | 多租户隔离
externalOrderNo | STRING(50) | 可空 | 第三方订单号
salesChannel | ENUM | 默认 DIRECT | 受控字典
status | ENUM | 必填 | created/assigned/...（详见状态机）
driverId | STRING(36) | 可空 | 分配后写入
shipper/receiver.name | STRING(50) | 必填 | 非空白
shipper/receiver.phone | STRING(20) | 必填 | E.164 或本地格式
addresses.* | STRING(2..200) | 必填 | ISO 国家 + 行政区 + 详细地址
packages[].length/width/height | DECIMAL(8,2) | >0 | 单位 cm
packages[].weight | DECIMAL(10,3) | >0 | 单位 kg
packages[].declaredValue | DECIMAL(12,2) | ≥0 | 币种 currency
items[].sku | STRING(40) | 可空 | -
items[].hsCode | STRING(4..10) | 可空 | 正则校验
estimatedCost | DECIMAL(12,2) | 可空 | 预估价
finalCost | DECIMAL(12,2) | 完成必填 | >=0
currency | STRING(3) | 默认 CNY | ISO 4217
timeline | JSON | 仅追加 | 事件追踪
audit fields | datetime/user | 自动 | createdAt/By, updatedAt/By
piiMasked | BOOLEAN | 默认 true | 前端展示脱敏

索引建议：`UNIQUE(shipmentNo)`, `INDEX(tenantId,status,createdAt)`, 视需要为城市建立前缀索引。

错误码：WB_1001(手机号无效)，WB_1002(重量/体积为负)，WB_1003(币种不支持)。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 19. 状态机图 + 异常恢复策略（细化）

主链：`created → assigned → picked_up → in_transit → delivered → completed`；分支：`exception`、`canceled`。

恢复策略：
- 幂等：所有状态更新需携带 `idempotencyKey`；重复提交不改变结果。
- 重试：网络/暂失败采用指数退避（最多 3 次）。
- 补偿：计费失败回滚变更，保持在 delivered；必要时人工介入。
- 回滚点：created/assigned/delivered 设置逻辑回滚点，exception 恢复到上一正常状态。

数据一致性：timeline 仅追加；完成前校验 finalCost；取消释放司机。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 20. 财务组件分解与示例计算（含税/折扣优先级）

组件：Base(基础价)、Fees(附加费)、Discounts(折扣)、Tax(税)、FX(汇率)、Rounding(舍入)。

推荐顺序（默认）：
1) Subtotal = Base + ΣFees  
2) AfterDiscount = round(Subtotal × (1 - D), 2)  
3) Total = round(AfterDiscount × (1 + Tax), 2)

可配置：支持“先税后折扣”作为租户协议选项，但需在审计中记录所用策略版本。

示例：Base=100, Fees=20, D=10%, Tax=13% → AfterDiscount=108.00 → Total=122.04。

幂等：使用（shipmentId + pricingVersion + paramsHash）作为计算幂等键；输出写入 financial_component，记录顺序与舍入前后值。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 21. 审计 & 幂等策略说明（细化）

审计范围：谁/何时/来源/对象/字段前后值；敏感字段脱敏存储；可导出报表（CSV/Parquet）。

幂等键设计：
- 创建：externalOrderNo+tenantId 或 idempotencyKey
- 状态更新：shipmentId+targetStatus+idempotencyKey
- 财务生成：shipmentId+type 唯一
- 规则发布：ruleId+version 唯一

留存：≥365 天；访问控制：AUDITOR 可见脱敏前（需审批）。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 22. 指标/监控 & 报警阈值（默认）

关键指标：
- API 成功率、P50/P95/P99 延迟（创建/状态更新/规则执行）
- dispatch_wait_time、pickup_delay_rate、completion_latency、exception_rate
- financial_gen_delay、audit_write_error_rate

默认阈值（可按环境调整）：
- 创建/状态更新 P95 < 300ms；成功率 > 99.5%
- 计费失败率 < 0.5%；审计落库失败率 < 0.1%
- 报警收敛：5 分钟窗口，抖动抑制；分级告警与值班轮值

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 23. 迭代 Roadmap & 风险登记表（汇总）

Roadmap（示例）：
- M1：状态机稳定 + 财务闭环 + 审计/幂等（本期）
- M2：导入/批量、异常仪表盘、权限细化矩阵落地
- M3：规则引擎 pricing MVP（只做预估） + 指标仪表板
- M4：payroll 规则 + 多币种/汇率

风险登记：
风险 | 概率 | 影响 | 等级 | 缓解
-----|------|------|------|-----
规则误配导致费用异常 | 中 | 高 | 高 | 审批+灰度+限额+回滚
状态机重复推进 | 中 | 中 | 中 | 幂等键+服务端校验
财务金额误差 | 低 | 高 | 中 | 版本化参数+双人复核+回放
性能瓶颈 | 中 | 中 | 中 | 压测+缓存+降级

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 24. 数据库 DDL 草案（核心表）

注：以下为逻辑 DDL 建议，实际以所选数据库方言为准（PostgreSQL 推荐）。

```sql
-- shipment（运单主表）
CREATE TABLE shipment (
  id               UUID PRIMARY KEY,
  tenant_id        UUID NOT NULL,
  shipment_no      VARCHAR(20) NOT NULL UNIQUE,
  external_order_no VARCHAR(50),
  sales_channel    VARCHAR(20) DEFAULT 'DIRECT',
  status           VARCHAR(20) NOT NULL,
  driver_id        UUID,
  estimated_cost   NUMERIC(12,2),
  final_cost       NUMERIC(12,2),
  cost_currency    CHAR(3) DEFAULT 'CNY',
  pricing_components JSONB DEFAULT '[]',
  pricing_rule_trace JSONB DEFAULT '[]',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by       UUID,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by       UUID
);
CREATE INDEX idx_shipment_tenant_status_created ON shipment(tenant_id, status, created_at DESC);

-- shipment_party（发/收件）
CREATE TABLE shipment_party (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  role VARCHAR(16) NOT NULL, -- SHIPPER/RECEIVER
  name VARCHAR(50) NOT NULL,
  company VARCHAR(80),
  contact_name VARCHAR(50),
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(80),
  country CHAR(2) NOT NULL,
  province VARCHAR(50),
  city VARCHAR(50) NOT NULL,
  postal_code VARCHAR(20),
  address_line1 VARCHAR(200) NOT NULL,
  address_line2 VARCHAR(200),
  is_residential BOOLEAN DEFAULT false
);
CREATE INDEX idx_party_shipment_role ON shipment_party(shipment_id, role);

-- shipment_package
CREATE TABLE shipment_package (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  box_name VARCHAR(40),
  length NUMERIC(8,2) NOT NULL,
  width  NUMERIC(8,2) NOT NULL,
  height NUMERIC(8,2) NOT NULL,
  dimension_unit VARCHAR(8) NOT NULL,
  weight NUMERIC(10,3) NOT NULL,
  weight_unit VARCHAR(8) NOT NULL,
  declared_value NUMERIC(12,2) DEFAULT 0,
  currency CHAR(3) DEFAULT 'CNY',
  remark VARCHAR(200)
);
CREATE INDEX idx_package_shipment ON shipment_package(shipment_id);

-- shipment_item（商品）
CREATE TABLE shipment_item (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  package_id UUID,
  sku VARCHAR(40),
  description VARCHAR(200),
  hs_code VARCHAR(10),
  quantity INTEGER NOT NULL,
  unit_weight NUMERIC(10,3),
  unit_price NUMERIC(12,2),
  currency CHAR(3) DEFAULT 'CNY',
  origin_country CHAR(2)
);
CREATE INDEX idx_item_shipment ON shipment_item(shipment_id);

-- shipment_timeline
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

-- financial_record
CREATE TABLE financial_record (
  id UUID PRIMARY KEY,
  shipment_id UUID NOT NULL REFERENCES shipment(id) ON DELETE CASCADE,
  type VARCHAR(16) NOT NULL, -- receivable/payable
  party_id UUID,
  amount NUMERIC(12,2) NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'CNY',
  status VARCHAR(16) NOT NULL DEFAULT 'pending',
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);
CREATE UNIQUE INDEX uq_financial_shipment_type ON financial_record(shipment_id, type);

-- financial_component
CREATE TABLE financial_component (
  id UUID PRIMARY KEY,
  financial_record_id UUID NOT NULL REFERENCES financial_record(id) ON DELETE CASCADE,
  code VARCHAR(32) NOT NULL,
  label VARCHAR(64),
  amount NUMERIC(12,2) NOT NULL,
  sequence INTEGER NOT NULL
);
CREATE INDEX idx_fin_comp_record ON financial_component(financial_record_id);

-- rule（预留）
CREATE TABLE rule (
  id UUID PRIMARY KEY,
  type VARCHAR(16) NOT NULL, -- pricing/payroll
  tenant_id UUID NOT NULL,
  priority INTEGER NOT NULL DEFAULT 0,
  conditions JSONB NOT NULL,
  actions JSONB NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_rule_tenant_type ON rule(tenant_id, type, enabled, priority DESC);

-- audit_log
CREATE TABLE audit_log (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(32) NOT NULL,
  entity_id UUID NOT NULL,
  field VARCHAR(64),
  old_value TEXT,
  new_value TEXT,
  actor_id UUID,
  actor_type VARCHAR(16),
  ts TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_entity_ts ON audit_log(entity_type, entity_id, ts DESC);
```

索引与约束建议：
- 避免跨租户扫描：所有核心查询均以 tenant_id 为首列建立复合索引。
- 时间序查询：timeline/financial 按 ts/created_at 降序索引。
- 金额字段 NUMERIC，统一两位小数，计算层控制舍入。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 25. 规则 DSL JSON Schema（建议）

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "Rule",
  "type": "object",
  "properties": {
    "id": { "type": "string" },
    "type": { "enum": ["pricing", "payroll"] },
    "tenantId": { "type": "string" },
    "priority": { "type": "integer", "minimum": 0 },
    "enabled": { "type": "boolean" },
    "conditions": {
      "type": "object",
      "properties": {
        "op": { "enum": ["AND", "OR"] },
        "children": {
          "type": "array",
          "items": {
            "anyOf": [
              { "$ref": "#/definitions/condition" },
              { "$ref": "#/definitions/group" }
            ]
          },
          "maxItems": 20
        }
      },
      "required": ["op", "children"]
    },
    "actions": {
      "type": "array",
      "items": { "$ref": "#/definitions/action" },
      "maxItems": 20
    }
  },
  "required": ["type", "tenantId", "priority", "conditions", "actions"],
  "definitions": {
    "condition": {
      "type": "object",
      "properties": {
        "field": { "type": "string" },
        "operator": { "enum": ["=","!=","<","<=",">",">=","IN","NOT_IN","STARTS_WITH","ENDS_WITH","CONTAINS"] },
        "value": {}
      },
      "required": ["field", "operator", "value"]
    },
    "group": {
      "type": "object",
      "properties": {
        "op": { "enum": ["AND", "OR"] },
        "children": { "type": "array", "items": { "$ref": "#/definitions/condition" } }
      },
      "required": ["op", "children"]
    },
    "action": {
      "type": "object",
      "properties": {
        "type": { "enum": ["addFee","applyDiscount","setTax","setFinalPrice","setDriverCommission","stopProcessing"] },
        "params": { "type": "object" }
      },
      "required": ["type"]
    }
  }
}
```

说明：仅允许白名单字段与动作；引擎加载时进行静态校验与限额检查。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 26. 驱动调度策略（初稿）

目标：在 created/unassigned 阶段，按“可用性、距离、负载”择优分配。

输入：shipment 起点/终点、包裹重量体积、时间窗；司机当前位置/状态/负载/能力（冷链）。

评价函数（示例）：
- score = w1×availability + w2×distanceScore + w3×loadScore + w4×capabilityMatch
- 可用性：在线且空闲 = 1，否则 0
- 距离分：近距离得分高（反比）
- 负载分：已分配数越少得分越高
- 能力匹配：要求冷链且司机支持=加分

约束：每名司机最大并发单数；同城优先；黑名单/白名单；人工 override。

输出：推荐 Top-N 司机列表；支持一键分配与人工选择。

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 27. 司机移动端交互与权限细化

功能：
- 登录与接单列表（仅本人）
- 查看运单要点（地址/联系人部分脱敏）
- 一键状态更新：picked_up / in_transit / delivered
- 上传签收照片/签收码（未来）

权限：
- 仅可访问 `assigned` 给自己的运单
- 不可查看费用明细/客户隐私完整信息
- 操作频次限制与位置校验（可选）

异常：
- 无网络离线缓存，恢复后补传
- 重复点击通过幂等键保证一次

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 28. 异常分类代码表（建议）

代码 | 名称 | 说明 | 是否终止
----|-----|-----|------
DELAY | 延迟 | 未按时取/送 | 否
DAMAGE | 货损 | 货物损坏 | 视严重度
LOST | 丢失 | 货物遗失 | 是
PARTIAL_LOSS | 部分丢失 | 部分货物缺失 | 视情况
ADDRESS_ISSUE | 地址问题 | 地址不详/错误 | 否
WEATHER | 天气 | 天灾导致无法按时 | 否
OTHER | 其他 | 其他异常 | 否

<!-- Added by assistant @ 2025-09-29 09:12:36 -->
## 29. API 错误码标准（建议）

结构：`{ code, message, details?, traceId }`

命名：
- 通用：`COM_4xx/5xx`
- 认证授权：`AUTH_4xx`
- 校验：`VAL_xxxx`
- 运单：`WB_xxxx`
- 财务：`FIN_xxxx`
- 规则：`RULE_xxxx`

示例：
- `VAL_1001` 参数缺失/格式错误
- `AUTH_401` 未授权
- `WB_1002` 重量/体积为负
- `FIN_2001` 金额不平衡
- `RULE_3001` 规则包含未授权字段

