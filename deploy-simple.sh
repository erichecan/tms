#!/bin/bash
# 简化的 TMS 部署脚本
# 项目: aponytms

set -e

echo "=== TMS 简化部署脚本 ==="
echo "项目: aponytms"
echo ""

# 生成构建 ID
BUILD_ID=$(date +%Y%m%d-%H%M%S)
echo "构建 ID: $BUILD_ID"

# 构建后端镜像
echo "1. 构建后端 Docker 镜像..."
docker build -t gcr.io/aponytms/tms-backend:$BUILD_ID -f docker/backend/Dockerfile .

# 构建前端镜像
echo "2. 构建前端 Docker 镜像..."
docker build -t gcr.io/aponytms/tms-frontend:$BUILD_ID -f docker/frontend/Dockerfile .

# 推送镜像
echo "3. 推送镜像到 Container Registry..."
docker push gcr.io/aponytms/tms-backend:$BUILD_ID
docker push gcr.io/aponytms/tms-frontend:$BUILD_ID

# 部署后端到 Cloud Run
echo "4. 部署后端到 Cloud Run..."
gcloud run deploy tms-backend \
    --image=gcr.io/aponytms/tms-backend:$BUILD_ID \
    --region=asia-east2 \
    --platform=managed \
    --allow-unauthenticated \
    --port=8080 \
    --set-secrets=DATABASE_URL=db-password:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
    --set-env-vars=NODE_ENV=production,CORS_ORIGIN=* \
    --memory=2Gi \
    --cpu=2 \
    --min-instances=1 \
    --max-instances=10 \
    --timeout=300 \
    --add-cloudsql-instances=aponytms:asia-east2:tms-database

# 获取后端 URL
echo "5. 获取后端服务 URL..."
BACKEND_URL=$(gcloud run services describe tms-backend --region=asia-east2 --format='value(status.url)')
echo "后端 URL: $BACKEND_URL"

# 部署前端到 Cloud Run
echo "6. 部署前端到 Cloud Run..."
gcloud run deploy tms-frontend \
    --image=gcr.io/aponytms/tms-frontend:$BUILD_ID \
    --region=asia-east2 \
    --platform=managed \
    --allow-unauthenticated \
    --port=80 \
    --memory=512Mi \
    --cpu=1 \
    --min-instances=0 \
    --max-instances=5 \
    --timeout=60

# 获取前端 URL
echo "7. 获取前端服务 URL..."
FRONTEND_URL=$(gcloud run services describe tms-frontend --region=asia-east2 --format='value(status.url)')
echo "前端 URL: $FRONTEND_URL"

echo ""
echo "=== 部署完成 ==="
echo "后端服务: $BACKEND_URL"
echo "前端服务: $FRONTEND_URL"
echo ""
echo "现在可以访问您的 TMS 系统了！"
