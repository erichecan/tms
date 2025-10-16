# TMS 平台 Google Cloud 部署步骤指南

**创建时间：** 2025-10-16 17:11:00  
**适用版本：** TMS v1.0.0

## 目录

- [前置准备](#前置准备)
- [步骤 1：设置 GCP 项目](#步骤-1设置-gcp-项目)
- [步骤 2：创建 Cloud SQL 数据库](#步骤-2创建-cloud-sql-数据库)
- [步骤 3：配置 Secret Manager](#步骤-3配置-secret-manager)
- [步骤 4：连接 GitHub 仓库](#步骤-4连接-github-仓库)
- [步骤 5：配置 Cloud Build 触发器](#步骤-5配置-cloud-build-触发器)
- [步骤 6：执行首次部署](#步骤-6执行首次部署)
- [步骤 7：数据库迁移](#步骤-7数据库迁移)
- [步骤 8：验证部署](#步骤-8验证部署)
- [故障排查](#故障排查)

---

## 前置准备

### 1. 所需工具

- **Google Cloud SDK (gcloud)**：[安装指南](https://cloud.google.com/sdk/docs/install)
- **Docker**：用于本地测试（可选）
- **Git**：版本控制
- **Node.js 18+**：本地开发和测试

### 2. 所需权限

确保您的 GCP 账户具有以下权限：
- `roles/owner` 或以下角色的组合：
  - `roles/run.admin`
  - `roles/cloudsql.admin`
  - `roles/secretmanager.admin`
  - `roles/cloudbuild.builds.editor`
  - `roles/iam.serviceAccountUser`

### 3. 预估成本

- **Cloud Run**：$10-50/月（根据流量）
- **Cloud SQL (db-g1-small)**：$25-50/月
- **Cloud Build**：前 120 分钟/天免费
- **Secret Manager**：$0.06/密钥/月
- **总计**：约 $40-110/月

---

## 步骤 1：设置 GCP 项目

### 1.1 创建新项目或选择现有项目

```bash
# 创建新项目
export PROJECT_ID="tms-production-12345"
export REGION="asia-east1"

gcloud projects create $PROJECT_ID --name="TMS Production"

# 设置为当前项目
gcloud config set project $PROJECT_ID

# 启用计费（必须）
# 访问：https://console.cloud.google.com/billing
```

### 1.2 启用必要的 API

```bash
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  compute.googleapis.com \
  vpcaccess.googleapis.com
```

**预计时间：** 2-3 分钟

---

## 步骤 2：创建 Cloud SQL 数据库

### 2.1 创建 PostgreSQL 实例

```bash
gcloud sql instances create tms-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase \
  --backup-start-time=03:00 \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --maintenance-release-channel=production \
  --no-assign-ip \
  --network=default
```

**预计时间：** 5-10 分钟

### 2.2 设置数据库密码

```bash
# 生成强密码
export DB_PASSWORD=$(openssl rand -base64 32)
echo "Database Password: $DB_PASSWORD"
# 请保存此密码！

# 设置 postgres 用户密码
gcloud sql users set-password postgres \
  --instance=tms-postgres \
  --password="$DB_PASSWORD"
```

### 2.3 创建应用数据库和用户

```bash
# 创建数据库
gcloud sql databases create tms_platform --instance=tms-postgres

# 创建应用用户
export APP_DB_PASSWORD=$(openssl rand -base64 32)
echo "App DB Password: $APP_DB_PASSWORD"
# 请保存此密码！

gcloud sql users create tms_user \
  --instance=tms-postgres \
  --password="$APP_DB_PASSWORD"
```

### 2.4 获取实例连接名

```bash
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe tms-postgres \
  --format='value(connectionName)')
echo "Instance Connection Name: $INSTANCE_CONNECTION_NAME"
```

---

## 步骤 3：配置 Secret Manager

### 3.1 创建数据库连接字符串密钥

```bash
# 构建连接字符串
export DATABASE_URL="postgresql://tms_user:${APP_DB_PASSWORD}@/tms_platform?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&sslmode=disable"

# 创建 Secret
echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=-

# 验证
gcloud secrets versions access latest --secret="database-url"
```

### 3.2 创建 JWT 密钥

```bash
# 生成随机密钥
export JWT_SECRET=$(openssl rand -base64 32)
echo "JWT Secret: $JWT_SECRET"

# 创建 Secret
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
```

### 3.3 创建 Google Maps API 密钥

```bash
# 替换为您的实际 API 密钥
export GOOGLE_MAPS_API_KEY="YOUR_ACTUAL_API_KEY"

echo -n "$GOOGLE_MAPS_API_KEY" | gcloud secrets create google-maps-api-key --data-file=-
```

### 3.4 创建 Gemini API 密钥（如果使用）

```bash
# 替换为您的实际 API 密钥
export GEMINI_API_KEY="YOUR_ACTUAL_API_KEY"

echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=-
```

### 3.5 授予 Cloud Run 访问权限

```bash
# 获取项目编号
export PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Cloud Run 默认服务账号
export SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

# 授予所有密钥的访问权限
for secret in database-url jwt-secret google-maps-api-key gemini-api-key; do
  gcloud secrets add-iam-policy-binding $secret \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor"
done
```

---

## 步骤 4：连接 GitHub 仓库

### 4.1 在 Cloud Console 中连接仓库

1. 访问 [Cloud Build 触发器页面](https://console.cloud.google.com/cloud-build/triggers)
2. 点击 **"连接代码库"**
3. 选择 **GitHub (Cloud Build GitHub App)**
4. 点击 **"继续"**
5. 授权 Google Cloud Build 访问您的 GitHub
6. 选择仓库：`erichecan/tms`
7. 点击 **"连接"**

### 4.2 验证连接

```bash
# 列出已连接的仓库
gcloud builds repositories list
```

---

## 步骤 5：配置 Cloud Build 触发器

### 5.1 更新 cloudbuild.yaml 中的替代变量

在创建触发器之前，确保以下变量已正确配置：

```bash
# 这些值将在触发器中设置
export _REGION="asia-east1"
export _CLOUDSQL_INSTANCE="${INSTANCE_CONNECTION_NAME}"
export _GOOGLE_MAPS_API_KEY="YOUR_API_KEY"
```

### 5.2 创建生产环境触发器

#### 方式 1：通过 Cloud Console（推荐）

1. 访问 [Cloud Build 触发器](https://console.cloud.google.com/cloud-build/triggers)
2. 点击 **"创建触发器"**
3. 配置如下：
   - **名称**：`deploy-production`
   - **描述**：Deploy to production on main branch
   - **事件**：推送到分支
   - **源**：选择 `erichecan/tms`
   - **分支**：`^main$`
   - **配置**：Cloud Build 配置文件
   - **位置**：`deploy/gcp/cloudbuild.yaml`
   
4. 在 **"替代变量"** 中添加：
   ```
   _REGION: asia-east1
   _BACKEND_URL: https://tms-backend-placeholder.run.app
   _GOOGLE_MAPS_API_KEY: YOUR_ACTUAL_API_KEY
   _CORS_ORIGIN: *
   _CLOUDSQL_INSTANCE: [YOUR_INSTANCE_CONNECTION_NAME]
   ```

5. 点击 **"创建"**

#### 方式 2：通过命令行

```bash
gcloud builds triggers create github \
  --name="deploy-production" \
  --repo-name="tms" \
  --repo-owner="erichecan" \
  --branch-pattern="^main$" \
  --build-config="deploy/gcp/cloudbuild.yaml" \
  --substitutions=_REGION="asia-east1",_CLOUDSQL_INSTANCE="${INSTANCE_CONNECTION_NAME}",_GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY}",_CORS_ORIGIN="*",_BACKEND_URL="https://placeholder.run.app"
```

---

## 步骤 6：执行首次部署

### 6.1 手动触发构建（推荐用于首次部署）

```bash
# 手动触发构建
gcloud builds triggers run deploy-production --branch=main
```

### 6.2 或者通过 Git 推送触发

```bash
# 在本地仓库中
cd /path/to/tms
git add .
git commit -m "chore: configure GCP deployment"
git push origin main
```

### 6.3 监控构建进度

```bash
# 查看构建列表
gcloud builds list --limit=5

# 查看特定构建的日志
gcloud builds log [BUILD_ID] --stream
```

**预计时间：** 15-20 分钟（首次构建）

---

## 步骤 7：数据库迁移

### 7.1 安装 Cloud SQL Proxy

```bash
# macOS
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.darwin.amd64
chmod +x cloud-sql-proxy

# Linux
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.11.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# 或通过 gcloud
gcloud components install cloud-sql-proxy
```

### 7.2 启动 Cloud SQL Proxy

```bash
# 在后台启动代理
./cloud-sql-proxy --port 5432 $INSTANCE_CONNECTION_NAME &

# 等待几秒钟
sleep 5
```

### 7.3 运行数据库迁移

```bash
cd /path/to/tms

# 设置本地数据库连接
export DATABASE_URL="postgresql://tms_user:${APP_DB_PASSWORD}@localhost:5432/tms_platform"

# 运行迁移
cd apps/backend
npm run db:migrate

# 运行种子数据（可选）
npm run db:seed
```

### 7.4 验证数据库

```bash
# 使用 psql 连接
psql "postgresql://tms_user:${APP_DB_PASSWORD}@localhost:5432/tms_platform"

# 列出所有表
\dt

# 退出
\q
```

### 7.5 停止 Proxy

```bash
# 查找进程
ps aux | grep cloud-sql-proxy

# 停止（替换 PID）
kill [PID]
```

---

## 步骤 8：验证部署

### 8.1 获取服务 URL

```bash
# 获取后端 URL
export BACKEND_URL=$(gcloud run services describe tms-backend \
  --region=$REGION \
  --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"

# 获取前端 URL
export FRONTEND_URL=$(gcloud run services describe tms-frontend \
  --region=$REGION \
  --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

### 8.2 测试后端健康检查

```bash
# 测试健康检查端点（如果有）
curl ${BACKEND_URL}/health

# 或测试 API 根路径
curl ${BACKEND_URL}/api
```

### 8.3 访问前端应用

```bash
# 在浏览器中打开
open $FRONTEND_URL

# 或使用 curl 检查
curl -I $FRONTEND_URL
```

### 8.4 更新 CORS 配置

现在我们有了实际的前端 URL，需要更新后端的 CORS 配置：

```bash
# 更新触发器中的 _CORS_ORIGIN 变量
gcloud builds triggers update deploy-production \
  --update-substitutions=_CORS_ORIGIN="${FRONTEND_URL}"

# 重新部署后端
gcloud run services update tms-backend \
  --region=$REGION \
  --update-env-vars=CORS_ORIGIN="${FRONTEND_URL}"
```

### 8.5 更新前端 API 地址

```bash
# 更新触发器中的 _BACKEND_URL 变量
gcloud builds triggers update deploy-production \
  --update-substitutions=_BACKEND_URL="${BACKEND_URL}"

# 重新构建前端（推送代码或手动触发）
```

### 8.6 查看日志

```bash
# 后端日志
gcloud logs tail --service=tms-backend --limit=50

# 前端日志
gcloud logs tail --service=tms-frontend --limit=50

# 实时日志
gcloud logs tail --service=tms-backend --follow
```

---

## 故障排查

### 问题 1：构建失败

**检查项：**
```bash
# 查看构建日志
gcloud builds log [BUILD_ID]

# 常见原因：
# - Dockerfile 路径错误
# - 依赖安装失败
# - 内存不足
```

**解决方案：**
- 验证 `cloudbuild.yaml` 中的路径
- 检查 `package.json` 依赖
- 增加构建机器类型

### 问题 2：Cloud Run 服务无法启动

**检查项：**
```bash
# 查看服务详情
gcloud run services describe tms-backend --region=$REGION

# 查看修订版本
gcloud run revisions list --service=tms-backend --region=$REGION

# 查看日志
gcloud logs read "resource.type=cloud_run_revision" --limit=50
```

**常见原因：**
- 端口配置错误（确保使用 PORT 环境变量）
- 数据库连接失败
- 缺少必要的环境变量

### 问题 3：数据库连接失败

**检查项：**
```bash
# 验证 Secret
gcloud secrets versions access latest --secret=database-url

# 验证 Cloud SQL 实例
gcloud sql instances describe tms-postgres

# 检查 IAM 权限
gcloud projects get-iam-policy $PROJECT_ID \
  --flatten="bindings[].members" \
  --filter="bindings.members:${SERVICE_ACCOUNT}"
```

**解决方案：**
- 确保 `--add-cloudsql-instances` 参数正确
- 验证数据库连接字符串格式
- 检查 Cloud SQL 实例状态

### 问题 4：前端无法访问后端

**检查项：**
- CORS 配置是否正确
- 前端构建时的 API URL 是否正确
- 网络防火墙规则

**解决方案：**
```bash
# 临时允许所有来源（仅测试用）
gcloud run services update tms-backend \
  --region=$REGION \
  --update-env-vars=CORS_ORIGIN="*"

# 验证前端环境变量
# 检查前端构建产物中的 API URL
```

---

## 后续步骤

### 1. 配置自定义域名

```bash
# 映射域名到 Cloud Run 服务
gcloud run domain-mappings create \
  --service=tms-frontend \
  --domain=www.yourdomain.com \
  --region=$REGION
```

### 2. 设置监控和告警

访问 [Cloud Monitoring](https://console.cloud.google.com/monitoring)：
- 创建 Uptime checks
- 设置错误率告警
- 配置 CPU/内存使用告警

### 3. 配置自动备份

```bash
# Cloud SQL 已自动启用每日备份
# 查看备份
gcloud sql backups list --instance=tms-postgres
```

### 4. 实施 CI/CD 最佳实践

- 创建 staging 环境
- 添加自动化测试到构建流程
- 实施蓝绿部署或金丝雀发布

---

## 有用的命令速查

```bash
# 查看所有 Cloud Run 服务
gcloud run services list

# 查看服务详情
gcloud run services describe tms-backend --region=$REGION

# 更新服务
gcloud run services update tms-backend --region=$REGION --memory=4Gi

# 删除服务
gcloud run services delete tms-backend --region=$REGION

# 查看构建历史
gcloud builds list --limit=10

# 查看触发器
gcloud builds triggers list

# 查看 Secret
gcloud secrets list

# 查看 Cloud SQL 实例
gcloud sql instances list
```

---

## 支持和文档

- [Cloud Run 文档](https://cloud.google.com/run/docs)
- [Cloud SQL 文档](https://cloud.google.com/sql/docs)
- [Cloud Build 文档](https://cloud.google.com/build/docs)
- [Secret Manager 文档](https://cloud.google.com/secret-manager/docs)

---

**文档版本：** 1.0  
**最后更新：** 2025-10-16 17:11:00

