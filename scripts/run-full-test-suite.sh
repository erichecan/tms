#!/bin/bash
# 完整测试套件执行脚本
# 创建时间: 2025-11-24T17:40:00Z
# 目的: 自动化执行所有测试并收集结果

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TEST_RESULTS_DIR="${PROJECT_ROOT}/test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
TEST_REPORT_FILE="${TEST_RESULTS_DIR}/test-report-${TIMESTAMP}.md"

echo -e "${GREEN}🚀 开始执行完整测试套件${NC}\n"

# 创建测试结果目录
mkdir -p "${TEST_RESULTS_DIR}"

# 初始化测试报告
cat > "${TEST_REPORT_FILE}" << EOF
# 测试执行报告

**执行时间**: $(date)
**项目根目录**: ${PROJECT_ROOT}

---

## 测试执行摘要

EOF

# 1. 启动本地服务（如果未运行）
echo -e "${YELLOW}📋 步骤 1: 检查本地服务状态...${NC}"
if ! docker-compose ps | grep -q "tms-backend.*Up"; then
    echo -e "${YELLOW}启动 Docker Compose 服务...${NC}"
    cd "${PROJECT_ROOT}"
    docker-compose up -d
    echo "等待服务启动..."
    sleep 10
else
    echo -e "${GREEN}✅ 服务已在运行${NC}"
fi

# 2. 运行数据库迁移和 seed
echo -e "\n${YELLOW}📋 步骤 2: 运行数据库迁移和 seed...${NC}"
cd "${PROJECT_ROOT}"
npm run db:migrate 2>&1 | tee -a "${TEST_RESULTS_DIR}/migration-${TIMESTAMP}.log" || {
    echo -e "${RED}❌ 数据库迁移失败${NC}" | tee -a "${TEST_REPORT_FILE}"
    exit 1
}

npm run db:seed 2>&1 | tee -a "${TEST_RESULTS_DIR}/seed-${TIMESTAMP}.log" || {
    echo -e "${RED}❌ Seed 数据填充失败${NC}" | tee -a "${TEST_REPORT_FILE}"
    exit 1
}

# 3. 验证 seed 数据
echo -e "\n${YELLOW}📋 步骤 3: 验证 seed 数据...${NC}"
cd "${PROJECT_ROOT}"
npx ts-node scripts/validate-seed-data.ts 2>&1 | tee -a "${TEST_RESULTS_DIR}/seed-validation-${TIMESTAMP}.log" || {
    echo -e "${RED}❌ Seed 数据验证失败${NC}" | tee -a "${TEST_REPORT_FILE}"
}

# 4. 运行 Playwright 测试
echo -e "\n${YELLOW}📋 步骤 4: 运行 Playwright E2E 测试...${NC}"
cd "${PROJECT_ROOT}/apps/frontend"
npm run test:e2e 2>&1 | tee -a "${TEST_RESULTS_DIR}/playwright-${TIMESTAMP}.log" || {
    echo -e "${RED}❌ Playwright 测试失败${NC}" | tee -a "${TEST_REPORT_FILE}"
}

# 5. 运行类型检查
echo -e "\n${YELLOW}📋 步骤 5: 运行类型检查...${NC}"
cd "${PROJECT_ROOT}"
npm run lint 2>&1 | tee -a "${TEST_RESULTS_DIR}/lint-${TIMESTAMP}.log" || {
    echo -e "${RED}❌ 类型检查失败${NC}" | tee -a "${TEST_REPORT_FILE}"
}

# 6. 运行单元测试
echo -e "\n${YELLOW}📋 步骤 6: 运行单元测试...${NC}"
cd "${PROJECT_ROOT}"
npm run test 2>&1 | tee -a "${TEST_RESULTS_DIR}/unit-tests-${TIMESTAMP}.log" || {
    echo -e "${RED}❌ 单元测试失败${NC}" | tee -a "${TEST_REPORT_FILE}"
}

# 7. 收集测试结果
echo -e "\n${YELLOW}📋 步骤 7: 收集测试结果...${NC}"

# 统计 Playwright 测试结果
if [ -f "${PROJECT_ROOT}/apps/frontend/test-results.json" ]; then
    PLAYWRIGHT_PASSED=$(jq '.stats.expected' "${PROJECT_ROOT}/apps/frontend/test-results.json" 2>/dev/null || echo "N/A")
    PLAYWRIGHT_FAILED=$(jq '.stats.unexpected' "${PROJECT_ROOT}/apps/frontend/test-results.json" 2>/dev/null || echo "N/A")
    cat >> "${TEST_REPORT_FILE}" << EOF

## Playwright 测试结果

- 通过: ${PLAYWRIGHT_PASSED}
- 失败: ${PLAYWRIGHT_FAILED}

EOF
fi

# 生成最终报告
cat >> "${TEST_REPORT_FILE}" << EOF

## 测试日志文件

- 数据库迁移: \`migration-${TIMESTAMP}.log\`
- Seed 数据: \`seed-${TIMESTAMP}.log\`
- Seed 验证: \`seed-validation-${TIMESTAMP}.log\`
- Playwright 测试: \`playwright-${TIMESTAMP}.log\`
- 类型检查: \`lint-${TIMESTAMP}.log\`
- 单元测试: \`unit-tests-${TIMESTAMP}.log\`

## 截图和视频

测试失败时的截图和视频保存在: \`${PROJECT_ROOT}/apps/frontend/test-results/\`

---

**报告生成时间**: $(date)
EOF

echo -e "\n${GREEN}✅ 测试套件执行完成！${NC}"
echo -e "${GREEN}📄 测试报告: ${TEST_REPORT_FILE}${NC}\n"

