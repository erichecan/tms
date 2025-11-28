# GCP 免费/极低成本部署方案
> 更新时间：2025-11-24T16:30:00Z（由 Assistant 重新整理，优化免费额度利用和操作流程）

本方案针对 TMS 应用，目标是在**不牺牲核心功能**的前提下，将 GCP 月度成本控制在 **$0-10 USD** 以内，适用于预发/演示/小规模生产环境。

---

## 📋 目录

1. [免费额度概览](#1-免费额度概览)
2. [架构设计](#2-架构设计)
3. [成本优化策略](#3-成本优化策略)
4. [部署步骤](#4-部署步骤)
5. [数据库成本控制](#5-数据库成本控制)
6. [监控与告警](#6-监控与告警)
7. [故障排查](#7-故障排查)
8. [常见问题](#8-常见问题)

---

## 1. 免费额度概览

### 1.1 GCP Always-Free 额度（每月）

| 服务 | 免费额度 | 说明 |
|------|---------|------|
| **Cloud Run** | 200 万请求<br>360,000 GB-秒<br>180,000 vCPU-秒 | 适用于后端和前端服务 |
| **Cloud Build** | 120 构建分钟 | 使用 E2_MEDIUM 机器类型 |
| **Cloud Logging** | 50 GiB 日志 | 包含应用日志和审计日志 |
| **Secret Manager** | 6 个密钥版本 | 足够存储所有敏感配置 |
| **Cloud Storage** | 5 GB 存储<br>1 GB 出站流量 | 可选，用于静态资源 |
| **Firebase Hosting** | 10 GB 存储<br>360 MB/天 出站流量 | 完全免费，可替代 Cloud Run 前端 |

### 1.2 需要付费的服务

| 服务 | 最低成本 | 优化策略 |
|------|---------|---------|
| **Cloud SQL PostgreSQL** | ~$7-9/月 | 使用 `db-f1-micro` + 按需暂停 |
| **Cloud SQL 存储** | ~$0.17/GB/月 | 最小化存储大小（10GB） |

**总成本估算：$7-10 USD/月**（仅数据库费用，其他服务在免费额度内）

---

## 2. 架构设计

### 2.1 推荐架构

```
┌─────────────────────────────────────────────────────────┐
│                    用户请求                              │
└────────────────────┬────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │                        │
    ┌────▼────┐            ┌──────▼──────┐
    │ 前端    │            │  后端 API    │
    │ Cloud   │───────────▶│  Cloud Run   │
    │ Run     │            │  (0.25 CPU) │
    │(0.25CPU)│            │  512Mi RAM   │
    └─────────┘            └──────┬──────┘
                                   │
                          ┌────────┴────────┐
                          │                 │
                    ┌─────▼─────┐   ┌──────▼──────┐
                    │ Cloud SQL  │   │Secret Manager│
                    │ PostgreSQL │   │  (密钥存储)  │
                    │db-f1-micro │   └─────────────┘
                    │ 按需暂停   │
                    └────────────┘
```

### 2.2 资源配置

#### 后端服务（Cloud Run）
- **CPU**: 0.25 vCPU（最小配置，符合免费额度）
- **内存**: 512 MiB
- **并发**: 80 请求/实例（提高利用率）
- **最小实例**: 0（冷启动，节省成本）
- **最大实例**: 2（限制突发）
- **超时**: 180 秒
- **区域**: `us-central1`（Always-Free 区域）

#### 前端服务（Cloud Run 或 Firebase Hosting）
- **方案 A - Cloud Run**:
  - CPU: 0.25 vCPU
  - 内存: 256 MiB
  - 并发: 150 请求/实例
  - 最小实例: 0
  - 最大实例: 2
  - 超时: 120 秒

- **方案 B - Firebase Hosting**（推荐，完全免费）:
  - 存储: 10 GB（免费）
  - 流量: 360 MB/天（免费）
  - 完全静态托管，零运行时成本

#### 数据库（Cloud SQL）
- **实例类型**: `db-f1-micro`（共享核心，最低配置）
- **存储**: 10 GB SSD（最小配置）
- **区域**: `us-central1`（与 Cloud Run 同区域，降低延迟）
- **激活策略**: `NEVER`（按需启动，节省成本）

#### 构建服务（Cloud Build）
- **机器类型**: `E2_MEDIUM`（免费额度内）
- **磁盘大小**: 25 GB（最小配置）
- **触发方式**: 手动触发（避免自动构建消耗额度）

---

## 3. 成本优化策略

### 3.1 Cloud Run 优化

1. **最小实例设为 0**：服务空闲时自动缩容到零，不产生费用
2. **提高并发数**：单实例处理更多请求，减少实例数量
3. **降低 CPU/内存**：使用最小配置，充分利用免费额度
4. **缩短超时时间**：减少空闲计费时间

### 3.2 Cloud SQL 优化

1. **使用最小实例类型**：`db-f1-micro` 是最便宜的选项
2. **按需暂停/启动**：演示时启动，结束后暂停
3. **最小化存储**：10 GB 足够小规模应用
4. **关闭自动备份**（可选）：演示环境可关闭，节省存储成本

### 3.3 构建优化

1. **手动触发**：避免 CI/CD 自动构建消耗免费额度
2. **使用小机器类型**：`E2_MEDIUM` 在免费额度内
3. **减少磁盘大小**：25 GB 足够构建

### 3.4 前端优化

1. **迁移到 Firebase Hosting**：完全免费，无运行时成本
2. **启用 CDN 缓存**：减少后端请求
3. **压缩静态资源**：减少流量消耗

---

## 4. 部署步骤

### 4.1 前置准备

```bash
# 设置环境变量
export PROJECT_ID="your-project-id"
export REGION="us-central1"  # Always-Free 区域

# 登录 GCP
gcloud auth login
gcloud config set project $PROJECT_ID

# 启用必要的 API
gcloud services enable \
  cloudbuild.googleapis.com \
  run.googleapis.com \
  sqladmin.googleapis.com \
  secretmanager.googleapis.com \
  artifactregistry.googleapis.com \
  firebase.googleapis.com
```

### 4.2 创建 Cloud SQL 实例（一次性）

```bash
# 创建最小配置的 PostgreSQL 实例
gcloud sql instances create tms-postgres \
  --database-version=POSTGRES_15 \
  --tier=db-f1-micro \
  --region=$REGION \
  --storage-type=SSD \
  --storage-size=10GB \
  --storage-auto-increase=false \
  --activation-policy=NEVER \
  --maintenance-window-day=SUN \
  --maintenance-window-hour=4 \
  --maintenance-release-channel=production \
  --no-assign-ip \
  --network=default

# 设置数据库密码
export DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users set-password postgres \
  --instance=tms-postgres \
  --password="$DB_PASSWORD"

# 创建应用数据库
gcloud sql databases create tms_platform --instance=tms-postgres

# 获取实例连接名
export INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe tms-postgres \
  --format='value(connectionName)')
echo "连接名: $INSTANCE_CONNECTION_NAME"
```

### 4.3 配置 Secret Manager

```bash
# 创建数据库连接字符串
export DATABASE_URL="postgresql://postgres:${DB_PASSWORD}@/tms_platform?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&sslmode=disable"
echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=-

# 创建 JWT 密钥
export JWT_SECRET=$(openssl rand -base64 32)
echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-

# 创建 Google Maps API 密钥
echo -n "YOUR_GOOGLE_MAPS_API_KEY" | gcloud secrets create google-maps-api-key --data-file=-
```

### 4.4 部署应用

#### 方式 A：使用 Cloud Build（推荐）

**注意**: 在构建前，需要先获取后端 URL 或使用替换变量。有两种方式：

**方式 1：使用替换变量（推荐）**

修改 `cloudbuild.yaml`，使用替换变量：

```yaml
substitutions:
  _BACKEND_URL: 'https://tms-backend-XXXXX.us-central1.run.app'  # 首次部署后更新
```

然后在构建步骤中使用 `${_BACKEND_URL}`。

**方式 2：先部署后端，再构建前端**

```bash
# 1. 先部署后端
gcloud builds submit --config cloudbuild.yaml . --substitutions=_BUILD_FRONTEND=false

# 2. 获取后端 URL
BACKEND_URL=$(gcloud run services describe tms-backend --region=us-central1 --format='value(status.url)')

# 3. 使用后端 URL 构建前端（需要修改 cloudbuild.yaml 使用替换变量）
gcloud builds submit --config cloudbuild.yaml . --substitutions=_BACKEND_URL=$BACKEND_URL
```

**方式 3：直接提交（首次部署）**

```bash
# 首次部署时，后端 URL 会在部署后自动生成
# 如果前端构建失败，可以重新构建前端镜像
gcloud builds submit --config cloudbuild.yaml .
```

#### 方式 B：使用部署脚本

```bash
cd deploy/gcp
chmod +x deploy.sh
./deploy.sh
```

### 4.5 部署前端到 Firebase Hosting（可选，完全免费）

```bash
# 安装 Firebase CLI
npm install -g firebase-tools
firebase login

# 初始化 Firebase（如果未初始化）
firebase init hosting

# 构建前端
cd apps/frontend
npm run build

# 部署到 Firebase Hosting
firebase deploy --only hosting
```

---

## 5. 数据库成本控制

### 5.1 手动启停数据库

```bash
# 启动数据库（演示前）
gcloud sql instances patch tms-postgres \
  --activation-policy=ALWAYS \
  --quiet

# 等待数据库就绪（约 2-3 分钟）
gcloud sql instances describe tms-postgres \
  --format="value(state)"

# 暂停数据库（演示后）
gcloud sql instances patch tms-postgres \
  --activation-policy=NEVER \
  --quiet
```

### 5.2 自动定时暂停（使用 Cloud Scheduler）

```bash
# 创建服务账号（用于 Scheduler）
gcloud iam service-accounts create scheduler-sa \
  --display-name="Cloud Scheduler Service Account"

# 授予 SQL Admin 权限
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:scheduler-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/cloudsql.admin"

# 创建每日 23:30 暂停任务
gcloud scheduler jobs create http stop-db-daily \
  --schedule="30 23 * * *" \
  --uri="https://sqladmin.googleapis.com/v1/projects/${PROJECT_ID}/instances/tms-postgres" \
  --http-method=PATCH \
  --message-body='{"settings":{"activationPolicy":"NEVER"}}' \
  --headers="Content-Type=application/json" \
  --oauth-service-account-email="scheduler-sa@${PROJECT_ID}.iam.gserviceaccount.com" \
  --location=$REGION
```

### 5.3 成本监控

```bash
# 查看数据库状态
gcloud sql instances describe tms-postgres \
  --format="table(name,state,settings.activationPolicy,settings.tier)"

# 查看月度成本（需要启用 Billing API）
gcloud billing projects describe $PROJECT_ID \
  --format="value(billingAccountName)"
```

---

## 6. 监控与告警

### 6.1 设置成本告警

```bash
# 创建预算（$10 上限）
gcloud billing budgets create \
  --billing-account=YOUR_BILLING_ACCOUNT_ID \
  --display-name="TMS Free Tier Budget" \
  --budget-amount=10USD \
  --threshold-rule=percent=80 \
  --threshold-rule=percent=100 \
  --all-updates-rule=pubsub-topic=projects/$PROJECT_ID/topics/billing-alerts
```

### 6.2 Cloud Run 监控

```bash
# 查看服务指标
gcloud run services describe tms-backend \
  --region=$REGION \
  --format="table(status.url,status.conditions)"

# 查看日志
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-backend" \
  --limit=50 \
  --format=json
```

### 6.3 设置告警策略

在 GCP Console 中设置：
1. **Cloud Run**: CPU 使用率 > 80%
2. **Cloud SQL**: CPU 使用率 > 70% 或连接数 > 80%
3. **成本**: 月度预算 > 80%

---

## 7. 故障排查

### 7.1 Cloud Run 服务无法启动

**症状**: 服务返回 503 或超时

**排查步骤**:
```bash
# 检查服务状态
gcloud run services describe tms-backend --region=$REGION

# 查看日志
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-backend" \
  --limit=100 \
  --format=json | jq '.[] | {timestamp, textPayload}'

# 检查 Secret Manager 密钥
gcloud secrets versions access latest --secret=database-url
```

**常见原因**:
- 数据库未启动（`activation-policy=NEVER`）
- Secret Manager 密钥不存在或格式错误
- 数据库连接字符串格式错误

### 7.2 数据库连接失败

**症状**: 应用无法连接到数据库

**排查步骤**:
```bash
# 检查数据库状态
gcloud sql instances describe tms-postgres

# 检查连接名格式
echo $INSTANCE_CONNECTION_NAME

# 测试数据库连接（需要 Cloud SQL Proxy）
gcloud sql connect tms-postgres --user=postgres
```

**解决方案**:
1. 确保数据库已启动（`activation-policy=ALWAYS`）
2. 验证连接字符串格式：`postgresql://user:pass@/db?host=/cloudsql/CONNECTION_NAME`
3. 检查 Cloud Run 服务是否有正确的 Secret Manager 权限

### 7.3 构建失败

**症状**: Cloud Build 构建超时或失败

**排查步骤**:
```bash
# 查看构建日志
gcloud builds list --limit=5
gcloud builds log BUILD_ID

# 检查机器类型和磁盘大小
cat cloudbuild.yaml | grep -A 5 "options:"
```

**解决方案**:
1. 确保使用 `E2_MEDIUM` 机器类型（免费额度内）
2. 减少构建步骤或优化 Dockerfile
3. 使用本地构建后推送镜像

### 7.4 超出免费额度

**症状**: 收到账单或告警

**排查步骤**:
```bash
# 查看资源使用情况
gcloud logging read "resource.type=cloud_run_revision" --limit=1000 | \
  jq '[.[] | {service: .resource.labels.service_name, timestamp}] | group_by(.service) | map({service: .[0].service, count: length})'

# 检查数据库运行时间
gcloud sql instances describe tms-postgres \
  --format="value(settings.activationPolicy,createTime)"
```

**解决方案**:
1. 确保数据库在非演示时间处于暂停状态
2. 检查 Cloud Run 最小实例是否为 0
3. 减少构建频率（手动触发而非自动）

---

## 8. 常见问题

### Q1: 为什么数据库仍有费用？

**A**: Cloud SQL 没有完全免费的方案。即使暂停（`activation-policy=NEVER`），仍会产生存储费用（约 $1.7/月/10GB）。这是最低成本配置。

**进一步优化**: 可以考虑迁移到外部免费 PostgreSQL 服务（如 Neon、Supabase Free Tier），但会增加网络延迟和合规复杂度。

### Q2: 如何彻底停服避免所有费用？

**A**: 执行以下步骤：

```bash
# 1. 删除 Cloud Run 服务
gcloud run services delete tms-backend --region=$REGION --quiet
gcloud run services delete tms-frontend --region=$REGION --quiet

# 2. 暂停数据库
gcloud sql instances patch tms-postgres --activation-policy=NEVER --quiet

# 3. 删除 Cloud Storage bucket（如果有）
gsutil rm -r gs://your-bucket-name

# 4. 删除构建历史（可选）
gcloud builds list --format="value(id)" | xargs -I {} gcloud builds delete {} --quiet
```

### Q3: 可以改为全 Serverless（Firestore）吗？

**A**: 可以，但需要重写数据访问层。当前方案保持 PostgreSQL，避免大规模重构。如果愿意重构，Firestore 的免费额度（1 GB 存储，5 万次读取/天）可能足够小规模应用。

### Q4: 前端迁移到 Firebase Hosting 的步骤？

**A**: 参考 [4.5 节](#45-部署前端到-firebase-hosting可选完全免费)。主要步骤：
1. 安装 Firebase CLI
2. 初始化 Firebase 项目
3. 构建前端（`npm run build`）
4. 部署到 Firebase Hosting（`firebase deploy --only hosting`）

### Q5: 如何监控实际成本？

**A**: 
1. 在 GCP Console 中启用 Billing Export
2. 设置预算告警（参考 [6.1 节](#61-设置成本告警)）
3. 定期检查 Billing Dashboard

### Q6: 数据库暂停后如何快速启动？

**A**: 使用以下脚本：

```bash
#!/bin/bash
# start-db.sh - 快速启动数据库

PROJECT_ID="your-project-id"
INSTANCE_NAME="tms-postgres"

echo "启动数据库实例..."
gcloud sql instances patch $INSTANCE_NAME \
  --activation-policy=ALWAYS \
  --quiet

echo "等待数据库就绪..."
while true; do
  STATE=$(gcloud sql instances describe $INSTANCE_NAME \
    --format="value(state)")
  if [ "$STATE" = "RUNNABLE" ]; then
    echo "✅ 数据库已就绪"
    break
  fi
  echo "等待中... (当前状态: $STATE)"
  sleep 5
done
```

---

## 9. 总结

### 月度成本估算

| 组件 | 成本 | 说明 |
|------|------|------|
| Cloud Run（后端+前端） | $0 | 在免费额度内 |
| Cloud Build | $0 | 手动触发，< 120 分钟/月 |
| Cloud Logging | $0 | < 50 GiB/月 |
| Secret Manager | $0 | < 6 个密钥版本 |
| Cloud SQL（运行中） | ~$7-9 | db-f1-micro + 10GB 存储 |
| Cloud SQL（暂停中） | ~$1.7 | 仅存储费用 |
| **总计（运行中）** | **$7-9** | 演示/使用期间 |
| **总计（暂停中）** | **$1.7** | 非使用期间 |

### 最佳实践

1. ✅ **演示时启动数据库，结束后立即暂停**
2. ✅ **使用 Firebase Hosting 托管前端（完全免费）**
3. ✅ **设置成本告警（$10 上限）**
4. ✅ **定期检查资源使用情况**
5. ✅ **使用最小资源配置**
6. ✅ **手动触发构建，避免自动 CI/CD**

---

## 10. 相关文档

- [GCP Always-Free 额度说明](https://cloud.google.com/free/docs/free-cloud-features)
- [Cloud Run 定价](https://cloud.google.com/run/pricing)
- [Cloud SQL 定价](https://cloud.google.com/sql/pricing)
- [Firebase Hosting 文档](https://firebase.google.com/docs/hosting)

---

**最后更新**: 2025-11-24T16:30:00Z  
**维护者**: TMS 开发团队

