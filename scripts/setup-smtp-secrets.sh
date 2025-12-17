#!/bin/bash
# 设置 SMTP 相关 Secret Manager 密钥
# 创建时间: 2025-12-12 00:20:00
# 作用: 在 GCP Secret Manager 中创建或更新 SMTP 配置密钥

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

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   SMTP Secret Manager 配置脚本${NC}"
echo -e "${BLUE}   项目: $PROJECT_ID${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 函数：创建或更新 Secret
create_or_update_secret() {
  local secret_name=$1
  local description=$2
  local is_password=$3  # 是否密码类型（输入时不显示）
  
  echo -e "${YELLOW}处理密钥: $secret_name ($description)${NC}"
  
  # 检查密钥是否存在
  if gcloud secrets describe "$secret_name" --project=$PROJECT_ID &>/dev/null; then
    echo -e "${YELLOW}  密钥已存在，是否更新？(y/n)${NC}"
    read -p "  " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${YELLOW}  跳过 $secret_name${NC}"
      echo ""
      return
    fi
  fi
  
  # 读取值
  if [ "$is_password" = "true" ]; then
    read -sp "  请输入 $description: " value
    echo
  else
    read -p "  请输入 $description: " value
  fi
  
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

# 1. SMTP 用户名（系统发信邮箱）
echo -e "${YELLOW}说明：这是系统发送邮件的账号（不是调度员邮箱）${NC}"
echo -e "${YELLOW}例如：it@aponyinc.com${NC}"
echo ""
create_or_update_secret "smtp_user" "SMTP 用户名（系统发信邮箱，如 it@aponyinc.com）" false

# 2. SMTP 应用专用密码
echo -e "${YELLOW}⚠️  重要提示：${NC}"
echo -e "${YELLOW}   - 必须使用 Google Workspace 邮箱的应用专用密码（App Password）${NC}"
echo -e "${YELLOW}   - 不是普通密码！需要在 Google 账户中生成应用专用密码${NC}"
echo -e "${YELLOW}   - 生成步骤：Google 账户 → 安全性 → 两步验证 → 应用密码${NC}"
echo -e "${YELLOW}   - 这是 it@aponyinc.com 邮箱的应用专用密码${NC}"
echo ""
create_or_update_secret "smtp_app_password" "SMTP 应用专用密码（16位，仅显示一次）" true

# 3. SMTP 发件人地址
echo -e "${YELLOW}说明：发件人显示地址（通常与 smtp_user 相同）${NC}"
create_or_update_secret "smtp_from" "SMTP 发件人地址（默认与 smtp_user 相同，如 it@aponyinc.com）" false

# 4. 调度员邮箱列表（接收通知的邮箱）
echo -e "${YELLOW}处理调度员邮箱列表（接收通知的邮箱）${NC}"
echo -e "${YELLOW}  说明：这是接收询价通知的调度员邮箱（不是发信邮箱）${NC}"
echo -e "${YELLOW}  提示：多个邮箱用逗号分隔，例如：dispatcher1@aponygroup.com,dispatcher2@aponygroup.com${NC}"
read -p "  请输入调度员邮箱列表（接收通知的邮箱，可选，留空跳过）: " dispatch_emails

if [ -n "$dispatch_emails" ]; then
  if gcloud secrets describe "dispatch-emails" --project=$PROJECT_ID &>/dev/null; then
    echo -n "$dispatch_emails" | gcloud secrets versions add "dispatch-emails" \
      --data-file=- \
      --project=$PROJECT_ID \
      --quiet
    echo -e "${GREEN}  ✅ 密钥 dispatch-emails 已更新${NC}"
  else
    echo -n "$dispatch_emails" | gcloud secrets create "dispatch-emails" \
      --data-file=- \
      --replication-policy="automatic" \
      --project=$PROJECT_ID \
      --quiet
    echo -e "${GREEN}  ✅ 密钥 dispatch-emails 已创建${NC}"
  fi
fi
echo ""

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
        --quiet || echo -e "${YELLOW}  ⚠️  权限可能已存在${NC}"
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
echo -e "${BLUE}下一步：${NC}"
echo -e "  1. 更新部署脚本，在 Cloud Run 服务中绑定这些 Secret"
echo -e "  2. 设置环境变量 DISPATCH_EMAILS（或从 Secret Manager 读取）"
echo -e "  3. 重新部署后端服务"
echo ""
