#!/bin/bash

# TMS SaaS平台快速启动脚本
# 创建时间: 2025-01-27 15:30:45

set -e

echo "🚀 TMS SaaS平台快速启动脚本"
echo "================================"

# 检查Node.js版本
echo "📋 检查环境依赖..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装 Node.js 18+"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 版本过低，需要 18+，当前版本: $(node -v)"
    exit 1
fi

echo "✅ Node.js 版本: $(node -v)"

# 检查Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker 未安装，请先安装 Docker"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose 未安装，请先安装 Docker Compose"
    exit 1
fi

echo "✅ Docker 版本: $(docker --version)"
echo "✅ Docker Compose 版本: $(docker-compose --version)"

# 安装依赖
echo ""
echo "📦 安装项目依赖..."
npm install

# 构建共享包
echo ""
echo "🔨 构建共享包..."
cd packages/shared-types && npm run build && cd ../..
cd packages/ui-components && npm run build && cd ../..
cd packages/utils && npm run build && cd ../..

# 创建环境配置文件
echo ""
echo "⚙️  创建环境配置..."
if [ ! -f .env ]; then
    cp env.example .env
    echo "✅ 已创建 .env 文件，请根据需要修改配置"
else
    echo "✅ .env 文件已存在"
fi

# 启动数据库服务
echo ""
echo "🗄️  启动数据库服务..."
docker-compose up -d postgres redis

# 等待数据库启动
echo "⏳ 等待数据库启动..."
sleep 10

# 运行数据库迁移
echo ""
echo "🔄 运行数据库迁移..."
cd apps/backend
npm run db:migrate
cd ../..

# 构建后端
echo ""
echo "🔨 构建后端服务..."
cd apps/backend && npm run build && cd ../..

# 构建前端
echo ""
echo "🔨 构建前端应用..."
cd apps/frontend && npm run build && cd ../..

echo ""
echo "🎉 设置完成！"
echo ""
echo "📋 下一步操作："
echo "1. 修改 .env 文件中的配置（如需要）"
echo "2. 启动开发环境："
echo "   npm run dev"
echo ""
echo "3. 或者启动生产环境："
echo "   docker-compose up -d"
echo ""
echo "🌐 访问地址："
echo "   前端: http://localhost:3000"
echo "   后端API: http://localhost:8000"
echo "   健康检查: http://localhost:8000/health"
echo ""
echo "👤 默认登录信息："
echo "   邮箱: admin@demo.tms-platform.com"
echo "   密码: password"
echo ""
echo "📚 更多信息请查看 README.md"
