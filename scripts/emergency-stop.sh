#!/bin/bash
# 紧急停止脚本 - 立即停止所有 GCP 服务以阻止费用产生
# 创建时间: 2025-11-30T21:45:00

set -e

PROJECT_ID="275911787144"
REGION="${REGION:-asia-east2}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo -e "${RED}   ⚠️  紧急停止所有 GCP 服务${NC}"
echo -e "${RED}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}此脚本将:${NC}"
echo "  1. 停止所有 Cloud Run 服务（设置实例数为 0）"
echo "  2. 暂停所有 Cloud SQL 实例（如果有）"
echo "  3. 列出所有资源供检查"
echo ""
read -p "确认继续？(y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

echo ""

# 1. 停止所有 Cloud Run 服务
echo -e "${YELLOW}[1/3] 停止所有 Cloud Run 服务...${NC}"
SERVICES=$(gcloud run services list --region=$REGION --project=$PROJECT_ID --format="value(metadata.name)" 2>/dev/null || echo "")

if [ -z "$SERVICES" ]; then
    echo -e "${GREEN}✅ 没有运行中的 Cloud Run 服务${NC}"
else
    for service in $SERVICES; do
        echo -e "${YELLOW}  停止服务: $service${NC}"
        gcloud run services update $service \
            --region=$REGION \
            --min-instances=0 \
            --max-instances=0 \
            --project=$PROJECT_ID \
            --quiet || echo "  无法停止 $service"
    done
    echo -e "${GREEN}✅ Cloud Run 服务已停止${NC}"
fi

# 2. 暂停所有 Cloud SQL 实例
echo -e "${YELLOW}[2/3] 暂停所有 Cloud SQL 实例...${NC}"
SQL_INSTANCES=$(gcloud sql instances list --project=$PROJECT_ID --format="value(name)" 2>/dev/null || echo "")

if [ -z "$SQL_INSTANCES" ]; then
    echo -e "${GREEN}✅ 没有 Cloud SQL 实例${NC}"
else
    for instance in $SQL_INSTANCES; do
        echo -e "${YELLOW}  暂停实例: $instance${NC}"
        gcloud sql instances patch $instance \
            --activation-policy=NEVER \
            --project=$PROJECT_ID \
            --quiet || echo "  无法暂停 $instance"
    done
    echo -e "${GREEN}✅ Cloud SQL 实例已暂停${NC}"
fi

# 3. 列出所有资源
echo -e "${YELLOW}[3/3] 列出所有资源...${NC}"
echo ""
echo -e "${BLUE}Cloud Run 服务:${NC}"
gcloud run services list --region=$REGION --project=$PROJECT_ID 2>/dev/null || echo "无服务"

echo ""
echo -e "${BLUE}Cloud SQL 实例:${NC}"
gcloud sql instances list --project=$PROJECT_ID 2>/dev/null || echo "无实例"

echo ""
echo -e "${BLUE}Compute Engine 实例:${NC}"
gcloud compute instances list --project=$PROJECT_ID 2>/dev/null || echo "无实例"

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ 紧急停止完成${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${YELLOW}下一步:${NC}"
echo "  1. 在 GCP Console 中检查费用明细"
echo "  2. 确认所有服务已停止"
echo "  3. 检查是否有其他资源在运行"
echo "  4. 联系 GCP 支持（如果费用异常）"
echo ""

