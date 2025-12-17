# 生产环境 E2E 测试设置指南

**创建时间**: 2025-12-10 20:00:00

## 快速开始

### 1. 配置环境变量

```bash
# 复制环境变量示例文件
cp env.e2e.example .env.e2e

# 编辑 .env.e2e 文件，填入生产环境信息
# PROD_BASE_URL=https://your-production-domain.com
# PROD_TEST_USER=your-test-user@example.com
# PROD_TEST_PASSWORD=your-secure-password
```

### 2. 安装依赖

```bash
npm install
npx playwright install chromium
```

### 3. 运行测试

```bash
# Headed 模式（显示浏览器）
npx playwright test tests/e2e/prod/waybill-pricing-and-maps.spec.ts --project=prod --headed

# Headless 模式
npx playwright test tests/e2e/prod/waybill-pricing-and-maps.spec.ts --project=prod
```

## 创建的文件清单

### 1. 测试代码文件

#### `tests/e2e/prod/waybill-pricing-and-maps.spec.ts`
- **用途**: 主要测试脚本
- **功能**: 
  - 登录与进入创建运单页面
  - 路程计费（distance-based）路径验证
  - 时间计费（time-based）路径验证
  - 日志与证据输出

### 2. 工具文件

#### `tests/utils/cdp.ts`
- **用途**: CDP (Chrome DevTools Protocol) 会话封装
- **功能**:
  - 网络请求/响应监听
  - Console 消息采集
  - 网络事件摘要生成

#### `tests/utils/assertions.ts`
- **用途**: 断言工具函数
- **功能**:
  - 规则引擎请求/响应断言
  - Google Maps API 调用断言
  - UI 价格信息验证

### 3. 配置文件

#### `playwright.config.ts` (已更新)
- **变更**: 添加生产环境项目配置
- **新增项目**: `prod` 项目配置
- **报告设置**: 生产环境独立报告输出

#### `env.e2e.example`
- **用途**: 环境变量配置示例
- **包含**: 
  - 生产环境 URL 和账号
  - 规则引擎 URL
  - Google Maps 端点配置

### 4. CI/CD 配置

#### `.github/workflows/e2e-prod.yml`
- **用途**: GitHub Actions 工作流配置
- **功能**:
  - 手动批准机制
  - 环境变量注入
  - 测试报告和网络事件摘要上传

### 5. 文档文件

#### `tests/e2e/prod/README.md`
- **用途**: 详细使用说明文档
- **包含**: 
  - 测试场景说明
  - 运行指南
  - 故障排查

## 文件结构

```
tms/
├── playwright.config.ts (已更新)
├── env.e2e.example (新建)
├── .github/
│   └── workflows/
│       └── e2e-prod.yml (新建)
└── tests/
    ├── e2e/
    │   └── prod/
    │       ├── waybill-pricing-and-maps.spec.ts (新建)
    │       ├── README.md (新建)
    │       └── SETUP_GUIDE.md (新建)
    ├── utils/
    │   ├── cdp.ts (新建)
    │   └── assertions.ts (新建)
    └── artifacts/ (新建目录)
        └── prod-network-summary.json (测试运行时生成)
```

## 环境变量说明

### 必需变量

| 变量名 | 说明 | 示例 |
|--------|------|------|
| `PROD_BASE_URL` | 生产环境基础 URL | `https://tms.example.com` |
| `PROD_TEST_USER` | 生产环境测试账号邮箱 | `admin@example.com` |
| `PROD_TEST_PASSWORD` | 生产环境测试账号密码 | `your-password` |

### 可选变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `RULE_ENGINE_URL` | 规则引擎 URL（用于精确匹配） | 使用通用路径匹配 |
| `GOOGLE_MAPS_EXPECTED_ENDPOINTS` | 期望的 Google Maps 端点 | `js,geocoding` |

## GitHub Secrets 配置

在 GitHub 仓库设置中配置以下 Secrets：

1. **Settings** → **Secrets and variables** → **Actions**
2. 添加以下 Secrets:
   - `PROD_BASE_URL`: 生产环境 URL
   - `PROD_TEST_USER`: 测试账号邮箱
   - `PROD_TEST_PASSWORD`: 测试账号密码
   - `RULE_ENGINE_URL`: 规则引擎 URL（可选）
   - `GOOGLE_MAPS_EXPECTED_ENDPOINTS`: Google Maps 端点（可选）

## 测试输出

### 本地运行输出

- **HTML 报告**: `playwright-report/index.html`
- **网络事件摘要**: `tests/artifacts/prod-network-summary.json`
- **测试结果**: `test-results/` 目录

### CI/CD 输出

- **Artifacts**: 在 GitHub Actions 运行页面下载
  - `playwright-report-prod`: HTML 报告
  - `network-summary-prod`: 网络事件摘要 JSON
  - `test-results-json-prod`: JSON 格式测试结果
  - `test-results-xml-prod`: JUnit XML 格式测试结果

## 验证清单

运行测试前，请确认：

- [ ] 环境变量已正确配置
- [ ] 测试账号有创建订单和查看地图的权限
- [ ] Playwright 浏览器已安装
- [ ] 生产环境可访问
- [ ] 规则引擎服务正常运行
- [ ] Google Maps API Key 已配置

## 常见问题

### Q: 测试失败，提示"未找到规则引擎调用"

**A**: 检查以下几点：
1. 确认 `RULE_ENGINE_URL` 是否正确
2. 查看网络事件摘要文件，确认实际调用的 URL
3. 检查规则引擎服务是否正常运行

### Q: 测试失败，提示"未找到 Google Maps 调用"

**A**: 检查以下几点：
1. 确认 Google Maps API Key 已配置
2. 查看浏览器控制台是否有错误
3. 检查网络事件摘要文件

### Q: 如何在 CI/CD 中运行测试？

**A**: 
1. 在 GitHub 仓库中配置 Secrets
2. 转到 **Actions** 标签
3. 选择 **E2E Production Tests** workflow
4. 点击 **Run workflow**，选择 `confirm_production: yes`

## 下一步

1. 根据实际生产环境调整测试选择器
2. 配置 GitHub Secrets
3. 运行测试验证功能
4. 查看测试报告和网络事件摘要
5. 根据结果优化测试用例

## 支持

如有问题，请查看：
- `tests/e2e/prod/README.md`: 详细使用说明
- Playwright 官方文档: https://playwright.dev
- 项目文档: `docs/` 目录
