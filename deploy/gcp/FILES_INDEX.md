# TMS GCP 部署文件索引

**创建时间：** 2025-10-16 17:17:00

## 📑 文档分类

### 🎯 快速开始

| 文件 | 用途 | 适合人群 |
|------|------|----------|
| **[README.md](./README.md)** | 部署概述和快速开始 | 所有人 |
| **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** | 常用命令速查表 | 运维人员 |

### 📖 详细指南

| 文件 | 用途 | 适合人群 |
|------|------|----------|
| **[DEPLOYMENT_STEPS.md](./DEPLOYMENT_STEPS.md)** | 完整的分步部署指南 | 首次部署者 |
| **[DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)** | 部署前后检查清单 | 所有部署者 |

### 🔧 配置文件

| 文件 | 用途 | 说明 |
|------|------|------|
| **[cloudbuild.yaml](./cloudbuild.yaml)** | Cloud Build CI/CD 配置 | 已优化，可直接使用 |
| **[cloudrun-backend.yaml](./cloudrun-backend.yaml)** | Cloud Run 后端配置 | 可选配置 |
| **[env.example](./env.example)** | 环境变量示例 | 参考配置 |

### 🚀 自动化脚本

| 文件 | 用途 | 使用方法 |
|------|------|----------|
| **[setup-gcp.sh](./setup-gcp.sh)** | 一键初始化 GCP 资源 | `./setup-gcp.sh` |
| **[deploy.sh](./deploy.sh)** | 手动部署脚本 | `./deploy.sh` |

### 📚 参考文档

| 文件 | 用途 |
|------|------|
| **[cloudsql-proxy-connector.md](./cloudsql-proxy-connector.md)** | Cloud SQL Proxy 使用指南 |

---

## 🗂️ 项目根目录文件

| 文件 | 位置 | 用途 |
|------|------|------|
| **DEPLOYMENT_SUMMARY.md** | `/` | 部署准备完成摘要 |
| **env.production.example** | `/` | 生产环境变量模板 |

---

## 📁 文件使用流程

### 首次部署流程

```
1. README.md (了解概述)
   ↓
2. DEPLOYMENT_CHECKLIST.md (检查准备工作)
   ↓
3. setup-gcp.sh (自动化初始化)
   或
   DEPLOYMENT_STEPS.md (手动分步操作)
   ↓
4. cloudbuild.yaml (已配置，由 Cloud Build 使用)
   ↓
5. DEPLOYMENT_CHECKLIST.md (验证部署)
```

### 日常运维流程

```
1. QUICK_REFERENCE.md (查找命令)
   ↓
2. 执行相应操作
   ↓
3. 查看日志验证
```

---

## 📝 文件详细说明

### README.md
- **内容**：部署概述、架构图、快速开始
- **何时使用**：了解整体部署方案
- **关键章节**：
  - 架构图
  - 快速开始
  - 手动部署步骤

### DEPLOYMENT_STEPS.md
- **内容**：详细的 8 个部署步骤
- **何时使用**：首次部署或需要详细指导时
- **关键章节**：
  - 步骤 1-3：GCP 基础设施设置
  - 步骤 4-5：GitHub 和 Cloud Build 配置
  - 步骤 6-8：部署、迁移和验证
- **预计时间**：完整阅读 15-20 分钟

### DEPLOYMENT_CHECKLIST.md
- **内容**：部署前后的完整检查清单
- **何时使用**：部署前验证、部署后确认
- **关键部分**：
  - 8 个阶段的检查项
  - 每个阶段的验证命令
  - 部署后验证清单
- **使用建议**：打印出来，逐项勾选

### QUICK_REFERENCE.md
- **内容**：常用命令和快速参考
- **何时使用**：日常运维、故障排查
- **关键部分**：
  - 30 秒部署概览
  - 关键资源表格
  - 常用命令
  - 快速故障排查
- **使用建议**：收藏此页面，随时查阅

### cloudbuild.yaml
- **内容**：Cloud Build 的完整配置
- **何时使用**：由 Cloud Build 自动使用
- **关键配置**：
  - Docker 构建步骤
  - 镜像推送
  - Cloud Run 部署
  - 替代变量
- **修改建议**：
  - 一般不需要修改
  - 如需调整资源配置，修改 `--memory` 和 `--cpu` 参数

### setup-gcp.sh
- **内容**：自动化初始化脚本
- **何时使用**：首次设置 GCP 资源
- **功能**：
  - 创建 Cloud SQL 实例
  - 设置数据库和用户
  - 创建 Secret Manager 密钥
  - 配置 IAM 权限
  - 生成配置文件
- **使用前提**：
  - 已安装 gcloud CLI
  - 已有 GCP 项目或创建权限
  - 已有必要的 API 密钥
- **运行时间**：10-15 分钟

### env.production.example
- **内容**：生产环境变量模板
- **何时使用**：配置生产环境参考
- **注意事项**：
  - 此文件仅作为参考
  - 实际密钥应存储在 Secret Manager
  - 不要将实际密钥提交到版本控制

---

## 🔍 如何查找信息

### 场景 1：我是第一次部署
→ 阅读顺序：
1. `README.md` - 了解概述
2. `DEPLOYMENT_CHECKLIST.md` - 检查准备工作
3. `setup-gcp.sh` 或 `DEPLOYMENT_STEPS.md` - 执行部署
4. `QUICK_REFERENCE.md` - 收藏备用

### 场景 2：我需要快速查找命令
→ 直接查看：
- `QUICK_REFERENCE.md` - 所有常用命令

### 场景 3：部署遇到问题
→ 查看顺序：
1. `QUICK_REFERENCE.md` - 快速故障排查
2. `DEPLOYMENT_STEPS.md` - 故障排除章节
3. 查看日志：`gcloud logs tail --service=xxx`

### 场景 4：我想了解成本
→ 查看：
- `DEPLOYMENT_SUMMARY.md` - 预计成本部分
- `QUICK_REFERENCE.md` - 关键资源表格

### 场景 5：我需要修改配置
→ 查看：
- `cloudbuild.yaml` - CI/CD 配置
- `env.production.example` - 环境变量参考
- `DEPLOYMENT_STEPS.md` - 配置说明

---

## 📋 文件更新记录

| 文件 | 创建日期 | 最后更新 | 版本 |
|------|---------|----------|------|
| README.md | 2025-01-27 | 2025-10-16 | 2.0 |
| DEPLOYMENT_STEPS.md | 2025-10-16 | 2025-10-16 | 1.0 |
| DEPLOYMENT_CHECKLIST.md | 2025-10-16 | 2025-10-16 | 1.0 |
| QUICK_REFERENCE.md | 2025-10-16 | 2025-10-16 | 1.0 |
| cloudbuild.yaml | 2025-01-27 | 2025-10-16 | 2.0 |
| setup-gcp.sh | 2025-10-16 | 2025-10-16 | 1.0 |
| FILES_INDEX.md | 2025-10-16 | 2025-10-16 | 1.0 |

---

## 🎯 推荐阅读路径

### 新手路径 🔰
1. README.md (5 分钟)
2. DEPLOYMENT_SUMMARY.md (5 分钟)
3. DEPLOYMENT_CHECKLIST.md (10 分钟)
4. 运行 setup-gcp.sh (15 分钟)
5. DEPLOYMENT_STEPS.md 第 6-8 步 (20 分钟)

**总计：** 约 55 分钟

### 经验者路径 ⚡
1. QUICK_REFERENCE.md (3 分钟)
2. DEPLOYMENT_CHECKLIST.md (5 分钟)
3. 运行 setup-gcp.sh (15 分钟)
4. 执行部署 (20 分钟)

**总计：** 约 43 分钟

### 运维路径 🔧
1. QUICK_REFERENCE.md (收藏)
2. 根据需要查阅相应命令

**总计：** 按需查阅

---

## 💡 提示和最佳实践

1. **首次部署前**
   - 完整阅读 `DEPLOYMENT_CHECKLIST.md`
   - 准备好所有 API 密钥
   - 确保有足够的 GCP 权限

2. **使用自动化脚本**
   - `setup-gcp.sh` 可以节省大量时间
   - 脚本会生成 `.env.secrets` 文件，请妥善保管

3. **保存重要信息**
   - Cloud SQL 实例连接名
   - 服务 URL
   - 密码（存储在 `.env.secrets`）

4. **定期备份**
   - 数据库自动备份已启用
   - 定期验证备份可用性

5. **监控和告警**
   - 部署后立即设置监控
   - 配置关键指标告警

---

**索引版本：** 1.0  
**最后更新：** 2025-10-16 17:17:00

