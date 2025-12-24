#!/bin/bash
# GCP 部署脚本 - 项目 275911787144
# 创建时间: 2025-11-30T21:35:00

set -e

# 配置
PROJECT_ID="oceanic-catcher-479821-u8"
REGION="${REGION:-asia-east2}" 
echo -e "${YELLOW}使用项目: $PROJECT_ID, 区域: $REGION${NC}"

BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
MOBILE_SERVICE="tms-frontend-mobile"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   TMS 平台 GCP 部署脚本${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 1. 验证项目访问权限 (后台执行环境略过)
echo -e "${YELLOW}[1/10] 验证 GCP 项目访问权限 (跳过)...${NC}"
# if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
#     echo -e "${RED}❌ 错误: 无法访问项目 $PROJECT_ID${NC}"
#     exit 1
# fi
echo -e "${GREEN}✅ 跳过验证，继续执行${NC}"

# 2. 设置项目
echo -e "${YELLOW}[2/10] 设置 GCP 项目...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
echo -e "${GREEN}✅ 项目已设置为: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ 区域已设置为: $REGION${NC}"

# 3. 启用必要的 API
echo -e "${YELLOW}[3/10] 启用必要的 GCP API...${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID || echo "Cloud Run API 可能已启用"
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID || echo "Cloud Build API 可能已启用"
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID || echo "Container Registry API 可能已启用"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID || echo "Secret Manager API 可能已启用"
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
        echo -e "${YELLOW}⚠️  密钥 $secret 不存在${NC}"
    else
        echo -e "${GREEN}✅ 密钥 $secret 存在${NC}"
    fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
    echo -e "${YELLOW}警告: 以下密钥需要创建:${NC}"
    for secret in "${MISSING_SECRETS[@]}"; do
        echo "  - $secret"
        echo "    创建命令: echo 'YOUR_VALUE' | gcloud secrets create $secret --data-file=- --project=$PROJECT_ID"
    done
    echo ""
    read -p "是否继续部署？(y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# 6. 构建并推送后端镜像 (使用 Cloud Build)
echo -e "${YELLOW}[6/10] 使用 Cloud Build 构建并推送后端镜像...${NC}"
cat <<EOF > cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: ['build', '-t', 'gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest', '-f', 'docker/backend/Dockerfile', '.']
images:
- 'gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest'
EOF
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID .
rm cloudbuild.yaml
echo -e "${GREEN}✅ 后端镜像构建并推送完成${NC}"

# 7. (步骤已合并到 6)
echo -e "${GREEN}✅ 跳过推送步骤 (Cloud Build 已自动推送)${NC}"

# 8. 部署后端服务
echo -e "${YELLOW}[8/10] 部署后端服务到 Cloud Run...${NC}"
gcloud run deploy $BACKEND_SERVICE \
    --image=gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
    --set-env-vars=NODE_ENV=production,CORS_ORIGIN=* \
    --memory=512Mi \
    --cpu=1 \
    --concurrency=80 \
    --min-instances=0 \
    --max-instances=2 \
    --timeout=180 \
    --ingress=all \
    --port=8000 \
    --project=$PROJECT_ID

BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' \
    --project=$PROJECT_ID)
echo -e "${GREEN}✅ 后端部署完成${NC}"
echo -e "${BLUE}   后端 URL: $BACKEND_URL${NC}"

# 9. 构建并推送前端镜像 (使用 Cloud Build)
echo -e "${YELLOW}[9/10] 使用 Cloud Build 构建并推送前端镜像...${NC}"
MAPS_API_KEY=$(gcloud secrets versions access latest --secret="google-maps-api-key" --project=$PROJECT_ID)

cat <<EOF > cloudbuild.yaml
steps:
- name: 'gcr.io/cloud-builders/docker'
  args: [
    'build', 
    '-t', 'gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest', 
    '-f', 'docker/frontend/Dockerfile', 
    '--build-arg', 'VITE_API_BASE_URL=$BACKEND_URL',
    '--build-arg', 'VITE_GOOGLE_MAPS_API_KEY=$MAPS_API_KEY',
    '.'
  ]
images:
- 'gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest'
EOF
gcloud builds submit --config cloudbuild.yaml --project=$PROJECT_ID .
rm cloudbuild.yaml
echo -e "${GREEN}✅ 前端镜像构建并推送完成${NC}"

# 10. 部署前端服务
echo -e "${YELLOW}[10/10] 部署前端服务...${NC}"
# 推送步骤已由 Cloud Build 完成

gcloud run deploy $FRONTEND_SERVICE \
    --image=gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --set-env-vars=VITE_API_BASE_URL=$BACKEND_URL \
    --memory=256Mi \
    --cpu=1 \
    --concurrency=150 \
    --min-instances=0 \
    --max-instances=5 \
    --timeout=120 \
    --ingress=all \
    --project=$PROJECT_ID

FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' \
    --project=$PROJECT_ID)
echo -e "${GREEN}✅ 前端部署完成${NC}"
echo -e "${BLUE}   前端 URL: $FRONTEND_URL${NC}"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   🎉 部署完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}服务地址:${NC}"
echo -e "  后端: ${GREEN}$BACKEND_URL${NC}"
echo -e "  前端: ${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 测试后端 API: curl $BACKEND_URL/health"
echo "  2. 访问前端: $FRONTEND_URL"
echo "  3. 配置自定义域名（可选）"
echo ""

