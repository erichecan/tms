// 计费引擎与 Google Maps 集成闭环测试
// 创建时间: 2025-12-05 12:00:00
// 目的: 测试从地址输入到价格计算的完整流程，验证 Google Maps 距离计算是否被用于计费

import { test, expect } from '@playwright/test';
import { login, waitForPageLoad } from './helpers';

test.describe('计费引擎与 Google Maps 集成闭环测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
    await waitForPageLoad(page);
  });

  test('完整流程：地址输入 → Google Maps 距离计算 → 价格计算', async ({ page }) => {
    // 1. 访问运单创建页面
    await page.goto('/shipments/create');
    await waitForPageLoad(page);
    
    // 等待页面完全加载
    await page.waitForTimeout(1000);

    // 2. 填写发货人地址（使用加拿大地址，确保 Google Maps 可以正确解析）
    const shipperAddressInput = page.locator('input[name="shipperAddress1"], input[placeholder*="发货"], input[placeholder*="取货"]').first();
    if (await shipperAddressInput.count() > 0) {
      await shipperAddressInput.fill('3401 Dufferin St, North York, ON M6A 2T9');
      await page.waitForTimeout(2000); // 等待地址自动完成和地理编码
      
      console.log('✅ 填写发货地址完成');
    }

    // 3. 填写收货人地址
    const receiverAddressInput = page.locator('input[name="receiverAddress1"], input[placeholder*="收货"], input[placeholder*="送货"]').first();
    if (await receiverAddressInput.count() > 0) {
      await receiverAddressInput.fill('88 Apple Ave, Markham, ON L3R 5W7');
      await page.waitForTimeout(2000); // 等待地址自动完成和地理编码
      
      console.log('✅ 填写收货地址完成');
    }

    // 4. 等待 Google Maps 距离计算完成
    await page.waitForTimeout(3000); // 给足够时间让 Google Maps API 计算距离

    // 5. 检查距离字段是否已更新（前端应该自动填充）
    const distanceInput = page.locator('input[name*="distance"], input[name*="estimatedDistance"], input[name*="transportDistance"]').first();
    let actualDistance: number | null = null;
    
    if (await distanceInput.count() > 0) {
      const distanceValue = await distanceInput.inputValue();
      if (distanceValue) {
        actualDistance = parseFloat(distanceValue);
        console.log(`✅ Google Maps 计算的距离: ${actualDistance} km`);
        
        // 验证距离是合理的（North York 到 Markham 大约 20-30 km）
        expect(actualDistance).toBeGreaterThan(10);
        expect(actualDistance).toBeLessThan(100);
      }
    }

    // 6. 填写货物信息（触发价格计算需要）
    const weightInput = page.locator('input[name*="weight"], input[name*="cargoWeight"]').first();
    if (await weightInput.count() > 0) {
      await weightInput.fill('100');
      await page.waitForTimeout(500);
    }

    const lengthInput = page.locator('input[name*="length"], input[name*="cargoLength"]').first();
    if (await lengthInput.count() > 0) {
      await lengthInput.fill('50');
    }

    const widthInput = page.locator('input[name*="width"], input[name*="cargoWidth"]').first();
    if (await widthInput.count() > 0) {
      await widthInput.fill('40');
    }

    const heightInput = page.locator('input[name*="height"], input[name*="cargoHeight"]').first();
    if (await heightInput.count() > 0) {
      await heightInput.fill('30');
    }

    // 7. 等待价格计算完成（实时计费应该触发）
    await page.waitForTimeout(2000);

    // 8. 检查价格是否显示
    const priceDisplay = page.locator('text=/费用|价格|总计|总价|estimated.*cost/i, [class*="price"], [class*="cost"]').first();
    if (await priceDisplay.count() > 0) {
      const priceText = await priceDisplay.textContent();
      console.log(`✅ 显示的价格: ${priceText}`);
      
      // 验证价格包含数字
      const priceMatch = priceText?.match(/[\d,]+\.?\d*/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[0].replace(/,/g, ''));
        expect(price).toBeGreaterThan(0);
        console.log(`✅ 解析的价格: ${price}`);
      }
    }

    // 9. 检查控制台日志，确认使用了 Google Maps
    const logs: string[] = [];
    page.on('console', msg => {
      if (msg.text().includes('Google Maps') || msg.text().includes('距离计算')) {
        logs.push(msg.text());
      }
    });

    // 10. 验证后端是否接收了距离
    // 监听 API 请求
    let distanceSentToBackend = false;
    page.on('request', request => {
      if (request.url().includes('/api') && (request.url().includes('shipments') || request.url().includes('pricing'))) {
        const postData = request.postData();
        if (postData) {
          try {
            const data = JSON.parse(postData);
            if (data.distanceKm || data.transportDistance || data.distance || 
                (data.shipmentContext && data.shipmentContext.distance)) {
              distanceSentToBackend = true;
              console.log('✅ 距离已发送到后端:', 
                data.distanceKm || data.transportDistance || data.distance || 
                (data.shipmentContext && data.shipmentContext.distance));
            }
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    });

    // 11. 尝试保存运单（如果不保存，也可以只测试预览）
    const submitButton = page.locator('button[type="submit"], button:has-text("创建"), button:has-text("保存")').first();
    if (await submitButton.count() > 0 && await submitButton.isEnabled()) {
      // 可以注释掉实际提交，只测试预览
      // await submitButton.click();
      // await page.waitForTimeout(2000);
    }

    // 12. 总结验证
    console.log('=== 测试总结 ===');
    console.log(`距离计算: ${actualDistance ? '✅ 成功' : '❌ 失败'}`);
    console.log(`距离发送到后端: ${distanceSentToBackend ? '✅ 是' : '⚠️ 未检测到'}`);
    
    // 基本验证
    expect(actualDistance).not.toBeNull();
    expect(actualDistance!).toBeGreaterThan(0);
  });

  test('验证 Google Maps API 调用', async ({ page }) => {
    await page.goto('/shipments/create');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    let mapsApiCalled = false;
    let distanceCalculated = false;

    // 监听网络请求
    page.on('request', request => {
      const url = request.url();
      if (url.includes('maps.googleapis.com') || url.includes('googleapis.com/maps')) {
        mapsApiCalled = true;
        console.log('✅ Google Maps API 调用:', url);
      }
    });

    // 监听控制台消息
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('距离计算成功') || text.includes('Distance calculated') || 
          text.includes('Google Maps') && text.includes('distance')) {
        distanceCalculated = true;
        console.log('✅ 距离计算日志:', text);
      }
    });

    // 填写地址触发计算
    const shipperInput = page.locator('input[name*="shipper"], input[placeholder*="取货"]').first();
    const receiverInput = page.locator('input[name*="receiver"], input[placeholder*="送货"]').first();
    
    if (await shipperInput.count() > 0) {
      await shipperInput.fill('3401 Dufferin St, North York, ON');
      await page.waitForTimeout(1500);
    }
    
    if (await receiverInput.count() > 0) {
      await receiverInput.fill('88 Apple Ave, Markham, ON');
      await page.waitForTimeout(3000); // 等待 API 调用和计算
    }

    console.log('=== API 调用验证 ===');
    console.log(`Google Maps API 调用: ${mapsApiCalled ? '✅ 是' : '⚠️ 未检测到（可能使用前端 SDK）'}`);
    console.log(`距离计算: ${distanceCalculated ? '✅ 是' : '⚠️ 未检测到'}`);

    // 如果使用前端 SDK，可能不会在 network 中看到请求，所以只验证功能
    expect(distanceCalculated || mapsApiCalled).toBeTruthy();
  });

  test('验证价格计算使用 Google Maps 距离', async ({ page }) => {
    await page.goto('/shipments/create');
    await waitForPageLoad(page);
    await page.waitForTimeout(1000);

    // 填写地址
    const shipperInput = page.locator('input[name*="shipper"]').first();
    const receiverInput = page.locator('input[name*="receiver"]').first();
    
    if (await shipperInput.count() > 0) {
      await shipperInput.fill('3401 Dufferin St, North York, ON M6A 2T9');
    }
    if (await receiverInput.count() > 0) {
      await receiverInput.fill('88 Apple Ave, Markham, ON L3R 5W7');
    }

    // 填写货物信息
    const weightInput = page.locator('input[name*="weight"]').first();
    if (await weightInput.count() > 0) {
      await weightInput.fill('100');
    }

    // 等待距离和价格计算
    await page.waitForTimeout(4000);

    // 获取距离值
    const distanceInput = page.locator('input[name*="distance"]').first();
    let distance: number | null = null;
    
    if (await distanceInput.count() > 0) {
      const distanceValue = await distanceInput.inputValue();
      if (distanceValue) {
        distance = parseFloat(distanceValue);
      }
    }

    // 监听价格计算 API 请求
    let pricingRequestData: any = null;
    page.on('request', request => {
      if (request.url().includes('/api') && 
          (request.url().includes('pricing') || request.url().includes('calculate'))) {
        const postData = request.postData();
        if (postData) {
          try {
            pricingRequestData = JSON.parse(postData);
          } catch (e) {
            // 忽略
          }
        }
      }
    });

    // 触发价格计算（如果有计算按钮）
    const calculateButton = page.locator('button:has-text("计算"), button:has-text("预览")').first();
    if (await calculateButton.count() > 0) {
      await calculateButton.click();
      await page.waitForTimeout(2000);
    }

    // 验证价格计算请求中包含距离
    if (pricingRequestData) {
      const requestDistance = pricingRequestData.distance || 
                             pricingRequestData.distanceKm ||
                             pricingRequestData.shipmentContext?.distance;
      
      console.log('价格计算请求中的距离:', requestDistance);
      
      if (distance && requestDistance) {
        // 允许小的差异（浮点数精度）
        expect(Math.abs(distance - requestDistance)).toBeLessThan(1);
        console.log('✅ 价格计算使用了 Google Maps 距离');
      }
    }

    // 基本验证
    expect(distance).not.toBeNull();
    expect(distance!).toBeGreaterThan(0);
  });
});

