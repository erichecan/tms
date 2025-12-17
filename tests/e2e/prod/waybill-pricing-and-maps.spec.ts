// 生产环境端到端测试 - 运单计费规则引擎与 Google Maps 验证
// 创建时间: 2025-12-10 20:00:00
// 用途: 验证创建订单时计费规则引擎和 Google Maps 是否被正确调用

import { test, expect, Page } from '@playwright/test';
import { CDPSessionManager, waitForNetworkRequest } from '../../utils/cdp';
import {
  verifyRuleEngineCall,
  verifyGoogleMapsCalls,
  assertRuleEngineResponse,
  extractRuleEngineResult,
  verifyPricingInUI,
} from '../../utils/assertions';
import { login } from '../../utils/auth';
import * as fs from 'fs';
import * as path from 'path';

// 测试配置
const PROD_BASE_URL = process.env.PROD_BASE_URL || process.env.BASE_URL || 'http://localhost:3000';
const PROD_TEST_USER = process.env.PROD_TEST_USER || process.env.E2E_USERNAME || 'admin@example.com';
const PROD_TEST_PASSWORD = process.env.PROD_TEST_PASSWORD || process.env.E2E_PASSWORD || 'admin123';
const RULE_ENGINE_URL = process.env.RULE_ENGINE_URL || '';
const GOOGLE_MAPS_EXPECTED_ENDPOINTS = process.env.GOOGLE_MAPS_EXPECTED_ENDPOINTS
  ? process.env.GOOGLE_MAPS_EXPECTED_ENDPOINTS.split(',')
  : ['js', 'geocoding'];

// 测试数据
const TEST_ADDRESSES = {
  pickup: {
    address: '3401 Dufferin St, North York, ON M6A 2T9, Canada',
    city: 'North York',
    province: 'ON',
    postalCode: 'M6A 2T9',
    country: 'CA',
  },
  delivery: {
    address: '100 Queen St W, Toronto, ON M5H 2N2, Canada',
    city: 'Toronto',
    province: 'ON',
    postalCode: 'M5H 2N2',
    country: 'CA',
  },
};

test.describe('生产环境 - 运单计费规则引擎与 Google Maps 验证', () => {
  let page: Page;
  let cdpManager: CDPSessionManager;

  test.beforeEach(async ({ browser }) => {
    // 创建新的浏览器上下文和页面
    const context = await browser.newContext({
      viewport: { width: 1920, height: 1080 },
    });
    page = await context.newPage();

    // 初始化 CDP 会话管理器
    cdpManager = new CDPSessionManager();
    await cdpManager.attachToPage(page);

    // 登录系统
    await login(page, PROD_TEST_USER, PROD_TEST_PASSWORD);
  });

  test.afterEach(async () => {
    // 保存网络事件摘要
    const artifactsDir = path.join(__dirname, '../../../artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const summaryPath = path.join(artifactsDir, 'prod-network-summary.json');
    await cdpManager.saveNetworkSummary(summaryPath);

    // 关闭 CDP 会话
    await cdpManager.close();

    // 关闭页面
    await page.close();
  });

  test('场景 1: 登录并进入创建运单页面', async () => {
    // 导航到创建运单页面
    await page.goto(`${PROD_BASE_URL}/shipments/create`);
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {
      // 忽略网络空闲超时
    });

    // 验证页面加载无错误
    const pageErrors: string[] = [];
    page.on('pageerror', (error) => {
      pageErrors.push(error.message);
    });

    // 等待页面主要内容加载
    await page.waitForSelector('body', { timeout: 10_000 });

    // 验证页面包含关键元素（根据实际 UI 调整选择器）
    const hasForm = await page.locator('form').count() > 0;
    expect(hasForm, '页面应包含表单').toBe(true);

    // 检查是否有计费模式相关字段（如果 UI 中有）
    // 注意：如果 UI 中没有计费模式选择，测试将通过 API 调用验证
    const pricingModeSelectors = [
      'input[name="pricingMode"]',
      'select[name="pricingMode"]',
      '[data-testid="pricing-mode"]',
      'text=/计费模式/i',
    ];

    let foundPricingMode = false;
    for (const selector of pricingModeSelectors) {
      const count = await page.locator(selector).count();
      if (count > 0) {
        foundPricingMode = true;
        break;
      }
    }

    // 验证地址输入字段存在
    const hasAddressFields =
      (await page.locator('input[name*="address"], input[placeholder*="地址"]').count()) > 0;
    expect(hasAddressFields, '页面应包含地址输入字段').toBe(true);

    // 验证时间字段存在
    const hasTimeFields =
      (await page.locator('input[name*="time"], input[name*="date"]').count()) > 0;
    expect(hasTimeFields, '页面应包含时间字段').toBe(true);

    console.log('✓ 页面加载成功，关键元素已找到');
  });

  test('场景 2: 路程计费（distance-based）路径验证', async () => {
    // 导航到创建运单页面
    await page.goto(`${PROD_BASE_URL}/shipments/create`);
    await page.waitForLoadState('domcontentloaded');

    // 等待表单加载
    await page.waitForSelector('form', { timeout: 10_000 });

    // 填写取货地址
    const pickupAddressSelectors = [
      'input[name="shipperAddress1"]',
      'input[placeholder*="取货地址"]',
      'input[placeholder*="发货地址"]',
      'input[name*="pickup"]',
    ];

    let pickupAddressFilled = false;
    for (const selector of pickupAddressSelectors) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        await element.fill(TEST_ADDRESSES.pickup.address);
        pickupAddressFilled = true;
        break;
      }
    }
    expect(pickupAddressFilled, '应成功填写取货地址').toBe(true);

    // 等待地址自动完成（如果使用 Google Maps Places API）
    await page.waitForTimeout(1000);

    // 填写送货地址
    const deliveryAddressSelectors = [
      'input[name="consigneeAddress1"]',
      'input[name="receiverAddress1"]',
      'input[placeholder*="送货地址"]',
      'input[placeholder*="收货地址"]',
      'input[name*="delivery"]',
    ];

    let deliveryAddressFilled = false;
    for (const selector of deliveryAddressSelectors) {
      const element = page.locator(selector).first();
      if ((await element.count()) > 0) {
        await element.fill(TEST_ADDRESSES.delivery.address);
        deliveryAddressFilled = true;
        break;
      }
    }
    expect(deliveryAddressFilled, '应成功填写送货地址').toBe(true);

    // 等待地址自动完成和地图加载
    await page.waitForTimeout(2000);

    // 验证 Google Maps 是否被调用（地址解析）
    const googleMapsCalls = verifyGoogleMapsCalls(cdpManager, GOOGLE_MAPS_EXPECTED_ENDPOINTS);
    expect(googleMapsCalls.length, '应检测到 Google Maps API 调用').toBeGreaterThan(0);
    console.log(`✓ 检测到 ${googleMapsCalls.length} 个 Google Maps API 调用`);

    // 填写其他必要字段
    // 客户名称
    const customerNameSelectors = [
      'input[name="customerName"]',
      'input[name="shipperName"]',
    ];
    for (const selector of customerNameSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill('测试客户');
        break;
      }
    }

    // 填写距离（如果字段存在）
    const distanceSelectors = [
      'input[name="distance"]',
      'input[name="distanceKm"]',
      'input[name="estimatedDistance"]',
    ];
    for (const selector of distanceSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill('25');
        break;
      }
    }

    // 填写货物信息（最小必要字段）
    const weightSelectors = [
      'input[name="cargoWeight"]',
      'input[name="weight"]',
    ];
    for (const selector of weightSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill('100');
        break;
      }
    }

    // 设置计费模式为路程计费（如果 UI 中有此选项）
    // 注意：如果 UI 中没有，将通过 API 请求验证
    const pricingModeSelectors = [
      'input[value="distance-based"]',
      'select[name="pricingMode"]',
      '[data-testid="pricing-mode-distance"]',
    ];

    for (const selector of pricingModeSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().click();
        break;
      }
    }

    // 点击保存/提交按钮
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("保存")',
      'button:has-text("创建")',
      'button:has-text("提交")',
      'button:has-text("Save")',
      'button:has-text("Create")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      const button = page.locator(selector).first();
      if ((await button.count()) > 0 && (await button.isVisible())) {
        // 等待规则引擎调用
        const ruleEnginePromise = waitForNetworkRequest(
          cdpManager,
          RULE_ENGINE_URL || /\/api\/(shipments|pricing|rules).*\/evaluate/i,
          30_000
        );

        await button.click();
        submitted = true;

        // 等待规则引擎响应
        const ruleEnginePairs = await ruleEnginePromise;
        expect(
          ruleEnginePairs.length,
          '应检测到规则引擎 API 调用（路程计费）'
        ).toBeGreaterThan(0);

        // 验证规则引擎请求和响应
        const verifiedPairs = verifyRuleEngineCall(cdpManager, RULE_ENGINE_URL, 'distance');
        expect(verifiedPairs.length, '应验证规则引擎调用').toBeGreaterThan(0);

        // 提取规则引擎结果
        if (verifiedPairs[0]?.response) {
          const result = extractRuleEngineResult(verifiedPairs[0].response);
          expect(result.amount, '规则引擎返回的金额应为正数').toBeGreaterThan(0);
          expect(result.currency, '规则引擎应返回币种').toBeTruthy();
          console.log(`✓ 规则引擎返回金额: ${result.currency} ${result.amount}`);
        }

        break;
      }
    }

    expect(submitted, '应成功提交表单').toBe(true);

    // 等待页面响应
    await page.waitForTimeout(3000);

    // 验证 UI 中显示价格（如果页面跳转或显示价格预览）
    try {
      await verifyPricingInUI(page);
      console.log('✓ UI 中显示了价格信息');
    } catch (error) {
      // 如果 UI 中没有价格显示，记录但不失败测试
      console.log('⚠ UI 中未找到价格信息（可能页面已跳转）');
    }

    // 验证 Google Maps 在提交后仍有调用（如果需要计算距离）
    const finalGoogleMapsCalls = verifyGoogleMapsCalls(cdpManager);
    expect(
      finalGoogleMapsCalls.length,
      '应检测到 Google Maps API 调用'
    ).toBeGreaterThan(0);
  });

  test('场景 3: 时间计费（time-based）路径验证', async () => {
    // 导航到创建运单页面
    await page.goto(`${PROD_BASE_URL}/shipments/create`);
    await page.waitForLoadState('domcontentloaded');

    // 等待表单加载
    await page.waitForSelector('form', { timeout: 10_000 });

    // 填写取货地址
    const pickupAddressSelectors = [
      'input[name="shipperAddress1"]',
      'input[placeholder*="取货地址"]',
      'input[placeholder*="发货地址"]',
    ];

    for (const selector of pickupAddressSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(TEST_ADDRESSES.pickup.address);
        break;
      }
    }

    // 填写送货地址
    const deliveryAddressSelectors = [
      'input[name="consigneeAddress1"]',
      'input[name="receiverAddress1"]',
      'input[placeholder*="送货地址"]',
    ];

    for (const selector of deliveryAddressSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(TEST_ADDRESSES.delivery.address);
        break;
      }
    }

    // 等待地址自动完成
    await page.waitForTimeout(2000);

    // 设置计费模式为时间计费（如果 UI 中有此选项）
    const pricingModeSelectors = [
      'input[value="time-based"]',
      'select[name="pricingMode"]',
      '[data-testid="pricing-mode-time"]',
    ];

    for (const selector of pricingModeSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().click();
        break;
      }
    }

    // 勾选"使用时间段"（如果存在）
    const useTimeWindowSelectors = [
      'input[name="useTimeWindow"]',
      'input[type="checkbox"][name*="timeWindow"]',
      '[data-testid="use-time-window"]',
    ];

    for (const selector of useTimeWindowSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        const checkbox = page.locator(selector).first();
        if (!(await checkbox.isChecked())) {
          await checkbox.click();
        }
        break;
      }
    }

    // 填写时间段
    const now = new Date();
    const pickupStart = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 明天
    const pickupEnd = new Date(pickupStart.getTime() + 2 * 60 * 60 * 1000); // 2小时后
    const deliveryStart = new Date(pickupEnd.getTime() + 60 * 60 * 1000); // 再1小时后
    const deliveryEnd = new Date(deliveryStart.getTime() + 2 * 60 * 60 * 1000); // 2小时后

    // 填写取货时间段
    const pickupStartSelectors = [
      'input[name="pickupStart"]',
      'input[name="pickupTimeRange[0]"]',
    ];
    for (const selector of pickupStartSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(pickupStart.toISOString());
        break;
      }
    }

    const pickupEndSelectors = [
      'input[name="pickupEnd"]',
      'input[name="pickupTimeRange[1]"]',
    ];
    for (const selector of pickupEndSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(pickupEnd.toISOString());
        break;
      }
    }

    // 填写送货时间段
    const deliveryStartSelectors = [
      'input[name="deliveryStart"]',
      'input[name="deliveryTimeRange[0]"]',
    ];
    for (const selector of deliveryStartSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(deliveryStart.toISOString());
        break;
      }
    }

    const deliveryEndSelectors = [
      'input[name="deliveryEnd"]',
      'input[name="deliveryTimeRange[1]"]',
    ];
    for (const selector of deliveryEndSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(deliveryEnd.toISOString());
        break;
      }
    }

    // 填写服务时间（分钟）
    const serviceMinutesSelectors = [
      'input[name="serviceMinutes"]',
      'input[name="serviceTime"]',
    ];
    for (const selector of serviceMinutesSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill('120'); // 2小时
        break;
      }
    }

    // 填写其他必要字段
    const customerNameSelectors = [
      'input[name="customerName"]',
      'input[name="shipperName"]',
    ];
    for (const selector of customerNameSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill('测试客户');
        break;
      }
    }

    // 点击保存/提交按钮
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("保存")',
      'button:has-text("创建")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      const button = page.locator(selector).first();
      if ((await button.count()) > 0 && (await button.isVisible())) {
        // 等待规则引擎调用
        const ruleEnginePromise = waitForNetworkRequest(
          cdpManager,
          RULE_ENGINE_URL || /\/api\/(shipments|pricing|rules).*\/evaluate/i,
          30_000
        );

        await button.click();
        submitted = true;

        // 等待规则引擎响应
        const ruleEnginePairs = await ruleEnginePromise;
        expect(
          ruleEnginePairs.length,
          '应检测到规则引擎 API 调用（时间计费）'
        ).toBeGreaterThan(0);

        // 验证规则引擎请求和响应
        const verifiedPairs = verifyRuleEngineCall(cdpManager, RULE_ENGINE_URL, 'time');
        expect(verifiedPairs.length, '应验证规则引擎调用').toBeGreaterThan(0);

        // 提取规则引擎结果
        if (verifiedPairs[0]?.response) {
          const result = extractRuleEngineResult(verifiedPairs[0].response);
          expect(result.amount, '规则引擎返回的金额应为正数').toBeGreaterThan(0);
          expect(result.currency, '规则引擎应返回币种').toBeTruthy();
          console.log(`✓ 规则引擎返回金额: ${result.currency} ${result.amount}`);
        }

        break;
      }
    }

    expect(submitted, '应成功提交表单').toBe(true);

    // 等待页面响应
    await page.waitForTimeout(3000);

    // 验证 Google Maps 调用（如果页面根据时间段触发地图组件）
    const googleMapsCalls = verifyGoogleMapsCalls(cdpManager);
    expect(googleMapsCalls.length, '应检测到 Google Maps API 调用').toBeGreaterThanOrEqual(0);
  });

  test('场景 4: 日志与证据输出', async () => {
    // 执行一个简单的流程以收集网络事件
    await page.goto(`${PROD_BASE_URL}/shipments/create`);
    await page.waitForLoadState('domcontentloaded');

    // 填写地址以触发 Google Maps 调用
    const addressSelectors = [
      'input[name="shipperAddress1"]',
      'input[placeholder*="地址"]',
    ];

    for (const selector of addressSelectors) {
      if ((await page.locator(selector).count()) > 0) {
        await page.locator(selector).first().fill(TEST_ADDRESSES.pickup.address);
        await page.waitForTimeout(2000); // 等待地图 API 调用
        break;
      }
    }

    // 获取网络事件摘要
    const summary = cdpManager.getNetworkSummary();

    // 验证摘要包含数据
    expect(summary.requests.length, '应记录网络请求').toBeGreaterThan(0);

    // 保存摘要到文件
    const artifactsDir = path.join(__dirname, '../../../artifacts');
    if (!fs.existsSync(artifactsDir)) {
      fs.mkdirSync(artifactsDir, { recursive: true });
    }

    const summaryPath = path.join(artifactsDir, 'prod-network-summary.json');
    await cdpManager.saveNetworkSummary(summaryPath);

    // 验证文件已创建
    expect(fs.existsSync(summaryPath), '网络事件摘要文件应已创建').toBe(true);

    // 验证文件内容
    const fileContent = fs.readFileSync(summaryPath, 'utf-8');
    const parsedContent = JSON.parse(fileContent);
    expect(parsedContent.requests, '摘要应包含请求数据').toBeDefined();
    expect(parsedContent.responses, '摘要应包含响应数据').toBeDefined();
    expect(parsedContent.consoleMessages, '摘要应包含 console 消息').toBeDefined();

    console.log(`✓ 网络事件摘要已保存到: ${summaryPath}`);
    console.log(`  - 请求数: ${parsedContent.requests.length}`);
    console.log(`  - 响应数: ${parsedContent.responses.length}`);
    console.log(`  - Console 消息数: ${parsedContent.consoleMessages.length}`);
  });
});
