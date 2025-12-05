#!/bin/bash
# 前端构建 API Key 验证脚本
# 创建时间: 2025-12-04T23:00:00
# 用途: 验证前端构建中是否正确注入了 Google Maps API Key

set -e

# 配置
PROJECT_ID="275911787144"
EXPECTED_FRONTEND_KEY="AIzaSyD26kTVaKAlJu3Rc6_bqP9VjLh-HEDmBRs"

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo -e "${BLUE}   前端构建 API Key 验证${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
echo ""

# 检查是否在项目根目录
if [ ! -f "cloudbuild.yaml" ]; then
    echo -e "${RED}❌ 错误: 请在项目根目录运行此脚本${NC}"
    exit 1
fi

# 检查是否存在前端构建目录
if [ ! -d "apps/frontend/dist" ]; then
    echo -e "${YELLOW}⚠️  前端构建目录不存在，开始构建...${NC}"
    echo ""
    
    # 检查是否有 .env.local 文件
    if [ -f ".env.local" ] || [ -f "apps/frontend/.env.local" ]; then
        echo -e "${GREEN}✓ 找到 .env.local 文件${NC}"
    else
        echo -e "${YELLOW}⚠️  未找到 .env.local 文件，使用环境变量${NC}"
        export VITE_GOOGLE_MAPS_API_KEY="$EXPECTED_FRONTEND_KEY"
    fi
    
    cd apps/frontend
    npm run build
    cd ../..
fi

# 检查构建产物
if [ ! -f "apps/frontend/dist/index.html" ]; then
    echo -e "${RED}❌ 错误: 前端构建失败，未找到 index.html${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/2] 检查构建产物中的 API Key...${NC}"

# 在 JavaScript 文件中搜索 API Key（不显示完整 key，只显示前 8 位）
API_KEY_FOUND=false
JS_FILES=$(find apps/frontend/dist -name "*.js" -type f)

for js_file in $JS_FILES; do
    if grep -q "$EXPECTED_FRONTEND_KEY" "$js_file" 2>/dev/null; then
        API_KEY_FOUND=true
        echo -e "${GREEN}✅ 在构建产物中找到 API Key${NC}"
        echo "  文件: $js_file"
        echo "  Key 前 8 位: ${EXPECTED_FRONTEND_KEY:0:8}..."
        break
    fi
done

if [ "$API_KEY_FOUND" = false ]; then
    # 尝试搜索部分 key（可能被编码或混淆）
    KEY_PREFIX="${EXPECTED_FRONTEND_KEY:0:10}"
    for js_file in $JS_FILES; do
        if grep -q "$KEY_PREFIX" "$js_file" 2>/dev/null; then
            API_KEY_FOUND=true
            echo -e "${YELLOW}⚠️  找到部分匹配的 Key（可能已编码）${NC}"
            echo "  文件: $js_file"
            break
        fi
    done
fi

if [ "$API_KEY_FOUND" = false ]; then
    echo -e "${RED}❌ 在构建产物中未找到预期的 API Key${NC}"
    echo "  可能的原因："
    echo "    1. 环境变量 VITE_GOOGLE_MAPS_API_KEY 未设置"
    echo "    2. 构建时未正确注入环境变量"
    echo ""
    echo "  检查方法："
    echo "    - 查看构建日志确认环境变量是否被读取"
    echo "    - 确认 .env.local 文件存在且包含 VITE_GOOGLE_MAPS_API_KEY"
    exit 1
fi

echo ""

# 2. 检查源文件中的环境变量引用
echo -e "${YELLOW}[2/2] 检查源代码中的环境变量引用...${NC}"
if grep -r "VITE_GOOGLE_MAPS_API_KEY" apps/frontend/src --include="*.ts" --include="*.tsx" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ 源代码中正确使用了 VITE_GOOGLE_MAPS_API_KEY${NC}"
    USAGE_COUNT=$(grep -r "VITE_GOOGLE_MAPS_API_KEY" apps/frontend/src --include="*.ts" --include="*.tsx" | wc -l | tr -d ' ')
    echo "  找到 $USAGE_COUNT 处使用"
else
    echo -e "${YELLOW}⚠️  未在源代码中找到 VITE_GOOGLE_MAPS_API_KEY 的使用${NC}"
fi

echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════${NC}"
if [ "$API_KEY_FOUND" = true ]; then
    echo -e "${GREEN}✅ 前端构建验证通过！${NC}"
    echo ""
    echo "注意："
    echo "  - API Key 会暴露在客户端代码中（这是 Google Maps 的标准做法）"
    echo "  - 请确保在 Google Cloud Console 中为前端 API Key 设置了 HTTP referrer 限制"
    exit 0
else
    echo -e "${RED}❌ 前端构建验证未通过${NC}"
    exit 1
fi

