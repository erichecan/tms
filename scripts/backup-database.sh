#!/bin/bash
# 数据库备份脚本
# 创建时间: 2025-09-26 15:58:00

set -e

# 配置
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="tms_backup_${TIMESTAMP}.sql"

# 创建备份目录
mkdir -p "$BACKUP_DIR"

echo "开始备份数据库..."
echo "备份文件: $BACKUP_DIR/$BACKUP_FILE"

# 执行完整备份
docker exec tms-postgres pg_dump -U tms_user -d tms_platform > "$BACKUP_DIR/$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库备份成功: $BACKUP_DIR/$BACKUP_FILE"
    
    # 压缩备份文件
    gzip "$BACKUP_DIR/$BACKUP_FILE"
    echo "✅ 备份文件已压缩: $BACKUP_DIR/$BACKUP_FILE.gz"
    
    # 显示备份文件大小
    ls -lh "$BACKUP_DIR/$BACKUP_FILE.gz"
else
    echo "❌ 数据库备份失败"
    exit 1
fi
