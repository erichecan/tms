
# 智能物流运营平台 (TMS SaaS) - 部署与运维手册

**版本:** 2.0 (基于代码分析)
**最后更新:** 2025-09-11

## 1. 概述

本手册提供了在本地开发环境和生产环境中部署、配置和维护TMS SaaS平台的详细步骤. 所有操作均基于项目根目录的 `package.json` 脚本和 `docker-compose.yml` 文件.

## 2. 环境要求

- **Docker:** 版本 20.10.0 或更高.
- **Docker Compose:** 版本 1.29.0 或更高.
- **Node.js:** 版本 18.0 或更高 (仅用于运行 `npm` 命令和本地开发).
- **NPM:** 版本 9.0 或更高.

## 3. 本地开发环境

### 3.1 首次启动

1.  **克隆代码库:**
    ```bash
    git clone <repository-url>
    cd tms-saas-platform
    ```

2.  **安装所有依赖:**
    此命令将使用 `npm workspaces` 安装根目录、`apps/*` 和 `packages/*` 下的所有依赖项.
    ```bash
    npm install
    ```

3.  **配置环境变量:**
    - **后端:** 进入 `apps/backend` 目录, 复制 `.env.example` 为 `.env`. 至少需要设置一个 `JWT_SECRET`.
      ```bash
      cd apps/backend
      cp .env.example .env
      # 用你自己的密钥替换 your-jwt-secret-key
      ```
    - **前端:** `apps/frontend` 的API地址已在 `docker-compose.yml` 中通过环境变量 `VITE_API_URL` 设置为指向Nginx代理, 通常无需修改.

4.  **启动Docker容器:**
    此命令会根据 `docker-compose.yml` 在后台构建并启动所有服务.
    ```bash
    npm run docker:up
    ```

5.  **初始化数据库:**
    首次启动时, `docker/postgres/init.sql` 会被执行以创建初始数据库和用户. 如果有数据库迁移(migration)脚本, 需要手动执行:
    ```bash
    npm run db:migrate
    ```

6.  **访问服务:**
    - **Web应用:** [http://localhost:3000](http://localhost:3000) (由 `frontend` 服务提供)
    - **API (通过Nginx):** `http://localhost/api/v1/...` (由 `nginx` 代理到 `backend`)
    - **PostgreSQL数据库:** `localhost:5432`
    - **Redis:** `localhost:6379`

### 3.2 日常开发

- **并行启动前后端 (热重载):** 如果你不想使用Docker, 可以在本地分别启动前后端开发服务器.
  ```bash
  # 启动后端 (在 apps/backend 目录)
  npm run dev

  # 启动前端 (在 apps/frontend 目录)
  npm run dev
  ```
- **运行测试:**
  ```bash
  # 运行所有测试
  npm test

  # 只运行后端测试
  npm run test:backend
  ```

## 4. 运维命令

### 4.1 Docker管理

- **查看所有服务日志:**
  ```bash
  docker-compose logs -f
  ```
- **查看特定服务日志 (如后端):**
  ```bash
  docker-compose logs -f backend
  ```
- **停止并移除所有容器、网络和卷:**
  ```bash
  npm run docker:down
  ```
- **强制重新构建镜像并启动:**
  ```bash
  docker-compose up -d --build --force-recreate
  ```

### 4.2 数据库操作

- **执行数据库迁移:**
  ```bash
  npm run db:migrate
  ```
- **填充种子数据:**
  ```bash
  npm run db:seed
  ```
- **进入PostgreSQL容器的psql命令行:**
  ```bash
  docker-compose exec postgres psql -U tms_user -d tms_platform
  ```

## 5. 生产环境部署 (高级指南)

直接在生产环境使用 `docker-compose` 是可行的, 但推荐使用更专业的容器编排工具如 **Kubernetes**.

### 关键考量:

1.  **环境变量:** 绝对不能将包含敏感信息 (如 `JWT_SECRET`, 数据库密码) 的 `.env` 文件提交到代码库. 在生产环境中, 应使用部署平台提供的 Secrets Management 机制 (如 Kubernetes Secrets, AWS Secrets Manager) 来注入环境变量.
2.  **数据库和Redis:** 生产环境应使用云服务商提供的托管数据库和Redis服务 (如 AWS RDS, ElastiCache), 以获得高可用性、备份和扩展能力. `docker-compose.yml` 中的 `postgres` 和 `redis` 服务应被移除.
3.  **Docker镜像:** CI/CD流水线应负责构建镜像, 添加版本标签, 并推送到私有镜像仓库 (如 ECR, GCR, Docker Hub).
4.  **持久化存储:** `volumes` 配置需要映射到生产服务器上可靠的持久化存储路径, 或使用云存储卷.
5.  **HTTPS:** `nginx` 服务必须配置SSL证书以启用HTTPS. 证书可以存放在 `docker/nginx/ssl` 目录中, 并在 `nginx.conf` 中引用.
