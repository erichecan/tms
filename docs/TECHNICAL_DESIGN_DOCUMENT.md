
# 智能物流运营平台 (TMS SaaS) - 技术总体设计文档 (TDD)

**版本:** 2.0 (基于代码分析)
**最后更新:** 2025-09-11

## 1. 概述

本文档基于对 `tms-saas-platform` 项目代码的深入分析编写, 旨在精确描述系统的技术架构、核心组件、数据流和设计决策.

## 2. 系统架构

系统采用基于 **Docker** 的 **前后端分离** 的 **Monorepo** 架构.

- **Monorepo (单一代码库):**
  - **实现:** 通过根目录 `package.json` 中的 `"workspaces": ["packages/*", "apps/*"]` 配置, 使用 `npm workspaces` 进行管理.
  - **优势:**
    - **代码共享:** `packages/shared-types` 中定义的TypeScript接口 (如 `Shipment`, `Rule`) 被前后端共同引用, 保证了数据契约的强类型一致性.
    - **统一管理:** 可通过顶层 `scripts` (如 `npm run build`) 一键构建所有子项目.

- **前后端分离:**
  - **前端 (`apps/frontend`):** React (Vite) 单页应用 (SPA).
  - **后端 (`apps/backend`):** Node.js (Express) API 服务.

- **容器化:**
  - **实现:** `docker-compose.yml` 文件定义了五个核心服务: `postgres`, `redis`, `backend`, `frontend`, `nginx`.
  - **网络:** 所有服务均在自定义的 `tms-network` bridge网络中, 通过服务名进行内部通信 (例如, backend通过 `postgres:5432` 连接数据库).

- **服务网关/反向代理:**
  - **实现:** `nginx` 服务作为系统的统一入口. `docker/nginx/nginx.conf` 文件中配置了反向代理规则, 将 `/api` 前缀的请求转发到 `backend:8000`, 其他请求转发到 `frontend:3000`.

## 3. 后端设计 (`apps/backend`)

### 3.1 核心技术栈

| 领域 | 技术/库 | 实现细节 |
| :--- | :--- | :--- |
| **框架** | Express.js | 作为API服务器的基础框架. |
| **语言** | TypeScript | 提供强类型支持, 减少运行时错误. |
| **数据库交互** | (待确认, 可能是Prisma/Knex) | `DatabaseService` 封装了所有数据库操作, 如 `getShipment`, `createShipment`. |
| **认证** | JSON Web Tokens (JWT) | `jsonwebtoken` 库用于生成和验证Token. |
| **日志** | (待确认, 可能是winston/pino) | `utils/logger.ts` 中定义了日志记录器, 用于输出结构化日志. |
| **验证** | (自定义中间件) | `middleware/validationMiddleware.ts` 提供了 `validateRequest` 中间件, 用于检查请求体和参数的类型及是否必需. |

### 3.2 核心流程与中间件

1.  **请求入口:** 外部请求首先到达 `nginx`.
2.  **API路由:** `/api` 请求被转发到 `backend` 服务. Express根据 `apps/backend/src/routes/` 下的路由文件 (如 `shipmentRoutes.ts`) 匹配端点.
3.  **认证中间件 (`authMiddleware.ts`):**
    - 这是所有私有路由的第一道屏障.
    - 从 `Authorization: Bearer <token>` HTTP头或 `token` Cookie中提取JWT.
    - 使用 `process.env.JWT_SECRET` 密钥通过 `jwt.verify()` 验证Token.
    - 验证成功后, 解码出 `tenantId` 和 `userId`, 从数据库查询用户信息.
    - 将用户信息 `{ id, email, role, tenantId }` 附加到 `req.user` 对象上.
    - 如果Token无效或用户不存在/非激活状态, 返回 `401 Unauthorized`.
4.  **租户中间件 (`tenantMiddleware.ts`):**
    - 紧随认证中间件之后.
    - 从 `req.user.tenantId` 获取租户ID.
    - 从数据库查询租户信息 (如 `Tenant` 对象).
    - 将租户信息附加到 `req.tenant` 对象上.
    - **关键作用:** 确保后续所有数据库查询都基于此租户ID进行, 实现数据隔离.
5.  **控制器 (`*Controller.ts`):**
    - 负责处理HTTP请求和响应.
    - 从 `req.params`, `req.query`, `req.body` 中提取数据.
    - 调用对应的服务层方法处理业务逻辑.
    - 构造统一格式的JSON响应 (成功或失败).
    - `ShipmentController.ts` 中包含了对运单完整生命周期 (创建、分配、取货、运输、完成、取消) 的处理方法.
6.  **服务层 (`*Service.ts`):**
    - **业务逻辑核心.**
    - `ShipmentService.ts` 实现了如 `assignDriver` (分配司机)、`completeShipment` (完成运单) 等复杂操作.
    - 服务之间可以相互调用, 例如 `ShipmentService` 依赖 `RuleEngineService` 来进行报价或薪酬计算.
    - 直接与 `DatabaseService` 交互, 执行数据库的CRUD操作.

### 3.3 运单状态机 (State Machine)
`ShipmentService.ts` 和 `shared-types/index.ts` 中的 `ShipmentStatus` 枚举共同定义了一个严格的运单状态机, 确保业务流程的正确性.

`pending` -> `quoted` -> `confirmed` -> `assigned` -> `picked_up` -> `in_transit` -> `delivered` -> `completed`

- 任何状态都可以转换为 `cancelled` (在 `completed` 之前).
- `ShipmentService` 中的每个状态转换方法 (如 `startTransit`) 都会检查前置状态是否正确 (例如, 必须是 `picked_up` 状态才能开始运输), 否则会抛出错误.

## 4. 前端设计 (`apps/frontend`)

### 4.1 核心技术栈

| 领域 | 技术/库 | 实现细节 |
| :--- | :--- | :--- |
| **框架** | React | 构建用户界面的核心库. |
| **构建工具** | Vite | 提供极速的开发服务器和优化的构建输出. |
| **状态管理** | React Context | `contexts/AuthContext.tsx` 和 `TenantContext.tsx` 用于全局管理用户认证信息和租户信息. |
| **API通信** | (待确认, 可能是axios/fetch) | `services/api.ts` 封装了与后端API的交互, 可能会设置一个基础URL和自动附加JWT认证头. |
| **组件库** | (待确认, 可能是Ant Design/MUI) | `components/` 目录下的组件 (如 `RuleEditor.tsx`) 表明使用了模块化的组件开发模式. |

### 4.2 核心组件与页面

- **`pages/`**: 包含应用的主要页面, 如 `ShipmentManagement.tsx`, `RuleManagement.tsx`, `Dashboard.tsx`. 每个页面负责一个核心业务功能的数据展示和操作.
- **`components/RuleEditor/RuleEditor.tsx`**: 这是一个复杂的核心组件, 允许用户通过图形化界面创建和编辑业务规则. 它很可能管理着一个复杂的本地状态, 用于构建符合 `shared-types` 中 `Rule` 接口的JSON对象.
- **`components/Auth/ProtectedRoute.tsx`**: 高阶组件, 用于保护需要登录才能访问的路由. 它会检查 `AuthContext` 中是否存在有效的用户信息, 否则重定向到登录页面.

## 5. 共享代码 (`packages/`)

- **`shared-types`**: 项目的"单一事实来源 (Single Source of Truth)".
  - **`index.ts`**: 定义了所有核心实体的TypeScript接口, 如 `Shipment`, `Rule`, `Driver`, `FinancialRecord` 等.
  - **`enums.ts`**: 定义了如 `ShipmentStatus`, `RuleType` 等枚举, 确保前后端使用相同的常量.
  - **价值:** 极大地提升了开发效率和代码质量. 前端可以安全地消费后端API返回的数据, 后端可以确保收到的请求体符合预定义的结构.

## 6. 数据库设计

设计细节将在 `DATABASE_SCHEMA_DESIGN.md` 中详述, 但其核心是基于 `shared-types` 中定义的接口. `DatabaseService` 的存在表明所有SQL查询都被抽象和封装起来, 控制器和服务层不直接编写SQL.
