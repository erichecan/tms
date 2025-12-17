#!/bin/bash
# 实时监控部署脚本
# 创建时间: 2025-12-11T15:40:00Z
# 用途: 实时监控 Cloud Run 部署进度

PROJECT_ID="oceanic-catcher-479821-u8"
REGION="asia-east2"
SERVICE="tms-backend"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}开始监控部署...${NC}"
echo ""

INITIAL_REVISION=$(gcloud run services describe $SERVICE \
    --region=$REGION \
    --format='value(status.latestReadyRevisionName)' \
    --project=$PROJECT_ID 2>&1)

echo "初始版本: $INITIAL_REVISION"
echo ""

while true; do
    # 检查进行中的构建
    WORKING=$(gcloud builds list --filter="status=WORKING OR status=QUEUED" --format="value(id)" --project=$PROJECT_ID 2>&1 | wc -l | tr -d ' ')
    
    if [ "$WORKING" -gt 0 ]; then
        echo -e "${YELLOW}[$(date '+%H:%M:%S')] 构建进行中...${NC}"
        gcloud builds list --filter="status=WORKING OR status=QUEUED" \
            --format="table(id,status,createTime)" \
            --project=$PROJECT_ID 2>&1 | head -3
    else
        CURRENT=$(gcloud run services describe $SERVICE \
            --region=$REGION \
            --format='value(status.latestReadyRevisionName)' \
            --project=$PROJECT_ID 2>&1)
        
        CREATED=$(gcloud run services describe $SERVICE \
            --region=$REGION \
            --format='value(status.latestCreatedRevisionName)' \
            --project=$PROJECT_ID 2>&1)
        
        echo -e "${BLUE}[$(date '+%H:%M:%S')] 当前版本: $CURRENT | 最新创建: $CREATED${NC}"
        
        if [ "$CURRENT" != "$INITIAL_REVISION" ] && [ "$CURRENT" = "$CREATED" ]; then
            echo -e "${GREEN}✓ 新版本已部署完成！${NC}"
            BACKEND_URL=$(gcloud run services describe $SERVICE \
                --region=$REGION \
                --format='value(status.url)' \
                --project=$PROJECT_ID 2>&1)
            echo "后端 URL: $BACKEND_URL"
            break
        fi
    fi
    
    sleep 5
done
