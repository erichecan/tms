#!/bin/bash
# GCP 性能优化部署脚本
# 创建时间: 2025-12-16 17:50:00
# 目的: 提升 Cloud Run 服务性能，解决卡顿问题

set -e

# 配置
PROJECT_NUMBER="${PROJECT_NUMBER:-275911787144}"
REGION="${REGION:-asia-east2}"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
AUTO_CONFIRM="${AUTO_CONFIRM:-yes}"

# 2025-12-16 17:50:00 获取项目 ID
CURRENT_PROJECT=$(gcloud config get-value project 2>/dev/null || echo "")
if [ -n "$CURRENT_PROJECT" ] && [[ ! "$CURRENT_PROJECT" =~ ^[0-9]+$ ]]; then
  PROJECT_ID="$CURRENT_PROJECT"
  echo "使用当前 GCP 项目 ID: $PROJECT_ID"
else
  PROJECT_ID=$(gcloud projects describe $PROJECT_NUMBER --format="value(projectId)" 2>/dev/null || echo "")
  if [ -z "$PROJECT_ID" ]; then
    PROJECT_ID=$(gcloud config get-value project 2>/dev/null || echo "oceanic-catcher-479821-u8")
  fi
  echo "使用项目 ID: $PROJECT_ID"
fi

# Artifact Registry 仓库配置
REPO_NAME="tms-repo"
IMAGE_REGISTRY="asia-east2-docker.pkg.dev/$PROJECT_ID/$REPO_NAME"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   TMS 平台 GCP 性能优化部署脚本${NC}"
echo -e "${YELLOW}   优化配置：提升 CPU、内存、并发和实例数${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

echo -e "${YELLOW}性能优化配置对比（预算控制: \$30/月）:${NC}"
echo ""
echo -e "${BLUE}后端服务:${NC}"
echo "  当前配置: CPU=0.25, 内存=512Mi, 并发=1, 最小实例=0, 最大实例=2"
echo "  优化配置: CPU=1, 内存=512Mi, 并发=10, 最小实例=0, 最大实例=5"
echo ""
echo -e "${BLUE}前端服务:${NC}"
echo "  当前配置: CPU=0.25, 内存=256Mi, 并发=1, 最小实例=0, 最大实例=2"
echo "  优化配置: CPU=0.5, 内存=512Mi, 并发=1, 最小实例=0, 最大实例=3"
echo -e "${YELLOW}  注意: CPU < 1 时 concurrency 必须 <= 1${NC}"
echo ""

# 设置项目
echo -e "${YELLOW}[1/6] 设置 GCP 项目...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
echo -e "${GREEN}✅ 项目已设置为: $PROJECT_ID${NC}"

# 获取 Cloud Functions URL
echo -e "${YELLOW}[2/6] 获取环境配置...${NC}"
EMAIL_NOTIFIER_FUNCTION_URL=$(gcloud functions describe orderEmailNotifier \
    --gen2 \
    --region=$REGION \
    --format='value(serviceConfig.uri)' \
    --project=$PROJECT_ID 2>/dev/null || echo "")

if [ -n "$EMAIL_NOTIFIER_FUNCTION_URL" ]; then
    echo -e "${GREEN}✅ 检测到 Cloud Functions URL: $EMAIL_NOTIFIER_FUNCTION_URL${NC}"
else
    echo -e "${YELLOW}⚠️  未检测到 Cloud Functions${NC}"
fi

# 构建 secrets 参数
SECRETS_PARAMS="DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest"
if gcloud secrets describe dispatch-emails --project=$PROJECT_ID &>/dev/null; then
    SECRETS_PARAMS="${SECRETS_PARAMS},DISPATCH_EMAILS=dispatch-emails:latest"
fi

# 构建环境变量参数
ENV_VARS="NODE_ENV=production,CORS_ORIGIN=*"
if [ -n "$EMAIL_NOTIFIER_FUNCTION_URL" ]; then
    ENV_VARS="${ENV_VARS},EMAIL_NOTIFIER_FUNCTION_URL=$EMAIL_NOTIFIER_FUNCTION_URL"
fi

# 部署后端服务 - 性能优化配置
echo -e "${YELLOW}[3/6] 部署后端服务（性能优化配置）...${NC}"
gcloud run deploy $BACKEND_SERVICE \
    --image=$IMAGE_REGISTRY/$BACKEND_SERVICE:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-secrets=${SECRETS_PARAMS} \
    --set-env-vars=${ENV_VARS} \
    --memory=512Mi \
    --cpu=1 \
    --concurrency=10 \
    --min-instances=0 \
    --max-instances=5 \
    --timeout=300 \
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

# 获取前端 Google Maps API Key
echo -e "${YELLOW}[4/6] 获取前端配置...${NC}"
GOOGLE_MAPS_API_KEY_FRONTEND=$(gcloud secrets versions access latest --secret="google-maps-api-key-frontend" --project=$PROJECT_ID 2>/dev/null || echo "")
if [ -z "$GOOGLE_MAPS_API_KEY_FRONTEND" ]; then
    GOOGLE_MAPS_API_KEY_FRONTEND=$(gcloud secrets versions access latest --secret="google-maps-api-key" --project=$PROJECT_ID 2>/dev/null || echo "")
fi
if [ -z "$GOOGLE_MAPS_API_KEY_FRONTEND" ]; then
    echo -e "${RED}❌ 错误: 无法从 Secret Manager 获取 Google Maps API Key${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Google Maps API Key 已获取${NC}"

# 构建前端镜像
echo -e "${YELLOW}[5/6] 构建前端 Docker 镜像...${NC}"
docker build --platform linux/amd64 \
    -t $IMAGE_REGISTRY/$FRONTEND_SERVICE:latest \
    -t $IMAGE_REGISTRY/$FRONTEND_SERVICE:$(date +%Y%m%d-%H%M%S) \
    --build-arg VITE_API_BASE_URL=$BACKEND_URL/api \
    --build-arg VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY_FRONTEND" \
    -f docker/frontend/Dockerfile . || {
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 前端镜像构建完成${NC}"

# 推送并部署前端服务 - 性能优化配置
echo -e "${YELLOW}[6/6] 推送并部署前端服务（性能优化配置）...${NC}"
docker push $IMAGE_REGISTRY/$FRONTEND_SERVICE:latest || {
    echo -e "${RED}❌ 前端镜像推送失败${NC}"
    exit 1
}

gcloud run deploy $FRONTEND_SERVICE \
    --image=$IMAGE_REGISTRY/$FRONTEND_SERVICE:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars=VITE_API_BASE_URL=$BACKEND_URL \
    --memory=512Mi \
    --cpu=0.5 \
    --concurrency=1 \
    --min-instances=0 \
    --max-instances=3 \
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
echo -e "${GREEN}   🎉 性能优化部署完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}服务地址:${NC}"
echo -e "  后端: ${GREEN}$BACKEND_URL${NC}"
echo -e "  前端: ${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}💰 成本估算（基于每天 8 小时运行，min-instances=0）:${NC}"
echo ""
echo -e "${BLUE}后端服务（1 vCPU, 512Mi 内存, 最小实例=0）:${NC}"
echo "  假设每天运行 8 小时，每月 30 天"
echo "  每月运行时间: 8 × 30 × 3600 = 864,000 秒"
echo "  CPU 费用: 864,000 × 1 × \$0.000024 = \$20.74"
echo "  内存费用: 864,000 × 0.5 × \$0.0000025 = \$1.08"
echo "  扣除免费额度后:"
echo "    CPU: (864,000 - 180,000) × \$0.000024 = \$16.42"
echo "    内存: (432,000 - 360,000) × \$0.0000025 = \$0.18"
echo "  后端小计: ~\$16.60/月"
echo ""
echo -e "${BLUE}前端服务（0.5 vCPU, 512Mi 内存, 最小实例=0）:${NC}"
echo "  假设每天运行 8 小时，每月 30 天"
echo "  每月运行时间: 8 × 30 × 3600 = 864,000 秒"
echo "  CPU 费用: 864,000 × 0.5 × \$0.000024 = \$10.37"
echo "  内存费用: 864,000 × 0.5 × \$0.0000025 = \$1.08"
echo "  扣除免费额度后:"
echo "    CPU: (432,000 - 180,000) × \$0.000024 = \$6.05"
echo "    内存: (432,000 - 360,000) × \$0.0000025 = \$0.18"
echo "  前端小计: ~\$6.23/月"
echo ""
echo -e "${GREEN}预计总成本: ~\$22.83/月（每天 8 小时运行）${NC}"
echo -e "${GREEN}✅ 预算控制: 在 \$30/月以内${NC}"
echo ""
echo -e "${YELLOW}💡 成本说明:${NC}"
echo "  • min-instances=0: 空闲时不产生费用，只有请求时才计费"
echo "  • 免费额度: 每月 180,000 vCPU-seconds 和 360,000 GiB-seconds"
echo "  • 如果每天运行 8 小时，大部分费用在免费额度内"
echo "  • 实际成本取决于实际流量和使用时间"
echo "  • 使用 Cloud Monitoring 监控实际使用量"
echo ""
echo -e "${YELLOW}性能提升:${NC}"
echo "  ✓ 后端并发处理能力: 1 → 10 请求/实例（10倍提升）"
echo "  ✓ 后端 CPU 性能: 0.25 → 1 vCPU（4倍提升）"
echo "  ✓ 前端内存容量: 256Mi → 512Mi（2倍提升）"
echo "  ✓ 最大实例数: 2 → 5 (后端), 2 → 3 (前端)"
echo "  ⚠️  冷启动: min-instances=0 会有 5-10 秒冷启动延迟（节省成本）"
echo "  ⚠️  前端并发: 受限于 CPU < 1，保持 concurrency=1"
echo ""
