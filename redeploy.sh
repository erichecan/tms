#!/bin/bash
# TMS 重新部署脚本
# 使用 erichecan@gmail.com 账户

echo "=== TMS 重新部署到个人 Google Cloud 项目 ==="

# 检查认证
echo "1. 检查认证状态..."
gcloud auth list

# 检查项目
echo "2. 检查项目..."
gcloud projects list

# 设置项目（如果需要）
read -p "请输入项目 ID（或按回车使用当前项目）: " PROJECT_ID
if [ -n "$PROJECT_ID" ]; then
    gcloud config set project $PROJECT_ID
fi

echo "3. 当前项目: $(gcloud config get-value project)"

# 启用 API
echo "4. 启用必要的 API..."
gcloud services enable \
    cloudbuild.googleapis.com \
    run.googleapis.com \
    sqladmin.googleapis.com \
    secretmanager.googleapis.com \
    artifactregistry.googleapis.com

# 检查现有资源
echo "5. 检查现有 Cloud Run 服务..."
gcloud run services list

echo "6. 检查现有 Cloud SQL 实例..."
gcloud sql instances list

echo "=== 重新部署准备完成 ==="
echo "请确认项目信息后，我们将继续部署..."
