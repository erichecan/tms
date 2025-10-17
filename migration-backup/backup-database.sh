#!/bin/bash
# 数据库备份脚本 - 迁移到多伦多区域
# 创建时间: 2025-10-17T14:45:00

set -e

# 配置
PROJECT_ID="aponytms"
INSTANCE_NAME="tms-database"
REGION="asia-east2"
BACKUP_DIR="/Users/apony-it/Desktop/tms/migration-backup"
BACKUP_FILE="$BACKUP_DIR/tms-db-backup-$(date +%Y%m%d-%H%M%S).sql"

echo "🔄 开始备份数据库..."
echo "项目: $PROJECT_ID"
echo "实例: $INSTANCE_NAME"
echo "备份文件: $BACKUP_FILE"

# 方法 1: 使用 gcloud sql export (需要 Cloud Storage bucket)
# 如果有可用的 bucket，使用这个方法
create_bucket_backup() {
    BUCKET_NAME="${PROJECT_ID}-migration-backup"
    
    # 创建 bucket（如果不存在）
    gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$BUCKET_NAME/ 2>/dev/null || true
    
    # 授予 Cloud SQL 服务账号权限
    SERVICE_ACCOUNT=$(gcloud sql instances describe $INSTANCE_NAME --format="value(serviceAccountEmailAddress)")
    gsutil iam ch serviceAccount:${SERVICE_ACCOUNT}:objectAdmin gs://$BUCKET_NAME/
    
    # 导出数据库
    gcloud sql export sql $INSTANCE_NAME gs://$BUCKET_NAME/backup-$(date +%Y%m%d-%H%M%S).sql \
        --database=tms_db
    
    echo "✅ 备份已保存到 Cloud Storage: gs://$BUCKET_NAME/"
}

# 方法 2: 使用 Cloud SQL Proxy + pg_dump (本地备份)
local_backup() {
    echo "📦 使用本地备份方法..."
    
    # 启动 Cloud SQL Proxy（在后台）
    ./cloud-sql-proxy --port 5433 ${PROJECT_ID}:${REGION}:${INSTANCE_NAME} &
    PROXY_PID=$!
    
    echo "⏳ 等待 Cloud SQL Proxy 启动..."
    sleep 5
    
    # 使用 pg_dump 备份（需要数据库密码）
    echo "📥 正在导出数据库..."
    echo "请输入数据库密码:"
    
    PGPASSWORD="" pg_dump -h localhost -p 5433 -U postgres -d tms_db > "$BACKUP_FILE"
    
    # 停止 Cloud SQL Proxy
    kill $PROXY_PID
    
    echo "✅ 备份完成: $BACKUP_FILE"
    echo "📊 备份文件大小: $(du -h $BACKUP_FILE | cut -f1)"
}

# 检查是否可以使用 Cloud Storage 方法
if gsutil ls gs://${PROJECT_ID}-migration-backup/ 2>/dev/null; then
    echo "使用 Cloud Storage 备份方法"
    create_bucket_backup
else
    echo "使用本地备份方法"
    echo "⚠️  注意：这需要 cloud-sql-proxy 和 pg_dump 工具"
    # local_backup
    echo "❌ 建议先创建 Cloud Storage bucket 进行备份"
fi

