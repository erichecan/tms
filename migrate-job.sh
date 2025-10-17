#!/bin/sh
# 数据库迁移 Job

set -e

echo "Starting database migration..."

cd /app

# 运行迁移
npm run db:migrate

# 运行种子数据
npm run db:seed

echo "Database migration completed successfully!"

