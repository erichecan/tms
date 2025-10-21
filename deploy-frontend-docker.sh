#!/bin/bash
# 前端Docker部署脚本 - 包含Google Maps API Key
# 创建时间: 2025-10-21 16:42:00

set -e

PROJECT_ID="aponytms"
REGION="asia-east2"
SERVICE_NAME="tms-frontend"
IMAGE_NAME="gcr.io/${PROJECT_ID}/tms-frontend:latest"
GOOGLE_MAPS_API_KEY="AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28"
BACKEND_URL="https://tms-backend-1038443972557.asia-east2.run.app"

echo "=================================================="
echo "前端Docker部署 - 包含Google Maps配置"
echo "=================================================="
echo "项目: ${PROJECT_ID}"
echo "区域: ${REGION}"
echo "镜像: ${IMAGE_NAME}"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "[步骤1/3] 构建Docker镜像..."
docker build \
  --build-arg VITE_API_BASE_URL="${BACKEND_URL}" \
  --build-arg VITE_GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY}" \
  -t "${IMAGE_NAME}" \
  -f docker/frontend/Dockerfile \
  .

echo ""
echo "[步骤2/3] 推送镜像到GCR..."
docker push "${IMAGE_NAME}"

echo ""
echo "[步骤3/3] 部署到Cloud Run..."
gcloud run deploy "${SERVICE_NAME}" \
  --image="${IMAGE_NAME}" \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60 \
  --quiet

echo ""
echo "=================================================="
echo "✅ 前端部署完成！"
echo "=================================================="
echo "访问: https://tms-frontend-1038443972557.asia-east2.run.app"
echo ""

