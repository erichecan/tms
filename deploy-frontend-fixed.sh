#!/bin/bash
# 前端部署脚本 - 包含Google Maps API Key
# 创建时间: 2025-10-21 16:40:00

set -e

PROJECT_ID="aponytms"
REGION="asia-east2"
SERVICE_NAME="tms-frontend"
GOOGLE_MAPS_API_KEY="AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28"
BACKEND_URL="https://tms-backend-1038443972557.asia-east2.run.app"

echo "=================================================="
echo "前端服务部署 - 包含Google Maps配置"
echo "=================================================="
echo "项目: ${PROJECT_ID}"
echo "区域: ${REGION}"
echo "服务: ${SERVICE_NAME}"
echo "后端API: ${BACKEND_URL}"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

echo "开始构建并部署前端..."
gcloud run deploy "${SERVICE_NAME}" \
  --source=apps/frontend \
  --region="${REGION}" \
  --platform=managed \
  --allow-unauthenticated \
  --memory=512Mi \
  --cpu=1 \
  --min-instances=0 \
  --max-instances=5 \
  --timeout=60 \
  --set-build-env-vars="VITE_API_BASE_URL=${BACKEND_URL},VITE_GOOGLE_MAPS_API_KEY=${GOOGLE_MAPS_API_KEY}" \
  --quiet

echo ""
echo "=================================================="
echo "✅ 前端部署完成！"
echo "=================================================="
echo "服务URL: https://tms-frontend-${PROJECT_ID}.${REGION}.run.app"
echo ""

