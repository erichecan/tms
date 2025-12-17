# GCP 部署状态

**部署时间**: 2025-12-10T23:30:00Z  
**项目 ID**: 275911787144  
**区域**: asia-east2

## 部署进度

### ✅ 已完成

1. **代码修改**
   - ✅ 前端权限定义已更新
   - ✅ 菜单配置已更新
   - ✅ 权限树已更新
   - ✅ 规则管理页面权限检查已添加
   - ✅ 后端权限中间件错误消息已改进
   - ✅ 数据库迁移脚本已创建并修复

2. **数据库迁移脚本**
   - ✅ 创建了 `database_migrations/016_add_rules_manage_permission.sql`
   - ✅ 修复了表不存在时的错误处理
   - ✅ 迁移脚本现在可以安全地处理表不存在的情况

3. **Docker 镜像构建**
   - ✅ 后端镜像构建成功
   - ✅ 前端镜像构建成功

### ⚠️ 进行中

1. **Docker 镜像推送**
   - ⚠️ 遇到 412 Precondition Failed 错误
   - 正在重新认证并重试推送

### 📋 待执行

1. **数据库迁移**
   - 需要在部署后手动执行迁移脚本
   - 或通过 Cloud SQL 连接执行

2. **服务部署**
   - 等待 Docker 镜像推送完成后部署到 Cloud Run

## 手动执行步骤

### 1. 执行数据库迁移

如果 Docker 推送成功，可以通过以下方式执行数据库迁移：

**方式 A: 通过 Cloud SQL 连接**

```bash
# 获取数据库连接字符串
DATABASE_URL=$(gcloud secrets versions access latest --secret="database-url" --project=275911787144)

# 执行迁移（如果有 psql）
psql "$DATABASE_URL" -f database_migrations/016_add_rules_manage_permission.sql

# 或使用 Docker
docker run --rm \
  -e PGPASSWORD="$(echo $DATABASE_URL | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')" \
  postgres:15-alpine \
  psql "$DATABASE_URL" -f - < database_migrations/016_add_rules_manage_permission.sql
```

**方式 B: 通过后端服务执行**

迁移脚本已经修复，可以在后端服务启动后通过 API 或管理界面执行。

### 2. 验证部署

部署完成后，验证以下内容：

1. **后端服务健康检查**
   ```bash
   curl https://tms-backend-275911787144.asia-east2.run.app/health
   ```

2. **规则管理权限验证**
   - 以 dispatcher 身份登录
   - 验证能看到规则管理菜单
   - 验证能访问规则管理页面
   - 验证 API 调用返回 200（不是 403）

3. **无权限用户验证**
   - 以无权限用户登录
   - 验证看不到规则管理菜单
   - 验证直接访问显示 403

## 故障排查

### Docker 推送 412 错误

如果遇到 412 Precondition Failed 错误：

1. **重新认证 Docker**
   ```bash
   gcloud auth configure-docker --quiet
   ```

2. **使用新标签**
   ```bash
   docker tag gcr.io/275911787144/tms-backend:latest \
              gcr.io/275911787144/tms-backend:$(date +%Y%m%d-%H%M%S)
   docker push gcr.io/275911787144/tms-backend:$(date +%Y%m%d-%H%M%S)
   ```

3. **检查权限**
   ```bash
   gcloud projects get-iam-policy 275911787144
   ```

### 数据库迁移错误

如果迁移脚本执行失败：

1. **检查表是否存在**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('tenant_users', 'users');
   ```

2. **手动执行部分 SQL**
   - 如果 `tenant_users` 表不存在，迁移脚本会自动跳过相关步骤
   - 权限将在用户创建时自动授予（通过后端代码中的 `ROLE_PERMISSIONS` 映射）

## 下一步

1. 等待 Docker 镜像推送完成
2. 执行数据库迁移
3. 验证部署结果
4. 运行 E2E 测试验证权限功能
