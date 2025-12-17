#!/bin/bash
# 部署监控脚本
# 创建时间: 2025-12-11T15:25:00Z
# 用途: 持续监控 GCP Cloud Run 部署状态

set -e

PROJECT_ID="oceanic-catcher-479821-u8"
REGION="asia-east2"
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   部署监控 - 持续监控 Cloud Run 部署状态${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 1. 检查最新的构建状态
echo -e "${YELLOW}[1] 检查最新的 Cloud Build 构建状态...${NC}"
LATEST_BUILD=$(gcloud builds list --limit=1 --format="value(id,status,createTime)" --project=$PROJECT_ID 2>&1 | head -1)
if [ -n "$LATEST_BUILD" ]; then
    BUILD_ID=$(echo $LATEST_BUILD | awk '{print $1}')
    BUILD_STATUS=$(echo $LATEST_BUILD | awk '{print $2}')
    BUILD_TIME=$(echo $LATEST_BUILD | awk '{print $3}')
    
    if [ "$BUILD_STATUS" = "SUCCESS" ]; then
        echo -e "${GREEN}✓ 最新构建: $BUILD_ID - 状态: $BUILD_STATUS - 时间: $BUILD_TIME${NC}"
    elif [ "$BUILD_STATUS" = "WORKING" ] || [ "$BUILD_STATUS" = "QUEUED" ]; then
        echo -e "${YELLOW}⚠ 最新构建: $BUILD_ID - 状态: $BUILD_STATUS (进行中)${NC}"
    else
        echo -e "${RED}✗ 最新构建: $BUILD_ID - 状态: $BUILD_STATUS${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 未找到构建记录${NC}"
fi
echo ""

# 2. 检查后端服务状态
echo -e "${YELLOW}[2] 检查后端服务状态...${NC}"
BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' \
    --project=$PROJECT_ID 2>&1)

if [ -n "$BACKEND_URL" ]; then
    echo -e "${GREEN}✓ 后端服务 URL: $BACKEND_URL${NC}"
    
    # 检查服务健康状态
    HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>&1 || echo "000")
    if [ "$HEALTH_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ 后端服务健康检查: 200 OK${NC}"
        
        # 获取健康检查详情
        HEALTH_DATA=$(curl -s "$BACKEND_URL/health" 2>&1)
        echo -e "${BLUE}   健康检查详情:${NC}"
        echo "$HEALTH_DATA" | head -3 | sed 's/^/   /'
    else
        echo -e "${RED}✗ 后端服务健康检查失败: HTTP $HEALTH_RESPONSE${NC}"
    fi
    
    # 检查最新版本
    LATEST_REVISION=$(gcloud run services describe $BACKEND_SERVICE \
        --region=$REGION \
        --format='value(status.latestReadyRevisionName)' \
        --project=$PROJECT_ID 2>&1)
    echo -e "${BLUE}   最新版本: $LATEST_REVISION${NC}"
else
    echo -e "${RED}✗ 无法获取后端服务 URL${NC}"
fi
echo ""

# 3. 检查前端服务状态
echo -e "${YELLOW}[3] 检查前端服务状态...${NC}"
FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE \
    --region=$REGION \
    --format='value(status.url)' \
    --project=$PROJECT_ID 2>&1)

if [ -n "$FRONTEND_URL" ]; then
    echo -e "${GREEN}✓ 前端服务 URL: $FRONTEND_URL${NC}"
    
    # 检查服务可访问性
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>&1 || echo "000")
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        echo -e "${GREEN}✓ 前端服务可访问: 200 OK${NC}"
    else
        echo -e "${YELLOW}⚠ 前端服务响应: HTTP $FRONTEND_RESPONSE${NC}"
    fi
else
    echo -e "${YELLOW}⚠ 无法获取前端服务 URL${NC}"
fi
echo ""

# 4. 检查服务配置
echo -e "${YELLOW}[4] 检查服务配置...${NC}"
BACKEND_CONFIG=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(spec.template.spec.containers[0].image)' \
    --project=$PROJECT_ID 2>&1)

if [ -n "$BACKEND_CONFIG" ]; then
    echo -e "${BLUE}   后端镜像: $BACKEND_CONFIG${NC}"
fi

# 5. 验证规则管理 API（需要 token）
echo -e "${YELLOW}[5] 规则管理 API 验证提示...${NC}"
echo -e "${BLUE}   要测试规则管理 API，请使用以下命令:${NC}"
echo ""
echo "   # 获取用户 token（需要先登录）"
echo "   TOKEN=\"your-auth-token\""
echo ""
echo "   # 测试规则 API"
echo "   curl -H \"Authorization: Bearer \$TOKEN\" \\"
echo "     $BACKEND_URL/api/rules"
echo ""
echo -e "${YELLOW}   预期结果:${NC}"
echo "   - dispatcher 用户: 200 OK（返回规则列表）"
echo "   - 无权限用户: 403 Forbidden"
echo ""

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   监控完成${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
