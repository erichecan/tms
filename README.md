# TMS SaaS 智能物流运营平台

**创建时间：** 2025-01-27 15:30:45  
**版本：** 1.0.0

## 项目概述

这是一个基于规则引擎的智能物流运营平台，采用SaaS多租户架构，支持动态计费、智能报价、运单管理、财务结算和司机薪酬核算等完整功能。

## 核心特性

### TMS v3.0-PC 功能特性
- 🚛 **运单管理**：完整的运单生命周期管理，支持PRD v3.0-PC规范
- 👥 **客户管理**：客户信息管理、地址自动填充、快速创建
- 🚗 **司机管理**：司机档案和绩效跟踪
- 🚛 **行程管理**：支持多运单挂载、联程运输
- 📊 **财务管理**：应收应付和结算管理
- 🗺️ **车队管理**：在途管理、空闲资源、地图轨迹
- 🎨 **统一UI布局**：左侧导航系统，支持收窄/展开

### 技术特性
- 🚀 **规则引擎驱动**：基于json-rules-engine的可视化规则编辑器
- 💰 **智能计费**：动态计费引擎，支持复杂计费规则配置
- 💳 **财务闭环**：应收账款和司机薪酬自动结算
- 🏢 **多租户SaaS**：支持多个物流公司独立使用
- 🔒 **数据隔离**：严格的租户数据隔离和安全保障
- 🔄 **完整API支持**：后端API完整实现PRD v3.0-PC需求
- 🗄️ **数据库优化**：支持新字段和表结构，性能优化

## 技术架构

- **前端**：React 18 + TypeScript + Ant Design
- **后端**：Node.js + Express + TypeScript
- **数据库**：PostgreSQL + Redis
- **规则引擎**：json-rules-engine
- **部署**：Docker + Kubernetes

## 项目结构

```
TMS/
├── apps/                    # 应用程序
│   ├── frontend/           # React前端应用
│   └── backend/            # Node.js后端服务
├── packages/               # 共享包
│   ├── shared-types/       # 共享TypeScript类型
│   ├── ui-components/      # 共享UI组件
│   └── utils/              # 共享工具函数
├── docs/                   # 文档
├── docker/                 # Docker配置
└── scripts/                # 构建和部署脚本
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 6+

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
# 启动所有服务
npm run dev

# 或者分别启动
npm run dev:frontend  # 启动前端 (http://localhost:3000)
npm run dev:backend   # 启动后端 (http://localhost:8000)
```

## 最小运单管理闭环（MVP）

> 更新时间：2025-09-23 10:00:00

本分支 `feature/minimal-shipment-flow` 将交付“最小运单管理闭环”，范围包含：创建运单 → 分配司机 → 通知 → 司机执行并更新状态 → 上传POD → 运单完成。暂不实现智能报价，仅保留 `estimatedCost` 与 `finalCost` 字段。

### 后端端口与环境

- 后端默认端口：`8000`
- 前端默认端口：`3000`
- 环境变量：参见 `.env.example`（新增 `UPLOAD_DIR`, `DATABASE_URL`）

### 基本命令

```bash
# 启动开发（前后端并行）
npm run dev

# 数据库迁移与种子
npm run db:migrate
npm run db:seed

# 运行测试
npm run test
# 端到端测试（Playwright）
npm run test:e2e
```

### 文档

- docs/API.md：MVP 接口列表
- docs/TEST_PLAN.md：测试覆盖与用例
- docs/STATE_MACHINE.md：状态机与合法转换

### 数据库设置

```bash
# 运行数据库迁移
npm run db:migrate

# 填充测试数据
npm run db:seed
```

### Docker部署

```bash
# 构建并启动所有服务
npm run docker:build
npm run docker:up
```

## 开发指南

### 代码规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier配置
- 编写单元测试和集成测试
- 使用Conventional Commits规范

### 提交规范

```bash
# 功能开发
git commit -m "feat: 添加规则引擎可视化编辑器"

# 问题修复
git commit -m "fix: 修复计费规则冲突检测逻辑"

# 文档更新
git commit -m "docs: 更新API文档"
```

### 测试

```bash
# 运行所有测试
npm run test

# 运行后端测试
npm run test:backend

# 运行前端测试
npm run test:frontend
```

## API文档

详细的API文档请参考：
- [后端API文档](./apps/backend/docs/api.md)
- [前端组件文档](./apps/frontend/docs/components.md)

## 部署指南

### 生产环境部署

1. 配置环境变量
2. 构建生产版本
3. 部署到Kubernetes集群

详细部署步骤请参考：[部署文档](./docs/DEPLOYMENT_GUIDE.md)

## 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建Pull Request

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 联系方式

- 项目负责人：TMS Development Team
- 邮箱：dev@tms-platform.com
- 文档：https://docs.tms-platform.com

---

**注意：** 这是一个企业级SaaS系统，请确保在生产环境中正确配置安全设置和性能优化。
