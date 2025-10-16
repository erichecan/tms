#!/bin/bash
# TMS 个人项目部署脚本
# 项目: aponytms (1038443972557)
# 账户: erichecan@gmail.com

set -e

echo "=== TMS 个人项目部署脚本 ==="
echo "项目: aponytms"
echo "账户: erichecan@gmail.com"
echo ""

# 检查认证
echo "1. 检查认证状态..."
gcloud auth list

# 确认项目
echo "2. 确认项目..."
gcloud config get-value project

# 创建 Cloud SQL 实例
echo "3. 创建 Cloud SQL PostgreSQL 实例..."
gcloud sql instances create tms-database \
    --database-version=POSTGRES_15 \
    --tier=db-f1-micro \
    --region=asia-east2 \
    --storage-type=SSD \
    --storage-size=10GB \
    --storage-auto-increase \
    --backup \
    --network=default \
    --no-assign-ip \
    --quiet

# 创建数据库
echo "4. 创建数据库..."
gcloud sql databases create tms_platform --instance=tms-database

# 创建数据库用户
echo "5. 创建数据库用户..."
DB_PASSWORD=$(openssl rand -base64 32)
gcloud sql users create tms_user \
    --instance=tms-database \
    --password="$DB_PASSWORD"

# 配置 Secret Manager
echo "6. 配置 Secret Manager..."
echo "$DB_PASSWORD" | gcloud secrets create db-password --data-file=-
echo "your-jwt-secret-key-$(openssl rand -hex 32)" | gcloud secrets create jwt-secret --data-file=-
echo "your-google-maps-api-key" | gcloud secrets create google-maps-api-key --data-file=-

# 获取 Cloud SQL 连接名称
echo "7. 获取 Cloud SQL 连接信息..."
INSTANCE_CONNECTION_NAME=$(gcloud sql instances describe tms-database --format="value(connectionName)")
echo "Cloud SQL 连接名称: $INSTANCE_CONNECTION_NAME"

# 创建 Cloud Build 触发器
echo "8. 创建 Cloud Build 触发器..."
gcloud builds triggers create github \
    --repo-name=tms \
    --repo-owner=erichecan \
    --branch-pattern="^main$" \
    --build-config=deploy/gcp/cloudbuild.yaml \
    --name=tms-backend-trigger \
    --description="TMS Backend Deployment" \
    --substitutions=_REGION=asia-east2,_CLOUDSQL_INSTANCE="$INSTANCE_CONNECTION_NAME"

gcloud builds triggers create github \
    --repo-name=tms \
    --repo-owner=erichecan \
    --branch-pattern="^main$" \
    --build-config=deploy/gcp/cloudbuild.yaml \
    --name=tms-frontend-trigger \
    --description="TMS Frontend Deployment" \
    --substitutions=_REGION=asia-east2,_CLOUDSQL_INSTANCE="$INSTANCE_CONNECTION_NAME"

echo ""
echo "=== 部署配置完成 ==="
echo "现在可以推送代码触发部署："
echo "git add ."
echo "git commit -m 'deploy to personal project'"
echo "git push origin main"
echo ""
echo "部署完成后，服务将自动配置为公开访问！"
