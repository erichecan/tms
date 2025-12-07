#!/bin/bash

# TMS 项目 GitHub Issues 完整批量创建脚本
# 使用方法: ./scripts/create-all-issues-complete.sh

REPO="erichecan/tms"
BODY_FILE=$(mktemp)
TOTAL_COUNT=0
SUCCESS_COUNT=0
FAILED_COUNT=0

echo "🚀 开始批量创建所有 GitHub Issues..."
echo ""

# 创建 Issue 函数
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    echo "[$TOTAL_COUNT] 创建: $title"
    
    # 写入 body 到临时文件
    echo -e "$body" > "$BODY_FILE"
    
    # 构建 gh 命令
    local cmd="gh issue create --repo \"$REPO\" --title \"$title\" --body-file \"$BODY_FILE\""
    
    # 添加 labels
    IFS=',' read -ra LABEL_ARRAY <<< "$labels"
    for label in "${LABEL_ARRAY[@]}"; do
        label=$(echo "$label" | xargs)  # 去除空格
        if [ -n "$label" ]; then
            cmd="$cmd --label \"$label\""
        fi
    done
    
    # 执行命令
    if eval "$cmd" > /dev/null 2>&1; then
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
        echo "  ✅ 成功"
        return 0
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        echo "  ❌ 失败 (可能是标签不存在，跳过该标签继续)"
        # 尝试不添加标签创建
        if gh issue create --repo "$REPO" --title "$title" --body-file "$BODY_FILE" > /dev/null 2>&1; then
            echo "  ⚠️  已创建但未添加标签"
            SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
            FAILED_COUNT=$((FAILED_COUNT - 1))
        fi
        return 1
    fi
}

# ==================== P0 - Critical Bugs ====================
echo "📝 创建 P0 Critical Issues..."

create_issue \
    "[BUG] Google Maps API 计费未启用导致功能受限" \
    "## 问题描述

地理编码、地址自动完成、距离计算等功能无法使用，影响核心功能。

## 影响

- 地图显示正常 ✅
- 地理编码功能 ❌ 需要计费
- 地址自动完成 ❌ 需要计费
- 距离计算 ❌ 需要计费

## 解决方案

1. 访问 Google Cloud Console
2. 为项目启用计费
3. 启用以下 API:
   - Maps JavaScript API
   - Geocoding API
   - Places API

## 相关文件

- \`apps/frontend/src/services/mapsService.ts\`

## 优先级

P0 - Critical" \
    "bug,critical,google-maps,p0,frontend"

sleep 1

create_issue \
    "[BUG] Neon 数据库权限不足，location_tracking 表无法创建" \
    "## 问题描述

location_tracking 表无法创建，影响位置历史和轨迹回放功能。

## 影响

无法查看位置历史和轨迹回放

## 解决方案

授予数据库创建表权限，或使用 postgres 超级用户执行迁移

## 相关文件

- \`apps/backend/src/database/\`

## 优先级

P0 - Critical" \
    "bug,critical,database,p0,backend"

sleep 1

create_issue \
    "[BUG] 多租户数据隔离安全性检查缺失" \
    "## 问题描述

需要验证所有 API 都有 tenant_id 隔离，防止数据泄露。

## 影响

数据安全风险

## 解决方案

全面审查所有 API，确保 tenant_id 隔离

## 相关文件

- \`apps/backend/src/routes/\`
- \`apps/backend/src/services/\`

## 优先级

P0 - Critical" \
    "bug,critical,security,p0,backend"

sleep 1

create_issue \
    "[BUG] 财务记录生成可能重复，需要验证幂等性" \
    "## 问题描述

财务记录生成可能重复，导致数据不一致。

## 影响

可能重复生成财务记录

## 解决方案

确保财务记录生成是幂等的，使用唯一约束

## 相关文件

- \`apps/backend/src/services/FinanceService.ts\`

## 优先级

P0 - Critical" \
    "bug,critical,finance,p0,backend"

sleep 1

create_issue \
    "[BUG] 规则引擎权限检查在开发环境被绕过，存在安全隐患" \
    "## 问题描述

开发环境中权限检查被绕过，可能导致安全问题。

## 影响

安全隐患

## 解决方案

修复开发环境权限检查逻辑，确保安全性

## 相关文件

- \`apps/backend/src/routes/ruleRoutes.ts\`

## 优先级

P0 - Critical" \
    "bug,critical,security,rules,p0,backend"

sleep 1

# ==================== P1 - High Priority ====================
echo ""
echo "📝 创建 P1 High Priority Issues..."

create_issue \
    "[BUG] 客户管理页面和运单创建页面的客户创建表单不一致" \
    "## 问题描述

两个页面的表单字段、验证规则不一致，影响用户体验和数据统一性。

## 影响

- 用户体验不一致
- 数据格式不统一
- 维护需要同时修改两处代码

## 解决方案

创建统一的 \`CustomerForm\` 组件

## 相关文件

- \`apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx\`
- \`apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,customer,p1,ux"

sleep 1

create_issue \
    "[BUG] 司机创建表单在多个位置不一致，可能导致数据不完整" \
    "## 问题描述

车队管理页面和运单详情页面的司机创建表单不一致，可能缺少驾照号等字段。

## 影响

- 司机数据可能不完整（缺少驾照号）
- 验证规则不一致
- 用户体验不一致

## 解决方案

创建统一的 \`DriverForm\` 组件

## 相关文件

- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`
- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,driver,p1"

sleep 1

create_issue \
    "[REFACTOR] 车辆创建功能存在重复代码" \
    "## 问题描述

车辆创建功能在两个地方有重复实现，维护困难。

## 影响

- 维护困难
- 可能产生不一致

## 解决方案

创建统一的 \`VehicleForm\` 组件

## 相关文件

- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`
- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High" \
    "refactor,frontend,vehicle,p1"

sleep 1

create_issue \
    "[BUG] 不同页面使用不同的地址格式，导致数据不统一" \
    "## 问题描述

不同页面使用不同的地址格式（加拿大 vs 中国），地址数据格式不统一。

## 影响

- 地址数据格式不统一
- 验证规则不一致
- 用户体验不一致

## 解决方案

统一地址格式，创建地址工具函数

## 相关文件

多个文件

## 优先级

P1 - High" \
    "bug,frontend,address,p1"

sleep 1

create_issue \
    "[BUG] 不同页面使用不同的手机号验证规则" \
    "## 问题描述

不同页面使用不同的手机号验证规则，数据质量不一致。

## 影响

数据质量不一致

## 解决方案

创建统一的验证规则工具

## 相关文件

多个文件

## 优先级

P1 - High" \
    "bug,frontend,validation,p1"

sleep 1

create_issue \
    "[BUG] 邮箱验证规则在不同页面不一致" \
    "## 问题描述

客户管理页面邮箱可选，运单创建页面邮箱必填。

## 影响

数据完整性不一致

## 相关文件

- \`apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx\`
- \`apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,validation,p1"

sleep 1

create_issue \
    "[BUG] 运单详情页面货物信息显示不正确" \
    "## 问题描述

只显示 \`shipment.description\`，但实际数据在 \`cargoInfo\` 中。

## 影响

货物信息无法正确显示

## 解决方案

修复货物信息显示逻辑，正确读取 cargoInfo

## 相关文件

- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,shipment,p1"

sleep 1

create_issue \
    "[BUG] 运单时间线 API 在表不存在时返回 500 错误" \
    "## 问题描述

timeline_events 表不存在时返回 500 错误，页面无法加载。

## 影响

页面无法加载

## 解决方案

完善错误处理，返回空数组而不是 500 错误

## 相关文件

- \`apps/backend/src/controllers/MvpShipmentController.ts\`

## 状态

已部分修复，需要完善

## 优先级

P1 - High" \
    "bug,backend,api,p1"

sleep 1

create_issue \
    "[BUG] 排班管理 isBetween 插件未导入（已修复）" \
    "## 问题描述

dayjs isBetween 插件未正确导入。

## 影响

排班管理功能无法使用

## 状态

✅ 已修复

## 相关文件

- \`apps/frontend/src/components/ScheduleManagement/ScheduleManagement.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,schedule,p1"

sleep 1

create_issue \
    "[BUG] Schedule Custom Fields API 500 错误（已部分修复）" \
    "## 问题描述

tenantId 获取方式不正确，表不存在时返回 500。

## 影响

排班管理无法加载自定义字段

## 状态

已部分修复

## 相关文件

- \`apps/backend/src/routes/scheduleCustomFieldRoutes.ts\`

## 优先级

P1 - High" \
    "bug,backend,api,p1"

sleep 1

create_issue \
    "[BUG] DriverPerformance 组件导入错误（已修复）" \
    "## 问题描述

组件名应为 DriverPayroll。

## 影响

页面无法加载

## 状态

✅ 已修复

## 相关文件

- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,p1"

sleep 1

create_issue \
    "[BUG] 挂载行程时重复消息提示（已修复）" \
    "## 问题描述

同时显示成功和失败消息。

## 影响

用户体验差

## 状态

✅ 已修复

## 相关文件

- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High" \
    "bug,frontend,ux,p1"

sleep 1

# ==================== P2 - Medium Priority ====================
echo ""
echo "📝 创建 P2 Medium Priority Issues..."

create_issue \
    "[REFACTOR] 清理 243 个 ESLint 警告" \
    "## 问题描述

主要是未使用的变量和导入，影响代码质量。

## 影响

代码质量下降

## 解决方案

移除未使用的导入和变量，或使用 \`_\` 前缀标记

## 优先级

P2 - Medium" \
    "refactor,code-quality,p2"

sleep 1

create_issue \
    "[REFACTOR] 表格列定义在多处重复，需要统一" \
    "## 问题描述

运单状态、客户等级等表格列定义在多处重复。

## 影响

状态显示可能不一致

## 解决方案

创建 \`utils/tableColumns.tsx\` 统一管理

## 优先级

P2 - Medium" \
    "refactor,frontend,table,p2"

sleep 1

create_issue \
    "[REFACTOR] 状态标签渲染逻辑重复" \
    "## 问题描述

状态到颜色和文本的映射逻辑重复。

## 影响

修改状态定义需要多处修改

## 解决方案

创建统一的状态渲染工具

## 优先级

P2 - Medium" \
    "refactor,frontend,p2"

sleep 1

create_issue \
    "[REFACTOR] 成本核算和财务管理数据可能重复" \
    "## 问题描述

维护费用可能在两个系统中都有记录，导致数据不一致。

## 影响

数据不一致

## 解决方案

通过 \`reference_id\` 关联，避免重复录入

## 相关文件

- \`apps/backend/src/services/FinanceService.ts\`

## 优先级

P2 - Medium" \
    "refactor,backend,finance,p2"

sleep 1

create_issue \
    "[REFACTOR] 站点管理和地址管理数据可能重复" \
    "## 问题描述

站点地址和运单地址可能重复存储。

## 影响

数据冗余

## 解决方案

建立关联关系，站点地址作为标准地址库

## 优先级

P2 - Medium" \
    "refactor,backend,data-model,p2"

sleep 1

create_issue \
    "[REFACTOR] 固定线路和路线优化概念重叠" \
    "## 问题描述

概念相似但用途不同，需要明确边界。

## 影响

功能理解混淆

## 解决方案

明确职责边界，数据复用

## 相关文件

- \`apps/backend/src/services/RouteOptimizationService.ts\`

## 优先级

P2 - Medium" \
    "refactor,backend,route,p2"

sleep 1

create_issue \
    "[FEATURE] 实现所有 TODO 功能" \
    "## 问题描述

多个 TODO 功能未实现。

## TODO 列表

- 客户搜索功能
- 客户状态筛选
- 客户排序
- 生成结算单功能
- 行程挂载逻辑
- 手动添加工资记录
- 离线操作同步

## 优先级

P2 - Medium" \
    "feature,todo,p2"

sleep 1

create_issue \
    "[BUG] 货币硬编码问题" \
    "## 问题描述

代码中硬编码 'CAD'，应该从运单获取。

## 影响

不够灵活

## 相关文件

- \`apps/backend/src/services/PricingFinancialIntegration.ts\`

## 优先级

P2 - Medium" \
    "bug,backend,p2"

sleep 1

create_issue \
    "[BUG] 客户等级硬编码问题" \
    "## 问题描述

客户等级硬编码为 'STANDARD'，应该从客户表获取。

## 影响

数据不准确

## 相关文件

- \`apps/backend/src/services/PricingFinancialIntegration.ts\`

## 优先级

P2 - Medium" \
    "bug,backend,p2"

sleep 1

create_issue \
    "[PERF] 规则引擎性能优化" \
    "## 问题描述

规则执行可能存在性能瓶颈。

## 影响

响应时间可能过长

## 相关文件

- \`apps/backend/src/services/PricingEngineService.ts\`

## 优先级

P2 - Medium" \
    "performance,backend,rules,p2"

sleep 1

create_issue \
    "[PERF] API 响应时间优化" \
    "## 问题描述

部分 API 响应时间可能超过 500ms 目标。

## 影响

用户体验下降

## 优先级

P2 - Medium" \
    "performance,backend,p2"

sleep 1

create_issue \
    "[PERF] 数据库查询优化" \
    "## 问题描述

可能存在 N+1 查询问题。

## 影响

数据库性能下降

## 优先级

P2 - Medium" \
    "performance,database,p2"

sleep 1

create_issue \
    "[PERF] 缓存策略优化" \
    "## 问题描述

需要完善 Redis 缓存策略。

## 影响

性能可能不佳

## 优先级

P2 - Medium" \
    "performance,cache,p2"

sleep 1

create_issue \
    "[REFACTOR] 错误处理和日志记录优化" \
    "## 问题描述

部分错误处理不完善，日志记录不一致。

## 影响

问题排查困难

## 优先级

P2 - Medium" \
    "refactor,backend,p2"

sleep 1

create_issue \
    "[REFACTOR] 代码注释时间戳格式不统一" \
    "## 问题描述

时间戳格式不一致（有些有，有些没有）。

## 影响

代码维护困难

## 优先级

P2 - Medium" \
    "refactor,code-quality,p2"

sleep 1

# ==================== P3 - Low Priority ====================
echo ""
echo "📝 创建 P3 Low Priority Issues..."

create_issue \
    "[ENHANCEMENT] 客户等级选项不一致" \
    "## 问题描述

客户管理使用 vip1-5，运单创建使用 standard/premium/vip。

## 影响

数据格式不统一

## 优先级

P3 - Low" \
    "enhancement,frontend,p3"

sleep 1

create_issue \
    "[FEATURE] 国际化支持" \
    "## 问题描述

需要多语言支持。

## 优先级

P3 - Low" \
    "enhancement,frontend,i18n,p3"

sleep 1

create_issue \
    "[ENHANCEMENT] 移动端优化" \
    "## 问题描述

移动端体验需要优化。

## 优先级

P3 - Low" \
    "enhancement,mobile,p3"

sleep 1

create_issue \
    "[FEATURE] 打印和导出功能增强" \
    "## 问题描述

需要更多导出格式（PDF、Excel）。

## 优先级

P3 - Low" \
    "enhancement,frontend,p3"

sleep 1

create_issue \
    "[FEATURE] 通知系统完善" \
    "## 问题描述

通知系统需要完善。

## 优先级

P3 - Low" \
    "enhancement,backend,p3"

sleep 1

create_issue \
    "[FEATURE] 审计日志查询界面" \
    "## 问题描述

需要审计日志查询界面。

## 优先级

P3 - Low" \
    "enhancement,frontend,p3"

sleep 1

create_issue \
    "[FEATURE] 数据备份和恢复自动化" \
    "## 问题描述

需要自动化数据备份和恢复。

## 优先级

P3 - Low" \
    "enhancement,backend,p3"

sleep 1

create_issue \
    "[FEATURE] 性能监控仪表板" \
    "## 问题描述

需要性能监控仪表板。

## 优先级

P3 - Low" \
    "enhancement,frontend,p3"

sleep 1

create_issue \
    "[TEST] 负载测试" \
    "## 问题描述

需要进行负载测试。

## 优先级

P3 - Low" \
    "testing,performance,p3"

sleep 1

create_issue \
    "[TEST] 安全测试" \
    "## 问题描述

需要进行安全测试。

## 优先级

P3 - Low" \
    "testing,security,p3"

sleep 1

create_issue \
    "[TEST] 代码覆盖率提升" \
    "## 问题描述

测试覆盖率需要提升。

## 优先级

P3 - Low" \
    "testing,p3"

sleep 1

create_issue \
    "[DOCS] API 文档自动生成" \
    "## 问题描述

需要自动生成 API 文档。

## 优先级

P3 - Low" \
    "documentation,p3"

sleep 1

create_issue \
    "[DOCS] 开发者文档完善" \
    "## 问题描述

需要更完善的开发者文档。

## 优先级

P3 - Low" \
    "documentation,p3"

sleep 1

create_issue \
    "[DOCS] 用户手册编写" \
    "## 问题描述

需要用户手册。

## 优先级

P3 - Low" \
    "documentation,p3"

sleep 1

create_issue \
    "[DOCS] 部署文档更新" \
    "## 问题描述

部署文档需要更新。

## 优先级

P3 - Low" \
    "documentation,p3"

sleep 1

# ==================== Refactoring Tasks ====================
echo ""
echo "📝 创建重构任务 Issues..."

create_issue \
    "[REFACTOR] 创建 CustomerForm 共享组件" \
    "## 问题描述

统一客户创建/编辑表单。

## 解决方案

创建 \`apps/frontend/src/components/CustomerForm/CustomerForm.tsx\`

## 优先级

P1 - High" \
    "refactor,frontend,component"

sleep 1

create_issue \
    "[REFACTOR] 创建 DriverForm 共享组件" \
    "## 问题描述

统一司机创建/编辑表单。

## 解决方案

创建 \`apps/frontend/src/components/DriverForm/DriverForm.tsx\`

## 优先级

P1 - High" \
    "refactor,frontend,component"

sleep 1

create_issue \
    "[REFACTOR] 创建 VehicleForm 共享组件" \
    "## 问题描述

统一车辆创建/编辑表单。

## 解决方案

创建 \`apps/frontend/src/components/VehicleForm/VehicleForm.tsx\`

## 优先级

P1 - High" \
    "refactor,frontend,component"

sleep 1

create_issue \
    "[REFACTOR] 创建地址工具函数" \
    "## 问题描述

统一地址格式化和验证。

## 解决方案

创建 \`apps/frontend/src/utils/addressUtils.ts\`

## 优先级

P1 - High" \
    "refactor,frontend,utils"

sleep 1

create_issue \
    "[REFACTOR] 创建表格列定义工具" \
    "## 问题描述

统一表格列定义。

## 解决方案

创建 \`apps/frontend/src/utils/tableColumns.tsx\`

## 优先级

P2 - Medium" \
    "refactor,frontend,utils"

sleep 1

create_issue \
    "[REFACTOR] 创建验证规则工具" \
    "## 问题描述

统一表单验证规则。

## 解决方案

创建 \`apps/frontend/src/utils/validationRules.ts\`

## 优先级

P1 - High" \
    "refactor,frontend,utils"

sleep 1

create_issue \
    "[REFACTOR] 重构 API 调用统一错误处理" \
    "## 问题描述

统一 API 错误处理逻辑。

## 解决方案

优化 \`apps/frontend/src/services/api.ts\`

## 优先级

P2 - Medium" \
    "refactor,frontend,api"

sleep 1

create_issue \
    "[REFACTOR] 重构状态管理" \
    "## 问题描述

优化状态管理，减少重复状态。

## 优先级

P2 - Medium" \
    "refactor,frontend"

sleep 1

create_issue \
    "[REFACTOR] 重构数据库服务层" \
    "## 问题描述

统一数据库操作，减少重复代码。

## 相关文件

- \`apps/backend/src/services/DatabaseService.ts\`

## 优先级

P2 - Medium" \
    "refactor,backend,database"

sleep 1

create_issue \
    "[REFACTOR] 重构规则引擎" \
    "## 问题描述

优化规则引擎性能和执行逻辑。

## 相关文件

- \`apps/backend/src/services/PricingEngineService.ts\`

## 优先级

P2 - Medium" \
    "refactor,backend,rules"

sleep 1

# ==================== Testing Tasks ====================
echo ""
echo "📝 创建测试任务 Issues..."

create_issue \
    "[TEST] E2E 测试覆盖率提升" \
    "## 问题描述

增加 E2E 测试用例。

## 优先级

P2 - Medium" \
    "testing,e2e,p2"

sleep 1

create_issue \
    "[TEST] 单元测试覆盖率提升" \
    "## 问题描述

增加单元测试用例。

## 优先级

P2 - Medium" \
    "testing,unit,p2"

sleep 1

create_issue \
    "[TEST] 集成测试完善" \
    "## 问题描述

增加集成测试用例。

## 优先级

P2 - Medium" \
    "testing,integration,p2"

sleep 1

create_issue \
    "[TEST] 性能测试" \
    "## 问题描述

进行性能测试和优化。

## 优先级

P2 - Medium" \
    "testing,performance,p2"

sleep 1

create_issue \
    "[TEST] 移动端测试" \
    "## 问题描述

增加移动端测试用例。

## 优先级

P3 - Low" \
    "testing,mobile,p3"

sleep 1

# 清理
rm -f "$BODY_FILE"

# 总结
echo ""
echo "=========================================="
echo "✅ Issues 批量创建完成！"
echo "=========================================="
echo "📊 统计:"
echo "   总数: $TOTAL_COUNT"
echo "   ✅ 成功: $SUCCESS_COUNT"
echo "   ❌ 失败: $FAILED_COUNT"
echo ""
echo "💡 下一步:"
echo "1. 查看 Issues: gh issue list --repo $REPO"
echo "2. 添加到 Project: https://github.com/users/erichecan/projects/2"
echo "3. 参考文档: docs/ADD_ISSUES_TO_PROJECT.md"
echo "=========================================="

