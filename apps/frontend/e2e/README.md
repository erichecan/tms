# E2E 测试指南
**创建时间: 2025-10-17T14:36:00**

## 简介

这个目录包含了使用 Playwright 编写的端到端测试，用于测试部署在 Google Cloud 上的 TMS 应用。

## 快速开始

### 安装依赖
```bash
npm install
```

### 安装浏览器
```bash
npx playwright install chromium
```

### 运行测试
```bash
npm test
```

## 可用命令

| 命令 | 描述 |
|-----|------|
| `npm test` | 运行所有测试 |
| `npm run test:ui` | 在 UI 模式下运行测试（交互式）|
| `npm run test:report` | 查看最近的测试报告 |
| `npm run test:debug` | 在调试模式下运行测试 |

## 测试文件说明

### `comprehensive.spec.ts`
- 综合页面错误检测
- 测试所有主要页面
- 检测控制台错误、页面错误、失败的请求
- 性能测试

### `login.spec.ts`
- 登录页面功能测试
- 表单元素测试
- 错误处理测试
- API 请求测试

### `navigation.spec.ts`
- 页面导航测试
- 路由重定向测试
- 认证保护测试

### `helpers.ts`
- 测试辅助函数
- 登录辅助函数
- 截图辅助函数
- 错误检测辅助函数

## 配置

测试配置文件: `../playwright.config.ts`

主要配置:
- **测试 URL**: https://tms-frontend-1038443972557.asia-east2.run.app
- **超时时间**: 30 秒
- **浏览器**: Chromium
- **重试次数**: 0 (本地) / 2 (CI)

## 添加新测试

### 1. 创建新的测试文件

```typescript
// e2e/my-feature.spec.ts
import { test, expect } from '@playwright/test';

test.describe('我的功能', () => {
  test('测试用例描述', async ({ page }) => {
    await page.goto('/my-route');
    // 添加测试逻辑
  });
});
```

### 2. 使用辅助函数

```typescript
import { login, waitForPageLoad } from './helpers';

test('需要登录的测试', async ({ page }) => {
  await login(page, 'username', 'password');
  await page.goto('/protected-route');
  await waitForPageLoad(page);
  // 添加测试逻辑
});
```

## 最佳实践

1. **独立性**: 每个测试应该独立运行，不依赖其他测试
2. **清理**: 测试后清理创建的数据
3. **等待**: 使用 `waitForLoadState('networkidle')` 等待页面加载
4. **选择器**: 优先使用语义化选择器（如 `role`, `text`）
5. **断言**: 使用明确的断言消息

## 示例测试

### 基础页面测试
```typescript
test('页面应该正确加载', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveTitle(/TMS/);
});
```

### 表单交互测试
```typescript
test('应该能够提交表单', async ({ page }) => {
  await page.goto('/form-page');
  await page.fill('input[name="field"]', 'value');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success')).toBeVisible();
});
```

### 错误检测测试
```typescript
test('检测控制台错误', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  await page.goto('/');
  expect(errors.length).toBe(0);
});
```

## 调试技巧

### 1. 使用 UI 模式
```bash
npm run test:ui
```
提供交互式界面，可以逐步执行测试。

### 2. 使用调试模式
```bash
npm run test:debug
```
打开调试器，可以设置断点。

### 3. 查看截图和视频
测试失败时会自动保存截图和视频到 `test-results/` 目录。

### 4. 使用追踪
```typescript
test('我的测试', async ({ page }) => {
  await page.context().tracing.start({ screenshots: true, snapshots: true });
  // 测试逻辑
  await page.context().tracing.stop({ path: 'trace.zip' });
});
```

## 持续集成

在 CI 环境中运行测试：

```yaml
# .github/workflows/test.yml
- name: Install dependencies
  run: npm ci

- name: Install Playwright
  run: npx playwright install --with-deps

- name: Run tests
  run: npm test
```

## 故障排查

### 测试超时
- 增加超时时间: `test.setTimeout(60000)`
- 检查网络连接
- 确认页面加载完成

### 元素未找到
- 等待元素出现: `await page.waitForSelector('.element')`
- 检查选择器是否正确
- 使用 `page.pause()` 暂停查看页面

### 网络错误
- 检查 baseURL 配置
- 确认应用正在运行
- 检查防火墙设置

## 资源

- [Playwright 官方文档](https://playwright.dev)
- [Playwright 最佳实践](https://playwright.dev/docs/best-practices)
- [测试选择器](https://playwright.dev/docs/selectors)

---

**维护人员**: TMS 开发团队  
**最后更新**: 2025-10-17

