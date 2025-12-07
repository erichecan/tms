# GitHub Issues 创建清单

**创建时间**: 2025-12-05  
**文档版本**: 1.0.0

本文档列出了根据 `docs/TMS_ISSUES_SUMMARY.md` 中的问题分类需要创建的 GitHub Issues。

---

## 🔴 P0 - Critical Bugs (紧急修复)

### Issue #1: Google Maps API 计费未启用导致功能受限
- **标题**: `[BUG] Google Maps API 计费未启用导致功能受限`
- **标签**: `bug`, `critical`, `google-maps`, `p0`, `frontend`
- **优先级**: P0
- **描述**: 地理编码、地址自动完成、距离计算等功能无法使用，影响核心功能
- **文件**: `apps/frontend/src/services/mapsService.ts`
- **解决方案**: 访问 Google Cloud Console 启用计费，启用必要的 API

### Issue #2: 数据库迁移和 Seed 数据问题
- **标题**: `[BUG] Neon 数据库权限不足，location_tracking 表无法创建`
- **标签**: `bug`, `critical`, `database`, `p0`, `backend`
- **优先级**: P0
- **描述**: location_tracking 表无法创建，影响位置历史和轨迹回放功能
- **文件**: `apps/backend/src/database/`
- **解决方案**: 授予数据库创建表权限，或使用 postgres 超级用户执行迁移

### Issue #3: 多租户数据隔离安全性检查
- **标题**: `[BUG] 多租户数据隔离安全性检查缺失`
- **标签**: `bug`, `critical`, `security`, `p0`, `backend`
- **优先级**: P0
- **描述**: 需要验证所有 API 都有 tenant_id 隔离，防止数据泄露
- **文件**: `apps/backend/src/routes/`, `apps/backend/src/services/`
- **解决方案**: 全面审查所有 API，确保 tenant_id 隔离

### Issue #4: 财务生成幂等性验证
- **标题**: `[BUG] 财务记录生成可能重复，需要验证幂等性`
- **标签**: `bug`, `critical`, `finance`, `p0`, `backend`
- **优先级**: P0
- **描述**: 财务记录生成可能重复，导致数据不一致
- **文件**: `apps/backend/src/services/FinanceService.ts`
- **解决方案**: 确保财务记录生成是幂等的，使用唯一约束

### Issue #5: 规则引擎权限检查在开发环境被绕过
- **标题**: `[BUG] 规则引擎权限检查在开发环境被绕过，存在安全隐患`
- **标签**: `bug`, `critical`, `security`, `rules`, `p0`, `backend`
- **优先级**: P0
- **描述**: 开发环境中权限检查被绕过，可能导致安全问题
- **文件**: `apps/backend/src/routes/ruleRoutes.ts`
- **解决方案**: 修复开发环境权限检查逻辑，确保安全性

---

## 🟠 P1 - High Priority Bugs (高优先级)

### Issue #6: 客户创建表单不一致
- **标题**: `[BUG] 客户管理页面和运单创建页面的客户创建表单不一致`
- **标签**: `bug`, `frontend`, `customer`, `p1`, `ux`
- **优先级**: P1
- **描述**: 两个页面的表单字段、验证规则不一致，影响用户体验和数据统一性
- **文件**: 
  - `apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx`
  - `apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx`
- **解决方案**: 创建统一的 `CustomerForm` 组件

### Issue #7: 司机创建表单不一致
- **标题**: `[BUG] 司机创建表单在多个位置不一致，可能导致数据不完整`
- **标签**: `bug`, `frontend`, `driver`, `p1`
- **优先级**: P1
- **描述**: 车队管理页面和运单详情页面的司机创建表单不一致，可能缺少驾照号等字段
- **文件**: 
  - `apps/frontend/src/pages/FleetManagement/FleetManagement.tsx`
  - `apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx`
- **解决方案**: 创建统一的 `DriverForm` 组件

### Issue #8: 车辆创建表单重复代码
- **标题**: `[REFACTOR] 车辆创建功能存在重复代码`
- **标签**: `refactor`, `frontend`, `vehicle`, `p1`
- **优先级**: P1
- **描述**: 车辆创建功能在两个地方有重复实现，维护困难
- **文件**: 
  - `apps/frontend/src/pages/FleetManagement/FleetManagement.tsx`
  - `apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx`
- **解决方案**: 创建统一的 `VehicleForm` 组件

### Issue #9: 地址输入格式不一致
- **标题**: `[BUG] 不同页面使用不同的地址格式，导致数据不统一`
- **标签**: `bug`, `frontend`, `address`, `p1`
- **优先级**: P1
- **描述**: 不同页面使用不同的地址格式（加拿大 vs 中国），地址数据格式不统一
- **文件**: 多个文件
- **解决方案**: 统一地址格式，创建地址工具函数

### Issue #10: 手机号验证规则不一致
- **标题**: `[BUG] 不同页面使用不同的手机号验证规则`
- **标签**: `bug`, `frontend`, `validation`, `p1`
- **优先级**: P1
- **描述**: 不同页面使用不同的手机号验证规则，数据质量不一致
- **解决方案**: 创建统一的验证规则工具

### Issue #11: 邮箱验证规则不一致
- **标题**: `[BUG] 邮箱验证规则在不同页面不一致`
- **标签**: `bug`, `frontend`, `validation`, `p1`
- **优先级**: P1
- **描述**: 客户管理页面邮箱可选，运单创建页面邮箱必填
- **文件**: 
  - `apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx`
  - `apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx`
- **解决方案**: 统一邮箱验证规则

### Issue #12: 运单详情货物信息显示问题
- **标题**: `[BUG] 运单详情页面货物信息显示不正确`
- **标签**: `bug`, `frontend`, `shipment`, `p1`
- **优先级**: P1
- **描述**: 只显示 `shipment.description`，但实际数据在 `cargoInfo` 中
- **文件**: `apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx`
- **解决方案**: 修复货物信息显示逻辑，正确读取 cargoInfo

### Issue #13: 运单时间线 API 错误处理
- **标题**: `[BUG] 运单时间线 API 在表不存在时返回 500 错误`
- **标签**: `bug`, `backend`, `api`, `p1`
- **优先级**: P1
- **描述**: timeline_events 表不存在时返回 500 错误，页面无法加载
- **文件**: `apps/backend/src/controllers/MvpShipmentController.ts`
- **状态**: 已部分修复，需要完善
- **解决方案**: 完善错误处理，返回空数组而不是 500 错误

---

## 🟡 P2 - Medium Priority

### Issue #14: ESLint 警告清理
- **标题**: `[REFACTOR] 清理 243 个 ESLint 警告`
- **标签**: `refactor`, `code-quality`, `p2`
- **优先级**: P2
- **描述**: 主要是未使用的变量和导入，影响代码质量
- **解决方案**: 移除未使用的导入和变量，或使用 `_` 前缀标记

### Issue #15: 表格列定义重复
- **标题**: `[REFACTOR] 表格列定义在多处重复，需要统一`
- **标签**: `refactor`, `frontend`, `table`, `p2`
- **优先级**: P2
- **描述**: 运单状态、客户等级等表格列定义在多处重复
- **解决方案**: 创建 `utils/tableColumns.tsx` 统一管理

### Issue #16: 状态标签渲染重复
- **标题**: `[REFACTOR] 状态标签渲染逻辑重复`
- **标签**: `refactor`, `frontend`, `p2`
- **优先级**: P2
- **描述**: 状态到颜色和文本的映射逻辑重复
- **解决方案**: 创建统一的状态渲染工具

### Issue #17: 成本核算 vs 财务管理数据可能重复
- **标题**: `[REFACTOR] 成本核算和财务管理数据可能重复`
- **标签**: `refactor`, `backend`, `finance`, `p2`
- **优先级**: P2
- **描述**: 维护费用可能在两个系统中都有记录，导致数据不一致
- **解决方案**: 通过 `reference_id` 关联，避免重复录入

### Issue #18: TODO 功能未实现
- **标题**: `[FEATURE] 实现所有 TODO 功能`
- **标签**: `feature`, `todo`, `p2`
- **优先级**: P2
- **描述**: 多个 TODO 功能未实现，包括客户搜索、状态筛选、排序等
- **TODO 列表**:
  - 客户搜索功能
  - 客户状态筛选
  - 客户排序
  - 生成结算单功能
  - 行程挂载逻辑
  - 手动添加工资记录
  - 离线操作同步

---

## 🟢 P3 - Low Priority

### Issue #19: 客户等级选项不一致
- **标题**: `[ENHANCEMENT] 统一客户等级选项`
- **标签**: `enhancement`, `frontend`, `p3`
- **优先级**: P3
- **描述**: 客户管理使用 vip1-5，运单创建使用 standard/premium/vip

### Issue #20: 国际化支持
- **标题**: `[FEATURE] 添加多语言国际化支持`
- **标签**: `enhancement`, `frontend`, `i18n`, `p3`
- **优先级**: P3
- **描述**: 需要多语言支持

### Issue #21: 移动端优化
- **标题**: `[ENHANCEMENT] 优化移动端用户体验`
- **标签**: `enhancement`, `mobile`, `p3`
- **优先级**: P3
- **描述**: 移动端体验需要优化

---

## 🔵 Refactoring Tasks

### Issue #22: 创建 CustomerForm 共享组件
- **标题**: `[REFACTOR] 创建 CustomerForm 共享组件`
- **标签**: `refactor`, `frontend`, `component`
- **优先级**: P1
- **描述**: 统一客户创建/编辑表单
- **文件**: `apps/frontend/src/components/CustomerForm/CustomerForm.tsx`

### Issue #23: 创建 DriverForm 共享组件
- **标题**: `[REFACTOR] 创建 DriverForm 共享组件`
- **标签**: `refactor`, `frontend`, `component`
- **优先级**: P1
- **描述**: 统一司机创建/编辑表单
- **文件**: `apps/frontend/src/components/DriverForm/DriverForm.tsx`

### Issue #24: 创建 VehicleForm 共享组件
- **标题**: `[REFACTOR] 创建 VehicleForm 共享组件`
- **标签**: `refactor`, `frontend`, `component`
- **优先级**: P1
- **描述**: 统一车辆创建/编辑表单
- **文件**: `apps/frontend/src/components/VehicleForm/VehicleForm.tsx`

### Issue #25: 创建地址工具函数
- **标题**: `[REFACTOR] 创建地址工具函数`
- **标签**: `refactor`, `frontend`, `utils`
- **优先级**: P1
- **描述**: 统一地址格式化和验证
- **文件**: `apps/frontend/src/utils/addressUtils.ts`

### Issue #26: 创建表格列定义工具
- **标题**: `[REFACTOR] 创建表格列定义工具`
- **标签**: `refactor`, `frontend`, `utils`
- **优先级**: P2
- **描述**: 统一表格列定义
- **文件**: `apps/frontend/src/utils/tableColumns.tsx`

### Issue #27: 创建验证规则工具
- **标题**: `[REFACTOR] 创建验证规则工具`
- **标签**: `refactor`, `frontend`, `utils`
- **优先级**: P1
- **描述**: 统一表单验证规则
- **文件**: `apps/frontend/src/utils/validationRules.ts`

---

## 🧪 Testing Tasks

### Issue #28: E2E 测试覆盖率提升
- **标题**: `[TEST] 提升 E2E 测试覆盖率`
- **标签**: `testing`, `e2e`
- **优先级**: P2
- **描述**: 增加 E2E 测试用例

### Issue #29: 单元测试覆盖率提升
- **标题**: `[TEST] 提升单元测试覆盖率`
- **标签**: `testing`, `unit`
- **优先级**: P2
- **描述**: 增加单元测试用例

---

## 📝 Documentation Tasks

### Issue #30: API 文档更新
- **标题**: `[DOCS] 更新 API 文档`
- **标签**: `documentation`, `api`
- **优先级**: P3
- **描述**: 更新 API 文档

### Issue #31: 用户手册编写
- **标题**: `[DOCS] 编写用户手册`
- **标签**: `documentation`, `user`
- **优先级**: P3
- **描述**: 编写用户手册

---

## 📋 Issue 创建脚本

可以使用以下命令批量创建 Issue（需要 GitHub CLI）:

```bash
# 安装 GitHub CLI
# brew install gh

# 登录
gh auth login

# 创建 Issue
gh issue create --title "[BUG] Google Maps API 计费未启用导致功能受限" \
  --body "地理编码、地址自动完成、距离计算等功能无法使用" \
  --label "bug,critical,google-maps,p0,frontend"
```

---

**最后更新**: 2025-12-05  
**维护者**: TMS 开发团队

