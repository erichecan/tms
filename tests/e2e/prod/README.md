# 生产环境端到端测试说明

**创建时间**: 2025-12-10 20:00:00  
**用途**: 在生产环境验证运单创建时的计费规则引擎和 Google Maps 集成

## 测试范围

本测试套件验证以下功能：

1. **计费规则引擎调用验证**
   - 路程计费（distance-based）模式
   - 时间计费（time-based）模式
   - 规则引擎请求和响应结构验证

2. **Google Maps 集成验证**
   - Google Maps JavaScript API 加载
   - 地理编码（Geocoding）API 调用
   - 距离矩阵（Distance Matrix）API 调用（如适用）
   - 其他 Google Maps API 调用

## 前置条件

### 1. 环境变量配置

复制环境变量示例文件并填入实际值：

```bash
cp env.e2e.example .env.e2e
```

编辑 `.env.e2e` 文件，设置以下变量：

- `PROD_BASE_URL`: 生产环境基础 URL
- `PROD_TEST_USER`: 生产环境测试账号邮箱
- `PROD_TEST_PASSWORD`: 生产环境测试账号密码
- `RULE_ENGINE_URL`: 规则引擎 URL（可选）
- `GOOGLE_MAPS_EXPECTED_ENDPOINTS`: 期望的 Google Maps 端点（可选）

### 2. 测试账号权限

测试账号需要具备以下权限：
- 创建运单/订单
- 查看地图
- 访问计费相关功能

### 3. 安装依赖

```bash
npm install
npx playwright install chromium
```

## 运行测试

### 本地运行

#### Headed 模式（显示浏览器）

```bash
npx playwright test tests/e2e/prod/waybill-pricing-and-maps.spec.ts --project=prod --headed
```

#### Headless 模式（后台运行）

```bash
npx playwright test tests/e2e/prod/waybill-pricing-and-maps.spec.ts --project=prod
```

#### 运行特定场景

```bash
# 仅运行路程计费测试
npx playwright test tests/e2e/prod/waybill-pricing-and-maps.spec.ts --project=prod -g "路程计费"

# 仅运行时间计费测试
npx playwright test tests/e2e/prod/waybill-pricing-and-maps.spec.ts --project=prod -g "时间计费"
```

### CI/CD 运行

在 GitHub Actions 中，测试通过 `e2e-prod.yml` workflow 运行。

**重要**: 此工作流需要手动批准以访问生产环境。

1. 在 GitHub 仓库中，转到 **Actions** 标签
2. 选择 **E2E Production Tests** workflow
3. 点击 **Run workflow**
4. 选择 **confirm_production: yes**
5. 点击 **Run workflow** 按钮

## 测试场景

### 场景 1: 登录并进入创建运单页面

- 验证页面加载无错误
- 验证关键表单元素存在
- 验证地址和时间字段可用

### 场景 2: 路程计费（distance-based）路径验证

- 填写取货和送货地址
- 触发 Google Maps 地理编码
- 选择路程计费模式
- 提交表单
- 验证规则引擎调用（包含 distance 参数）
- 验证规则引擎响应结构
- 验证 UI 中显示价格

### 场景 3: 时间计费（time-based）路径验证

- 填写取货和送货地址
- 选择时间计费模式
- 勾选"使用时间段"
- 填写时间段信息
- 提交表单
- 验证规则引擎调用（包含 time 参数）
- 验证规则引擎响应结构

### 场景 4: 日志与证据输出

- 收集所有网络事件
- 保存网络事件摘要到 JSON 文件
- 验证摘要文件包含完整数据

## 输出文件

测试运行后，会在以下位置生成输出文件：

### 1. 测试报告

- **HTML 报告**: `playwright-report/index.html`
- **JSON 报告**: `test-results.json`
- **JUnit XML**: `test-results.xml`

### 2. 网络事件摘要

- **位置**: `tests/artifacts/prod-network-summary.json`
- **内容**: 
  - 所有网络请求
  - 所有网络响应
  - Console 消息

### 3. 截图和视频

- **失败截图**: `test-results/` 目录
- **测试视频**: `test-results/` 目录（如果启用）

## 验证标准

测试通过需要满足以下条件：

1. ✅ 成功登录并完成两条计费模式的下单流程（或报价）
2. ✅ UI 无致命错误
3. ✅ 捕获并断言至少 1 次规则引擎调用（distance、time 各一次）
4. ✅ 捕获并断言 Google Maps 加载与至少 1 次 API 请求调用
5. ✅ 生成报告与网络事件摘要文件
6. ✅ 金额断言为正数、响应结构完整

## 故障排查

### 测试失败：无法登录

- 检查 `PROD_TEST_USER` 和 `PROD_TEST_PASSWORD` 是否正确
- 确认测试账号未被锁定或禁用
- 检查生产环境是否可访问

### 测试失败：未检测到规则引擎调用

- 检查 `RULE_ENGINE_URL` 是否正确设置
- 查看网络事件摘要文件，确认实际调用的 URL
- 检查规则引擎服务是否正常运行

### 测试失败：未检测到 Google Maps 调用

- 检查 Google Maps API Key 是否配置正确
- 查看浏览器控制台是否有错误
- 检查网络事件摘要文件，查看实际网络请求

### 测试失败：页面元素未找到

- 检查生产环境 UI 是否与测试预期一致
- 查看测试截图，确认页面实际状态
- 可能需要更新测试中的选择器

## 注意事项

⚠️ **重要提示**:

1. **生产环境测试风险**
   - 生产环境测试需要谨慎使用
   - 建议使用专门的测试账号
   - 避免在生产环境创建真实订单（如果可能，使用报价预览模式）
   - 定期清理测试数据

2. **敏感信息保护**
   - 不要将 `.env.e2e` 文件提交到版本控制系统
   - 在 CI/CD 中使用 GitHub Secrets 存储敏感信息

3. **测试数据管理**
   - 如果生产策略不允许创建真实订单，请将保存动作替换为报价预览
   - 或使用 staging 环境进行测试

4. **网络监控**
   - CDP 网络监控可能捕获大量数据
   - 大型测试运行可能生成较大的摘要文件
   - 定期清理旧的测试输出文件

## 相关文件

- 测试代码: `tests/e2e/prod/waybill-pricing-and-maps.spec.ts`
- CDP 工具: `tests/utils/cdp.ts`
- 断言工具: `tests/utils/assertions.ts`
- Playwright 配置: `playwright.config.ts`
- CI/CD 配置: `.github/workflows/e2e-prod.yml`
- 环境变量示例: `env.e2e.example`

## 支持

如有问题或需要帮助，请：
1. 查看测试输出和网络事件摘要
2. 检查 Playwright 报告中的详细错误信息
3. 联系开发团队
