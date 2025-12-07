# 将 Issues 添加到 GitHub Project 指南

**创建时间**: 2025-12-05

---

## 📋 概述

本文档说明如何将已创建的 Issues 批量添加到 GitHub Project 中。

---

## 🎯 方法一：使用 GitHub Web 界面（推荐）

### 步骤：

1. **打开 GitHub Project**
   - 访问: https://github.com/users/erichecan/projects/2
   - 或通过 Repository → Projects → 选择项目

2. **添加 Issues 到 Project**
   - 点击 Project 页面右上角的 `+` 按钮
   - 选择 "Add items"
   - 在搜索框中输入 `is:issue` 或具体的 issue 编号
   - 选择要添加的 Issues
   - 点击 "Add to project"

### 批量添加技巧：

- 搜索 `is:issue label:p0` 可以找到所有 P0 的 Issues
- 搜索 `is:issue label:p1` 可以找到所有 P1 的 Issues
- 可以通过拖拽的方式组织 Issues 到不同的列

---

## 🔧 方法二：使用 GitHub CLI（需要 Project API 权限）

### 步骤：

1. **刷新 GitHub CLI 权限**
   ```bash
   gh auth refresh --hostname github.com -s read:project,write:project
   ```

2. **批量添加 Issues 到 Project**

创建脚本 `scripts/add-issues-to-project.sh`:

```bash
#!/bin/bash

REPO="erichecan/tms"
PROJECT_NUMBER=2

# 获取所有 issues
ISSUES=$(gh issue list --repo "$REPO" --json number --jq '.[].number')

for ISSUE_NUM in $ISSUES; do
    echo "添加 Issue #$ISSUE_NUM 到 Project..."
    gh project item-add "$PROJECT_NUMBER" \
        --owner erichecan \
        --url "https://github.com/$REPO/issues/$ISSUE_NUM" \
        || echo "⚠️  Issue #$ISSUE_NUM 添加失败（可能已经存在）"
    sleep 0.5  # 避免速率限制
done

echo "✅ 完成！"
```

3. **运行脚本**
   ```bash
   chmod +x scripts/add-issues-to-project.sh
   ./scripts/add-issues-to-project.sh
   ```

---

## 📝 方法三：使用 GitHub API（最灵活）

### 步骤：

1. **创建 GitHub Personal Access Token**
   - 访问: https://github.com/settings/tokens
   - 创建新 token，勾选 `project` 权限

2. **使用 API 添加**

创建脚本 `scripts/add-to-project-api.sh`:

```bash
#!/bin/bash

REPO="erichecan/tms"
PROJECT_NUMBER=2
GITHUB_TOKEN="your-token-here"  # 替换为你的 token

# 获取 Project 信息
PROJECT_ID=$(gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        id
      }
    }
  }' -f org=erichecan -f number=$PROJECT_NUMBER --jq '.data.organization.projectV2.id')

echo "Project ID: $PROJECT_ID"

# 获取所有 issues
ISSUES=$(gh issue list --repo "$REPO" --json id,number --jq '.[] | "\(.id)|\(.number)"')

for ISSUE_INFO in $ISSUES; do
    ISSUE_ID=$(echo $ISSUE_INFO | cut -d'|' -f1)
    ISSUE_NUM=$(echo $ISSUE_INFO | cut -d'|' -f2)
    
    echo "添加 Issue #$ISSUE_NUM 到 Project..."
    
    gh api graphql -f query='
      mutation($project: ID!, $item: ID!) {
        addProjectV2ItemById(input: {projectId: $project, itemId: $item}) {
          item {
            id
          }
        }
      }' -f project="$PROJECT_ID" -f item="$ISSUE_ID" \
      || echo "⚠️  Issue #$ISSUE_NUM 添加失败"
    
    sleep 0.5
done

echo "✅ 完成！"
```

---

## 🚀 快速添加（推荐）

### 最简单的方法：

1. **打开 GitHub Project 页面**
   ```
   https://github.com/users/erichecan/projects/2/views/1
   ```

2. **使用搜索过滤**
   - 在搜索框输入: `is:issue repo:erichecan/tms`
   - 或按标签: `is:issue repo:erichecan/tms label:p0`
   - 或按标题: `is:issue repo:erichecan/tms "[BUG]"`

3. **批量选择并添加**
   - 使用 Shift + 点击选择多个 Issues
   - 拖拽到 Project 中
   - 或使用 "Add items" 功能

---

## 📊 已创建的 Issues 列表

根据脚本执行，以下 Issues 已创建：

### P0 - Critical (5 个)
- ✅ [BUG] Google Maps API 计费未启用导致功能受限
- ✅ [BUG] Neon 数据库权限不足，location_tracking 表无法创建
- ✅ [BUG] 多租户数据隔离安全性检查缺失
- ✅ [BUG] 财务记录生成可能重复，需要验证幂等性
- ✅ [BUG] 规则引擎权限检查在开发环境被绕过，存在安全隐患

### P1 - High Priority (1 个，更多待创建)
- ✅ [BUG] 客户管理页面和运单创建页面的客户创建表单不一致

---

## 💡 提示

1. **批量添加**: GitHub Web 界面支持批量选择和添加，这是最快的方法

2. **自动组织**: 创建 Issues 时已添加了标签（p0, p1, p2, p3），可以通过标签筛选和分组

3. **项目列**: 建议在 Project 中创建以下列：
   - 📋 Backlog
   - 🔴 P0 Critical
   - 🟠 P1 High
   - 🟡 P2 Medium
   - 🟢 P3 Low
   - ✅ Done

4. **过滤器**: 使用 Project 的过滤器功能，可以：
   - 按优先级分组
   - 按标签分组
   - 按负责人分组
   - 按状态分组

---

## 🔗 相关链接

- [GitHub Project 文档](https://docs.github.com/en/issues/planning-and-tracking-with-projects)
- [GitHub CLI 文档](https://cli.github.com/manual/)
- [GitHub API 文档](https://docs.github.com/en/rest)

---

**最后更新**: 2025-12-05

