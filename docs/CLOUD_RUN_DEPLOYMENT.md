# Cloud Run 部署配置
> 创建时间: 2025-11-24T19:30:00Z

## 🚀 后端部署

### 1. 构建和推送镜像

```bash
# 设置项目 ID
export PROJECT_ID=aponytms
export REGION=us-central1

# 构建后端镜像
docker build --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/tms-backend:latest \
  -f docker/backend/Dockerfile .

# 推送镜像
docker push gcr.io/$PROJECT_ID/tms-backend:latest
```

### 2. 部署后端服务

```bash
gcloud run deploy tms-backend \
  --image=gcr.io/$PROJECT_ID/tms-backend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
  --set-env-vars=NODE_ENV=production,CORS_ORIGIN=* \
  --memory=512Mi \
  --cpu=0.25 \
  --concurrency=80 \
  --min-instances=0 \
  --max-instances=2 \
  --timeout=180 \
  --ingress=all
```

### 3. 获取后端 URL

```bash
BACKEND_URL=$(gcloud run services describe tms-backend \
  --region=$REGION \
  --format='value(status.url)')
echo "Backend URL: $BACKEND_URL"
```

---

## 🎨 前端部署

### 1. 构建前端镜像

```bash
# 使用后端 URL 构建前端
docker build --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/tms-frontend:latest \
  --build-arg VITE_API_BASE_URL=$BACKEND_URL \
  --build-arg VITE_GOOGLE_MAPS_API_KEY=AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28 \
  -f docker/frontend/Dockerfile .

# 推送镜像
docker push gcr.io/$PROJECT_ID/tms-frontend:latest
```

### 2. 部署前端服务

```bash
gcloud run deploy tms-frontend \
  --image=gcr.io/$PROJECT_ID/tms-frontend:latest \
  --region=$REGION \
  --platform=managed \
  --allow-unauthenticated \
  --set-env-vars=VITE_API_BASE_URL=$BACKEND_URL \
  --memory=256Mi \
  --cpu=0.25 \
  --concurrency=150 \
  --min-instances=0 \
  --max-instances=2 \
  --timeout=120 \
  --ingress=all
```

### 3. 获取前端 URL

```bash
FRONTEND_URL=$(gcloud run services describe tms-frontend \
  --region=$REGION \
  --format='value(status.url)')
echo "Frontend URL: $FRONTEND_URL"
```

---

## 🔄 更新 CORS 配置

部署前端后，需要更新后端的 CORS_ORIGIN：

```bash
gcloud run services update tms-backend \
  --region=$REGION \
  --update-env-vars=CORS_ORIGIN=$FRONTEND_URL
```

---

## 📊 验证部署

### 1. 检查服务状态

```bash
# 检查后端
gcloud run services describe tms-backend --region=$REGION

# 检查前端
gcloud run services describe tms-frontend --region=$REGION
```

### 2. 测试健康检查

```bash
# 测试后端
curl $BACKEND_URL/api/health

# 测试前端
curl -I $FRONTEND_URL
```

### 3. 查看日志

```bash
# 后端日志
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-backend" --limit=50

# 前端日志
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=tms-frontend" --limit=50
```

---

## 💰 成本优化

当前配置已优化为免费/低成本：
- **后端**: 0.25 CPU, 512Mi 内存, min-instances=0
- **前端**: 0.25 CPU, 256Mi 内存, min-instances=0
- **数据库**: Neon (完全免费)

预计月度成本: **$0-10 USD** (仅 Google Maps API 使用费用)

---

**最后更新**: 2025-11-24T19:30:00Z

