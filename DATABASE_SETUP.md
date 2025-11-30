# 数据库配置说明

## 问题诊断

如果后端服务器启动失败，通常是因为数据库连接配置缺失或数据库服务未运行。

## 配置方式

### 方式 1: 使用 DATABASE_URL（推荐）

在项目根目录创建 `.env` 文件：

```bash
# 本地 PostgreSQL
DATABASE_URL=postgresql://tms_user:tms_password@localhost:5432/tms_platform

# 或使用 Neon 数据库
DATABASE_URL=postgresql://user:password@ep-xxx-xxx.region.aws.neon.tech/dbname?sslmode=require
```

### 方式 2: 使用独立环境变量

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tms_platform
DB_USER=tms_user
DB_PASSWORD=tms_password
```

## 数据库迁移

配置好数据库连接后，需要运行数据库迁移：

```bash
# 运行所有迁移
cd apps/backend
npm run migrate

# 或使用 Neon MCP（如果已配置）
# 通过 Cursor IDE 的 MCP 功能运行迁移
```

## 检查数据库连接

启动后端服务器后，查看日志中的数据库连接状态：

- ✅ 数据库连接成功
- ❌ 数据库连接失败（会显示具体错误信息）

## 常见问题

1. **数据库服务未运行**
   - 本地 PostgreSQL: 确保 PostgreSQL 服务已启动
   - Neon: 确保数据库实例已创建并激活

2. **连接字符串格式错误**
   - 检查 DATABASE_URL 格式是否正确
   - 确保用户名、密码、主机、端口、数据库名都正确

3. **数据库不存在**
   - 需要先创建数据库：`CREATE DATABASE tms_platform;`

4. **权限问题**
   - 确保数据库用户有足够的权限
   - 可能需要运行 `GRANT ALL PRIVILEGES ON DATABASE tms_platform TO tms_user;`

