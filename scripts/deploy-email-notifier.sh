#!/bin/bash
# 部署 Cloud Functions 邮件通知服务
# 创建时间: 2025-12-12 00:25:00

set -e

# 配置
REGION="${REGION:-asia-east2}"
FUNCTION_NAME="orderEmailNotifier"
RUNTIME="nodejs20"
MEMORY="256Mi"
TIMEOUT="60s"
MAX_INSTANCES="10"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

# 获取项目 ID
PROJECT_ID="${PROJECT_ID:-$(gcloud config get-value project 2>/dev/null || echo "")}"

if [ -z "$PROJECT_ID" ]; then
  echo -e "${RED}❌ 错误: 未设置 PROJECT_ID，且无法从 gcloud config 读取${NC}"
  exit 1
fi

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   部署 Cloud Functions 邮件通知服务${NC}"
echo -e "${BLUE}   项目: $PROJECT_ID${NC}"
echo -e "${BLUE}   区域: $REGION${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 检查必要的 Secret
echo -e "${YELLOW}[1/4] 检查 Secret Manager 密钥...${NC}"
REQUIRED_SECRETS=("smtp_user" "smtp_app_password" "smtp_from")
MISSING_SECRETS=()

for secret in "${REQUIRED_SECRETS[@]}"; do
  if gcloud secrets describe "$secret" --project=$PROJECT_ID &>/dev/null; then
    echo -e "${GREEN}  ✅ $secret 存在${NC}"
  else
    echo -e "${RED}  ❌ $secret 不存在${NC}"
    MISSING_SECRETS+=($secret)
  fi
done

if [ ${#MISSING_SECRETS[@]} -gt 0 ]; then
  echo -e "${RED}❌ 错误: 缺少必要的 Secret${NC}"
  echo -e "${YELLOW}请先运行: ./scripts/setup-smtp-secrets.sh${NC}"
  exit 1
fi

# 启用必要的 API
echo -e "${YELLOW}[2/4] 启用必要的 GCP API...${NC}"
gcloud services enable cloudfunctions.googleapis.com --project=$PROJECT_ID --quiet || echo "Cloud Functions API 可能已启用"
gcloud services enable cloudbuild.googleapis.com --project=$PROJECT_ID --quiet || echo "Cloud Build API 可能已启用"
gcloud services enable secretmanager.googleapis.com --project=$PROJECT_ID --quiet || echo "Secret Manager API 可能已启用"
echo -e "${GREEN}✅ API 启用完成${NC}"

# 授予权限
echo -e "${YELLOW}[3/4] 授予 Cloud Functions 服务账号 Secret Manager 访问权限...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null || echo "")
if [ -n "$PROJECT_NUMBER" ]; then
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  
  for secret in smtp_user smtp_app_password smtp_from smtp_to_default smtp_logo_base64; do
    if gcloud secrets describe "$secret" --project=$PROJECT_ID &>/dev/null; then
      gcloud secrets add-iam-policy-binding "$secret" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID \
        --quiet || echo -e "${YELLOW}  ⚠️  $secret 权限可能已存在${NC}"
    fi
  done
  
  echo -e "${GREEN}✅ 权限授予完成${NC}"
else
  echo -e "${YELLOW}⚠️  无法获取项目编号，请手动授予权限${NC}"
fi

# 部署函数
echo -e "${YELLOW}[4/4] 部署 Cloud Functions...${NC}"
cd cloud-functions/order-email-notifier

gcloud functions deploy $FUNCTION_NAME \
  --gen2 \
  --region=$REGION \
  --runtime=$RUNTIME \
  --entry-point=orderEmailNotifier \
  --trigger-http \
  --allow-unauthenticated \
  --memory=$MEMORY \
  --timeout=$TIMEOUT \
  --max-instances=$MAX_INSTANCES \
  --project=$PROJECT_ID || {
  echo -e "${RED}❌ 部署失败${NC}"
  exit 1
}

# 获取函数 URL
FUNCTION_URL=$(gcloud functions describe $FUNCTION_NAME \
  --gen2 \
  --region=$REGION \
  --format='value(serviceConfig.uri)' \
  --project=$PROJECT_ID)

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Cloud Functions 部署完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}函数 URL:${NC}"
echo -e "  ${FUNCTION_URL}"
echo ""
echo -e "${BLUE}测试命令:${NC}"
echo -e "  curl -X POST \"${FUNCTION_URL}\" \\"
echo -e "    -H \"Content-Type: application/json\" \\"
echo -e "    -d '{\"order\":{\"orderNo\":\"TEST-001\",\"customerName\":\"Test Customer\"}}'"
echo ""

cd ../..
