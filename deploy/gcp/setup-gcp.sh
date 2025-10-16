#!/bin/bash
# TMS GCP 初始化脚本
# 创建时间：2025-10-16 17:12:00
# 用途：自动化 GCP 资源创建和配置

set -e  # 遇到错误立即退出

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查必要的工具
check_prerequisites() {
    print_info "检查必要的工具..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "gcloud CLI 未安装。请访问：https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    if ! command -v openssl &> /dev/null; then
        print_error "openssl 未安装"
        exit 1
    fi
    
    print_info "✓ 所有必要工具已安装"
}

# 获取用户输入
get_user_input() {
    print_info "请提供以下信息："
    
    # 项目 ID
    read -p "GCP 项目 ID (默认: tms-production): " PROJECT_ID
    PROJECT_ID=${PROJECT_ID:-tms-production}
    
    # 区域
    read -p "部署区域 (默认: asia-east1): " REGION
    REGION=${REGION:-asia-east1}
    
    # Google Maps API Key
    read -p "Google Maps API Key: " GOOGLE_MAPS_API_KEY
    
    # Gemini API Key (可选)
    read -p "Gemini API Key (可选，直接回车跳过): " GEMINI_API_KEY
    
    # 确认
    echo ""
    print_info "配置摘要："
    echo "  项目 ID: $PROJECT_ID"
    echo "  区域: $REGION"
    echo "  Google Maps API: ${GOOGLE_MAPS_API_KEY:0:20}..."
    echo ""
    read -p "确认以上配置？(y/n): " confirm
    
    if [ "$confirm" != "y" ]; then
        print_error "用户取消操作"
        exit 1
    fi
    
    # 导出环境变量
    export PROJECT_ID
    export REGION
    export GOOGLE_MAPS_API_KEY
    export GEMINI_API_KEY
}

# 设置 GCP 项目
setup_project() {
    print_info "设置 GCP 项目..."
    
    # 检查项目是否存在
    if ! gcloud projects describe $PROJECT_ID &> /dev/null; then
        print_warn "项目 $PROJECT_ID 不存在，尝试创建..."
        gcloud projects create $PROJECT_ID --name="TMS Production" || {
            print_error "创建项目失败，请确保项目 ID 可用"
            exit 1
        }
    fi
    
    # 设置为当前项目
    gcloud config set project $PROJECT_ID
    
    print_info "✓ 项目设置完成"
}

# 启用必要的 API
enable_apis() {
    print_info "启用必要的 Google Cloud API（这可能需要几分钟）..."
    
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        secretmanager.googleapis.com \
        artifactregistry.googleapis.com \
        compute.googleapis.com \
        vpcaccess.googleapis.com \
        --quiet
    
    print_info "✓ API 启用完成"
}

# 创建 Cloud SQL 实例
create_cloudsql() {
    print_info "创建 Cloud SQL PostgreSQL 实例（这可能需要 5-10 分钟）..."
    
    # 检查实例是否已存在
    if gcloud sql instances describe tms-postgres &> /dev/null; then
        print_warn "Cloud SQL 实例 'tms-postgres' 已存在，跳过创建"
        INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe tms-postgres --format='value(connectionName)')
    else
        gcloud sql instances create tms-postgres \
            --database-version=POSTGRES_15 \
            --tier=db-g1-small \
            --region=$REGION \
            --storage-type=SSD \
            --storage-size=10GB \
            --storage-auto-increase \
            --backup-start-time=03:00 \
            --maintenance-window-day=SUN \
            --maintenance-window-hour=4 \
            --maintenance-release-channel=production \
            --no-assign-ip \
            --network=default \
            --quiet
        
        print_info "✓ Cloud SQL 实例创建完成"
        
        # 获取实例连接名
        INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe tms-postgres --format='value(connectionName)')
    fi
    
    export INSTANCE_CONNECTION_NAME
    print_info "实例连接名: $INSTANCE_CONNECTION_NAME"
}

# 设置数据库
setup_database() {
    print_info "设置数据库和用户..."
    
    # 生成密码
    export DB_PASSWORD=$(openssl rand -base64 32)
    export APP_DB_PASSWORD=$(openssl rand -base64 32)
    
    # 设置 postgres 用户密码
    gcloud sql users set-password postgres \
        --instance=tms-postgres \
        --password="$DB_PASSWORD" \
        --quiet || print_warn "Postgres 用户密码可能已设置"
    
    # 创建数据库
    if ! gcloud sql databases describe tms_platform --instance=tms-postgres &> /dev/null; then
        gcloud sql databases create tms_platform --instance=tms-postgres --quiet
        print_info "✓ 数据库 'tms_platform' 创建完成"
    else
        print_warn "数据库 'tms_platform' 已存在"
    fi
    
    # 创建应用用户
    if ! gcloud sql users describe tms_user --instance=tms-postgres &> /dev/null; then
        gcloud sql users create tms_user \
            --instance=tms-postgres \
            --password="$APP_DB_PASSWORD" \
            --quiet
        print_info "✓ 用户 'tms_user' 创建完成"
    else
        print_warn "用户 'tms_user' 已存在"
    fi
    
    # 保存密码到文件
    cat > ./.env.secrets << EOF
# 生成时间：$(date)
# 警告：此文件包含敏感信息，请勿提交到版本控制！

DB_PASSWORD=$DB_PASSWORD
APP_DB_PASSWORD=$APP_DB_PASSWORD
INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME
EOF
    
    chmod 600 ./.env.secrets
    print_info "✓ 数据库密码已保存到 .env.secrets（请妥善保管）"
}

# 创建 Secrets
create_secrets() {
    print_info "创建 Secret Manager 密钥..."
    
    # 数据库连接字符串
    DATABASE_URL="postgresql://tms_user:${APP_DB_PASSWORD}@/tms_platform?host=/cloudsql/${INSTANCE_CONNECTION_NAME}&sslmode=disable"
    
    if ! gcloud secrets describe database-url &> /dev/null; then
        echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=- --quiet
        print_info "✓ 创建密钥: database-url"
    else
        print_warn "密钥 'database-url' 已存在，更新版本"
        echo -n "$DATABASE_URL" | gcloud secrets versions add database-url --data-file=- --quiet
    fi
    
    # JWT 密钥
    JWT_SECRET=$(openssl rand -base64 32)
    if ! gcloud secrets describe jwt-secret &> /dev/null; then
        echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=- --quiet
        print_info "✓ 创建密钥: jwt-secret"
    else
        print_warn "密钥 'jwt-secret' 已存在，跳过"
    fi
    
    # Google Maps API
    if ! gcloud secrets describe google-maps-api-key &> /dev/null; then
        echo -n "$GOOGLE_MAPS_API_KEY" | gcloud secrets create google-maps-api-key --data-file=- --quiet
        print_info "✓ 创建密钥: google-maps-api-key"
    else
        print_warn "密钥 'google-maps-api-key' 已存在，更新版本"
        echo -n "$GOOGLE_MAPS_API_KEY" | gcloud secrets versions add google-maps-api-key --data-file=- --quiet
    fi
    
    # Gemini API (可选)
    if [ -n "$GEMINI_API_KEY" ]; then
        if ! gcloud secrets describe gemini-api-key &> /dev/null; then
            echo -n "$GEMINI_API_KEY" | gcloud secrets create gemini-api-key --data-file=- --quiet
            print_info "✓ 创建密钥: gemini-api-key"
        else
            print_warn "密钥 'gemini-api-key' 已存在，更新版本"
            echo -n "$GEMINI_API_KEY" | gcloud secrets versions add gemini-api-key --data-file=- --quiet
        fi
    fi
    
    print_info "✓ 所有密钥创建完成"
}

# 授予 IAM 权限
grant_iam_permissions() {
    print_info "配置 IAM 权限..."
    
    # 获取项目编号和服务账号
    PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
    SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"
    
    print_info "服务账号: $SERVICE_ACCOUNT"
    
    # 授予 Secret Manager 访问权限
    for secret in database-url jwt-secret google-maps-api-key gemini-api-key; do
        if gcloud secrets describe $secret &> /dev/null; then
            gcloud secrets add-iam-policy-binding $secret \
                --member="serviceAccount:${SERVICE_ACCOUNT}" \
                --role="roles/secretmanager.secretAccessor" \
                --quiet 2>/dev/null || print_warn "权限可能已存在: $secret"
        fi
    done
    
    print_info "✓ IAM 权限配置完成"
}

# 生成配置文件
generate_config() {
    print_info "生成部署配置文件..."
    
    cat > ./deploy-config.env << EOF
# TMS GCP 部署配置
# 生成时间：$(date)

PROJECT_ID=$PROJECT_ID
REGION=$REGION
INSTANCE_CONNECTION_NAME=$INSTANCE_CONNECTION_NAME
GOOGLE_MAPS_API_KEY=$GOOGLE_MAPS_API_KEY

# Cloud Build 触发器配置
# 使用以下命令创建触发器或在 Cloud Console 中手动配置
#
# gcloud builds triggers create github \\
#   --name="deploy-production" \\
#   --repo-name="tms" \\
#   --repo-owner="erichecan" \\
#   --branch-pattern="^main$" \\
#   --build-config="deploy/gcp/cloudbuild.yaml" \\
#   --substitutions=_REGION="$REGION",_CLOUDSQL_INSTANCE="$INSTANCE_CONNECTION_NAME",_GOOGLE_MAPS_API_KEY="$GOOGLE_MAPS_API_KEY",_CORS_ORIGIN="*",_BACKEND_URL="https://placeholder.run.app"
EOF
    
    print_info "✓ 配置文件已生成: deploy-config.env"
}

# 显示后续步骤
show_next_steps() {
    echo ""
    print_info "========================================"
    print_info "✓ GCP 资源创建完成！"
    print_info "========================================"
    echo ""
    echo "后续步骤："
    echo ""
    echo "1. 连接 GitHub 仓库到 Cloud Build"
    echo "   访问：https://console.cloud.google.com/cloud-build/triggers?project=$PROJECT_ID"
    echo ""
    echo "2. 创建 Cloud Build 触发器"
    echo "   - 名称: deploy-production"
    echo "   - 分支: ^main$"
    echo "   - 配置文件: deploy/gcp/cloudbuild.yaml"
    echo "   - 替代变量参考: deploy-config.env"
    echo ""
    echo "3. 运行数据库迁移"
    echo "   详见：deploy/gcp/DEPLOYMENT_STEPS.md 第 7 节"
    echo ""
    echo "4. 触发首次部署"
    echo "   git push origin main"
    echo ""
    echo "重要文件："
    echo "  - .env.secrets: 数据库密码（请妥善保管）"
    echo "  - deploy-config.env: 部署配置"
    echo "  - deploy/gcp/DEPLOYMENT_STEPS.md: 详细部署文档"
    echo ""
    print_warn "请确保 .env.secrets 不会被提交到版本控制！"
    echo ""
}

# 主函数
main() {
    echo ""
    print_info "========================================"
    print_info "TMS GCP 部署初始化脚本"
    print_info "========================================"
    echo ""
    
    check_prerequisites
    get_user_input
    setup_project
    enable_apis
    create_cloudsql
    setup_database
    create_secrets
    grant_iam_permissions
    generate_config
    show_next_steps
}

# 运行主函数
main

