#!/bin/bash
# 数据库恢复脚本
# 创建时间: 2025-09-26 15:58:00

set -e

# 检查参数
if [ $# -eq 0 ]; then
    echo "用法: $0 <备份文件路径>"
    echo "示例: $0 ./backups/tms_backup_20250926_155800.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"

# 检查备份文件是否存在
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ 备份文件不存在: $BACKUP_FILE"
    exit 1
fi

echo "开始恢复数据库..."
echo "备份文件: $BACKUP_FILE"

# 检查数据库容器是否运行
if ! docker ps | grep -q tms-postgres; then
    echo "❌ PostgreSQL 容器未运行，请先启动: docker-compose up -d postgres"
    exit 1
fi

# 如果是压缩文件，先解压
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "解压备份文件..."
    TEMP_FILE="/tmp/tms_restore_$(date +%s).sql"
    gunzip -c "$BACKUP_FILE" > "$TEMP_FILE"
    BACKUP_FILE="$TEMP_FILE"
fi

# 执行恢复
echo "正在恢复数据库..."
docker exec -i tms-postgres psql -U tms_user -d tms_platform < "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ 数据库恢复成功"
    
    # 清理临时文件
    if [[ "$1" == *.gz ]]; then
        rm -f "$TEMP_FILE"
    fi
else
    echo "❌ 数据库恢复失败"
    exit 1
fi
