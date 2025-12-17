#!/bin/bash
# TMS 端到端健康检查脚本
# 创建时间: 2025-12-05 12:00:00
# 用途: 运行完整的 E2E 健康检查并生成报告

set -e

echo "=========================================="
echo "TMS 端到端健康检查"
echo "=========================================="
echo ""

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 检查环境变量
if [ -z "$BASE_URL" ]; then
  if [ -f .env.e2e ]; then
    echo "加载 .env.e2e 文件..."
    export $(cat .env.e2e | grep -v '^#' | xargs)
  else
    echo -e "${YELLOW}警告: 未设置 BASE_URL，使用默认值 http://localhost:3000${NC}"
    export BASE_URL=http://localhost:3000
  fi
fi

echo "测试环境: $BASE_URL"
echo ""

# 检查 Playwright 是否已安装
if ! command -v npx &> /dev/null; then
  echo -e "${RED}错误: 未找到 npx，请先安装 Node.js${NC}"
  exit 1
fi

# 检查是否已安装 Playwright
if [ ! -d "node_modules/@playwright" ]; then
  echo "安装 Playwright..."
  npm install
  npx playwright install chromium
fi

# 创建必要的目录
mkdir -p test-results
mkdir -p playwright-report
mkdir -p tmp/downloads
mkdir -p tests/e2e/fixtures

# 运行测试
echo "开始运行 E2E 测试..."
echo ""

# 根据参数决定运行模式
MODE=${1:-headless}

if [ "$MODE" = "headed" ]; then
  echo "模式: 可视化模式 (Headed)"
  npx playwright test --headed
elif [ "$MODE" = "ui" ]; then
  echo "模式: UI 模式 (交互式)"
  npx playwright test --ui
elif [ "$MODE" = "debug" ]; then
  echo "模式: 调试模式"
  PWDEBUG=1 npx playwright test
else
  echo "模式: Headless 模式"
  npx playwright test
fi

TEST_EXIT_CODE=$?

echo ""
echo "=========================================="
if [ $TEST_EXIT_CODE -eq 0 ]; then
  echo -e "${GREEN}✓ 所有测试通过！${NC}"
else
  echo -e "${RED}✗ 部分测试失败${NC}"
fi
echo "=========================================="
echo ""

# 生成报告
echo "生成测试报告..."
npx playwright show-report --host 0.0.0.0 --port 9323 > /dev/null 2>&1 &
REPORT_PID=$!

echo ""
echo "测试报告已生成:"
echo "  - HTML 报告: playwright-report/index.html"
echo "  - JSON 结果: test-results.json"
echo ""
echo "查看报告:"
echo "  npx playwright show-report"
echo ""
echo "或访问: http://localhost:9323 (如果服务器已启动)"
echo ""

# 显示测试结果摘要
if [ -f "test-results.json" ]; then
  echo "测试结果摘要:"
  echo "--------------"
  
  TOTAL=$(jq '.stats.total' test-results.json 2>/dev/null || echo "N/A")
  PASSED=$(jq '.stats.expected' test-results.json 2>/dev/null || echo "N/A")
  FAILED=$(jq '.stats.unexpected' test-results.json 2>/dev/null || echo "N/A")
  SKIPPED=$(jq '.stats.skipped' test-results.json 2>/dev/null || echo "N/A")
  
  echo "  总测试数: $TOTAL"
  echo -e "  通过: ${GREEN}$PASSED${NC}"
  echo -e "  失败: ${RED}$FAILED${NC}"
  echo "  跳过: $SKIPPED"
  echo ""
fi

# 如果有失败的测试，显示失败列表
if [ $TEST_EXIT_CODE -ne 0 ]; then
  echo -e "${YELLOW}失败的测试:${NC}"
  npx playwright test --list | grep -E "(failed|error)" || echo "  无"
  echo ""
  echo "查看详细错误信息:"
  echo "  - 查看 playwright-report/index.html"
  echo "  - 查看 test-results/ 目录中的截图和视频"
  echo ""
fi

# 返回测试退出码
exit $TEST_EXIT_CODE

