# 数据库迁移指南
> 更新时间：2025-11-24T16:50:00Z（由 Assistant 创建，用于指导数据库迁移决策）

本文档说明如何选择数据库方案，以及如何在不同数据库之间迁移。

---

## 📊 当前数据库配置

### 本地开发环境
- **数据库类型**: PostgreSQL 15 (Docker Compose)
- **连接方式**: `postgresql://tms_user:tms_password@postgres:5432/tms_platform`
- **位置**: 本地 Docker 容器

### GCP 部署环境
- **数据库类型**: Cloud SQL PostgreSQL
- **连接方式**: Unix socket (`/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`)
- **位置**: Google Cloud Platform
- **成本**: ~$7-10/月（使用免费方案）

---

## 🤔 是否需要迁移？

### 选项 A：继续使用 Cloud SQL（推荐）

**适用场景**:
- ✅ 已经在使用 GCP 服务
- ✅ 需要低延迟（同区域部署）
- ✅ 需要与 GCP 服务深度集成
- ✅ 可以接受 $7-10/月的成本

**优点**:
- 与 Cloud Run 同区域，延迟极低
- 无需修改代码（已支持）
- 自动备份和监控
- 与 GCP 生态集成好

**缺点**:
- 需要付费（即使是最低配置）
- 需要手动启停以节省成本

---

### 选项 B：迁移到 Neon（完全免费）

**适用场景**:
- ✅ 需要完全免费的数据库
- ✅ 可以接受略高的网络延迟
- ✅ 愿意进行数据迁移

**优点**:
- **完全免费**（Free Tier: 0.5 GB 存储，无限项目）
- 无需管理数据库启停
- 自动备份和恢复
- 支持分支（类似 Git）

**缺点**:
- 需要迁移数据
- 网络延迟可能略高（跨云服务商）
- 需要修改连接配置

---

## 🚀 迁移到 Neon 的步骤

### 1. 创建 Neon 账户和项目

1. 访问 [Neon Console](https://console.neon.tech/)
2. 注册/登录账户
3. 创建新项目
4. 选择区域（建议选择与 Cloud Run 相近的区域）

### 2. 获取 Neon 连接字符串

在 Neon Console 中：
1. 进入项目设置
2. 复制连接字符串，格式类似：
   ```
   postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require
   ```

### 3. 迁移数据

#### 方式 A：使用 pg_dump/pg_restore（推荐）

```bash
# 从 Cloud SQL 导出数据
gcloud sql export sql tms-postgres gs://your-bucket/tms-dump.sql \
  --database=tms_platform

# 下载 dump 文件
gsutil cp gs://your-bucket/tms-dump.sql .

# 导入到 Neon（使用 Neon 的连接字符串）
psql "postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require" < tms-dump.sql
```

#### 方式 B：使用 Neon 的迁移工具

Neon 提供了数据迁移工具，可以在 Console 中直接操作。

### 4. 更新代码配置

#### 4.1 修改 DatabaseService.ts

```typescript
// 移除 Cloud SQL 特殊处理，直接使用连接字符串
if (envUrl && typeof envUrl === 'string' && envUrl.startsWith('postgres')) {
  // 无论是本地、Cloud Run 还是 Neon，都使用标准连接字符串
  poolConfig = { connectionString: envUrl };
}
```

#### 4.2 更新 Secret Manager

```bash
# 更新 DATABASE_URL secret
echo -n "postgresql://user:password@ep-xxx-xxx.us-east-2.aws.neon.tech/dbname?sslmode=require" | \
  gcloud secrets versions add database-url --data-file=-
```

#### 4.3 更新 Cloud Run 配置

```bash
# 移除 Cloud SQL 连接器（不再需要）
gcloud run services update tms-backend \
  --region=us-central1 \
  --remove-cloudsql-instances
```

### 5. 测试连接

```bash
# 测试数据库连接
gcloud run services proxy tms-backend --region=us-central1 &
curl http://localhost:8080/api/health
```

---

## 📋 迁移检查清单

### 迁移前
- [ ] 备份 Cloud SQL 数据
- [ ] 创建 Neon 项目
- [ ] 测试 Neon 连接
- [ ] 准备迁移脚本

### 迁移中
- [ ] 导出 Cloud SQL 数据
- [ ] 导入到 Neon
- [ ] 验证数据完整性
- [ ] 更新代码配置
- [ ] 更新 Secret Manager
- [ ] 更新 Cloud Run 配置

### 迁移后
- [ ] 测试应用功能
- [ ] 监控数据库性能
- [ ] 验证备份机制
- [ ] 更新文档

---

## 💡 推荐方案

### 如果预算允许（$7-10/月）
**推荐继续使用 Cloud SQL**，因为：
1. 无需迁移数据
2. 延迟更低
3. 与 GCP 集成更好
4. 已修复硬编码问题，现在可以从环境变量读取

### 如果需要完全免费
**推荐迁移到 Neon**，因为：
1. 完全免费
2. 功能完整
3. 自动备份
4. 无需管理启停

---

## 🔧 当前代码修复

我已经修复了代码中的硬编码问题，现在连接名会从 `DATABASE_URL` 环境变量中自动提取。这意味着：

1. **无需修改代码**即可支持新的 Cloud SQL 实例
2. **也支持 Neon**（只需修改 DATABASE_URL 格式）
3. **向后兼容**现有的连接字符串格式

---

## 📚 相关文档

- [Neon 官方文档](https://neon.tech/docs)
- [Cloud SQL 文档](https://cloud.google.com/sql/docs)
- [GCP 免费部署方案](./GCP_FREE_DEPLOYMENT.md)

---

**最后更新**: 2025-11-24T16:50:00Z  
**维护者**: TMS 开发团队


