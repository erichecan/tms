# TMS 端到端健康检查文档

## 概述

本文档说明如何使用 Playwright 对 TMS 网站进行端到端健康检查，确保基本流程通畅，适合在联调前进行快速验证。

## 快速开始

### 1. 环境准备

```bash
# 安装依赖
npm install

# 安装 Playwright 浏览器
npx playwright install chromium
```

### 2. 配置环境变量

创建 `.env.e2e` 文件（参考 `.env.e2e.example`）：

```bash
BASE_URL=http://localhost:3000
E2E_USERNAME=admin@example.com
E2E_PASSWORD=admin123
```

### 3. 运行测试

```bash
# Headless 模式（默认）
npm run test:e2e

# 可视化模式
npm run test:e2e:headed

# UI 模式（交互式）
npm run test:e2e:ui

# 使用健康检查脚本
npm run test:e2e:health-check
```

## 测试覆盖范围

### ✅ 1. 登录与权限
- 登录成功流程
- 错误凭据处理
- 权限验证
- 未登录访问保护
- 登录状态保持

### ✅ 2. 主导航与路由
- 主要页面可访问（Dashboard、运单、客户、财务等）
- 导航菜单可点击
- 路由跳转正常
- 面包屑导航
- 页面加载状态

### ✅ 3. 列表查询与筛选
- 搜索功能
- 筛选功能
- 分页功能
- 排序功能
- 空状态显示

### ✅ 4. 详情页
- 从列表进入详情
- 核心字段显示（订单号、状态、时间线）
- Tab 切换功能
- 面包屑返回列表

### ✅ 5. 创建/编辑流程
- 新建运单（填写表单、提交、成功提示）
- 编辑运单（修改字段、保存）
- 状态流转（推进订单状态）
- 表单验证（必填字段检查）
- 取消操作

### ✅ 6. 上传与下载
- 上传图片附件
- 上传 PDF 附件
- 导出 CSV
- 下载对账单
- 附件列表显示
- 删除附件

### ✅ 7. 错误处理
- 404 页面渲染
- 500 错误处理
- 网络错误处理
- 表单错误提示
- 权限错误（403）

### ✅ 8. 全局搜索
- 输入订单号搜索
- 搜索结果列表
- 点击结果跳转详情
- 清空搜索

### ✅ 9. 退出登录
- 退出功能
- 退出后访问受限页面重定向
- 清除认证信息
- 重新登录

## 测试报告

### 查看 HTML 报告

```bash
npm run test:e2e:report
```

报告位置：`playwright-report/index.html`

### 失败截图和视频

测试失败时，自动保存到：
- 截图：`test-results/`
- 视频：`test-results/`
- Trace：`test-results/`

### 查看 Trace

```bash
npx playwright show-trace test-results/trace.zip
```

## 测试配置

### Playwright 配置

配置文件：`playwright.config.ts`

主要配置项：
- 测试目录：`./tests/e2e`
- 超时时间：60 秒
- 重试次数：2 次
- 浏览器：Chromium（默认）
- 报告格式：HTML、JSON、JUnit

### 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `BASE_URL` | 测试环境 URL | `http://localhost:3000` |
| `E2E_USERNAME` | 测试账号邮箱 | - |
| `E2E_PASSWORD` | 测试账号密码 | - |
| `DOWNLOAD_DIR` | 下载文件目录 | `./tmp/downloads` |

## CI 集成

### GitHub Actions 示例

```yaml
name: E2E Health Check

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps chromium
      - name: Run E2E tests
        env:
          BASE_URL: ${{ secrets.E2E_BASE_URL }}
          E2E_USERNAME: ${{ secrets.E2E_USERNAME }}
          E2E_PASSWORD: ${{ secrets.E2E_PASSWORD }}
        run: npm run test:e2e
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 30
```

## 调试技巧

### 1. 使用 Playwright Inspector

```bash
npm run test:e2e:debug
```

### 2. 慢速运行

```bash
npx playwright test --slow-mo=1000
```

### 3. 运行特定测试

```bash
# 运行特定文件
npx playwright test tests/e2e/auth.spec.ts

# 运行特定测试用例
npx playwright test -g "登录成功"
```

### 4. 查看控制台日志

在测试代码中已包含控制台错误监听，失败时会自动记录。

## 最佳实践

1. **使用 data-testid**: 优先使用 `data-testid` 属性定位元素
2. **等待策略**: 使用 `waitForLoadState` 和 `waitForSelector` 确保元素已加载
3. **错误处理**: 使用 `test.skip()` 跳过不可用的功能
4. **数据隔离**: 每个测试使用独立的测试数据
5. **清理资源**: 测试结束后清理创建的数据

## 常见问题

### Q: 测试在 CI 环境中失败，但本地通过？

**A:** 检查：
- 环境变量是否正确设置
- 网络超时设置是否足够
- 浏览器是否已正确安装
- 服务器是否已启动并可访问

### Q: 如何调试失败的测试？

**A:** 
1. 查看失败截图和视频（`test-results/`）
2. 使用 `--headed` 模式运行
3. 使用 Playwright Inspector (`PWDEBUG=1`)
4. 检查 Trace 文件

### Q: 测试运行太慢？

**A:**
- 减少测试用例数量
- 使用 `--workers=1` 限制并发
- 优化等待时间
- 使用 `test.skip()` 跳过非关键测试

### Q: 如何添加新的测试用例？

**A:**
1. 在 `tests/e2e/` 目录创建新的 `.spec.ts` 文件
2. 使用 `test.describe` 组织测试
3. 使用辅助函数（`login`, `waitForPageLoad` 等）
4. 运行测试验证

## 维护与更新

- 定期更新测试用例以匹配 UI 变化
- 添加新功能的测试用例
- 修复脆弱的测试选择器
- 优化测试执行时间
- 保持测试文档更新

## 相关文档

- [测试文件 README](./tests/e2e/README.md)
- [Playwright 官方文档](https://playwright.dev/)
- [项目 README](../README.md)

## 联系方式

如有问题或建议，请联系测试团队或提交 Issue。

