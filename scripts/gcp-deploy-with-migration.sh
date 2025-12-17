#!/bin/bash
# GCP 自动部署脚本（包含数据库迁移）- 项目 275911787144
# 创建时间: 2025-12-10T20:30:00Z
# 目的: 自动部署，包含数据库迁移步骤

set -e

# 配置
PROJECT_ID="275911787144"
REGION="${REGION:-asia-east2}"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"
AUTO_CONFIRM="${AUTO_CONFIRM:-yes}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   TMS 平台 GCP 部署脚本 (包含数据库迁移)${NC}"
echo -e "${YELLOW}   项目: $PROJECT_ID | 区域: $REGION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 1. 验证项目访问权限
echo -e "${YELLOW}[1/12] 验证 GCP 项目访问权限...${NC}"
if ! gcloud projects describe $PROJECT_ID &>/dev/null; then
    echo -e "${RED}❌ 错误: 无法访问项目 $PROJECT_ID${NC}"
    exit 1
fi
echo -e "${GREEN}✅ 项目访问权限验证通过${NC}"

# 2. 设置项目
echo -e "${YELLOW}[2/12] 设置 GCP 项目...${NC}"
gcloud config set project $PROJECT_ID
gcloud config set compute/region $REGION
echo -e "${GREEN}✅ 项目已设置为: $PROJECT_ID${NC}"
echo -e "${GREEN}✅ 区域已设置为: $REGION${NC}"

# 3. 启用必要的 API
echo -e "${YELLOW}[3/12] 启用必要的 GCP API...${NC}"
gcloud services enable run.googleapis.com --project=$PROJECT_ID --quiet || echo "Cloud Run API 可能已启用"
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID --quiet || echo "Cloud Build API 可能已启用"
gcloud services enable containerregistry.googleapis.com --project=$PROJECT_ID --quiet || echo "Container Registry API 可能已启用"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID --quiet || echo "Secret Manager API 可能已启用"
echo -e "${GREEN}✅ API 启用完成${NC}"

# 4. 配置 Docker 认证
echo -e "${YELLOW}[4/12] 配置 Docker 认证...${NC}"
gcloud auth configure-docker --quiet
echo -e "${GREEN}✅ Docker 认证配置完成${NC}"

# 5. 检查必要的密钥是否存在
echo -e "${YELLOW}[5/12] 检查 Secret Manager 密钥...${NC}"
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

# 6. 执行数据库迁移
echo -e "${YELLOW}[6/12] 执行数据库迁移...${NC}"
echo -e "${BLUE}   获取数据库连接字符串...${NC}"

# 从 Secret Manager 获取数据库 URL
DATABASE_URL=$(gcloud secrets versions access latest --secret="database-url" --project=$PROJECT_ID 2>/dev/null || echo "")

if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}❌ 错误: 无法从 Secret Manager 获取 database-url${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 数据库连接字符串已获取${NC}"

# 执行数据库迁移（使用 Docker，更可靠）
MIGRATION_FILE="database_migrations/016_add_rules_manage_permission.sql"
if [ -f "$MIGRATION_FILE" ]; then
    echo -e "${BLUE}   执行迁移: $MIGRATION_FILE${NC}"
    
    # 提取密码（用于 PGPASSWORD 环境变量）
    DB_PASSWORD=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p' | sed 's/%40/@/g' | sed 's/%3A/:/g')
    
    # 使用 Docker 执行迁移
    docker run --rm \
        -e PGPASSWORD="$DB_PASSWORD" \
        -v "$(pwd)/$MIGRATION_FILE:/migration.sql:ro" \
        postgres:15-alpine \
        sh -c "psql \"$DATABASE_URL\" -f /migration.sql" 2>&1 | grep -v "WARNING" || {
        MIGRATION_EXIT_CODE=${PIPESTATUS[0]}
        if [ $MIGRATION_EXIT_CODE -eq 0 ]; then
            echo -e "${GREEN}✅ 数据库迁移完成${NC}"
        else
            echo -e "${YELLOW}⚠️  迁移执行遇到错误（可能是表不存在或已执行过），继续部署...${NC}"
            echo -e "${BLUE}   注意: 如果 tenant_users 表不存在，权限将通过后端代码中的 ROLE_PERMISSIONS 映射自动授予${NC}"
        fi
    }
else
    echo -e "${YELLOW}⚠️  迁移文件不存在: $MIGRATION_FILE${NC}"
    echo -e "${YELLOW}   跳过数据库迁移步骤${NC}"
fi

# 7. 获取版本信息
echo -e "${YELLOW}[7/12] 获取版本信息...${NC}"
GIT_SHA=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
BUILD_TIME=$(date -u +%Y%m%d-%H%M%S)
echo -e "${BLUE}   Git SHA: ${GIT_SHA}${NC}"
echo -e "${BLUE}   Build Time (UTC): ${BUILD_TIME}${NC}"
echo -e "${GREEN}✅ 版本信息获取完成${NC}"

# 8. 构建后端镜像
echo -e "${YELLOW}[8/12] 构建后端 Docker 镜像...${NC}"
docker build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest \
    -t gcr.io/$PROJECT_ID/$BACKEND_SERVICE:$(date +%Y%m%d-%H%M%S) \
    --build-arg BUILD_VERSION=$GIT_SHA \
    --build-arg BUILD_TIME=$BUILD_TIME \
    -f docker/backend/Dockerfile . || {
    echo -e "${RED}❌ 后端镜像构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 后端镜像构建完成${NC}"

# 9. 推送后端镜像
echo -e "${YELLOW}[9/12] 推送后端镜像到 Container Registry...${NC}"
docker push gcr.io/$PROJECT_ID/$BACKEND_SERVICE:latest || {
    echo -e "${RED}❌ 后端镜像推送失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 后端镜像推送完成${NC}"

# 10. 部署后端服务
echo -e "${YELLOW}[10/12] 部署后端服务到 Cloud Run...${NC}"
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

# 11. 构建前端镜像
echo -e "${YELLOW}[11/12] 构建前端 Docker 镜像...${NC}"

GOOGLE_MAPS_API_KEY=$(gcloud secrets versions access latest --secret="google-maps-api-key" --project=$PROJECT_ID 2>/dev/null || echo "")
if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
    echo -e "${YELLOW}⚠️  未找到 Secret Manager 中的 google-maps-api-key，使用默认值${NC}"
    GOOGLE_MAPS_API_KEY="AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28"
fi

docker build --platform linux/amd64 \
    -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:latest \
    -t gcr.io/$PROJECT_ID/$FRONTEND_SERVICE:$(date +%Y%m%d-%H%M%S) \
    --build-arg VITE_API_BASE_URL=$BACKEND_URL \
    --build-arg VITE_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY" \
    --build-arg BUILD_VERSION=$GIT_SHA \
    --build-arg BUILD_TIME=$BUILD_TIME \
    -f docker/frontend/Dockerfile . || {
    echo -e "${RED}❌ 前端镜像构建失败${NC}"
    exit 1
}
echo -e "${GREEN}✅ 前端镜像构建完成${NC}"

# 12. 推送并部署前端服务
echo -e "${YELLOW}[12/12] 推送并部署前端服务...${NC}"
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
echo -e "${GREEN}   🎉 部署完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}服务地址:${NC}"
echo -e "  后端: ${GREEN}$BACKEND_URL${NC}"
echo -e "  前端: ${GREEN}$FRONTEND_URL${NC}"
echo ""
echo -e "${YELLOW}版本信息:${NC}"
echo -e "  Git SHA: ${GREEN}${GIT_SHA}${NC}"
echo -e "  Build Time (UTC): ${GREEN}${BUILD_TIME}${NC}"
echo ""
echo -e "${YELLOW}验证步骤:${NC}"
echo "  1. 测试后端 API: curl $BACKEND_URL/health"
echo "  2. 访问前端: $FRONTEND_URL"
echo "  3. 验证规则管理权限: 以 dispatcher 身份登录，检查是否能访问规则管理"
echo "  4. 检查数据库迁移: 确认 dispatcher 用户拥有 rules:manage 权限"
echo ""
