#!/bin/bash
# 非交互式设置 SMTP Secret Manager 密钥
# 创建时间: 2025-12-12 00:35:00
# 使用方式: ./scripts/setup-smtp-secrets-non-interactive.sh

set -e

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

# 配置值
SMTP_USER="it@aponyinc.com"
SMTP_APP_PASSWORD="svrxqrcapvaqxzej"  # 应用专用密码（已去除空格）
SMTP_FROM="it@aponyinc.com"
DISPATCH_EMAILS="${DISPATCH_EMAILS:-}"  # 从环境变量读取，或留空

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   SMTP Secret Manager 配置脚本（非交互式）${NC}"
echo -e "${BLUE}   项目: $PROJECT_ID${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 函数：创建或更新 Secret
create_or_update_secret() {
  local secret_name=$1
  local value=$2
  local description=$3
  
  echo -e "${YELLOW}处理密钥: $secret_name ($description)${NC}"
  
  if [ -z "$value" ]; then
    echo -e "${YELLOW}  跳过 $secret_name（值为空）${NC}"
    echo ""
    return
  fi
  
  # 创建或更新密钥
  if gcloud secrets describe "$secret_name" --project=$PROJECT_ID &>/dev/null; then
    echo -n "$value" | gcloud secrets versions add "$secret_name" \
      --data-file=- \
      --project=$PROJECT_ID \
      --quiet
    echo -e "${GREEN}  ✅ 密钥 $secret_name 已更新${NC}"
  else
    echo -n "$value" | gcloud secrets create "$secret_name" \
      --data-file=- \
      --replication-policy="automatic" \
      --project=$PROJECT_ID \
      --quiet
    echo -e "${GREEN}  ✅ 密钥 $secret_name 已创建${NC}"
  fi
  echo ""
}

# 1. SMTP 用户名
create_or_update_secret "smtp_user" "$SMTP_USER" "SMTP 用户名（系统发信邮箱）"

# 2. SMTP 应用专用密码
create_or_update_secret "smtp_app_password" "$SMTP_APP_PASSWORD" "SMTP 应用专用密码"

# 3. SMTP 发件人地址
create_or_update_secret "smtp_from" "$SMTP_FROM" "SMTP 发件人地址"

# 4. 调度员邮箱列表（如果提供了）
if [ -n "$DISPATCH_EMAILS" ]; then
  create_or_update_secret "dispatch-emails" "$DISPATCH_EMAILS" "调度员邮箱列表（接收通知）"
else
  echo -e "${YELLOW}跳过调度员邮箱配置（未提供 DISPATCH_EMAILS 环境变量）${NC}"
  echo -e "${YELLOW}提示：可以通过环境变量 DISPATCH_EMAILS 设置，或稍后手动配置${NC}"
  echo ""
fi

# 5. 授予 Cloud Run 服务账号权限
echo -e "${YELLOW}[5/5] 授予 Cloud Run 服务账号 Secret Manager 访问权限...${NC}"
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format="value(projectNumber)" 2>/dev/null || echo "")
if [ -n "$PROJECT_NUMBER" ]; then
  SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
  
  for secret in smtp_user smtp_app_password smtp_from dispatch-emails; do
    if gcloud secrets describe "$secret" --project=$PROJECT_ID &>/dev/null; then
      gcloud secrets add-iam-policy-binding "$secret" \
        --member="serviceAccount:${SERVICE_ACCOUNT}" \
        --role="roles/secretmanager.secretAccessor" \
        --project=$PROJECT_ID \
        --quiet 2>/dev/null || echo -e "${YELLOW}  ⚠️  $secret 权限可能已存在${NC}"
    fi
  done
  
  echo -e "${GREEN}✅ 权限授予完成${NC}"
else
  echo -e "${YELLOW}⚠️  无法获取项目编号，请手动授予权限${NC}"
fi

echo ""
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ SMTP Secret Manager 配置完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}已配置的 Secret:${NC}"
echo -e "  ✅ smtp_user: $SMTP_USER"
echo -e "  ✅ smtp_app_password: ${SMTP_APP_PASSWORD:0:4}**** (已隐藏)"
echo -e "  ✅ smtp_from: $SMTP_FROM"
if [ -n "$DISPATCH_EMAILS" ]; then
  echo -e "  ✅ dispatch-emails: $DISPATCH_EMAILS"
else
  echo -e "  ⚠️  dispatch-emails: 未配置（可通过环境变量 DISPATCH_EMAILS 设置）"
fi
echo ""
echo -e "${BLUE}下一步：${NC}"
echo -e "  1. 如果还未设置调度员邮箱，运行: DISPATCH_EMAILS='email1@aponygroup.com,email2@aponygroup.com' ./scripts/setup-smtp-secrets-non-interactive.sh"
echo -e "  2. 部署 Cloud Functions: ./scripts/deploy-email-notifier.sh"
echo -e "  3. 配置环境变量 EMAIL_NOTIFIER_FUNCTION_URL"
echo ""
