#!/bin/bash
# 测试 Cloud Functions 邮件通知服务
# 创建时间: 2025-12-12 00:25:00

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取项目 ID 和区域
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"
REGION="${REGION:-asia-east2}"

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ 错误: 未设置 PROJECT_ID${NC}"
  exit 1
fi

# 获取函数 URL
FUNCTION_URL=$(gcloud functions describe orderEmailNotifier \
  --gen2 \
  --region=$REGION \
  --format='value(serviceConfig.uri)' \
  --project=$PROJECT_ID 2>/dev/null || echo "")

if [ -z "$FUNCTION_URL" ]; then
  echo -e "${RED}❌ 错误: 无法获取函数 URL，请先部署函数${NC}"
  echo -e "${YELLOW}运行: ./scripts/deploy-email-notifier.sh${NC}"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   测试 Cloud Functions 邮件通知服务${NC}"
echo -e "${BLUE}   函数 URL: $FUNCTION_URL${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 测试数据
TEST_DATA='{
  "lang": "zh-CN",
  "brand": {
    "name": "Apony 物流",
    "primaryColor": "#FF6B35",
    "headerBg": "#FF6B35",
    "headerFg": "#ffffff"
  },
  "order": {
    "orderNo": "QR-20251212-0001",
    "customerName": "测试客户",
    "amount": 1680,
    "currency": "CNY",
    "pickupDate": "2025-12-13",
    "link": "https://tms-frontend-v4estohola-df.a.run.app/admin/quote-requests/test-id",
    "items": [
      {"name": "机箱", "qty": 10, "weight": "12kg"},
      {"name": "主板", "qty": 20, "weight": "8kg"}
    ],
    "notes": "加急，夜间到仓"
  }
}'

echo -e "${YELLOW}发送测试请求...${NC}"
echo ""

RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -d "$TEST_DATA")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" = "200" ]; then
  echo -e "${GREEN}✅ 请求成功 (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo -e "${BLUE}响应内容:${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  echo ""
  echo -e "${GREEN}请检查收件邮箱是否收到测试邮件${NC}"
else
  echo -e "${RED}❌ 请求失败 (HTTP $HTTP_CODE)${NC}"
  echo ""
  echo -e "${BLUE}响应内容:${NC}"
  echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
  exit 1
fi
