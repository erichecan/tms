# 测试指南
> 创建时间: 2025-11-24T18:35:00Z

本文档说明如何运行测试、验证数据和使用测试工具。

---

## 🚀 快速开始

### 1. 验证 Seed 数据

```bash
# 运行 seed 数据验证
npm run validate:seed
```

这将检查：
- 数据完整性
- 外键关系
- 唯一性约束
- 数据分布

### 2. 运行完整测试套件

```bash
# 执行所有测试
npm run test:full
```

这将：
- 启动本地服务（如果未运行）
- 运行数据库迁移和 seed
- 执行 Playwright 测试
- 收集测试结果和日志
- 生成测试报告

### 3. 运行 Playwright 测试

```bash
cd apps/frontend
npm run test:e2e
```

### 4. 生成测试报告

```bash
# 生成测试报告
npm run test:report
```

---

## 📋 测试文件说明

### Playwright 测试

- `e2e/login.spec.ts` - 登录流程测试
- `e2e/navigation.spec.ts` - 页面导航测试
- `e2e/comprehensive.spec.ts` - 综合错误检测
- `e2e/shipment-create.spec.ts` - 运单创建测试
- `e2e/dispatch-assignment.spec.ts` - 调度分配测试
- `e2e/maps-integration.spec.ts` - Google Maps 集成测试
- `e2e/shipment-status.spec.ts` - 状态流转测试
- `e2e/finance-settlement.spec.ts` - 财务结算测试

### 测试脚本

- `scripts/validate-seed-data.ts` - Seed 数据验证
- `scripts/mcp-test-runner.ts` - Chrome DevTools MCP 测试框架
- `scripts/run-full-test-suite.sh` - 完整测试套件执行
- `scripts/generate-test-report.ts` - 测试报告生成

---

## 🔧 配置

### 环境变量

```bash
# 本地测试
PLAYWRIGHT_BASE_URL=http://localhost:3000

# 远程测试
PLAYWRIGHT_BASE_URL=https://your-app-url.com
```

### Playwright 配置

配置文件: `apps/frontend/playwright.config.ts`

主要设置:
- `baseURL`: 测试目标 URL
- `screenshot`: 失败时自动截图
- `video`: 失败时保留视频
- `trace`: 失败时记录追踪

---

## 📊 测试报告

测试报告保存在 `test-results/reports/` 目录：

- `test-report-{timestamp}.json` - JSON 格式报告
- `test-report-{timestamp}.md` - Markdown 格式报告

报告包含：
- 测试摘要（总数、通过、失败、跳过）
- 详细测试结果
- 问题与建议
- 性能指标

---

## 🐛 故障排除

### 测试失败

1. 检查服务是否运行
2. 检查数据库连接
3. 查看测试日志: `test-results/*.log`
4. 查看截图: `test-results/`

### Seed 数据验证失败

1. 检查数据库连接
2. 运行迁移脚本: `npm run db:migrate`
3. 重新运行 seed: `npm run db:seed`

---

## 📚 相关文档

- [测试实施总结](./docs/TEST_IMPLEMENTATION_SUMMARY.md)
- [测试计划完成报告](./docs/TEST_PLAN_COMPLETION_REPORT.md)
- [数据库迁移指南](./docs/DATABASE_MIGRATION_GUIDE.md)

---

**最后更新**: 2025-11-24T18:35:00Z

