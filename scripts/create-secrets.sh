#!/bin/bash
# 创建 GCP Secret Manager 密钥脚本
# 创建时间: 2025-11-30T21:40:00

set -e

PROJECT_ID="275911787144"
ENV_FILE="${ENV_FILE:-.env}"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   创建 GCP Secret Manager 密钥${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 检查 .env 文件是否存在
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ 错误: $ENV_FILE 文件不存在${NC}"
    echo "请确保 .env 文件存在并包含必要的配置"
    exit 1
fi

echo -e "${YELLOW}从 $ENV_FILE 读取配置...${NC}"
echo ""

# 函数：创建或更新密钥
create_or_update_secret() {
    local secret_name=$1
    local env_var=$2
    local description=$3
    
    echo -e "${YELLOW}处理密钥: $secret_name ($description)${NC}"
    
    # 从 .env 文件读取值
    local value=$(grep "^${env_var}=" "$ENV_FILE" | cut -d '=' -f2- | sed 's/^["'\'']//;s/["'\'']$//')
    
    if [ -z "$value" ]; then
        echo -e "${RED}  ⚠️  警告: 在 $ENV_FILE 中未找到 $env_var${NC}"
        read -p "  是否手动输入值？(y/n) " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            read -sp "  请输入 $description 的值: " value
            echo
        else
            echo -e "${YELLOW}  跳过 $secret_name${NC}"
            return
        fi
    fi
    
    # 检查密钥是否存在
    if gcloud secrets describe "$secret_name" --project=$PROJECT_ID &>/dev/null; then
        echo -e "${YELLOW}  密钥已存在，更新中...${NC}"
        echo -n "$value" | gcloud secrets versions add "$secret_name" \
            --data-file=- \
            --project=$PROJECT_ID
        echo -e "${GREEN}  ✅ 密钥 $secret_name 已更新${NC}"
    else
        echo -e "${YELLOW}  创建新密钥...${NC}"
        echo -n "$value" | gcloud secrets create "$secret_name" \
            --data-file=- \
            --replication-policy="automatic" \
            --project=$PROJECT_ID
        echo -e "${GREEN}  ✅ 密钥 $secret_name 已创建${NC}"
    fi
    echo ""
}

# 1. 创建 database-url 密钥
create_or_update_secret "database-url" "DATABASE_URL" "数据库连接字符串"

# 2. 创建 jwt-secret 密钥
create_or_update_secret "jwt-secret" "JWT_SECRET" "JWT 签名密钥"

# 3. 创建 google-maps-api-key 密钥
create_or_update_secret "google-maps-api-key" "GOOGLE_MAPS_API_KEY" "Google Maps API 密钥"

echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo -e "${GREEN}   ✅ Secret Manager 密钥配置完成！${NC}"
echo -e "${GREEN}═══════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}下一步:${NC}"
echo "  运行部署脚本: ${GREEN}./scripts/gcp-deploy.sh${NC}"
echo ""

