#!/bin/bash
# GCP 自动部署脚本（非交互式）- 项目 275911787144
# 创建时间: 2025-11-30T21:50:00
# 目的: 自动部署，无需交互确认

set -e

# 配置
PROJECT_ID="275911787144"
REGION="${REGION:-asia-east2}"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
AUTO_CONFIRM="${AUTO_CONFIRM:-yes}"  # 自动确认

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   TMS 平台 GCP 自动部署脚本 (免费配置)${NC}"
echo -e "${YELLOW}   目标: \$0 费用 - 使用免费层配置${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}免费配置说明:${NC}"
echo "  ✓ 最小实例数: 0 (空闲时不产生费用)"
echo "  ✓ CPU: 0.25 vCPU (免费层)"
echo "  ✓ 内存: 最小配置 (免费层)"
echo "  ✓ 数据库: 使用 Neon (完全免费)"
echo ""

# 1. 验证项目访问权限
echo -e "${YELLOW}[1/10] 验证 GCP 项目访问权限...${NC}"
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo -e "${RED}❌ 错误: 无法访问项目 $PROJECT_ID${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 项目访问权限验证通过${NC}"

# 2. 设置项目
echo -e "${YELLOW}[2/10] 设置 GCP 项目...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
echo -e "${GREEN}✅ 项目已设置为: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ 区域已设置为: $REGION${NC}"

# 3. 启用必要的 API
echo -e "${YELLOW}[3/10] 启用必要的 GCP API...${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID --quiet || echo "Cloud Run API 可能已启用"
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID --quiet || echo "Cloud Build API 可能已启用"
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID --quiet || echo "Container Registry API 可能已启用"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID --quiet || echo "Secret Manager API 可能已启用"
echo -e "${GREEN}✅ API 启用完成${NC}"

# 4. 配置 Docker 认证
echo -e "${YELLOW}[4/10] 配置 Docker 认证...${NC}"
gcloud auth configure-docker --quiet
echo -e "${GREEN}✅ Docker 认证配置完成${NC}"

# 5. 检查必要的密钥是否存在
echo -e "${YELLOW}[5/10] 检查 Secret Manager 密钥...${NC}"
REQUIRED_SECRETS=("database-url" "jwt-secret" "google-maps-api-key")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
    if ! gcloud secrets describe $secret --project=$PROJECT_ID &>/dev/null; then
        MISSING_SECRETS+=($secret)
        echo -e "${RED}❌ 密钥 $secret 不存在${NC}"
    else
        echo -e "${GREEN}✅ 密钥 $secret 存在${NC}"
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo -e "${RED}❌ 错误: 缺少必要的密钥${NC}"
    echo "请先运行: ./scripts/create-secrets.sh"
    exit 1
fi

# 6. 构建后端镜像
echo -e "${YELLOW}[6/10] 构建后端 Docker 镜像...${NC}"
docker build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
    -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$(date +%Y%m%d-%H%M%S) \
    -f docker/backend/Dockerfile . || {
    echo -e "${RED}❌ 后端镜像构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 后端镜像构建完成${NC}"

# 7. 推送后端镜像
echo -e "${YELLOW}[7/10] 推送后端镜像到 Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest || {
    echo -e "${RED}❌ 后端镜像推送失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 后端镜像推送完成${NC}"

# 8. 部署后端服务 - 免费配置
echo -e "${YELLOW}[8/10] 部署后端服务到 Cloud Run (免费配置)...${NC}"
gcloud run deploy $BACKEND_SERVICE \
    --image=gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
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
    --ingress=all \
    --port=8000 \
    --quiet \
    --project=$PROJECT_ID || {
    echo -e "${RED}❌ 后端部署失败${NC}"
    exit 1
}

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' \
    --project=$PROJECT_ID)
echo -e "${GREEN}✅ 后端部署完成${NC}"
echo -e "${BLUE}   后端 URL: $BACKEND_URL${NC}"

# 9. 构建前端镜像
echo -e "${YELLOW}[9/10] 构建前端 Docker 镜像...${NC}"
docker build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
    -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$(date +%Y%m%d-%H%M%S) \
    --build-arg VITE_API_BASE_URL=$BACKEND_URL \
    -f docker/frontend/Dockerfile . || {
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 前端镜像构建完成${NC}"

# 10. 推送并部署前端服务 - 免费配置
echo -e "${YELLOW}[10/10] 推送并部署前端服务 (免费配置)...${NC}"
docker push gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest || {
    echo -e "${RED}❌ 前端镜像推送失败${NC}"
    exit 1
}

gcloud run deploy $FRONTEND_SERVICE \
    --image=gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
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
    --ingress=all \
    --quiet \
    --project=$PROJECT_ID || {
    echo -e "${RED}❌ 前端部署失败${NC}"
    exit 1
}

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' \
    --project=$PROJECT_ID)
echo -e "${GREEN}✅ 前端部署完成${NC}"
echo -e "${BLUE}   前端 URL: $FRONTEND_URL${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 免费配置部署完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}服务地址:${NC}"
echo -e "  后端: ${GREEN}$BACKEND_URL${NC}"
echo -e "  前端: ${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}💰 成本说明:${NC}"
echo "  ✓ 最小实例数: 0 (空闲时 \$0)"
echo "  ✓ CPU/内存: 免费层配置"
echo "  ✓ 预计月度费用: \$0 (使用 Neon 免费数据库)"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 测试后端 API: curl $BACKEND_URL/health"
echo "  2. 访问前端: $FRONTEND_URL"
echo "  3. 设置成本告警（推荐）: ./scripts/setup-cost-alert.sh"
echo ""

