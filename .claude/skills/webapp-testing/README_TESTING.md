# TMS 系统完整测试指南

## 概述

本目录包含使用 webapp-testing 和 Playwright 对 TMS 系统进行完整功能测试的脚本。

## 文件说明

- `test_complete_system.py` - 完整系统测试脚本，测试所有功能模块
- `generate_test_report.py` - 测试报告生成脚本
- `test_vehicle_management.py` - 车辆管理功能测试（示例）

## 快速开始

### 1. 安装依赖

```bash
# 安装 Playwright
pip3 install playwright

# 安装 Chromium 浏览器
python3 -m playwright install chromium
```

### 2. 设置环境变量

```bash
# 设置测试账号（必需）
export TMS_TEST_EMAIL=your-email@example.com
export TMS_TEST_PASSWORD=your-password

# 设置生产环境 URL（可选，有默认值）
export TMS_FRONTEND_URL=https://tms-frontend-v4estohola-df.a.run.app
export TMS_BACKEND_URL=https://tms-backend-v4estohola-df.a.run.app
```

### 3. 运行完整测试

```bash
cd /Users/apony-it/Desktop/tms
python3 .claude/skills/webapp-testing/test_complete_system.py
```

### 4. 生成测试报告

```bash
cd /Users/apony-it/Desktop/tms
python3 .claude/skills/webapp-testing/generate_test_report.py
```

## 测试模块

测试脚本会自动测试以下模块：

1. **认证模块**
   - 登录功能
   - 登出功能
   - 会话管理

2. **运单管理**
   - 运单列表查看
   - 创建运单功能
   - 运单详情查看

3. **车辆管理**
   - 车辆列表查看
   - 添加车辆功能

4. **司机管理**
   - 司机列表查看
   - 添加司机功能

5. **客户管理**
   - 客户列表查看
   - 添加客户功能

6. **财务管理**
   - 财务记录查看
   - 应收款/应付款功能

7. **地图集成**
   - Google Maps 显示
   - 地图元素检测

8. **调度管理**
   - 运单分配功能
   - 行程管理

## 测试结果

测试完成后，会在 `test-results/` 目录生成：

- `test-report-{timestamp}.json` - JSON 格式的测试结果
- `test-report-{timestamp}.txt` - 可读的文本报告
- `*.png` - 各个页面的截图

## 数据清理

在运行测试前，如果需要清理 seed 数据：

```bash
# 设置数据库连接
export DATABASE_URL=your-database-url

# 运行清理脚本
npx tsx scripts/clean-seed-data-only.ts
```

**注意**: 清理脚本会删除所有 seed 数据，但保留用户创建的数据。

## 故障排除

### 测试账号未设置

如果看到 "测试账号未设置" 错误，请设置环境变量：
```bash
export TMS_TEST_EMAIL=your-email@example.com
export TMS_TEST_PASSWORD=your-password
```

### Playwright 浏览器未安装

如果看到浏览器相关错误，请安装 Chromium：
```bash
python3 -m playwright install chromium
```

### 网络连接问题

如果测试无法连接到生产环境，请检查：
1. 网络连接是否正常
2. 生产环境 URL 是否正确
3. 防火墙设置是否允许访问

## 注意事项

1. **测试环境**: 默认测试生产环境，请确保不会影响生产数据
2. **测试账号**: 使用提供的测试账号，不要使用生产账号
3. **测试时间**: 完整测试可能需要 5-10 分钟
4. **截图**: 测试过程中会生成多个截图，占用一定磁盘空间

## 联系支持

如有问题，请查看测试报告中的错误信息，或联系开发团队。

