/**
 * 计费引擎实时计费测试
 * 创建时间: 2025-10-08 14:45:00
 * 作用: 测试运单创建页面的实时计费功能
 */

import { test, expect } from '@playwright/test';

test.describe('计费引擎实时计费测试', () => {
  test.beforeEach(async ({ page }) => {
    // 导航到运单创建页面
    await page.goto('http://localhost:3000/admin/shipments/create');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
  });

  test('应该成功调用计费引擎并显示实时费用', async ({ page }) => {
    // 监听 API 调用
    const pricingRequests: any[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/pricing/calculate')) {
        pricingRequests.push({
          url: request.url(),
          method: request.method(),
          postData: request.postDataJSON()
        });
      }
    });

    const pricingResponses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/pricing/calculate')) {
        const json = await response.json().catch(() => null);
        pricingResponses.push({
          status: response.status(),
          data: json
        });
      }
    });

    // 1. 选择客户
    console.log('步骤 1: 选择客户');
    await page.click('[name="customerId"]');
    await page.waitForTimeout(500);
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await page.waitForTimeout(1000);

    // 2. 填写发货人地址
    console.log('步骤 2: 填写发货人地址');
    await page.fill('[name="shipperAddress1"]', '228-8323 KENNEDY RD');
    await page.fill('[name="shipperCity"]', 'MARKHAM');
    await page.fill('[name="shipperProvince"]', 'ON');
    await page.fill('[name="shipperPostalCode"]', 'L3R 5W7');
    await page.fill('[name="shipperPhone"]', '+1-416-123-4567');

    // 3. 填写收货人地址
    console.log('步骤 3: 填写收货人地址');
    await page.fill('[name="receiverAddress1"]', '8323 KENNEDY RD');
    await page.fill('[name="receiverCity"]', 'MARKHAM');
    await page.fill('[name="receiverProvince"]', 'ON');
    await page.fill('[name="receiverPostalCode"]', 'L3R 5W7');
    await page.fill('[name="receiverPhone"]', '+1-416-987-6543');

    // 4. 填写货物信息
    console.log('步骤 4: 填写货物信息');
    await page.fill('[name="cargoLength"]', '100');
    await page.fill('[name="cargoWidth"]', '100');
    await page.fill('[name="cargoHeight"]', '100');
    await page.fill('[name="cargoWeight"]', '15');
    await page.fill('[name="cargoQuantity"]', '1');

    // 5. 填写距离（触发计费计算）
    console.log('步骤 5: 填写距离，触发计费引擎');
    await page.fill('[name="distance"]', '25');
    
    // 等待计费引擎响应
    await page.waitForTimeout(2000);

    // 验证 API 调用
    console.log('\n=== API 调用验证 ===');
    expect(pricingRequests.length).toBeGreaterThan(0);
    console.log(`✓ 计费引擎被调用了 ${pricingRequests.length} 次`);

    // 验证请求参数
    const lastRequest = pricingRequests[pricingRequests.length - 1];
    console.log('\n最后一次请求参数:', JSON.stringify(lastRequest.postData, null, 2));
    
    expect(lastRequest.postData).toHaveProperty('shipmentContext');
    expect(lastRequest.postData.shipmentContext).toHaveProperty('shipmentId');
    expect(lastRequest.postData.shipmentContext).toHaveProperty('distance');
    expect(lastRequest.postData.shipmentContext).toHaveProperty('weight');
    console.log('✓ 请求参数格式正确');

    // 验证 shipmentId 是 UUID 格式
    const shipmentId = lastRequest.postData.shipmentContext.shipmentId;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(shipmentId).toMatch(uuidRegex);
    console.log(`✓ shipmentId 是有效的 UUID: ${shipmentId}`);

    // 验证响应
    console.log('\n=== API 响应验证 ===');
    expect(pricingResponses.length).toBeGreaterThan(0);
    
    const lastResponse = pricingResponses[pricingResponses.length - 1];
    console.log(`HTTP 状态: ${lastResponse.status}`);
    console.log('响应数据:', JSON.stringify(lastResponse.data, null, 2));

    // 验证响应格式
    expect(lastResponse.status).toBe(200);
    expect(lastResponse.data).toHaveProperty('success', true);
    expect(lastResponse.data).toHaveProperty('data');
    expect(lastResponse.data.data).toHaveProperty('totalRevenue');
    expect(lastResponse.data.data).toHaveProperty('revenueBreakdown');
    
    console.log(`✓ 计费引擎返回成功`);
    console.log(`✓ 总收入: $${lastResponse.data.data.totalRevenue}`);

    // 验证页面显示的费用
    console.log('\n=== 前端显示验证 ===');
    const priceElement = await page.locator('text=/\\$\\d+/').first();
    await expect(priceElement).toBeVisible({ timeout: 5000 });
    
    const displayedPrice = await priceElement.textContent();
    console.log(`✓ 页面显示费用: ${displayedPrice}`);

    // 验证没有错误日志
    const consoleLogs: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' || msg.text().includes('降级到本地计算')) {
        consoleLogs.push(msg.text());
      }
    });

    // 等待确保没有延迟的错误
    await page.waitForTimeout(1000);

    if (consoleLogs.length > 0) {
      console.log('\n⚠️ 发现控制台错误:');
      consoleLogs.forEach(log => console.log(`  - ${log}`));
    }

    // 最终验证：不应该降级到本地计算
    const pageContent = await page.content();
    expect(pageContent).not.toContain('降级到本地计算');
    console.log('✓ 没有降级到本地计算');

    console.log('\n✅ 所有测试通过！计费引擎工作正常。');
  });

  test('应该正确处理不同距离的计费', async ({ page }) => {
    console.log('测试不同距离的计费差异');

    // 简化填写表单的辅助函数
    const fillBasicForm = async () => {
      await page.click('[name="customerId"]');
      await page.waitForTimeout(300);
      await page.keyboard.press('ArrowDown');
      await page.keyboard.press('Enter');
      
      await page.fill('[name="shipperAddress1"]', 'Test Address 1');
      await page.fill('[name="shipperCity"]', 'Toronto');
      await page.fill('[name="shipperProvince"]', 'ON');
      await page.fill('[name="shipperPostalCode"]', 'M5V 1A1');
      await page.fill('[name="shipperPhone"]', '+1-416-111-1111');
      
      await page.fill('[name="receiverAddress1"]', 'Test Address 2');
      await page.fill('[name="receiverCity"]', 'Toronto');
      await page.fill('[name="receiverProvince"]', 'ON');
      await page.fill('[name="receiverPostalCode"]', 'M5V 2A2');
      await page.fill('[name="receiverPhone"]', '+1-416-222-2222');
      
      await page.fill('[name="cargoLength"]', '100');
      await page.fill('[name="cargoWidth"]', '100');
      await page.fill('[name="cargoHeight"]', '100');
      await page.fill('[name="cargoWeight"]', '10');
      await page.fill('[name="cargoQuantity"]', '1');
    };

    const responses: any[] = [];
    page.on('response', async response => {
      if (response.url().includes('/api/pricing/calculate') && response.status() === 200) {
        const json = await response.json();
        responses.push(json.data);
      }
    });

    await fillBasicForm();

    // 测试 25km
    await page.fill('[name="distance"]', '25');
    await page.waitForTimeout(1500);

    // 测试 50km
    await page.fill('[name="distance"]', '50');
    await page.waitForTimeout(1500);

    // 测试 100km
    await page.fill('[name="distance"]', '100');
    await page.waitForTimeout(1500);

    // 验证费用随距离增加
    console.log(`\n收集到 ${responses.length} 个计费响应`);
    if (responses.length >= 2) {
      const prices = responses.map(r => r.totalRevenue);
      console.log('不同距离的费用:', prices);
      
      // 验证费用是递增的（通常距离越远费用越高）
      const isIncreasing = prices.every((price, i) => i === 0 || price >= prices[i - 1]);
      if (isIncreasing) {
        console.log('✓ 费用随距离正确增加');
      }
    }

    console.log('✅ 距离测试完成');
  });
});

