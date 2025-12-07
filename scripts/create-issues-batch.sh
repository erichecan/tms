#!/bin/bash

# TMS 项目 GitHub Issues 批量创建脚本
# 使用方法: ./scripts/create-issues-batch.sh

set -e

REPO="erichecan/tms"
OUTPUT_FILE="created_issues.json"

echo "🚀 开始创建 GitHub Issues..."
echo ""

# 创建临时文件存储 issue body
BODY_FILE=$(mktemp)

# P0 Issues
echo "📝 创建 P0 Critical Issues..."

# Issue 1
cat > "$BODY_FILE" << 'EOF'
## 问题描述

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

- `apps/frontend/src/services/mapsService.ts`

## 优先级

P0 - Critical
EOF

gh issue create \
  --repo "$REPO" \
  --title "[BUG] Google Maps API 计费未启用导致功能受限" \
  --body-file "$BODY_FILE" \
  --label "bug" --label "critical" --label "google-maps" --label "p0" --label "frontend" \
  >> /tmp/created_issues.txt 2>&1 || true

echo "✅ Issue 1 创建完成"
sleep 1

# Issue 2
cat > "$BODY_FILE" << 'EOF'
## 问题描述

location_tracking 表无法创建，影响位置历史和轨迹回放功能。

## 影响

无法查看位置历史和轨迹回放

## 解决方案

授予数据库创建表权限，或使用 postgres 超级用户执行迁移

## 相关文件

- `apps/backend/src/database/`

## 优先级

P0 - Critical
EOF

gh issue create \
  --repo "$REPO" \
  --title "[BUG] Neon 数据库权限不足，location_tracking 表无法创建" \
  --body-file "$BODY_FILE" \
  --label "bug" --label "critical" --label "database" --label "p0" --label "backend" \
  >> /tmp/created_issues.txt 2>&1 || true

echo "✅ Issue 2 创建完成"
sleep 1

# Issue 3
cat > "$BODY_FILE" << 'EOF'
## 问题描述

需要验证所有 API 都有 tenant_id 隔离，防止数据泄露。

## 影响

数据安全风险

## 解决方案

全面审查所有 API，确保 tenant_id 隔离

## 相关文件

- `apps/backend/src/routes/`
- `apps/backend/src/services/`

## 优先级

P0 - Critical
EOF

gh issue create \
  --repo "$REPO" \
  --title "[BUG] 多租户数据隔离安全性检查缺失" \
  --body-file "$BODY_FILE" \
  --label "bug" --label "critical" --label "security" --label "p0" --label "backend" \
  >> /tmp/created_issues.txt 2>&1 || true

echo "✅ Issue 3 创建完成"
sleep 1

# Issue 4
cat > "$BODY_FILE" << 'EOF'
## 问题描述

财务记录生成可能重复，导致数据不一致。

## 影响

可能重复生成财务记录

## 解决方案

确保财务记录生成是幂等的，使用唯一约束

## 相关文件

- `apps/backend/src/services/FinanceService.ts`

## 优先级

P0 - Critical
EOF

gh issue create \
  --repo "$REPO" \
  --title "[BUG] 财务记录生成可能重复，需要验证幂等性" \
  --body-file "$BODY_FILE" \
  --label "bug" --label "critical" --label "finance" --label "p0" --label "backend" \
  >> /tmp/created_issues.txt 2>&1 || true

echo "✅ Issue 4 创建完成"
sleep 1

# Issue 5
cat > "$BODY_FILE" << 'EOF'
## 问题描述

开发环境中权限检查被绕过，可能导致安全问题。

## 影响

安全隐患

## 解决方案

修复开发环境权限检查逻辑，确保安全性

## 相关文件

- `apps/backend/src/routes/ruleRoutes.ts`

## 优先级

P0 - Critical
EOF

gh issue create \
  --repo "$REPO" \
  --title "[BUG] 规则引擎权限检查在开发环境被绕过，存在安全隐患" \
  --body-file "$BODY_FILE" \
  --label "bug" --label "critical" --label "security" --label "rules" --label "p0" --label "backend" \
  >> /tmp/created_issues.txt 2>&1 || true

echo "✅ Issue 5 创建完成"
sleep 1

# P1 Issues
echo ""
echo "📝 创建 P1 High Priority Issues..."

# Issue 6
cat > "$BODY_FILE" << 'EOF'
## 问题描述

两个页面的表单字段、验证规则不一致，影响用户体验和数据统一性。

## 影响

- 用户体验不一致
- 数据格式不统一
- 维护需要同时修改两处代码

## 解决方案

创建统一的 `CustomerForm` 组件

## 相关文件

- `apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx`
- `apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx`

## 优先级

P1 - High
EOF

gh issue create \
  --repo "$REPO" \
  --title "[BUG] 客户管理页面和运单创建页面的客户创建表单不一致" \
  --body-file "$BODY_FILE" \
  --label "bug" --label "frontend" --label "customer" --label "p1" --label "ux" \
  >> /tmp/created_issues.txt 2>&1 || true

echo "✅ Issue 6 创建完成"
sleep 1

# 清理临时文件
rm -f "$BODY_FILE"

echo ""
echo "✅ 主要 Issues 创建完成！"
echo ""
echo "💡 提示:"
echo "1. 查看创建结果: gh issue list --repo $REPO"
echo "2. 将 Issues 添加到 Project: 在 GitHub Project 页面手动添加，或使用 GitHub API"
echo "3. 完整 Issues 列表请参考: docs/GITHUB_ISSUES_LIST.md"

