#!/bin/bash
# 开发环境快速设置脚本
# 创建时间: 2025-09-26 15:58:00

set -e

echo "🚀 设置 TMS 开发环境..."

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker 未运行，请先启动 Docker"
    exit 1
fi

# 检查是否存在 .env 文件
if [ ! -f ".env" ]; then
    echo "📝 创建 .env 文件..."
    cp env.example .env
    echo "✅ .env 文件已创建"
fi

# 启动数据库服务
echo "🐘 启动 PostgreSQL 和 Redis..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 检查数据库是否就绪
echo "🔍 检查数据库连接..."
if docker exec tms-postgres pg_isready -U tms_user -d tms_platform > /dev/null 2>&1; then
    echo "✅ 数据库连接正常"
else
    echo "❌ 数据库连接失败"
    exit 1
fi

# 检查是否需要恢复数据
if [ -d "backups" ] && [ "$(ls -A backups/*.sql.gz 2>/dev/null)" ]; then
    echo "📦 发现备份文件，是否要恢复数据？"
    echo "备份文件列表："
    ls -la backups/*.sql.gz 2>/dev/null | head -5
    
    read -p "是否恢复最新的备份？(y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        LATEST_BACKUP=$(ls -t backups/*.sql.gz 2>/dev/null | head -1)
        if [ -n "$LATEST_BACKUP" ]; then
            echo "🔄 恢复备份: $LATEST_BACKUP"
            ./scripts/restore-database.sh "$LATEST_BACKUP"
        fi
    fi
fi

# 启动后端服务
echo "🔧 启动后端服务..."
docker-compose up -d backend

# 等待后端启动
echo "⏳ 等待后端服务启动..."
sleep 5

# 检查后端健康状态
echo "🔍 检查后端服务..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✅ 后端服务运行正常"
else
    echo "❌ 后端服务启动失败"
    echo "查看日志: docker logs tms-backend"
fi

# 启动前端服务
echo "🌐 启动前端服务..."
docker-compose up -d frontend

echo ""
echo "🎉 开发环境设置完成！"
echo ""
echo "服务地址："
echo "  前端: http://localhost:3000"
echo "  后端: http://localhost:8000"
echo "  健康检查: http://localhost:8000/health"
echo ""
echo "数据库信息："
echo "  PostgreSQL: localhost:5432"
echo "  Redis: localhost:6379"
echo ""
echo "常用命令："
echo "  查看日志: docker-compose logs -f [service]"
echo "  停止服务: docker-compose down"
echo "  备份数据: ./scripts/backup-database.sh"
echo "  恢复数据: ./scripts/restore-database.sh <backup_file>"
