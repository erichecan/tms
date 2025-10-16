# TMS GCP 部署快速参考

**创建时间：** 2025-10-16 17:15:00

## 🚀 30 秒部署概览

### 准备阶段（5-10 分钟）

```bash
# 1. 运行自动化脚本
cd deploy/gcp
./setup-gcp.sh

# 2. 连接 GitHub（在 Cloud Console）
# https://console.cloud.google.com/cloud-build/triggers
```

### 部署阶段（15-20 分钟）

```bash
# 3. 推送代码触发部署
git push origin main

# 4. 运行数据库迁移
./cloud-sql-proxy [INSTANCE_CONNECTION_NAME] &
cd apps/backend && npm run db:migrate
```

---

## 📋 关键资源

### GCP 服务

| 服务 | 用途 | 成本/月 |
|------|------|---------|
| Cloud Run (后端) | 容器化 API 服务 | $20-40 |
| Cloud Run (前端) | 静态文件托管 | $5-15 |
| Cloud SQL | PostgreSQL 数据库 | $25-50 |
| Secret Manager | 密钥管理 | $0.30 |
| Cloud Build | CI/CD | 免费 120min/天 |
| **总计** | - | **$50-105/月** |

### 必需的 Secret

| 密钥名称 | 描述 | 示例值 |
|---------|------|--------|
| `database-url` | 数据库连接字符串 | `postgresql://tms_user:***@/tms_platform?host=/cloudsql/...` |
| `jwt-secret` | JWT 签名密钥 | 32 字符随机字符串 |
| `google-maps-api-key` | Google Maps API | `AIza...` |
| `gemini-api-key` | Gemini AI API（可选） | `AIza...` |

### Cloud Build 替代变量

| 变量名 | 示例值 | 说明 |
|--------|--------|------|
| `_REGION` | `asia-east1` | 部署区域 |
| `_CLOUDSQL_INSTANCE` | `project:region:instance` | Cloud SQL 连接名 |
| `_GOOGLE_MAPS_API_KEY` | `AIza...` | Maps API 密钥 |
| `_CORS_ORIGIN` | `https://frontend-xxx.run.app` | 前端 URL |
| `_BACKEND_URL` | `https://backend-xxx.run.app` | 后端 URL |

---

## 🔑 关键命令

### 项目设置

```bash
# 设置项目
export PROJECT_ID="your-project-id"
export REGION="asia-east1"
gcloud config set project $PROJECT_ID

# 启用 API
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com
```

### Cloud SQL

```bash
# 创建实例
gcloud sql instances create tms-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-g1-small \
  --region=$REGION

# 获取连接名
gcloud sql instances describe tms-postgres \
  --format='value(connectionName)'

# 连接数据库
./cloud-sql-proxy [CONNECTION_NAME] &
psql "postgresql://tms_user:[PASSWORD]@localhost:5432/tms_platform"
```

### Secret Manager

```bash
# 创建密钥
echo -n "SECRET_VALUE" | gcloud secrets create secret-name --data-file=-

# 查看密钥
gcloud secrets versions access latest --secret=secret-name

# 授权访问
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

gcloud secrets add-iam-policy-binding secret-name \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/secretmanager.secretAccessor"
```

### Cloud Build

```bash
# 手动触发构建
gcloud builds triggers run deploy-production --branch=main

# 查看构建列表
gcloud builds list --limit=10

# 查看构建日志
gcloud builds log [BUILD_ID] --stream

# 更新触发器
gcloud builds triggers update deploy-production \
  --update-substitutions=_CORS_ORIGIN="https://new-url.run.app"
```

### Cloud Run

```bash
# 查看服务
gcloud run services list
gcloud run services describe tms-backend --region=$REGION

# 获取服务 URL
gcloud run services describe tms-backend \
  --region=$REGION \
  --format='value(status.url)'

# 更新服务
gcloud run services update tms-backend \
  --region=$REGION \
  --memory=4Gi \
  --cpu=2 \
  --update-env-vars=KEY=VALUE

# 查看修订版本
gcloud run revisions list --service=tms-backend --region=$REGION

# 回滚到上一个版本
gcloud run services update-traffic tms-backend \
  --region=$REGION \
  --to-revisions=[REVISION_NAME]=100
```

### 日志查看

```bash
# 实时日志
gcloud logs tail --service=tms-backend --follow

# 历史日志
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-backend" --limit=100

# 错误日志
gcloud logs read "resource.type=cloud_run_revision AND severity>=ERROR" --limit=50

# 按时间过滤
gcloud logs read "resource.type=cloud_run_revision" \
  --limit=50 \
  --format="table(timestamp,severity,textPayload)" \
  --freshness=1h
```

---

## 🐛 快速故障排查

### 构建失败

```bash
# 1. 查看构建日志
gcloud builds log [BUILD_ID]

# 2. 常见问题：
# - Dockerfile 路径错误 → 检查 cloudbuild.yaml
# - 依赖安装失败 → 检查 package.json
# - 内存不足 → 增加构建机器类型
```

### 服务无法启动

```bash
# 1. 查看服务日志
gcloud logs tail --service=tms-backend --limit=100

# 2. 检查环境变量
gcloud run services describe tms-backend --region=$REGION

# 3. 常见问题：
# - 端口错误 → 确保使用 PORT 环境变量
# - 数据库连接失败 → 检查 --add-cloudsql-instances
# - 缺少 Secret → 验证 Secret Manager 配置
```

### 数据库连接问题

```bash
# 1. 验证 Cloud SQL 实例
gcloud sql instances describe tms-postgres

# 2. 测试本地连接
./cloud-sql-proxy [INSTANCE_CONNECTION_NAME] &
psql "postgresql://tms_user:[PASSWORD]@localhost:5432/tms_platform"

# 3. 检查 Secret
gcloud secrets versions access latest --secret=database-url

# 4. 验证 IAM 权限
gcloud secrets get-iam-policy database-url
```

### CORS 错误

```bash
# 1. 临时允许所有来源（仅测试）
gcloud run services update tms-backend \
  --region=$REGION \
  --update-env-vars=CORS_ORIGIN="*"

# 2. 设置正确的前端 URL
FRONTEND_URL=$(gcloud run services describe tms-frontend --region=$REGION --format='value(status.url)')
gcloud run services update tms-backend \
  --region=$REGION \
  --update-env-vars=CORS_ORIGIN="$FRONTEND_URL"
```

---

## 📊 监控和维护

### 查看服务状态

```bash
# 服务健康状态
gcloud run services describe tms-backend --region=$REGION \
  --format='value(status.conditions)'

# 资源使用情况
gcloud run services describe tms-backend --region=$REGION \
  --format='yaml(spec.template.spec.containers[0].resources)'

# 请求统计（需要在 Cloud Console 查看）
# https://console.cloud.google.com/run
```

### 数据库备份

```bash
# 创建按需备份
gcloud sql backups create --instance=tms-postgres

# 列出备份
gcloud sql backups list --instance=tms-postgres

# 恢复备份
gcloud sql backups restore [BACKUP_ID] --backup-instance=tms-postgres
```

### 成本监控

```bash
# 查看计费账户
gcloud billing accounts list

# 设置预算告警（在 Cloud Console）
# https://console.cloud.google.com/billing/budgets
```

---

## 🔄 更新和回滚

### 部署新版本

```bash
# 方式 1：推送代码（自动）
git push origin main

# 方式 2：手动触发
gcloud builds triggers run deploy-production --branch=main
```

### 回滚到上一版本

```bash
# 1. 查看修订版本
gcloud run revisions list --service=tms-backend --region=$REGION

# 2. 切换流量到上一版本
gcloud run services update-traffic tms-backend \
  --region=$REGION \
  --to-revisions=[PREVIOUS_REVISION]=100
```

### 零停机更新

```bash
# 金丝雀发布（新版本 10%，旧版本 90%）
gcloud run services update-traffic tms-backend \
  --region=$REGION \
  --to-revisions=[NEW_REVISION]=10,[OLD_REVISION]=90

# 逐步增加新版本流量
gcloud run services update-traffic tms-backend \
  --region=$REGION \
  --to-revisions=[NEW_REVISION]=50,[OLD_REVISION]=50

# 完全切换到新版本
gcloud run services update-traffic tms-backend \
  --region=$REGION \
  --to-latest
```

---

## 📞 有用的链接

### GCP Console 快速访问

- [Cloud Run 服务](https://console.cloud.google.com/run)
- [Cloud Build 历史](https://console.cloud.google.com/cloud-build/builds)
- [Cloud SQL 实例](https://console.cloud.google.com/sql/instances)
- [Secret Manager](https://console.cloud.google.com/security/secret-manager)
- [日志浏览器](https://console.cloud.google.com/logs)
- [监控仪表板](https://console.cloud.google.com/monitoring)

### 官方文档

- [Cloud Run 文档](https://cloud.google.com/run/docs)
- [Cloud Build 文档](https://cloud.google.com/build/docs)
- [Cloud SQL 文档](https://cloud.google.com/sql/docs)
- [Secret Manager 文档](https://cloud.google.com/secret-manager/docs)

---

**版本：** 1.0  
**最后更新：** 2025-10-16 17:15:00

