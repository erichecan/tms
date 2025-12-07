#!/bin/bash

# TMS 项目 GitHub Issues 批量创建脚本
# 使用方法: ./scripts/create-github-issues.sh

set -e

REPO="erichecan/tms"
PROJECT_NUMBER=2  # GitHub Project 编号

echo "🚀 开始创建 GitHub Issues..."

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 创建 Issue 函数
create_issue() {
    local title="$1"
    local body="$2"
    local labels="$3"
    local priority="$4"
    
    echo -e "${YELLOW}创建 Issue: ${title}${NC}"
    
    # 创建 issue 并获取 issue 编号
    local issue_number=$(gh issue create \
        --repo "$REPO" \
        --title "$title" \
        --body "$body" \
        --label "$labels" \
        --json number \
        --jq '.number')
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Issue #${issue_number} 创建成功: ${title}${NC}"
        echo "$issue_number" >> /tmp/created_issues.txt
        return 0
    else
        echo -e "${RED}❌ Issue 创建失败: ${title}${NC}"
        return 1
    fi
}

# 清空已创建 issues 列表
echo "" > /tmp/created_issues.txt

# P0 - Critical Bugs
echo -e "\n${RED}创建 P0 Critical Issues...${NC}"

create_issue \
    "[BUG] Google Maps API 计费未启用导致功能受限" \
    "## 问题描述\n\n地理编码、地址自动完成、距离计算等功能无法使用，影响核心功能。\n\n## 影响\n\n- 地图显示正常 ✅\n- 地理编码功能 ❌ 需要计费\n- 地址自动完成 ❌ 需要计费\n- 距离计算 ❌ 需要计费\n\n## 解决方案\n\n1. 访问 Google Cloud Console\n2. 为项目启用计费\n3. 启用以下 API:\n   - Maps JavaScript API\n   - Geocoding API\n   - Places API\n\n## 相关文件\n\n- \`apps/frontend/src/services/mapsService.ts\`\n\n## 优先级\n\nP0 - Critical" \
    "bug,critical,google-maps,p0,frontend" \
    "P0"

create_issue \
    "[BUG] Neon 数据库权限不足，location_tracking 表无法创建" \
    "## 问题描述\n\nlocation_tracking 表无法创建，影响位置历史和轨迹回放功能。\n\n## 影响\n\n无法查看位置历史和轨迹回放\n\n## 解决方案\n\n授予数据库创建表权限，或使用 postgres 超级用户执行迁移\n\n## 相关文件\n\n- \`apps/backend/src/database/\`\n\n## 优先级\n\nP0 - Critical" \
    "bug,critical,database,p0,backend" \
    "P0"

create_issue \
    "[BUG] 多租户数据隔离安全性检查缺失" \
    "## 问题描述\n\n需要验证所有 API 都有 tenant_id 隔离，防止数据泄露。\n\n## 影响\n\n数据安全风险\n\n## 解决方案\n\n全面审查所有 API，确保 tenant_id 隔离\n\n## 相关文件\n\n- \`apps/backend/src/routes/\`\n- \`apps/backend/src/services/\`\n\n## 优先级\n\nP0 - Critical" \
    "bug,critical,security,p0,backend" \
    "P0"

create_issue \
    "[BUG] 财务记录生成可能重复，需要验证幂等性" \
    "## 问题描述\n\n财务记录生成可能重复，导致数据不一致。\n\n## 影响\n\n可能重复生成财务记录\n\n## 解决方案\n\n确保财务记录生成是幂等的，使用唯一约束\n\n## 相关文件\n\n- \`apps/backend/src/services/FinanceService.ts\`\n\n## 优先级\n\nP0 - Critical" \
    "bug,critical,finance,p0,backend" \
    "P0"

create_issue \
    "[BUG] 规则引擎权限检查在开发环境被绕过，存在安全隐患" \
    "## 问题描述\n\n开发环境中权限检查被绕过，可能导致安全问题。\n\n## 影响\n\n安全隐患\n\n## 解决方案\n\n修复开发环境权限检查逻辑，确保安全性\n\n## 相关文件\n\n- \`apps/backend/src/routes/ruleRoutes.ts\`\n\n## 优先级\n\nP0 - Critical" \
    "bug,critical,security,rules,p0,backend" \
    "P0"

# P1 - High Priority Bugs
echo -e "\n${YELLOW}创建 P1 High Priority Issues...${NC}"

create_issue \
    "[BUG] 客户管理页面和运单创建页面的客户创建表单不一致" \
    "## 问题描述\n\n两个页面的表单字段、验证规则不一致，影响用户体验和数据统一性。\n\n## 影响\n\n- 用户体验不一致\n- 数据格式不统一\n- 维护需要同时修改两处代码\n\n## 解决方案\n\n创建统一的 \`CustomerForm\` 组件\n\n## 相关文件\n\n- \`apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx\`\n- \`apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx\`\n\n## 优先级\n\nP1 - High" \
    "bug,frontend,customer,p1,ux" \
    "P1"

create_issue \
    "[BUG] 司机创建表单在多个位置不一致，可能导致数据不完整" \
    "## 问题描述\n\n车队管理页面和运单详情页面的司机创建表单不一致，可能缺少驾照号等字段。\n\n## 影响\n\n- 司机数据可能不完整（缺少驾照号）\n- 验证规则不一致\n- 用户体验不一致\n\n## 解决方案\n\n创建统一的 \`DriverForm\` 组件\n\n## 相关文件\n\n- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`\n- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`\n\n## 优先级\n\nP1 - High" \
    "bug,frontend,driver,p1" \
    "P1"

create_issue \
    "[REFACTOR] 车辆创建功能存在重复代码" \
    "## 问题描述\n\n车辆创建功能在两个地方有重复实现，维护困难。\n\n## 影响\n\n- 维护困难\n- 可能产生不一致\n\n## 解决方案\n\n创建统一的 \`VehicleForm\` 组件\n\n## 相关文件\n\n- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`\n- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`\n\n## 优先级\n\nP1 - High" \
    "refactor,frontend,vehicle,p1" \
    "P1"

create_issue \
    "[BUG] 不同页面使用不同的地址格式，导致数据不统一" \
    "## 问题描述\n\n不同页面使用不同的地址格式（加拿大 vs 中国），地址数据格式不统一。\n\n## 影响\n\n- 地址数据格式不统一\n- 验证规则不一致\n- 用户体验不一致\n\n## 解决方案\n\n统一地址格式，创建地址工具函数\n\n## 相关文件\n\n多个文件\n\n## 优先级\n\nP1 - High" \
    "bug,frontend,address,p1" \
    "P1"

create_issue \
    "[BUG] 不同页面使用不同的手机号验证规则" \
    "## 问题描述\n\n不同页面使用不同的手机号验证规则，数据质量不一致。\n\n## 影响\n\n数据质量不一致\n\n## 解决方案\n\n创建统一的验证规则工具\n\n## 相关文件\n\n多个文件\n\n## 优先级\n\nP1 - High" \
    "bug,frontend,validation,p1" \
    "P1"

create_issue \
    "[BUG] 邮箱验证规则在不同页面不一致" \
    "## 问题描述\n\n客户管理页面邮箱可选，运单创建页面邮箱必填。\n\n## 影响\n\n数据完整性不一致\n\n## 相关文件\n\n- \`apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx\`\n- \`apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx\`\n\n## 优先级\n\nP1 - High" \
    "bug,frontend,validation,p1" \
    "P1"

create_issue \
    "[BUG] 运单详情页面货物信息显示不正确" \
    "## 问题描述\n\n只显示 \`shipment.description\`，但实际数据在 \`cargoInfo\` 中。\n\n## 影响\n\n货物信息无法正确显示\n\n## 解决方案\n\n修复货物信息显示逻辑，正确读取 cargoInfo\n\n## 相关文件\n\n- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`\n\n## 优先级\n\nP1 - High" \
    "bug,frontend,shipment,p1" \
    "P1"

create_issue \
    "[BUG] 运单时间线 API 在表不存在时返回 500 错误" \
    "## 问题描述\n\ntimeline_events 表不存在时返回 500 错误，页面无法加载。\n\n## 影响\n\n页面无法加载\n\n## 解决方案\n\n完善错误处理，返回空数组而不是 500 错误\n\n## 相关文件\n\n- \`apps/backend/src/controllers/MvpShipmentController.ts\`\n\n## 状态\n\n已部分修复，需要完善\n\n## 优先级\n\nP1 - High" \
    "bug,backend,api,p1" \
    "P1"

echo -e "\n${GREEN}✅ Issues 创建完成！${NC}"
echo -e "\n创建的 Issues 列表保存在: /tmp/created_issues.txt"

# 显示创建的 issues 列表
echo -e "\n📋 创建的 Issues:"
cat /tmp/created_issues.txt | while read issue_num; do
    echo "  - Issue #${issue_num}"
done

echo -e "\n💡 提示: 可以使用以下命令将 Issues 添加到 GitHub Project:"
echo "  gh project item-add $PROJECT_NUMBER --owner erichecan --url https://github.com/erichecan/tms/issues/NUMBER"

