# Cursor 自动化分支创建规则

**创建时间**: 2025-12-05  
**文档版本**: 1.0.0

---

## 📋 概述

本文档定义了 Cursor IDE 中自动创建 Git 分支的规则，确保分支命名规范化和工作流程一致性。

---

## 🤖 自动化规则

### 规则触发条件

当用户在 Cursor 中执行以下操作时，自动创建分支：

1. **新建功能开发**: 创建新功能或增强现有功能
2. **Bug 修复**: 修复已知问题
3. **代码重构**: 重构现有代码
4. **测试添加**: 添加或更新测试
5. **文档更新**: 更新项目文档

---

## 📝 分支创建模板

### 1. 功能开发 (Feature)

**触发关键词**: `feat`, `feature`, `add`, `implement`, `create`, `new`

**分支命名规则**: `feature/<模块>-<简短描述>`

**示例对话**:
```
用户: "我需要添加运单创建表单的统一组件"
AI: "我将为您创建功能分支 feature/shipment-create-form"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["feat", "feature", "add", "implement", "create", "new"]
  patterns:
    - "添加.*功能"
    - "实现.*功能"
    - "创建.*组件"
    - "新建.*页面"

branch_template: "feature/{module}-{description}"
module_extraction:
  - shipment: ["运单", "shipment", "订单"]
  - customer: ["客户", "customer"]
  - driver: ["司机", "driver"]
  - vehicle: ["车辆", "vehicle"]
  - finance: ["财务", "finance", "支付"]
  - pricing: ["定价", "pricing", "计费"]
  - rule: ["规则", "rule"]
  - fleet: ["车队", "fleet"]
  - schedule: ["排班", "schedule"]
  - auth: ["认证", "auth", "登录"]
  - api: ["API", "接口"]
  - ui: ["UI", "界面", "页面"]
  - mobile: ["移动端", "mobile"]
```

### 2. Bug 修复 (Fix)

**触发关键词**: `fix`, `bug`, `error`, `issue`, `修复`, `解决`

**分支命名规则**: `fix/<模块>-<简短描述>`

**示例对话**:
```
用户: "修复客户手机号验证的问题"
AI: "我将为您创建修复分支 fix/customer-phone-validation"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["fix", "bug", "error", "issue", "修复", "解决", "错误"]
  patterns:
    - "修复.*问题"
    - "解决.*Bug"
    - "修复.*错误"
    - ".*报错"

branch_template: "fix/{module}-{description}"
```

### 3. 代码重构 (Refactor)

**触发关键词**: `refactor`, `重构`, `优化`, `改进`, `优化代码`

**分支命名规则**: `refactor/<模块>-<简短描述>`

**示例对话**:
```
用户: "重构客户表单组件，提取为共享组件"
AI: "我将为您创建重构分支 refactor/customer-form-component"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["refactor", "重构", "优化", "改进", "提取", "统一"]
  patterns:
    - "重构.*组件"
    - "优化.*代码"
    - "提取.*共享"
    - "统一.*逻辑"

branch_template: "refactor/{module}-{description}"
```

### 4. 测试 (Test)

**触发关键词**: `test`, `测试`, `添加测试`, `测试用例`

**分支命名规则**: `test/<模块>-<测试类型>`

**示例对话**:
```
用户: "为运单创建功能添加 E2E 测试"
AI: "我将为您创建测试分支 test/shipment-e2e"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["test", "测试", "e2e", "unit", "integration"]
  patterns:
    - "添加.*测试"
    - ".*E2E.*测试"
    - ".*单元测试"
    - ".*集成测试"

branch_template: "test/{module}-{test_type}"
test_types:
  - e2e: ["e2e", "端到端", "端到端测试"]
  - unit: ["unit", "单元", "单元测试"]
  - integration: ["integration", "集成", "集成测试"]
  - performance: ["performance", "性能", "性能测试"]
  - security: ["security", "安全", "安全测试"]
```

### 5. 文档 (Docs)

**触发关键词**: `docs`, `文档`, `更新文档`, `编写文档`

**分支命名规则**: `docs/<文档类型>-<描述>`

**示例对话**:
```
用户: "更新 API 文档，添加运单创建接口说明"
AI: "我将为您创建文档分支 docs/api-shipment-endpoints"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["docs", "文档", "更新文档", "编写文档"]
  patterns:
    - "更新.*文档"
    - "编写.*文档"
    - ".*API.*文档"
    - ".*用户手册"

branch_template: "docs/{doc_type}-{description}"
doc_types:
  - api: ["API", "接口", "接口文档"]
  - user: ["用户", "用户文档", "用户手册"]
  - developer: ["开发者", "开发文档", "开发指南"]
  - deployment: ["部署", "部署文档", "部署指南"]
```

### 6. 构建/工具 (Chore)

**触发关键词**: `chore`, `配置`, `依赖`, `CI`, `构建`

**分支命名规则**: `chore/<工具类型>-<描述>`

**示例对话**:
```
用户: "更新项目依赖包版本"
AI: "我将为您创建构建分支 chore/deps-update-dependencies"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["chore", "配置", "依赖", "CI", "构建", "工具"]
  patterns:
    - "更新.*依赖"
    - "配置.*CI"
    - ".*构建.*配置"

branch_template: "chore/{tool_type}-{description}"
tool_types:
  - ci: ["CI", "ci", "持续集成"]
  - build: ["构建", "build"]
  - deps: ["依赖", "dependencies", "deps"]
  - config: ["配置", "config"]
```

### 7. 紧急修复 (Hotfix)

**触发关键词**: `hotfix`, `紧急`, `critical`, `生产环境`, `P0`

**分支命名规则**: `hotfix/<模块>-<紧急问题描述>`

**示例对话**:
```
用户: "生产环境发现运单创建的关键 Bug，需要紧急修复"
AI: "我将为您创建紧急修复分支 hotfix/shipment-critical-bug"
```

**Cursor 规则**:
```yaml
trigger:
  keywords: ["hotfix", "紧急", "critical", "生产环境", "P0", "严重"]
  patterns:
    - "紧急修复"
    - "生产环境.*Bug"
    - ".*关键.*问题"
    - "P0.*问题"

branch_template: "hotfix/{module}-{description}"
```

---

## 🔧 Cursor 配置实现

### 方式 1: Cursor Rules (.cursorrules)

在项目根目录创建 `.cursorrules` 文件:

```markdown
# TMS 项目 GitFlow 自动化规则

## 分支创建规则

当用户请求开发新功能、修复 Bug、重构代码等操作时，自动创建符合 GitFlow 规范的分支。

### 分支命名规范

1. **功能开发**: feature/{module}-{description}
   - 模块: shipment, customer, driver, vehicle, finance, pricing, rule, fleet, schedule, auth, api, ui, mobile
   - 示例: feature/shipment-create-form

2. **Bug 修复**: fix/{module}-{description}
   - 示例: fix/customer-phone-validation

3. **代码重构**: refactor/{module}-{description}
   - 示例: refactor/customer-form-component

4. **测试**: test/{module}-{test_type}
   - 测试类型: e2e, unit, integration, performance, security
   - 示例: test/shipment-e2e

5. **文档**: docs/{doc_type}-{description}
   - 文档类型: api, user, developer, deployment
   - 示例: docs/api-shipment-endpoints

6. **构建/工具**: chore/{tool_type}-{description}
   - 工具类型: ci, build, deps, config
   - 示例: chore/deps-update-dependencies

7. **紧急修复**: hotfix/{module}-{description}
   - 示例: hotfix/shipment-critical-bug

### 自动化流程

1. 检测用户意图（功能开发、Bug 修复等）
2. 从对话中提取模块和描述
3. 生成符合规范的分支名
4. 执行 git 命令创建分支
5. 切换到新分支

### 命令模板

```bash
# 检查当前分支
git branch --show-current

# 确保在 develop 分支（功能开发、Bug 修复、重构）
git checkout develop
git pull origin develop

# 创建新分支
git checkout -b {branch_name}

# 推送分支到远程
git push -u origin {branch_name}
```

### 特殊规则

- 紧急修复 (hotfix) 从 main 分支创建
- 测试分支可以从功能分支或 develop 创建
- 所有其他分支从 develop 创建

### 模块识别规则

从用户对话中识别模块关键词:
- shipment: 运单、订单、shipment
- customer: 客户、customer
- driver: 司机、driver
- vehicle: 车辆、vehicle
- finance: 财务、支付、finance
- pricing: 定价、计费、pricing
- rule: 规则、rule
- fleet: 车队、fleet
- schedule: 排班、schedule
- auth: 认证、登录、auth
- api: API、接口
- ui: UI、界面、页面
- mobile: 移动端、mobile
```

### 方式 2: Cursor 命令脚本

创建 `scripts/cursor-branch.sh`:

```bash
#!/bin/bash

# Cursor 自动分支创建脚本

TYPE=$1
MODULE=$2
DESCRIPTION=$3

# 转换为小写
TYPE=$(echo "$TYPE" | tr '[:upper:]' '[:lower:]')
MODULE=$(echo "$MODULE" | tr '[:upper:]' '[:lower:]')
DESCRIPTION=$(echo "$DESCRIPTION" | tr '[:upper:]' '[:lower:]' | tr ' ' '-')

# 生成分支名
BRANCH_NAME="${TYPE}/${MODULE}-${DESCRIPTION}"

# 根据类型选择源分支
if [ "$TYPE" == "hotfix" ]; then
    SOURCE_BRANCH="main"
else
    SOURCE_BRANCH="develop"
fi

# 创建分支
echo "切换到 ${SOURCE_BRANCH} 分支..."
git checkout ${SOURCE_BRANCH}
git pull origin ${SOURCE_BRANCH}

echo "创建新分支: ${BRANCH_NAME}"
git checkout -b ${BRANCH_NAME}

echo "推送分支到远程..."
git push -u origin ${BRANCH_NAME}

echo "✅ 分支 ${BRANCH_NAME} 创建成功！"
```

使用示例:
```bash
./scripts/cursor-branch.sh feature shipment create-form
./scripts/cursor-branch.sh fix customer phone-validation
```

---

## 📋 使用示例

### 示例 1: 功能开发

**用户**: "我需要创建一个统一的客户表单组件"

**AI 响应**:
1. 识别类型: feature
2. 识别模块: customer
3. 提取描述: unified-form-component
4. 生成分支名: `feature/customer-unified-form-component`
5. 执行命令:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/customer-unified-form-component
   git push -u origin feature/customer-unified-form-component
   ```

### 示例 2: Bug 修复

**用户**: "修复运单时间线 API 返回 500 错误的问题"

**AI 响应**:
1. 识别类型: fix
2. 识别模块: shipment
3. 提取描述: timeline-api-500-error
4. 生成分支名: `fix/shipment-timeline-api-500-error`
5. 执行命令:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b fix/shipment-timeline-api-500-error
   git push -u origin fix/shipment-timeline-api-500-error
   ```

### 示例 3: 代码重构

**用户**: "重构司机表单组件，提取为共享组件"

**AI 响应**:
1. 识别类型: refactor
2. 识别模块: driver
3. 提取描述: form-component-extract
4. 生成分支名: `refactor/driver-form-component-extract`
5. 执行命令:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b refactor/driver-form-component-extract
   git push -u origin refactor/driver-form-component-extract
   ```

---

## ✅ 验证清单

创建分支后，验证以下项目:

- [ ] 分支名符合命名规范
- [ ] 从正确的源分支创建（develop 或 main）
- [ ] 分支已推送到远程
- [ ] 当前在新建的分支上
- [ ] 分支保护规则已配置（如需要）

---

**最后更新**: 2025-12-05  
**维护者**: TMS 开发团队

