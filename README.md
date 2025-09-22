# TMS SaaS 智能物流运营平台

**创建时间：** 2025-01-27 15:30:45  
**版本：** 1.0.0

## 项目概述

这是一个基于规则引擎的智能物流运营平台，采用SaaS多租户架构，支持动态计费、智能报价、运单管理、财务结算和司机薪酬核算等完整功能。

## 核心特性

- 🚀 **规则引擎驱动**：基于json-rules-engine的可视化规则编辑器
- 💰 **智能计费**：动态计费引擎，支持复杂计费规则配置
- 📦 **运单管理**：完整的运单生命周期管理
- 💳 **财务闭环**：应收账款和司机薪酬自动结算
- 🏢 **多租户SaaS**：支持多个物流公司独立使用
- 🔒 **数据隔离**：严格的租户数据隔离和安全保障

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
