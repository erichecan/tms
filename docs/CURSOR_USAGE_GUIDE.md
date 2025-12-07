# Cursor GitFlow 使用指南

**创建时间**: 2025-12-05  
**文档版本**: 1.0.0

---

## ✅ 在公司电脑上使用 GitFlow

### 1. 拉取最新代码

公司电脑上的 Cursor 拉取代码后，会自动读取项目根目录的 `.cursorrules` 文件，AI 助手会遵循这些规则。

```bash
# 在公司电脑上执行
git pull origin main

# 或者如果是第一次克隆
git clone <repository-url>
cd tms-main
```

### 2. 如何使用自动分支创建

**直接在 Cursor 的 AI 对话中请求创建分支即可**，AI 会自动：
- 识别你的意图（功能开发、Bug 修复等）
- 根据 `.cursorrules` 中的规则生成分支名
- 执行 git 命令创建分支
- 切换到新分支

---

## 📝 使用示例

### 示例 1: 创建功能分支

**你说**: "我需要创建一个统一的客户表单组件"

**AI 会**:
1. 识别类型: `feature`
2. 识别模块: `customer`
3. 生成分支名: `feature/customer-unified-form-component`
4. 执行命令:
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/customer-unified-form-component
   git push -u origin feature/customer-unified-form-component
   ```

### 示例 2: 修复 Bug

**你说**: "修复客户手机号验证的问题"

**AI 会**:
1. 识别类型: `fix`
2. 识别模块: `customer`
3. 生成分支名: `fix/customer-phone-validation`
4. 执行命令创建分支

### 示例 3: 代码重构

**你说**: "重构司机表单组件，提取为共享组件"

**AI 会**:
1. 识别类型: `refactor`
2. 识别模块: `driver`
3. 生成分支名: `refactor/driver-form-component`
4. 执行命令创建分支

---

## 🎯 支持的请求类型

### 功能开发
- "添加运单创建功能"
- "实现客户管理新功能"
- "开发司机薪酬计算模块"

### Bug 修复
- "修复运单时间线显示问题"
- "解决客户表单验证错误"
- "修复司机分配逻辑 Bug"

### 代码重构
- "重构 API 错误处理"
- "优化数据库查询逻辑"
- "提取共享组件"

### 测试
- "为运单创建添加 E2E 测试"
- "添加单元测试覆盖"

### 文档
- "更新 API 文档"
- "编写用户使用手册"

---

## ⚠️ 注意事项

### 1. 确保有 develop 分支

如果项目还没有 `develop` 分支，AI 会提示你先创建：

```bash
git checkout main
git checkout -b develop
git push origin develop
```

### 2. 当前分支状态

AI 会自动检查当前分支状态，如果需要，会先切换到 `develop` 分支。

### 3. 权限问题

如果遇到 git 权限问题，AI 会提示你：
- 检查 git 配置
- 确认远程仓库权限
- 检查 SSH 密钥或 HTTPS 凭证

### 4. 分支已存在

如果分支已存在，AI 会：
- 提示分支已存在
- 询问是否要切换到该分支
- 或创建新名称的分支

---

## 🔧 常见问题

### Q: AI 没有自动创建分支怎么办？

**A**: 可能是：
1. 请求不够明确，尝试更具体的描述
2. `.cursorrules` 文件没有正确加载，检查文件是否存在
3. 直接说："请帮我创建一个功能分支用于开发客户表单组件"

### Q: 可以手动创建分支吗？

**A**: 当然可以！但使用 AI 自动创建更符合项目规范。

```bash
# 手动创建（需要自己命名，可能不符合规范）
git checkout develop
git checkout -b my-feature

# 使用 AI（自动符合规范）
# 在 Cursor 中说："创建功能分支用于开发客户表单"
```

### Q: AI 创建的分支名不对怎么办？

**A**: 可以：
1. 告诉 AI 想要的分支名
2. 或者让 AI 重新创建
3. 或者手动重命名分支

### Q: 如何知道 AI 已经创建了分支？

**A**: AI 会：
1. 告诉你创建的分支名
2. 显示执行的 git 命令
3. 确认当前所在的分支

---

## 📋 使用检查清单

在开始使用前，确认：

- [ ] 已拉取最新代码（包含 `.cursorrules` 文件）
- [ ] 已配置 git 用户信息
- [ ] 已配置远程仓库权限（SSH 或 HTTPS）
- [ ] 已创建 `develop` 分支（如果没有）
- [ ] Cursor AI 助手可用（检查是否连接）

---

## 🚀 快速开始

1. **打开 Cursor**
2. **打开项目文件夹**
3. **在 AI 对话中直接说**：
   - "我要开发新功能，创建功能分支"
   - "修复一个 Bug，创建修复分支"
   - "重构代码，创建重构分支"

**AI 会自动处理一切！** ✨

---

## 📚 相关文档

- [GitFlow 工作流程](./GITFLOW_WORKFLOW.md)
- [Cursor 自动化规则](./CURSOR_BRANCH_AUTOMATION.md)
- [分支命名规范](./GITFLOW_WORKFLOW.md#分支命名规范)

---

**最后更新**: 2025-12-05  
**维护者**: TMS 开发团队

