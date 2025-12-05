#!/bin/bash
# Google Maps API Key Secret 设置脚本
# 创建时间: 2025-12-04T23:00:00
# 用途: 在 GCP Secret Manager 中创建前端和后端 API Key secrets

set -e

# 配置
PROJECT_ID="275911787144"
FRONTEND_API_KEY="AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs"
BACKEND_API_KEY="AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Google Maps API Key Secret 设置${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 1. 设置项目
echo -e "${YELLOW}[1/4] 设置 GCP 项目...${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✅ 项目已设置为: $PROJECT_ID${NC}"
echo ""

# 2. 检查并创建前端 API Key Secret
echo -e "${YELLOW}[2/4] 创建前端 API Key Secret...${NC}"
if gcloud secrets describe google-maps-api-key-frontend --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}⚠️  Secret 'google-maps-api-key-frontend' 已存在，更新为新版本...${NC}"
    echo -n "$FRONTEND_API_KEY" | gcloud secrets versions add google-maps-api-key-frontend \
        --data-file=- \
        --project=$PROJECT_ID
    echo -e "${GREEN}✅ 前端 API Key Secret 已更新${NC}"
else
    echo -n "$FRONTEND_API_KEY" | gcloud secrets create google-maps-api-key-frontend \
        --data-file=- \
        --project=$PROJECT_ID \
        --replication-policy="automatic"
    echo -e "${GREEN}✅ 前端 API Key Secret 已创建${NC}"
fi
echo ""

# 3. 检查并创建/更新后端 API Key Secret
echo -e "${YELLOW}[3/4] 验证后端 API Key Secret...${NC}"
if gcloud secrets describe google-maps-api-key --project=$PROJECT_ID &>/dev/null; then
    CURRENT_BACKEND_KEY=$(gcloud secrets versions access latest --secret=google-maps-api-key --project=$PROJECT_ID)
    if [ "$CURRENT_BACKEND_KEY" != "$BACKEND_API_KEY" ]; then
        echo -e "${YELLOW}⚠️  后端 Secret 存储的 Key 与预期不符，更新为新版本...${NC}"
        echo -n "$BACKEND_API_KEY" | gcloud secrets versions add google-maps-api-key \
            --data-file=- \
            --project=$PROJECT_ID
        echo -e "${GREEN}✅ 后端 API Key Secret 已更新${NC}"
    else
        echo -e "${GREEN}✅ 后端 API Key Secret 已正确配置${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  后端 Secret 不存在，创建新 Secret...${NC}"
    echo -n "$BACKEND_API_KEY" | gcloud secrets create google-maps-api-key \
        --data-file=- \
        --project=$PROJECT_ID \
        --replication-policy="automatic"
    echo -e "${GREEN}✅ 后端 API Key Secret 已创建${NC}"
fi
echo ""

# 4. 获取项目编号并配置 Cloud Build 服务账户权限
echo -e "${YELLOW}[4/4] 配置 Cloud Build 服务账户权限...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)")
CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"

echo "项目编号: $PROJECT_NUMBER"
echo "Cloud Build 服务账户: $CLOUD_BUILD_SA"

# 为前端 secret 添加权限
gcloud secrets add-iam-policy-binding google-maps-api-key-frontend \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID \
    --quiet || echo -e "${YELLOW}⚠️  权限可能已存在${NC}"

# 为后端 secret 添加权限（如果还没有）
gcloud secrets add-iam-policy-binding google-maps-api-key \
    --member="serviceAccount:${CLOUD_BUILD_SA}" \
    --role="roles/secretmanager.secretAccessor" \
    --project=$PROJECT_ID \
    --quiet || echo -e "${YELLOW}⚠️  权限可能已存在${NC}"

echo -e "${GREEN}✅ Cloud Build 服务账户权限已配置${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ 所有 Secrets 已配置完成！${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""
echo "创建的 Secrets:"
echo "  - google-maps-api-key-frontend (前端 API Key)"
echo "  - google-maps-api-key (后端 API Key)"
echo ""
echo "下一步:"
echo "  1. 运行部署命令重新部署应用"
echo "  2. 验证前端地图是否正常加载"

