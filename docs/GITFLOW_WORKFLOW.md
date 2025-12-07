# TMS 项目 GitFlow 工作流程

**创建时间**: 2025-12-05  
**文档版本**: 1.0.0

---

## 📋 目录

1. [概述](#概述)
2. [分支结构](#分支结构)
3. [分支命名规范](#分支命名规范)
4. [工作流程](#工作流程)
5. [Pull Request 流程](#pull-request-流程)
6. [禁止的操作](#禁止的操作)
7. [分支保护规则](#分支保护规则)
8. [最佳实践](#最佳实践)
9. [自动化规则](#自动化规则)
10. [当前项目迁移建议](#当前项目迁移建议)

---

## 概述

### 为什么使用 GitFlow？

1. ✅ **并行开发**: 支持同时开发多个功能，互不干扰
2. ✅ **稳定发布**: `main` 分支始终保持可发布状态
3. ✅ **测试隔离**: 每个功能在独立分支中测试
4. ✅ **代码审查**: 通过 Pull Request 进行代码审查
5. ✅ **回滚容易**: 出问题可以快速回滚

---

## 分支结构

### 核心分支（长期存在）

```
main          ← 生产环境代码（稳定，可随时发布）
develop       ← 开发主分支（集成分支）
```

### 功能分支（临时分支）

```
feature/xxx   ← 新功能开发
fix/xxx       ← Bug 修复
test/xxx      ← 测试相关
hotfix/xxx    ← 紧急修复（从 main 分支创建）
refactor/xxx  ← 代码重构
docs/xxx      ← 文档更新
chore/xxx     ← 构建/工具/配置更新
```

---

## 分支命名规范

### TMS 项目特定命名规范

#### 1. 功能分支 (feature)

格式: `feature/<模块>-<简短描述>`

**模块前缀**:
- `shipment` - 运单管理
- `customer` - 客户管理
- `driver` - 司机管理
- `vehicle` - 车辆管理
- `finance` - 财务管理
- `pricing` - 定价引擎
- `rule` - 规则管理
- `fleet` - 车队管理
- `schedule` - 排班管理
- `auth` - 认证授权
- `api` - API 相关
- `ui` - UI/UX 相关
- `mobile` - 移动端

**示例**:
```bash
feature/shipment-create-form
feature/customer-unified-form
feature/finance-payment-records
feature/pricing-rule-wizard
feature/mobile-driver-dashboard
feature/ui-customer-table
```

#### 2. Bug 修复分支 (fix)

格式: `fix/<模块>-<简短描述>`

**示例**:
```bash
fix/shipment-timeline-api
fix/customer-phone-validation
fix/driver-assignment-logic
fix/google-maps-api-key
fix/finance-calculation-bug
```

#### 3. 重构分支 (refactor)

格式: `refactor/<模块>-<简短描述>`

**示例**:
```bash
refactor/customer-form-component
refactor/api-error-handling
refactor/database-service-layer
refactor/pricing-engine-optimization
```

#### 4. 测试分支 (test)

格式: `test/<模块>-<测试类型>`

**测试类型**:
- `e2e` - 端到端测试
- `unit` - 单元测试
- `integration` - 集成测试
- `performance` - 性能测试
- `security` - 安全测试

**示例**:
```bash
test/shipment-e2e
test/customer-unit
test/api-integration
test/pricing-performance
```

#### 5. 文档分支 (docs)

格式: `docs/<文档类型>-<描述>`

**文档类型**:
- `api` - API 文档
- `user` - 用户文档
- `developer` - 开发者文档
- `deployment` - 部署文档

**示例**:
```bash
docs/api-shipment-endpoints
docs/user-guide-customer-management
docs/developer-setup-guide
```

#### 6. 构建/工具分支 (chore)

格式: `chore/<工具类型>-<描述>`

**工具类型**:
- `ci` - CI/CD
- `build` - 构建配置
- `deps` - 依赖更新
- `config` - 配置文件

**示例**:
```bash
chore/ci-github-actions
chore/deps-update-dependencies
chore/config-env-variables
```

#### 7. 紧急修复分支 (hotfix)

格式: `hotfix/<模块>-<紧急问题描述>`

**示例**:
```bash
hotfix/shipment-critical-bug
hotfix/finance-calculation-error
hotfix/security-vulnerability
```

---

## 工作流程

### 1. 开发新功能

```bash
# 1. 从 develop 创建功能分支
git checkout develop
git pull origin develop
git checkout -b feature/shipment-create-form

# 2. 开发功能...
git add .
git commit -m "feat(shipment): 实现运单创建表单统一组件"

# 3. 推送到远程
git push origin feature/shipment-create-form

# 4. 创建 Pull Request: feature/xxx → develop
# - 在 GitHub 上创建 PR
# - 等待代码审查
# - 通过后合并到 develop
```

### 2. 修复 Bug

```bash
# 1. 从 develop 创建修复分支
git checkout develop
git pull origin develop
git checkout -b fix/customer-phone-validation

# 2. 修复 Bug...
git add .
git commit -m "fix(customer): 修复客户手机号验证规则"

# 3. 推送到远程
git push origin fix/customer-phone-validation

# 4. 创建 Pull Request: fix/xxx → develop
```

### 3. 代码重构

```bash
# 1. 从 develop 创建重构分支
git checkout develop
git pull origin develop
git checkout -b refactor/customer-form-component

# 2. 重构代码...
git add .
git commit -m "refactor(customer): 提取客户表单为共享组件"

# 3. 推送到远程
git push origin refactor/customer-form-component

# 4. 创建 Pull Request: refactor/xxx → develop
```

### 4. 添加测试

```bash
# 1. 从功能分支或 develop 创建测试分支
git checkout feature/shipment-create-form
git checkout -b test/shipment-e2e

# 2. 添加测试...
git add .
git commit -m "test(shipment): 添加运单创建 E2E 测试"

# 3. 推送到远程
git push origin test/shipment-e2e

# 4. 创建 Pull Request: test/xxx → feature/xxx 或 develop
```

### 5. 发布到生产环境

```bash
# 1. 从 develop 合并到 main
git checkout main
git pull origin main
git merge develop
git push origin main

# 2. 打标签
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 3. 部署到生产环境
```

### 6. 紧急修复（Hotfix）

```bash
# 1. 从 main 创建 hotfix 分支
git checkout main
git pull origin main
git checkout -b hotfix/shipment-critical-bug

# 2. 修复...
git add .
git commit -m "fix(shipment): 紧急修复运单创建关键 Bug"

# 3. 同时合并到 main 和 develop
git checkout main
git merge hotfix/shipment-critical-bug
git push origin main

git checkout develop
git merge hotfix/shipment-critical-bug
git push origin develop

# 4. 删除 hotfix 分支
git branch -d hotfix/shipment-critical-bug
git push origin --delete hotfix/shipment-critical-bug
```

---

## Pull Request 流程

### 创建 PR 的步骤

1. **开发完成** → 推送到功能分支
   ```bash
   git checkout feature/xxx
   git add .
   git commit -m "feat(shipment): 实现运单创建表单统一组件"
   git push origin feature/xxx
   ```

2. **创建 PR** → `feature/xxx` → `develop`
   - 在 GitHub 上创建 Pull Request
   - 选择源分支: `feature/xxx`
   - 选择目标分支: `develop`

3. **代码审查** → 团队成员审查代码
   - 至少需要 1 名审查者批准
   - 审查者检查代码质量、规范、测试等

4. **CI/CD 检查** → 自动运行测试
   - 确保所有 CI 检查通过
   - 确保没有构建错误
   - 确保测试通过

5. **合并** → 审查通过后合并到 `develop`
   - 使用 "Squash and merge" 或 "Create a merge commit"
   - 不要使用 "Rebase and merge"（保持历史清晰）

6. **删除分支** → 合并后删除功能分支
   ```bash
   git checkout develop
   git pull origin develop
   git branch -d feature/xxx
   git push origin --delete feature/xxx
   ```

### PR 标题格式

遵循 Conventional Commits 规范，包含优先级标签：

```
<type>: [优先级] <模块> - <简短描述> (#Issue编号)

示例:
feat: [P0] Shipment - 运单创建表单统一组件 (#123)
fix: [P1] Customer - 客户手机号验证规则 (#456)
refactor: [P2] API - 错误处理逻辑重构 (#789)
test: [P2] Shipment - E2E 测试关键流程 (#101)
docs: [P3] API - 更新运单创建接口文档 (#112)
```

**优先级标签**:
- `[P0]` - Critical（关键，影响核心功能）
- `[P1]` - High（高优先级，影响用户体验）
- `[P2]` - Medium（中优先级，影响较小）
- `[P3]` - Low（低优先级，优化建议）

**类型 (type)**:
- `feat` - 新功能
- `fix` - Bug 修复
- `refactor` - 重构
- `test` - 测试
- `docs` - 文档
- `chore` - 构建/工具
- `perf` - 性能优化

### PR 描述模板

```markdown
## 📋 描述

清晰简洁地描述本次 PR 的内容和目的。

## 🔗 相关 Issue

Closes #123
或
Refs #456

## 🎯 变更内容

- [ ] 功能变更
- [ ] Bug 修复
- [ ] 代码重构
- [ ] 文档更新
- [ ] 测试添加

## 🧪 测试

- [ ] 单元测试已添加/更新
- [ ] 集成测试已添加/更新
- [ ] E2E 测试已添加/更新
- [ ] 手动测试已完成

## 📸 截图（如适用）

如果是 UI 相关的变更，请添加截图。

## ✅ 检查清单

- [ ] 代码符合项目规范
- [ ] 代码有适当的注释和时间戳
- [ ] 没有引入新的警告或错误
- [ ] 所有 CI 检查通过
- [ ] 文档已更新（如需要）
- [ ] 提交消息符合规范
```

---

## 🚫 禁止的操作

### ❌ 不要这样做

1. **不要直接提交到 `main` 分支**
   ```bash
   # ❌ 错误
   git checkout main
   git add .
   git commit -m "feat: 新功能"
   git push origin main
   ```

2. **不要在 `main` 分支上直接开发**
   ```bash
   # ❌ 错误
   git checkout main
   # 开始写代码...
   ```

3. **不要跳过代码审查**
   ```bash
   # ❌ 错误
   git checkout develop
   git merge feature/xxx --no-ff
   # 应该通过 PR 合并
   ```

4. **不要强制推送到受保护的分支**
   ```bash
   # ❌ 错误
   git push --force origin main
   git push --force origin develop
   ```

5. **不要在 feature 分支上直接合并其他 feature 分支**
   ```bash
   # ❌ 错误
   git checkout feature/xxx
   git merge feature/yyy
   # 应该分别创建 PR 到 develop
   ```

### ✅ 应该这样做

1. **创建功能分支**
   ```bash
   # ✅ 正确
   git checkout develop
   git pull origin develop
   git checkout -b feature/xxx
   ```

2. **通过 PR 合并**
   ```bash
   # ✅ 正确
   # 在 GitHub 上创建 PR: feature/xxx → develop
   # 等待审查和 CI 通过后合并
   ```

3. **保持 main 分支稳定**
   ```bash
   # ✅ 正确
   # main 分支只接受从 develop 的合并
   git checkout main
   git merge develop
   git push origin main
   ```

4. **保持 develop 分支最新**
   ```bash
   # ✅ 正确
   # 定期从 develop 拉取最新代码
   git checkout feature/xxx
   git merge develop
   # 或使用 rebase（谨慎使用）
   git rebase develop
   ```

5. **及时删除已合并的分支**
   ```bash
   # ✅ 正确
   git branch -d feature/xxx
   git push origin --delete feature/xxx
   ```

---

## 🔒 分支保护规则

### GitHub 分支保护设置（推荐配置）

#### main 分支保护

**设置路径**: GitHub Repository → Settings → Branches → Add rule → Branch name pattern: `main`

**保护规则**:
- ✅ **Require pull request reviews before merging**
  - Required approving reviews: 1
  - Dismiss stale pull request approvals when new commits are pushed
  - Require review from Code Owners

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - 添加 CI 检查: `build`, `test`, `lint`

- ✅ **Require conversation resolution before merging**
  - 所有评论必须解决

- ✅ **Do not allow bypassing the above settings**
  - 即使是管理员也不能绕过

- ✅ **Restrict who can push to matching branches**
  - 限制可以推送的用户/团队（可选）

- ✅ **Allow force pushes**: ❌ 禁用
- ✅ **Allow deletions**: ❌ 禁用

#### develop 分支保护

**设置路径**: GitHub Repository → Settings → Branches → Add rule → Branch name pattern: `develop`

**保护规则**:
- ✅ **Require pull request reviews before merging**
  - Required approving reviews: 1
  - Dismiss stale pull request approvals when new commits are pushed

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date before merging
  - 添加 CI 检查: `build`, `test`, `lint`

- ✅ **Require conversation resolution before merging**
  - 所有评论必须解决

- ✅ **Allow force pushes**: ❌ 禁用
- ✅ **Allow deletions**: ❌ 禁用（可选，允许删除用于清理）

#### feature/fix/refactor 分支（可选保护）

对于以 `feature/`, `fix/`, `refactor/` 开头的分支，可以设置较宽松的保护：

- ✅ **Require pull request reviews before merging**（可选）
- ❌ **Allow force pushes**: 允许（用于 rebase）
- ✅ **Allow deletions**: 允许

---

## 📈 当前项目迁移建议

### 立即行动

1. **创建 develop 分支**（如果还没有）
   ```bash
   git checkout main
   git pull origin main
   git checkout -b develop
   git push origin develop
   
   # 设置 develop 为默认开发分支
   git branch --set-upstream-to=origin/develop develop
   ```

2. **为当前工作创建分支**
   ```bash
   # 如果当前有未提交的更改
   git checkout develop
   git checkout -b feature/current-work
   git add .
   git commit -m "chore: 保存当前工作状态"
   git push origin feature/current-work
   ```

3. **配置分支保护规则**
   - 在 GitHub 上设置 main 和 develop 分支保护
   - 参考上面的"分支保护规则"章节

4. **为每个 Issue 创建分支**
   ```bash
   # 根据 Issues 创建对应的功能分支
   # 例如：从 Issue #123 创建分支
   git checkout develop
   git checkout -b feature/shipment-create-form
   # 或使用 Issue 编号
   git checkout -b feature/issue-123-shipment-create-form
   ```

### 长期维护

1. **定期同步 develop 到 main**
   ```bash
   # 每周或每两周发布一次
   git checkout main
   git pull origin main
   git merge develop
   git tag -a v1.x.x -m "Release version 1.x.x"
   git push origin main
   git push origin v1.x.x
   ```

2. **清理已合并的分支**
   ```bash
   # 删除本地已合并的分支
   git branch --merged develop | grep -v "develop\|main" | xargs git branch -d
   
   # 删除远程已合并的分支（需要确认）
   git branch -r --merged develop | grep -v "develop\|main" | sed 's/origin\///' | xargs -I {} git push origin --delete {}
   ```

3. **保持 develop 分支最新**
   ```bash
   # 定期从 main 合并 hotfix
   git checkout develop
   git merge main
   git push origin develop
   ```

4. **定期清理过时的分支**
   ```bash
   # 查找超过 30 天未更新的分支
   git for-each-ref --format='%(refname:short) %(committerdate:relative)' refs/heads/ | grep "months ago\|years ago"
   ```

---

## 最佳实践

### 提交消息规范

使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**类型 (type)**:
- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响代码运行的变动）
- `refactor`: 重构（既不是新功能也不是 Bug 修复）
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `revert`: 回滚

**示例**:
```bash
feat(shipment): 实现运单创建表单统一组件

- 创建 CustomerForm 共享组件
- 统一客户创建/编辑表单逻辑
- 支持加拿大和中国地址格式

Closes #123

fix(customer): 修复客户手机号验证规则

- 统一使用加拿大手机号格式验证
- 修复验证规则不一致问题

Refs #456

refactor(api): 重构 API 错误处理逻辑

- 统一错误响应格式
- 改进错误日志记录
```

### 分支管理规则

1. **分支命名**: 使用小写字母和连字符，不要使用下划线
2. **分支长度**: 分支名应该简短但具有描述性（最多 50 个字符）
3. **及时删除**: 合并后立即删除功能分支
4. **保持更新**: 定期从 develop 拉取最新代码
5. **单一职责**: 每个分支只做一件事

### Pull Request 规范

1. **标题**: 清晰描述 PR 的内容
2. **描述**: 详细说明修改内容、原因和影响
3. **关联 Issue**: 使用 `Closes #123` 或 `Refs #456` 关联 Issue
4. **标签**: 添加适当的标签（bug, feature, refactor 等）
5. **审查者**: 至少需要 1 名审查者批准
6. **CI 通过**: 确保所有 CI 检查通过

### 代码审查清单

- [ ] 代码符合项目规范
- [ ] 代码有适当的注释
- [ ] 没有引入新的警告或错误
- [ ] 测试用例覆盖新功能
- [ ] 文档已更新（如需要）
- [ ] 提交消息符合规范

---

## 自动化规则

### Cursor 自动化分支创建规则

参见 `docs/CURSOR_BRANCH_AUTOMATION.md`

---

## 当前项目迁移步骤

### 步骤 1: 创建 develop 分支

```bash
# 从当前 main 分支创建 develop 分支
git checkout main
git pull origin main
git checkout -b develop
git push origin develop

# 设置 develop 为默认开发分支
git branch --set-upstream-to=origin/develop develop
```

### 步骤 2: 保护分支规则

在 GitHub 上设置分支保护规则:

1. **main 分支**:
   - 要求 Pull Request 审查
   - 要求状态检查通过
   - 要求分支最新
   - 不允许强制推送
   - 不允许删除

2. **develop 分支**:
   - 要求 Pull Request 审查
   - 要求状态检查通过
   - 不允许强制推送

### 步骤 3: 创建初始功能分支

根据 `docs/TMS_ISSUES_SUMMARY.md` 中的问题列表创建分支:

```bash
# P0 Critical Bugs
git checkout -b fix/google-maps-api-billing develop
git checkout -b fix/database-migration-permissions develop
git checkout -b fix/tenant-isolation-security develop

# P1 High Priority Bugs
git checkout -b refactor/customer-form-component develop
git checkout -b refactor/driver-form-component develop
git checkout -b refactor/vehicle-form-component develop
```

---

**最后更新**: 2025-12-05  
**维护者**: TMS 开发团队

