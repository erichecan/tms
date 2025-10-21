#!/bin/bash
# 数据库初始化Job脚本
# 创建时间: 2025-10-21 16:05:00
# 功能: 通过gcloud将SQL文件导入到Cloud SQL实例

set -e

PROJECT_ID="aponytms"
INSTANCE_NAME="tms-database-toronto"
DATABASE_NAME="tms_platform"
BUCKET_NAME="${PROJECT_ID}-sql-imports"

echo "=================================================="
echo "数据库初始化Job - 开始执行"
echo "=================================================="
echo "项目: ${PROJECT_ID}"
echo "实例: ${INSTANCE_NAME}"
echo "数据库: ${DATABASE_NAME}"
echo "时间: $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# 步骤1: 创建GCS存储桶（如果不存在）
echo "[步骤1/4] 检查并创建GCS存储桶..."
if ! gsutil ls "gs://${BUCKET_NAME}" &>/dev/null; then
    echo "创建存储桶: gs://${BUCKET_NAME}"
    gsutil mb -p "${PROJECT_ID}" -l northamerica-northeast2 "gs://${BUCKET_NAME}"
else
    echo "存储桶已存在: gs://${BUCKET_NAME}"
fi
echo ""

# 步骤2: 上传SQL文件到GCS
echo "[步骤2/6] 上传SQL文件到GCS..."
echo "上传 drop_all_tables.sql..."
gsutil cp drop_all_tables.sql "gs://${BUCKET_NAME}/drop_all_tables.sql"
echo "上传 complete_database_init.sql..."
gsutil cp complete_database_init.sql "gs://${BUCKET_NAME}/complete_database_init.sql"
echo "上传 grant_permissions_fix.sql..."
gsutil cp grant_permissions_fix.sql "gs://${BUCKET_NAME}/grant_permissions_fix.sql"
echo "上传 generate_test_data_with_locations.sql..."
gsutil cp generate_test_data_with_locations.sql "gs://${BUCKET_NAME}/generate_test_data_with_locations.sql"
echo ""

# 步骤3: 清理现有表
echo "[步骤3/6] 清理现有表..."
gcloud sql import sql "${INSTANCE_NAME}" \
    "gs://${BUCKET_NAME}/drop_all_tables.sql" \
    --database="${DATABASE_NAME}" \
    --user=postgres \
    --quiet
echo "✅ 表清理完成"
echo ""

# 步骤4: 导入数据库schema
echo "[步骤4/6] 导入数据库schema..."
gcloud sql import sql "${INSTANCE_NAME}" \
    "gs://${BUCKET_NAME}/complete_database_init.sql" \
    --database="${DATABASE_NAME}" \
    --user=postgres \
    --quiet
echo "✅ Schema导入完成"
echo ""

# 步骤5: 修复权限
echo "[步骤5/6] 修复表所有权和权限..."
gcloud sql import sql "${INSTANCE_NAME}" \
    "gs://${BUCKET_NAME}/grant_permissions_fix.sql" \
    --database="${DATABASE_NAME}" \
    --user=postgres \
    --quiet
echo "✅ 权限修复完成"
echo ""

# 步骤6: 导入测试数据
echo "[步骤6/6] 导入测试数据..."
gcloud sql import sql "${INSTANCE_NAME}" \
    "gs://${BUCKET_NAME}/generate_test_data_with_locations.sql" \
    --database="${DATABASE_NAME}" \
    --user=postgres \
    --quiet
echo "✅ 测试数据导入完成"
echo ""

echo "=================================================="
echo "数据库初始化完成！"
echo "=================================================="
echo "下一步:"
echo "1. 验证数据: 运行 ./verify_database_data.sh"
echo "2. 重新部署后端服务: gcloud run deploy tms-backend ..."
echo "3. 访问前端测试: https://tms-frontend-1038443972557.asia-east2.run.app"
echo ""

