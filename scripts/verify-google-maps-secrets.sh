#!/bin/bash
# Google Maps API Key Secret 验证脚本
# 创建时间: 2025-12-04T23:00:00
# 用途: 验证 GCP Secret Manager 中的 API Key secrets 是否正确配置

set -e

# 配置
PROJECT_ID="275911787144"
EXPECTED_FRONTEND_KEY="AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs"
EXPECTED_BACKEND_KEY="AIzaSyDWyRo10INN_p2op7PB9rUE-yTjB-LlxT0"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   Google Maps API Key Secret 验证${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 设置项目
gcloud config set project $PROJECT_ID >/dev/null 2>&1

# 验证结果
FRONTEND_OK=false
BACKEND_OK=false
PERMISSIONS_OK=false

# 1. 验证前端 Secret
echo -e "${YELLOW}[1/3] 验证前端 API Key Secret...${NC}"
if gcloud secrets describe google-maps-api-key-frontend --project=$PROJECT_ID &>/dev/null; then
    ACTUAL_FRONTEND_KEY=$(gcloud secrets versions access latest --secret=google-maps-api-key-frontend --project=$PROJECT_ID 2>/dev/null || echo "")
    if [ "$ACTUAL_FRONTEND_KEY" = "$EXPECTED_FRONTEND_KEY" ]; then
        echo -e "${GREEN}✅ 前端 Secret 配置正确${NC}"
        echo "  Secret: google-maps-api-key-frontend"
        echo "  Key 前 8 位: ${EXPECTED_FRONTEND_KEY:0:8}..."
        FRONTEND_OK=true
    else
        echo -e "${RED}❌ 前端 Secret 存储的 Key 不正确${NC}"
        echo "  期望: ${EXPECTED_FRONTEND_KEY:0:8}..."
        echo "  实际: ${ACTUAL_FRONTEND_KEY:0:8}..."
        echo "  请运行: scripts/setup-google-maps-secrets.sh"
    fi
else
    echo -e "${RED}❌ 前端 Secret 'google-maps-api-key-frontend' 不存在${NC}"
    echo "  请运行: scripts/setup-google-maps-secrets.sh"
fi
echo ""

# 2. 验证后端 Secret
echo -e "${YELLOW}[2/3] 验证后端 API Key Secret...${NC}"
if gcloud secrets describe google-maps-api-key --project=$PROJECT_ID &>/dev/null; then
    ACTUAL_BACKEND_KEY=$(gcloud secrets versions access latest --secret=google-maps-api-key --project=$PROJECT_ID 2>/dev/null || echo "")
    if [ "$ACTUAL_BACKEND_KEY" = "$EXPECTED_BACKEND_KEY" ]; then
        echo -e "${GREEN}✅ 后端 Secret 配置正确${NC}"
        echo "  Secret: google-maps-api-key"
        echo "  Key 前 8 位: ${EXPECTED_BACKEND_KEY:0:8}..."
        BACKEND_OK=true
    else
        echo -e "${RED}❌ 后端 Secret 存储的 Key 不正确${NC}"
        echo "  期望: ${EXPECTED_BACKEND_KEY:0:8}..."
        echo "  实际: ${ACTUAL_BACKEND_KEY:0:8}..."
        echo "  请运行: scripts/setup-google-maps-secrets.sh"
    fi
else
    echo -e "${RED}❌ 后端 Secret 'google-maps-api-key' 不存在${NC}"
    echo "  请运行: scripts/setup-google-maps-secrets.sh"
fi
echo ""

# 3. 验证 Cloud Build 服务账户权限
echo -e "${YELLOW}[3/3] 验证 Cloud Build 服务账户权限...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null || echo "")
if [ -n "$PROJECT_NUMBER" ]; then
    CLOUD_BUILD_SA="${PROJECT_NUMBER}@cloudbuild.gserviceaccount.com"
    
    # 检查前端 secret 权限
    FRONTEND_PERMISSION=$(gcloud secrets get-iam-policy google-maps-api-key-frontend --project=$PROJECT_ID 2>/dev/null | grep -c "$CLOUD_BUILD_SA" || echo "0")
    BACKEND_PERMISSION=$(gcloud secrets get-iam-policy google-maps-api-key --project=$PROJECT_ID 2>/dev/null | grep -c "$CLOUD_BUILD_SA" || echo "0")
    
    if [ "$FRONTEND_PERMISSION" -gt 0 ] && [ "$BACKEND_PERMISSION" -gt 0 ]; then
        echo -e "${GREEN}✅ Cloud Build 服务账户权限配置正确${NC}"
        echo "  服务账户: $CLOUD_BUILD_SA"
        echo "  前端 Secret 权限: ✅"
        echo "  后端 Secret 权限: ✅"
        PERMISSIONS_OK=true
    else
        echo -e "${RED}❌ Cloud Build 服务账户权限配置不完整${NC}"
        echo "  服务账户: $CLOUD_BUILD_SA"
        [ "$FRONTEND_PERMISSION" -eq 0 ] && echo "  前端 Secret 权限: ❌"
        [ "$BACKEND_PERMISSION" -eq 0 ] && echo "  后端 Secret 权限: ❌"
        echo "  请运行: scripts/setup-google-maps-secrets.sh"
    fi
else
    echo -e "${RED}❌ 无法获取项目编号${NC}"
fi
echo ""

# 总结
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
if [ "$FRONTEND_OK" = true ] && [ "$BACKEND_OK" = true ] && [ "$PERMISSIONS_OK" = true ]; then
    echo -e "${GREEN}✅ 所有验证通过！可以开始部署应用${NC}"
    echo ""
    echo "下一步："
    echo "  运行部署命令重新部署应用"
    exit 0
else
    echo -e "${RED}❌ 验证未通过，请修复上述问题后重试${NC}"
    echo ""
    echo "修复方法："
    echo "  运行: ./scripts/setup-google-maps-secrets.sh"
    exit 1
fi

