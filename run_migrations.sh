#!/bin/bash

# 数据库迁移执行脚本
# 创建时间: 2025-10-17 23:15:00

set -e

PROJECT_ID="aponytms"
BUCKET_NAME="${PROJECT_ID}-sql-imports"
INSTANCE_NAME="tms-database-toronto"
DATABASE_NAME="tms_db"

echo "🔄 Starting database migrations..."

# 1. 创建 Cloud Storage bucket（如果不存在）
echo "📦 Checking Cloud Storage bucket..."
if ! gsutil ls -b gs://${BUCKET_NAME} > /dev/null 2>&1; then
    echo "Creating bucket gs://${BUCKET_NAME}..."
    gsutil mb -p ${PROJECT_ID} -l northamerica-northeast2 gs://${BUCKET_NAME}
fi

# 2. 上传迁移脚本到 Cloud Storage
echo "⬆️  Uploading migration scripts to Cloud Storage..."
gsutil cp database_migrations/001_add_location_tracking.sql gs://${BUCKET_NAME}/001_add_location_tracking.sql
gsutil cp database_migrations/002_generate_test_data.sql gs://${BUCKET_NAME}/002_generate_test_data.sql

# 3. 执行第一个迁移（添加位置跟踪字段）
echo "🗄️  Running migration 001: Add location tracking..."
gcloud sql import sql ${INSTANCE_NAME} \
    gs://${BUCKET_NAME}/001_add_location_tracking.sql \
    --database=${DATABASE_NAME} \
    --quiet

echo "✅ Migration 001 completed!"

# 4. 执行第二个迁移（生成测试数据）
echo "🗄️  Running migration 002: Generate test data..."
gcloud sql import sql ${INSTANCE_NAME} \
    gs://${BUCKET_NAME}/002_generate_test_data.sql \
    --database=${DATABASE_NAME} \
    --quiet

echo "✅ Migration 002 completed!"

# 5. 清理
echo "🧹 Cleaning up..."
gsutil rm gs://${BUCKET_NAME}/001_add_location_tracking.sql
gsutil rm gs://${BUCKET_NAME}/002_generate_test_data.sql

echo "✅ All migrations completed successfully!"
echo ""
echo "📊 Database is now ready with:"
echo "   - Location tracking fields added to vehicles, drivers, trips"
echo "   - Location history table created"
echo "   - 10 test records generated for all tables"
echo "   - Real Toronto coordinates for all locations"

