#!/bin/bash
# 验证数据库数据脚本
# 创建时间: 2025-10-21 16:25:00

set -e

PROJECT_ID="aponytms"
INSTANCE_NAME="tms-database-toronto"
DATABASE_NAME="tms_platform"
BUCKET_NAME="${PROJECT_ID}-sql-imports"

echo "=================================================="
echo "验证数据库数据"
echo "=================================================="

# 上传验证SQL到GCS
echo "上传验证SQL..."
gsutil cp check_database_data.sql "gs://${BUCKET_NAME}/check_database_data.sql"

# 执行验证
echo "执行数据验证..."
gcloud sql import sql "${INSTANCE_NAME}" \
    "gs://${BUCKET_NAME}/check_database_data.sql" \
    --database="${DATABASE_NAME}" \
    --user=postgres \
    --quiet

echo ""
echo "✅ 数据验证完成！"
echo "每个表应该有10条测试数据"

