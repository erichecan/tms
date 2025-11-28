#!/bin/bash
# Neon 数据库部署脚本
# 创建时间: 2025-11-24T19:30:00Z

set -e

# 配置
PROJECT_ID="${PROJECT_ID:-aponytms}"
REGION="${REGION:-us-central1}"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}🚀 开始部署 TMS 应用到 Google Cloud (Neon 数据库)${NC}"

# 1. 设置项目
gcloud config set project $PROJECT_ID

# 2. 构建和推送后端镜像
echo -e "${YELLOW}📦 构建后端镜像...${NC}"
docker build --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/tms-backend:latest \
  -f docker/backend/Dockerfile .
docker push gcr.io/$PROJECT_ID/tms-backend:latest

# 3. 部署后端
echo -e "${YELLOW}🚀 部署后端服务...${NC}"
gcloud run deploy $BACKEND_SERVICE \
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

# 4. 获取后端 URL
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)')
echo -e "${GREEN}✅ 后端 URL: $BACKEND_URL${NC}"

# 5. 构建和推送前端镜像
echo -e "${YELLOW}📦 构建前端镜像...${NC}"
docker build --platform linux/amd64 \
  -t gcr.io/$PROJECT_ID/tms-frontend:latest \
  --build-arg VITE_API_BASE_URL=$BACKEND_URL \
  --build-arg VITE_GOOGLE_MAPS_API_KEY=AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28 \
  -f docker/frontend/Dockerfile .
docker push gcr.io/$PROJECT_ID/tms-frontend:latest

# 6. 部署前端
echo -e "${YELLOW}🚀 部署前端服务...${NC}"
gcloud run deploy $FRONTEND_SERVICE \
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

# 7. 获取前端 URL
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
  --region=$REGION \
  --format='value(status.url)')
echo -e "${GREEN}✅ 前端 URL: $FRONTEND_URL${NC}"

# 8. 更新 CORS
echo -e "${YELLOW}🔧 更新 CORS 配置...${NC}"
gcloud run services update $BACKEND_SERVICE \
  --region=$REGION \
  --update-env-vars=CORS_ORIGIN=$FRONTEND_URL

echo -e "${GREEN}🎉 部署完成！${NC}"
echo -e "${GREEN}后端: $BACKEND_URL${NC}"
echo -e "${GREEN}前端: $FRONTEND_URL${NC}"
