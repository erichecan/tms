#!/bin/bash
# Google Cloud 部署脚本
# 2025-01-27 10:40:00
# 2025-11-24T15:47:20Z Added by Assistant: Free-tier defaults for GCP

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_ID="${PROJECT_ID:-aponytms}"
REGION="${REGION:-us-central1}" # 2025-11-24T15:47:20Z Added by Assistant: align with always-free regions
BACKEND_SERVICE="tms-backend"
FRONTEND_SERVICE="tms-frontend"

echo -e "${GREEN}🚀 开始部署 TMS 应用到 Google Cloud${NC}"

# 检查必要的工具
check_dependencies() {
    echo -e "${YELLOW}📋 检查依赖项...${NC}"
    
    if ! command -v gcloud &> /dev/null; then
        echo -e "${RED}❌ gcloud CLI 未安装，请先安装 Google Cloud SDK${NC}"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        echo -e "${RED}❌ Docker 未安装，请先安装 Docker${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ 依赖项检查完成${NC}"
}

# 设置项目
setup_project() {
    echo -e "${YELLOW}🔧 设置 Google Cloud 项目...${NC}"
    
    gcloud config set project $PROJECT_ID
    
    # 启用必要的 API
    echo -e "${YELLOW}📡 启用必要的 API...${NC}"
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sqladmin.googleapis.com \
        secretmanager.googleapis.com \
        artifactregistry.googleapis.com
}

# 创建 Secret Manager 密钥
create_secrets() {
    echo -e "${YELLOW}🔐 创建 Secret Manager 密钥...${NC}"
    
    # 检查密钥是否已存在
    if gcloud secrets describe database-url &> /dev/null; then
        echo -e "${YELLOW}⚠️  database-url 密钥已存在，跳过创建${NC}"
    else
        echo -e "${YELLOW}📝 请提供数据库连接字符串：${NC}"
        read -s -p "DATABASE_URL: " DATABASE_URL
        echo
        echo -n "$DATABASE_URL" | gcloud secrets create database-url --data-file=-
    fi
    
    if gcloud secrets describe jwt-secret &> /dev/null; then
        echo -e "${YELLOW}⚠️  jwt-secret 密钥已存在，跳过创建${NC}"
    else
        echo -e "${YELLOW}📝 请提供 JWT 密钥：${NC}"
        read -s -p "JWT_SECRET: " JWT_SECRET
        echo
        echo -n "$JWT_SECRET" | gcloud secrets create jwt-secret --data-file=-
    fi
    
    if gcloud secrets describe google-maps-api-key &> /dev/null; then
        echo -e "${YELLOW}⚠️  google-maps-api-key 密钥已存在，跳过创建${NC}"
    else
        echo -n "AIzaSyBrJZAt61Nrlhe-MRY8rmE0D0i9x-0OS28" | gcloud secrets create google-maps-api-key --data-file=-
    fi
}

# 构建和推送后端镜像
build_and_deploy_backend() {
    echo -e "${YELLOW}🏗️  构建和部署后端...${NC}"
    
    # 配置 Docker 认证
    gcloud auth configure-docker
    
    # 构建后端镜像
    echo -e "${YELLOW}📦 构建后端镜像...${NC}"
    docker build --platform linux/amd64 -t gcr.io/$PROJECT_ID/tms-backend:latest -f docker/backend/Dockerfile .
    docker push gcr.io/$PROJECT_ID/tms-backend:latest
    
    # 部署后端
    echo -e "${YELLOW}🚀 部署后端服务到 Cloud Run...${NC}"
    gcloud run deploy $BACKEND_SERVICE \
        --image=gcr.io/$PROJECT_ID/tms-backend:latest \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --set-secrets=DATABASE_URL=database-url:latest,JWT_SECRET=jwt-secret:latest,GOOGLE_MAPS_API_KEY=google-maps-api-key:latest \
        --set-env-vars=NODE_ENV=production,CORS_ORIGIN=https://YOUR_FRONTEND_DOMAIN.com \
        --memory=512Mi \
        --cpu=1 \
        --concurrency=80 \
        --min-instances=0 \
        --max-instances=2 \
        --timeout=180 \
        --ingress=all
        
    # 获取后端服务 URL
    export BACKEND_URL=$(gcloud run services describe $BACKEND_SERVICE --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ 后端服务已部署: $BACKEND_URL${NC}"
}

# 构建和部署前端
build_and_deploy_frontend() {
    echo -e "${YELLOW}🏗️  构建和部署前端...${NC}"
    echo -e "${YELLOW}🔗 使用后端 API 地址: $BACKEND_URL${NC}"

    # 构建前端镜像 (注入后端 URL)
    echo -e "${YELLOW}📦 构建前端镜像...${NC}"
    docker build --platform linux/amd64 \
        --build-arg VITE_API_BASE_URL=$BACKEND_URL \
        -t gcr.io/$PROJECT_ID/tms-frontend:latest \
        -f docker/frontend/Dockerfile .
    docker push gcr.io/$PROJECT_ID/tms-frontend:latest
    
    # 部署前端
    echo -e "${YELLOW}🚀 部署前端服务到 Cloud Run...${NC}"
    gcloud run deploy $FRONTEND_SERVICE \
        --image=gcr.io/$PROJECT_ID/tms-frontend:latest \
        --region=$REGION \
        --platform=managed \
        --allow-unauthenticated \
        --set-env-vars=VITE_API_BASE_URL=$BACKEND_URL \
        --memory=256Mi \
        --cpu=1 \
        --concurrency=150 \
        --min-instances=0 \
        --max-instances=2 \
        --timeout=120 \
        --ingress=all
    
    # 获取前端服务 URL
    export FRONTEND_URL=$(gcloud run services describe $FRONTEND_SERVICE --region=$REGION --format="value(status.url)")
    echo -e "${GREEN}✅ 前端服务已部署: $FRONTEND_URL${NC}"
}

# 显示部署结果
show_results() {
    echo -e "${GREEN}🎉 部署完成！${NC}"
    echo -e "${YELLOW}📋 服务信息：${NC}"
    echo -e "   后端服务: $BACKEND_URL"
    echo -e "   前端服务: $FRONTEND_URL"
    echo -e "${YELLOW}📝 后续步骤：${NC}"
    echo -e "   1. 更新 CORS_ORIGIN 环境变量为前端 URL"
    echo -e "   2. 配置自定义域名（可选）"
    echo -e "   3. 设置数据库迁移"
    echo -e "   4. 配置监控和日志"
}

# 主函数
main() {
    check_dependencies
    setup_project
    # create_secrets
    build_and_deploy_backend
    build_and_deploy_frontend
    show_results
}

# 运行主函数
main "$@"
