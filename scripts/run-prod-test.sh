#!/bin/bash
# 生产环境测试运行脚本
# 创建时间: 2025-12-05 12:00:00

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== 生产环境测试配置检查 ===${NC}"

# 检查环境变量文件
if [ -f .env.prod.test ]; then
    echo -e "${GREEN}✅ 找到配置文件: .env.prod.test${NC}"
    source .env.prod.test
else
    echo -e "${RED}❌ 未找到配置文件 .env.prod.test${NC}"
    echo "请先运行配置脚本或手动创建配置文件"
    exit 1
fi

# 检查必需的环境变量
if [ -z "$PROD_BASE_URL" ] || [ "$PROD_BASE_URL" = "https://your-production-domain.com" ]; then
    echo -e "${RED}❌ PROD_BASE_URL 未配置或使用默认值${NC}"
    exit 1
fi

if [ -z "$PROD_TEST_USER" ] || [ "$PROD_TEST_USER" = "your-test-user@example.com" ]; then
    echo -e "${RED}❌ PROD_TEST_USER 未配置或使用默认值${NC}"
    exit 1
fi

if [ -z "$PROD_TEST_PASSWORD" ] || [ "$PROD_TEST_PASSWORD" = "your-password-here" ]; then
    echo -e "${RED}❌ PROD_TEST_PASSWORD 未配置或使用默认值${NC}"
    exit 1
fi

echo -e "${GREEN}✅ 环境变量配置检查通过${NC}"
echo ""
echo -e "${YELLOW}配置信息:${NC}"
echo "  生产环境 URL: $PROD_BASE_URL"
echo "  测试账号: $PROD_TEST_USER"
echo ""

# 导出环境变量供 Playwright 使用
export PROD_BASE_URL
export PROD_TEST_USER
export PROD_TEST_PASSWORD
export RULE_ENGINE_URL
export GOOGLE_MAPS_EXPECTED_ENDPOINTS

# 运行测试
echo -e "${YELLOW}=== 开始运行生产环境测试 ===${NC}"
echo ""

# 检查是否指定了测试文件
if [ -z "$1" ]; then
    # 默认运行新的计费引擎与 Google Maps 集成测试
    TEST_FILE="tests/e2e/prod/pricing-google-maps-integration.spec.ts"
else
    TEST_FILE="$1"
fi

# 检查是否使用 headed 模式
if [ "$2" = "--headed" ] || [ "$2" = "-h" ]; then
    HEADED_FLAG="--headed"
else
    HEADED_FLAG=""
fi

echo -e "${YELLOW}运行测试: $TEST_FILE${NC}"
echo ""

npx playwright test "$TEST_FILE" --project=prod $HEADED_FLAG

echo ""
echo -e "${GREEN}=== 测试完成 ===${NC}"
echo "查看报告: npx playwright show-report"

