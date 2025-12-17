#!/bin/bash
# 持续监控部署脚本
# 创建时间: 2025-12-11T15:30:00Z
# 用途: 持续监控 Cloud Run 部署直到完成

set -e

PROJECT_ID="oceanic-catcher-479821-u8"
REGION="asia-east2"
BACKEND_SERVICE="tms-backend"
MAX_CHECKS=60  # 最多检查 60 次（10分钟）
CHECK_INTERVAL=10  # 每 10 秒检查一次

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   持续监控 Cloud Run 部署${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

INITIAL_REVISION=$(gcloud run services describe $BACKEND_SERVICE \
    --region=$REGION \
    --format='value(status.latestReadyRevisionName)' \
    --project=$PROJECT_ID 2>&1)

echo -e "${BLUE}初始版本: $INITIAL_REVISION${NC}"
echo -e "${YELLOW}开始监控...${NC}"
echo ""

for i in $(seq 1 $MAX_CHECKS); do
    echo -e "${BLUE}[$i/$MAX_CHECKS] $(date '+%H:%M:%S') - 检查部署状态...${NC}"
    
    # 检查进行中的构建
    WORKING_BUILDS=$(gcloud builds list --filter="status=WORKING OR status=QUEUED" --format="value(id)" --project=$PROJECT_ID 2>&1 | wc -l | tr -d ' ')
    
    if [ "$WORKING_BUILDS" -gt 0 ]; then
        echo -e "${YELLOW}  进行中的构建: $WORKING_BUILDS 个${NC}"
        gcloud builds list --filter="status=WORKING OR status=QUEUED" \
            --format="table(id,status,createTime)" \
            --project=$PROJECT_ID 2>&1 | head -3
    else
        # 检查最新构建
        LATEST_BUILD=$(gcloud builds list --limit=1 --format="value(id,status,createTime)" --project=$PROJECT_ID 2>&1 | head -1)
        BUILD_STATUS=$(echo $LATEST_BUILD | awk '{print $2}')
        BUILD_TIME=$(echo $LATEST_BUILD | awk '{print $3}')
        
        # 检查服务版本
        CURRENT_REVISION=$(gcloud run services describe $BACKEND_SERVICE \
            --region=$REGION \
            --format='value(status.latestReadyRevisionName)' \
            --project=$PROJECT_ID 2>&1)
        
        LATEST_CREATED=$(gcloud run services describe $BACKEND_SERVICE \
            --region=$REGION \
            --format='value(status.latestCreatedRevisionName)' \
            --project=$PROJECT_ID 2>&1)
        
        echo -e "${BLUE}  最新构建: $BUILD_STATUS ($BUILD_TIME)${NC}"
        echo -e "${BLUE}  当前版本: $CURRENT_REVISION${NC}"
        echo -e "${BLUE}  最新创建版本: $LATEST_CREATED${NC}"
        
        # 如果版本发生变化，说明有新部署
        if [ "$CURRENT_REVISION" != "$INITIAL_REVISION" ] && [ "$CURRENT_REVISION" = "$LATEST_CREATED" ]; then
            echo -e "${GREEN}  ✓ 检测到新版本部署完成！${NC}"
            
            # 健康检查
            BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE \
                --region=$REGION \
                --format='value(status.url)' \
                --project=$PROJECT_ID 2>&1)
            
            HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/health" 2>&1 || echo "000")
            if [ "$HEALTH" = "200" ]; then
                echo -e "${GREEN}  ✓ 后端服务健康检查: 200 OK${NC}"
                echo ""
                echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
                echo -e "${GREEN}   部署完成！${NC}"
                echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
                echo ""
                echo -e "${BLUE}服务地址:${NC}"
                echo -e "  后端: $BACKEND_URL"
                echo ""
                echo -e "${YELLOW}下一步验证:${NC}"
                echo "  1. 刷新前端页面"
                echo "  2. 以 dispatcher 身份登录"
                echo "  3. 访问规则管理页面，验证不再出现 403 错误"
                exit 0
            else
                echo -e "${YELLOW}  ⚠ 后端服务健康检查: HTTP $HEALTH（可能还在启动中）${NC}"
            fi
        fi
    fi
    
    if [ $i -lt $MAX_CHECKS ]; then
        echo -e "${BLUE}  等待 ${CHECK_INTERVAL} 秒后继续检查...${NC}"
        sleep $CHECK_INTERVAL
    fi
done

echo ""
echo -e "${YELLOW}⚠ 监控超时，请手动检查部署状态${NC}"
echo -e "${BLUE}使用以下命令检查:${NC}"
echo "  gcloud run services describe $BACKEND_SERVICE --region=$REGION --project=$PROJECT_ID"
