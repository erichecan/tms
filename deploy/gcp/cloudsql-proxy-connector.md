# Cloud SQL 连接配置指南
# 2025-01-27 10:40:00

## 概述
本文档说明如何配置 Cloud SQL for PostgreSQL 连接，支持两种方式：
1. 使用 Cloud SQL Proxy（推荐用于生产环境）
2. 直接连接（适用于开发/测试环境）

## 方式一：使用 Cloud SQL Proxy（推荐）

### 1. 启用 Cloud SQL Admin API
```bash
gcloud services enable sqladmin.googleapis.com
```

### 2. 创建 Cloud SQL 实例
```bash
# 创建实例
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

### 3. 创建 Cloud SQL 连接器
```bash
# 创建连接器
gcloud sql connect tms-postgres \
    --user=postgres \
    --database=tms_db
```

### 4. 配置 Cloud Run 使用连接器
在 Cloud Run 服务中添加连接器配置：
```yaml
metadata:
  annotations:
    run.googleapis.com/cloudsql-instances: PROJECT_ID:asia-east1:tms-postgres
```

### 5. 生成连接字符串
```bash
# 获取连接名称
gcloud sql instances describe tms-postgres --format="value(connectionName)"

# 连接字符串格式（用于 Cloud Run）
postgres://postgres:YOUR_PASSWORD@/tms_db?host=/cloudsql/PROJECT_ID:asia-east1:tms-postgres
```

## 方式二：直接连接（开发/测试）

### 1. 启用外网访问
```bash
gcloud sql instances patch tms-postgres \
    --authorized-networks=0.0.0.0/0
```

### 2. 获取外网 IP
```bash
gcloud sql instances describe tms-postgres \
    --format="value(ipAddresses[0].ipAddress)"
```

### 3. 生成连接字符串
```bash
# 外网连接字符串格式
postgres://postgres:YOUR_PASSWORD@EXTERNAL_IP:5432/tms_db?sslmode=require
```

## 环境变量配置

### Cloud Run 环境变量
```bash
# 使用 Secret Manager 存储敏感信息
gcloud secrets create database-url \
    --data-file=- <<< "postgres://postgres:YOUR_PASSWORD@/tms_db?host=/cloudsql/PROJECT_ID:asia-east1:tms-postgres"

gcloud secrets create jwt-secret \
    --data-file=- <<< "your-32-character-jwt-secret-key"

gcloud secrets create google-maps-api-key \
    --data-file=- <<< "AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28"
```

### 本地开发环境变量
```bash
# .env.gcp.example
DATABASE_URL=postgres://postgres:YOUR_PASSWORD@EXTERNAL_IP:5432/tms_db?sslmode=require
JWT_SECRET=your-32-character-jwt-secret-key
GOOGLE_MAPS_API_KEY=AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000
```

## 数据库迁移

### 1. 安装 Cloud SQL Proxy（本地开发）
```bash
# macOS
curl -o cloud_sql_proxy https://dl.google.com/cloudsql/cloud_sql_proxy.darwin.amd64
chmod +x cloud_sql_proxy

# 启动代理
./cloud_sql_proxy -instances=PROJECT_ID:asia-east1:tms-postgres=tcp:5432
```

### 2. 运行数据库迁移
```bash
cd apps/backend
npm run migrate
```

## 安全最佳实践

1. **使用 Secret Manager**：存储所有敏感信息
2. **启用 SSL**：始终使用 `sslmode=require`
3. **限制网络访问**：仅允许必要的 IP 范围
4. **定期备份**：启用自动备份
5. **监控访问**：启用 Cloud SQL 审计日志

## 故障排除

### 连接超时
- 检查防火墙规则
- 验证 Cloud SQL 实例状态
- 确认连接字符串格式

### 认证失败
- 验证用户名和密码
- 检查数据库用户权限
- 确认 SSL 配置

### 性能问题
- 监控 Cloud SQL 指标
- 考虑升级实例规格
- 优化查询和索引
