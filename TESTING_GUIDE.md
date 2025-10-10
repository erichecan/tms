# TMS系统测试指南

**创建时间**: 2025-10-10  
**最后更新**: 2025-10-10 13:50:00

---

## 📚 目录

1. [测试概述](#测试概述)
2. [测试套件](#测试套件)
3. [运行测试](#运行测试)
4. [测试结果](#测试结果)
5. [常见问题](#常见问题)

---

## 测试概述

TMS系统使用**Playwright**进行端到端自动化测试，覆盖以下范围：

- ✅ 页面可访问性测试
- ✅ 认证和授权测试
- ✅ 业务流程测试
- ✅ API集成测试
- ✅ 性能测试

---

## 测试套件

### 1. 页面可访问性测试
**文件**: `tests/e2e/pages-accessibility-test.spec.ts`  
**测试数**: 11个  
**目的**: 验证所有主要页面是否可以正常加载

**测试项**:
- 主页访问
- 运单管理页面
- 创建运单页面
- 车队管理页面
- 财务结算页面
- 规则管理页面
- 控制台错误检查
- 页面响应时间
- API健康检查
- 前端资源加载
- 路由可访问性

**运行命令**:
```bash
npx playwright test tests/e2e/pages-accessibility-test.spec.ts
```

---

### 2. 认证功能测试
**文件**: `tests/e2e/authenticated-flow-test.spec.ts`  
**测试数**: 13个  
**目的**: 验证需要认证的功能是否正常工作

**测试项**:
- 认证状态验证
- 运单列表数据加载
- 创建运单表单交互
- 运单详情Modal
- BOL单据标签页
- 编辑运单功能
- 车队管理地图
- 智能调度UI
- 财务结算页面
- 司机薪酬页面
- 完整运单查看流程
- Google Maps初始化
- 计费引擎响应

**运行命令**:
```bash
npx playwright test tests/e2e/authenticated-flow-test.spec.ts
```

---

### 3. 完整系统测试
**文件**: `tests/e2e/complete-system-test.spec.ts`  
**测试数**: 17个  
**目的**: 完整的端到端测试（需要登录）

**注意**: 此测试套件需要配置登录流程或使用测试token

---

## 运行测试

### 前置条件

1. **启动后端服务**:
```bash
cd apps/backend
npm run dev
```

2. **启动前端服务**:
```bash
cd apps/frontend
npm run dev
```

3. **确保数据库运行**:
```bash
# PostgreSQL应该在localhost:5432运行
```

---

### 运行所有测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test tests/e2e/pages-accessibility-test.spec.ts

# 以UI模式运行（可视化）
npx playwright test --ui

# 以调试模式运行
npx playwright test --debug

# 运行特定测试
npx playwright test -g "BOL单据"
```

---

### 查看测试报告

```bash
# 生成并打开HTML报告
npx playwright show-report

# 报告会在浏览器中打开，位于：
# http://localhost:9323
```

---

## 测试结果

### 最新测试结果 (2025-10-10)

**总测试数**: 24  
**通过**: 24/24 (100%)  
**失败**: 0  
**执行时间**: 16.7秒

### 详细结果

#### ✅ 页面可访问性测试 (11/11通过)
- 平均响应时间: 309ms
- 所有页面状态码: 200
- 无资源加载错误
- 无控制台错误

#### ✅ 认证功能测试 (13/13通过)
- Token认证: 正常
- API调用: 正常
- Google Maps: v3.62.9c已加载
- BOL单据: 正常显示
- 编辑功能: 正常工作

---

## 测试覆盖的功能

### ✅ 已测试功能

1. **运单管理**
   - ✅ 运单列表显示
   - ✅ 运单详情查看
   - ✅ 运单编辑功能
   - ✅ BOL单据显示
   - ✅ 运单创建表单

2. **Google Maps集成**
   - ✅ Maps API加载（v3.62.9c）
   - ✅ 地址输入框
   - ✅ 地图容器

3. **计费引擎**
   - ✅ API端点健康
   - ✅ 表单交互

4. **智能调度**
   - ✅ UI按钮显示
   - ✅ 运单选择功能

5. **财务管理**
   - ✅ 财务结算页面
   - ✅ 司机薪酬页面

6. **BOL打印系统**
   - ✅ BOL文档显示
   - ✅ 标签页切换
   - ✅ 打印按钮

---

## 常见问题

### Q1: 测试超时怎么办？

**A**: 增加timeout配置：
```typescript
test('测试名称', async ({ page }) => {
  await page.goto(url, { timeout: 30000 }); // 30秒超时
});
```

### Q2: 如何跳过某个测试？

**A**: 使用`test.skip`:
```typescript
test.skip('暂时跳过的测试', async ({ page }) => {
  // ...
});
```

### Q3: 如何只运行一个测试？

**A**: 使用`test.only`:
```typescript
test.only('只运行这个测试', async ({ page }) => {
  // ...
});
```

### Q4: 测试token过期怎么办？

**A**: 运行token生成脚本：
```bash
cd apps/backend
node generate-test-token.js
```

然后更新测试文件中的`TEST_TOKEN`常量。

### Q5: 如何生成测试数据？

**A**: 运行测试数据生成脚本：
```bash
cd apps/backend
npx tsx src/database/generateTestData.ts
```

---

## 测试最佳实践

### 1. 使用有意义的测试名称
```typescript
// ❌ 不好
test('test1', async ({ page }) => { ... });

// ✅ 好
test('运单详情Modal应该正确显示BOL单据', async ({ page }) => { ... });
```

### 2. 添加适当的等待
```typescript
// 等待页面加载完成
await page.waitForLoadState('networkidle');

// 等待特定元素
await page.waitForSelector('.ant-modal');

// 等待API响应
await page.waitForResponse(response => response.url().includes('/api/'));
```

### 3. 处理异步操作
```typescript
// 使用try-catch处理可能的错误
try {
  await page.click('button');
} catch (error) {
  console.log('按钮未找到，跳过此步骤');
}
```

### 4. 使用控制台日志辅助调试
```typescript
console.log('✅ 测试通过');
console.log('⚠️  警告信息');
console.log('❌ 错误信息');
console.log('📊 统计数据:', count);
```

---

## 持续集成（CI）

### GitHub Actions配置示例

```yaml
name: E2E Tests

on: [push, pull_request]

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
      
      - name: Run tests
        run: npx playwright test
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

---

## 测试维护

### 定期更新
- 每次添加新功能时，添加相应的测试
- 每周运行一次完整测试套件
- 每次部署前运行测试验证

### 测试数据维护
- 定期清理测试数据
- 保持测试数据的真实性
- 避免测试数据污染生产数据

---

## 📞 支持

如有测试相关问题，请：
1. 查看测试报告: `npx playwright show-report`
2. 查看失败截图和视频
3. 检查控制台日志
4. 联系开发团队

---

**文档版本**: 1.0  
**生成时间**: 2025-10-10 13:50:00

