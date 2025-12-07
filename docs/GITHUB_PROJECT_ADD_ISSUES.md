# 将 Issues 添加到 GitHub Project 指南

**创建时间**: 2025-12-05

---

## ✅ Issues 创建状态

**已成功创建 63 个 Issues！** 🎉

查看所有 Issues: https://github.com/erichecan/tms/issues

---

## 📋 批量添加到 Project 的方法

### 方法一：使用 GitHub Web 界面（推荐，最简单）

#### 步骤：

1. **打开 GitHub Project**
   ```
   https://github.com/users/erichecan/projects/2/views/1
   ```

2. **添加 Issues**
   - 点击 Project 页面右上角的 `+` 按钮
   - 选择 "Add items"
   - 在搜索框中输入以下内容来过滤 Issues：

   **按优先级搜索**:
   - `is:issue repo:erichecan/tms label:p0` - 所有 P0 Critical Issues (5个)
   - `is:issue repo:erichecan/tms label:p1` - 所有 P1 High Priority Issues (12个)
   - `is:issue repo:erichecan/tms label:p2` - 所有 P2 Medium Priority Issues (约25个)
   - `is:issue repo:erichecan/tms label:p3` - 所有 P3 Low Priority Issues (约35个)

   **按类型搜索**:
   - `is:issue repo:erichecan/tms label:bug` - 所有 Bug Issues
   - `is:issue repo:erichecan/tms label:refactor` - 所有重构 Issues
   - `is:issue repo:erichecan/tms label:enhancement` - 所有功能增强 Issues

   **全部 Issues**:
   - `is:issue repo:erichecan/tms` - 所有 Issues

3. **批量选择并添加**
   - 搜索结果会显示所有匹配的 Issues
   - 使用 `Shift + 点击` 或 `Ctrl/Cmd + 点击` 选择多个 Issues
   - 点击 "Add to project" 按钮

4. **组织 Issues**
   - 在 Project 中创建列来组织 Issues：
     - 📋 Backlog
     - 🔴 P0 Critical
     - 🟠 P1 High
     - 🟡 P2 Medium
     - 🟢 P3 Low
     - 🚧 In Progress
     - ✅ Done

---

### 方法二：使用 GitHub API（需要 Personal Access Token）

如果你有 GitHub Personal Access Token 并设置了 `project` 权限：

```bash
# 1. 设置环境变量
export GITHUB_TOKEN="your-token-here"

# 2. 获取 Project ID
PROJECT_ID=$(gh api graphql -f query='
  query($org: String!, $number: Int!) {
    organization(login: $org) {
      projectV2(number: $number) {
        id
      }
    }
  }' -f org=erichecan -f number=2 --jq '.data.organization.projectV2.id')

echo "Project ID: $PROJECT_ID"

# 3. 批量添加 Issues
for ISSUE_NUM in $(gh issue list --repo erichecan/tms --json number -q '.[].number'); do
  ISSUE_ID=$(gh api graphql -f query='
    query($repo: String!, $number: Int!) {
      repository(owner: "erichecan", name: "tms") {
        issue(number: $number) {
          id
        }
      }
    }' -f repo=tms -f number=$ISSUE_NUM --jq '.data.repository.issue.id')
  
  echo "Adding Issue #$ISSUE_NUM to Project..."
  gh api graphql -f query='
    mutation($project: ID!, $item: ID!) {
      addProjectV2ItemById(input: {projectId: $project, itemId: $item}) {
        item {
          id
        }
      }
    }' -f project="$PROJECT_ID" -f item="$ISSUE_ID"
  
  sleep 0.3  # 避免速率限制
done
```

---

### 方法三：手动拖拽（适合少量 Issues）

1. 打开 Project 页面
2. 在浏览器中打开 Issues 列表页面
3. 直接拖拽 Issues 卡片到 Project 中

---

## 📊 Issues 统计

根据创建结果：

| 优先级 | 数量 | Issues 编号范围 |
|--------|------|----------------|
| P0 - Critical | 5 | #3, #4, #5, #6, #7 |
| P1 - High | 12 | #8 - #19 |
| P2 - Medium | 25 | #20 - #44 |
| P3 - Low | 14 | #45 - #58 |
| 重构任务 | 10 | #59 - #68 |
| 测试任务 | 5 | #69 - #73 |

**总计**: 63 个 Issues

---

## 🎯 快速添加步骤（推荐）

### 最快的方法：

1. **打开 Project**: https://github.com/users/erichecan/projects/2

2. **一次性添加所有 Issues**:
   - 点击 `+` → "Add items"
   - 搜索: `is:issue repo:erichecan/tms state:open`
   - 选择所有 Issues（使用 `Ctrl/Cmd + A` 全选）
   - 点击 "Add to project"

3. **按优先级组织**:
   - 使用 Project 的过滤器功能
   - 创建过滤器: `label:p0`、`label:p1`、`label:p2`、`label:p3`
   - 或手动拖拽到不同的列

---

## 💡 提示

1. **批量操作**: GitHub Web 界面支持批量选择和操作，这是最快的方法

2. **过滤器**: 使用 Project 的过滤器可以：
   - 按优先级分组（p0, p1, p2, p3）
   - 按标签分组（bug, feature, refactor）
   - 按模块分组（shipment, customer, driver 等）

3. **自动化**: 如果经常需要添加 Issues，可以：
   - 在 GitHub Project 设置中启用 "Auto-add items"
   - 使用 GitHub Actions 自动添加新创建的 Issues

---

## 🔗 相关链接

- [GitHub Project 页面](https://github.com/users/erichecan/projects/2)
- [所有 Issues 列表](https://github.com/erichecan/tms/issues)
- [GitHub Project 文档](https://docs.github.com/en/issues/planning-and-tracking-with-projects)

---

**最后更新**: 2025-12-05

