# TMS 多电脑开发环境配置指南

## ⚠️ 核心原则

**所有环境（本地开发、生产部署）必须使用同一个远程数据库**

这确保：
- ✅ **数据一致性**：所有开发者和生产环境看到相同的数据
- ✅ **简化管理**：只需维护一个数据库
- ✅ **避免错误**：消除"本地能用，生产不能用"的问题
- ✅ **真实测试**：本地开发直接使用生产数据进行测试

## 统一数据库配置

### 生产数据库（唯一数据库）

**连接字符串**:
```
postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require
```

**主机标识**: `ep-round-math-ahvyvkcx-pooler`

**用途**:
- ✅ 本地开发环境
- ✅ GCP Cloud Run 生产部署
- ✅ 所有团队成员的开发机器

## 问题说明

如果您在不同电脑上启动本地服务器时看到的数据不一样，原因是 **`.env` 文件配置不一致**。

## 根本原因

1. **`.env` 文件不会同步**
   - `.env` 文件包含敏感信息（数据库密码、API密钥等）
   - 已在 `.gitignore` 中排除，不会通过 Git 提交和同步
   - 每台电脑需要手动配置

2. **配置不一致导致的问题**
   - 如果某台电脑配置了错误的数据库，就会看到不同的数据
   - 如果没有 `.env` 文件，服务可能无法启动

## 解决方案

### 步骤 1: 检查当前配置

在每台电脑上检查 `apps/backend/.env` 文件是否存在：

```bash
cd /path/to/TMS2.0
cat apps/backend/.env
```

### 步骤 2: 统一配置

确保所有电脑使用相同的 `.env` 配置：

```bash
# 如果 .env 文件不存在，从模板复制
cp apps/backend/.env.example apps/backend/.env

# 或者手动创建 .env 文件，内容如下：
```

**标准配置内容（所有电脑必须一致）：**

```env
# ⚠️ 生产环境数据库 - 所有环境统一使用
DATABASE_URL="postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
PORT=3001
GOOGLE_MAPS_API_KEY=AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0
JWT_SECRET=tms-production-secret-key-2026
CORS_ORIGIN=*
```

### 步骤 3: 验证数据库连接

运行以下命令验证是否连接到正确的数据库：

```bash
# 检查数据库连接（应该显示 ep-round-math-ahvyvkcx-pooler）
echo "SELECT current_database(), current_user, inet_server_addr();" | psql "postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"

# 检查数据量（所有电脑应该看到相同的数字）
echo "SELECT COUNT(*) FROM users; SELECT COUNT(*) FROM waybills;" | psql "postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require"
```

**当前远程数据库数据量：**
- 用户数：13
- 运单数：10
- 客户数：4

### 步骤 4: 重启后端服务

修改 `.env` 后必须重启后端服务：

```bash
cd apps/backend
npm run dev
```

或者如果使用 nodemon，在终端输入 `rs` 重启。

## 最佳实践

### 1. 新电脑设置流程

```bash
# 1. 克隆代码
git clone <repository-url>
cd TMS2.0

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp apps/backend/.env.example apps/backend/.env
# 编辑 .env 文件，确保 DATABASE_URL 正确

# 4. 启动服务
cd apps/backend && npm run dev
cd apps/frontend && npm run dev
```

### 2. 环境变量管理

- ✅ **DO**: 使用 `.env.example` 作为模板
- ✅ **DO**: 在团队文档中记录正确的配置值
- ✅ **DO**: 定期检查所有电脑的配置是否一致
- ❌ **DON'T**: 不要将 `.env` 文件提交到 Git
- ❌ **DON'T**: 不要在代码中硬编码敏感信息

### 3. 数据库选择

**开发环境推荐：**
- 🌐 **远程数据库（推荐）**: 所有开发者共享同一数据，便于协作
  - 优点：数据一致、无需本地数据库
  - 缺点：需要网络连接、可能相互影响

- 💻 **本地数据库**: 每个开发者独立数据
  - 优点：离线工作、互不影响
  - 缺点：数据不同步、需要本地 PostgreSQL

**当前配置：** 使用 Neon 远程数据库（推荐保持）

## 故障排查

### 问题：看到的数据不一样

**检查清单：**

1. ✅ 确认 `.env` 文件存在
   ```bash
   ls -la apps/backend/.env
   ```

2. ✅ 确认 `DATABASE_URL` 相同
   ```bash
   grep DATABASE_URL apps/backend/.env
   ```

3. ✅ 确认连接到同一数据库
   ```bash
   echo "SELECT current_database();" | psql "$DATABASE_URL"
   ```

4. ✅ 确认后端已重启
   - 修改 `.env` 后必须重启后端服务

### 问题：数据库连接失败

**可能原因：**
- 网络问题（无法访问 Neon）
- `DATABASE_URL` 格式错误
- 数据库密码过期

**解决方法：**
```bash
# 测试数据库连接
psql "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require" -c "SELECT 1"
```

## 安全提醒

⚠️ **重要：** 
- `.env` 文件包含敏感信息，不要分享到公开渠道
- 生产环境使用不同的数据库和密钥
- 定期更新 API 密钥和数据库密码
- 不要将 `.env` 文件提交到 Git

## 相关文件

- `apps/backend/.env` - 实际配置文件（不提交到 Git）
- `apps/backend/.env.example` - 配置模板（提交到 Git）
- `.gitignore` - 确保 `.env` 不被追踪
- `apps/backend/src/db-postgres.ts` - 数据库连接逻辑
