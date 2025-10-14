# Google Cloud Platform 部署指南

## 概述

本文档说明如何将 TMS 应用部署到 Google Cloud Platform，包括：
- Cloud Run（后端和前端服务）
- Cloud SQL for PostgreSQL（数据库）
- Secret Manager（敏感信息管理）
- Cloud Build（CI/CD）

## 架构图

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Firebase      │    │   Cloud Run     │    │   Cloud SQL     │
│   Hosting       │◄──►│   Backend       │◄──►│   PostgreSQL    │
│   (Frontend)    │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌─────────────────┐
                       │  Secret Manager │
                       │  (API Keys)     │
                       └─────────────────┘
```

## 快速开始

### 1. 前置要求

- Google Cloud 账户和项目
- 已安装 `gcloud` CLI
- 已安装 Docker
- 已安装 Node.js 和 npm

### 2. 设置项目

```bash
# 设置项目 ID
export PROJECT_ID=your-project-id
export REGION=asia-east1

# 设置默认项目
gcloud config set project $PROJECT_ID
```

### 3. 启用必要的 API

```bash
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com
```

### 4. 运行部署脚本

```bash
# 给脚本执行权限
chmod +x deploy/gcp/deploy.sh

# 运行部署脚本
./deploy/gcp/deploy.sh
```

## 手动部署步骤

### 1. 创建 Cloud SQL 实例

```bash
# 创建 PostgreSQL 实例
gcloud sql instances create tms-postgres \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=asia-east1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup-start-time=03:00 \
    --enable-ip-alias \
    --authorized-networks=0.0.0.0/0

# 设置 root 密码
gcloud sql users set-password postgres \
    --instance=tms-postgres \
    --password=YOUR_SECURE_PASSWORD

# 创建应用数据库
gcloud sql databases create tms_db --instance=tms-postgres
```

### 2. 创建 Secret Manager 密钥

```bash
# 数据库连接字符串
echo "postgres://postgres:YOUR_PASSWORD@/tms_db?host=/cloudsql/$PROJECT_ID:asia-east1:tms-postgres" | \
gcloud secrets create database-url --data-file=-

# JWT 密钥
echo "your-32-character-jwt-secret-key" | \
gcloud secrets create jwt-secret --data-file=-

# Google Maps API 密钥
echo "AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28" | \
gcloud secrets create google-maps-api-key --data-file=-
```

### 3. 构建和推送镜像

```bash
# 配置 Docker 认证
gcloud auth configure-docker

# 构建后端镜像
docker build -t gcr.io/$PROJECT_ID/tms-backend:latest -f docker/backend/Dockerfile apps/backend/
docker push gcr.io/$PROJECT_ID/tms-backend:latest

# 构建前端镜像
docker build -t gcr.io/$PROJECT_ID/tms-frontend:latest -f docker/frontend/Dockerfile apps/frontend/
docker push gcr.io/$PROJECT_ID/tms-frontend:latest
```

### 4. 部署到 Cloud Run

```bash
# 部署后端服务
gcloud run deploy tms-backend \
    --image=gcr.io/$PROJECT_ID/tms-backend:latest \
    --region=asia-east1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
    --set-env-vars=PORT=8080,NODE_ENV=production,CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN.com \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=10 \
    --timeout=300

# 获取后端 URL
BACKEND_URL=$(gcloud run services describe tms-backend --region=asia-east1 --format="value(status.url)")

# 部署前端服务
gcloud run deploy tms-frontend \
    --image=gcr.io/$PROJECT_ID/tms-frontend:latest \
    --region=asia-east1 \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars=VITE_API_BASE_URL=$BACKEND_URL \
    --memory=1Gi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5
```

## 环境变量配置

### 后端环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `DATABASE_URL` | 数据库连接字符串 | `postgres://user:pass@/db?host=/cloudsql/...` |
| `JWT_SECRET` | JWT 签名密钥 | `your-32-character-secret` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API 密钥 | `AIzaSy...` |
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `8080` |
| `CORS_ORIGIN` | 允许的跨域源 | `https://yourdomain.com` |

### 前端环境变量

| 变量名 | 描述 | 示例值 |
|--------|------|--------|
| `VITE_API_BASE_URL` | 后端 API 地址 | `https://tms-backend-xxx.run.app` |
| `VITE_GOOGLE_MAPS_API_KEY` | Google Maps API 密钥 | `AIzaSy...` |

## 数据库迁移

### 1. 使用 Cloud SQL Proxy

```bash
# 下载 Cloud SQL Proxy
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# 启动代理
./cloud_sql_proxy -instances=$PROJECT_ID:asia-east1:tms-postgres=tcp:5432
```

### 2. 运行迁移

```bash
cd apps/backend
npm run migrate
```

## 监控和日志

### 1. 查看服务日志

```bash
# 后端日志
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-backend" --limit=50

# 前端日志
gcloud logs read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-frontend" --limit=50
```

### 2. 监控指标

访问 [Google Cloud Console](https://console.cloud.google.com/) 查看：
- Cloud Run 服务指标
- Cloud SQL 性能指标
- 错误率和响应时间

## 故障排除

### 常见问题

1. **服务启动失败**
   - 检查环境变量配置
   - 验证 Secret Manager 密钥
   - 查看 Cloud Run 日志

2. **数据库连接失败**
   - 验证 Cloud SQL 实例状态
   - 检查连接字符串格式
   - 确认网络访问权限

3. **前端无法访问后端**
   - 检查 CORS 配置
   - 验证后端 URL
   - 确认服务权限设置

### 调试命令

```bash
# 检查服务状态
gcloud run services list --region=asia-east1

# 查看服务详情
gcloud run services describe tms-backend --region=asia-east1

# 测试服务连接
curl https://your-backend-url.run.app/health

# 查看实时日志
gcloud logs tail "resource.type=cloud_run_revision AND resource.labels.service_name=tms-backend"
```

## 成本优化

1. **Cloud Run**
   - 设置最小实例数为 0（前端服务）
   - 调整 CPU 和内存分配
   - 使用请求并发控制

2. **Cloud SQL**
   - 选择合适的主机规格
   - 启用自动备份优化
   - 监控存储使用量

3. **Secret Manager**
   - 定期轮换密钥
   - 删除不再使用的密钥

## 安全最佳实践

1. **网络安全**
   - 限制 Cloud SQL 访问 IP 范围
   - 使用 VPC 网络
   - 启用 SSL/TLS

2. **访问控制**
   - 使用 IAM 角色和权限
   - 定期审查访问权限
   - 启用审计日志

3. **数据保护**
   - 使用 Secret Manager 存储敏感信息
   - 启用数据库加密
   - 定期备份数据

## 更新和维护

### 1. 更新服务

```bash
# 重新构建镜像
docker build -t gcr.io/$PROJECT_ID/tms-backend:latest -f docker/backend/Dockerfile apps/backend/
docker push gcr.io/$PROJECT_ID/tms-backend:latest

# 更新 Cloud Run 服务
gcloud run services update tms-backend --region=asia-east1 --image=gcr.io/$PROJECT_ID/tms-backend:latest
```

### 2. 数据库维护

```bash
# 创建备份
gcloud sql backups create --instance=tms-postgres

# 查看备份列表
gcloud sql backups list --instance=tms-postgres
```

## 支持

如有问题，请参考：
- [Cloud Run 文档](https://cloud.google.com/run/docs)
- [Cloud SQL 文档](https://cloud.google.com/sql/docs)
- [Secret Manager 文档](https://cloud.google.com/secret-manager/docs)
