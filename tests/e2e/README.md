# TMS 端到端健康检查测试

## 概述

本目录包含 TMS 网站的端到端健康检查测试套件，使用 Playwright 编写。测试覆盖登录、导航、列表查询、详情查看、创建/编辑、文件上传下载、权限验证、错误处理等关键业务流程。

## 测试文件结构

```
tests/e2e/
├── README.md                 # 本文档
├── utils/                    # 测试辅助函数
│   ├── auth.ts              # 登录/登出辅助函数
│   └── helpers.ts           # 通用工具函数
├── fixtures/                 # 测试数据文件（需要创建）
│   ├── test-image.jpg       # 测试图片
│   └── test-document.pdf    # 测试 PDF
├── auth.spec.ts             # 登录与权限测试
├── navigation.spec.ts       # 主导航与路由测试
├── list-query.spec.ts       # 列表查询与筛选测试
├── detail.spec.ts           # 详情页测试
├── crud.spec.ts             # 创建/编辑流程测试
├── upload-download.spec.ts  # 上传下载测试
├── error-handling.spec.ts   # 错误处理测试
├── search-global.spec.ts    # 全局搜索测试
└── logout.spec.ts           # 退出登录测试
```

## 环境配置

### 1. 安装依赖

```bash
npm install
```

### 2. 安装 Playwright 浏览器

```bash
npx playwright install
```

### 3. 配置环境变量

复制环境变量示例文件并填入实际值：

```bash
cp .env.e2e.example .env.e2e
```

编辑 `.env.e2e` 文件，设置：
- `BASE_URL`: 测试环境的基础 URL
- `E2E_USERNAME`: 测试账号邮箱
- `E2E_PASSWORD`: 测试账号密码

## 运行测试

### 本地运行（Headless 模式）

```bash
npm run test:e2e
```

### 可视化运行（Headed 模式）

```bash
npx playwright test --headed
```

### 运行特定测试文件

```bash
npx playwright test tests/e2e/auth.spec.ts
```

### 运行特定测试用例

```bash
npx playwright test -g "登录成功并进入 Dashboard"
```

### 使用 UI 模式运行（交互式）

```bash
npm run test:e2e:ui
```

### 生成代码（录制测试）

```bash
npm run test:e2e:codegen
```

## 查看测试报告

### HTML 报告

```bash
npm run test:e2e:report
```

或直接运行：

```bash
npx playwright show-report
```

报告位置：`playwright-report/index.html`

## 测试覆盖范围

### 1. 登录与权限 ✅
- 登录成功流程
- 错误凭据处理
- 权限验证
- 未登录访问保护
- 登录状态保持

### 2. 主导航与路由 ✅
- 主要页面可访问
- 导航菜单可点击
- 路由跳转正常
- 面包屑导航
- 页面加载状态

### 3. 列表查询与筛选 ✅
- 搜索功能
- 筛选功能
- 分页功能
- 排序功能
- 空状态显示

### 4. 详情页 ✅
- 从列表进入详情
- 核心字段显示
- Tab 切换
- 面包屑返回

### 5. 创建/编辑流程 ✅
- 新建运单
- 编辑运单
- 状态流转
- 表单验证
- 取消操作

### 6. 上传与下载 ✅
- 上传图片
- 上传 PDF
- 导出 CSV
- 下载对账单
- 附件列表
- 删除附件

### 7. 错误处理 ✅
- 404 页面
- 500 错误
- 网络错误
- 表单错误
- 权限错误

### 8. 全局搜索 ✅
- 搜索订单号
- 搜索结果列表
- 点击结果跳转
- 清空搜索

### 9. 退出登录 ✅
- 退出功能
- 退出后访问保护
- 清除认证信息
- 重新登录

## 测试报告与截图

### 失败截图

测试失败时，截图会自动保存到 `test-results/` 目录。

### 失败视频

测试失败时，视频会自动保存到 `test-results/` 目录。

### Trace 文件

测试失败时，Trace 文件会自动保存，可以使用以下命令查看：

```bash
npx playwright show-trace test-results/trace.zip
```

## CI 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Install Playwright
        run: npx playwright install --with-deps
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
PWDEBUG=1 npx playwright test
```

### 2. 慢速运行（观察操作）

```bash
npx playwright test --slow-mo=1000
```

### 3. 查看控制台日志

在测试代码中添加：

```typescript
page.on('console', msg => console.log('Browser console:', msg.text()));
```

### 4. 查看网络请求

```typescript
page.on('request', request => console.log('Request:', request.url()));
page.on('response', response => console.log('Response:', response.url(), response.status()));
```

## 最佳实践

1. **使用 data-testid**: 优先使用 `data-testid` 属性定位元素，避免使用脆弱的 CSS 选择器
2. **等待策略**: 使用 `waitForLoadState` 和 `waitForSelector` 确保元素已加载
3. **错误处理**: 使用 `test.skip()` 跳过不可用的功能，而不是让测试失败
4. **数据隔离**: 每个测试使用独立的测试数据，避免相互影响
5. **清理资源**: 测试结束后清理创建的数据和文件

## 常见问题

### Q: 测试在 CI 环境中失败，但本地通过？

A: 检查：
- 环境变量是否正确设置
- 网络超时设置是否足够
- 浏览器是否已正确安装

### Q: 如何调试失败的测试？

A: 
1. 查看失败截图和视频
2. 使用 `--headed` 模式运行
3. 使用 Playwright Inspector
4. 检查 Trace 文件

### Q: 测试运行太慢？

A:
- 减少测试用例数量
- 使用 `--workers=1` 限制并发
- 优化等待时间
- 使用 `test.skip()` 跳过非关键测试

## 维护与更新

- 定期更新测试用例以匹配 UI 变化
- 添加新功能的测试用例
- 修复脆弱的测试选择器
- 优化测试执行时间

## 联系方式

如有问题或建议，请联系测试团队。

