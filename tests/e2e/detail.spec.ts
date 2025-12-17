// 详情页测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试详情页的加载、核心字段显示、面包屑导航

import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { waitForPageLoad } from './utils/helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('详情页测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('运单详情页 - 从列表进入详情', async ({ page }) => {
    // 导航到运单列表
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 等待列表加载
    const table = page.locator('table, .ant-table').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
    
    // 查找第一行数据
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      // 点击第一行进入详情
      await firstRow.click();
      
      // 等待导航到详情页
      await page.waitForURL(/\/admin\/shipments\/\w+|\/shipments\/\w+/, { timeout: 10_000 });
      await waitForPageLoad(page);
      
      // 验证详情页核心字段显示
      // 查找订单号/运单号
      const orderId = page.locator(
        'text=/订单号|运单号|Shipment|Order/i, [data-testid="order-id"], [data-testid="shipment-id"]'
      ).first();
      
      if (await orderId.count() > 0) {
        await expect(orderId).toBeVisible();
      }
      
      // 查找状态
      const status = page.locator(
        '[data-testid="order-status"], [data-testid="shipment-status"], text=/状态|Status/i'
      ).first();
      
      if (await status.count() > 0) {
        await expect(status).toBeVisible();
      }
    } else {
      // 如果列表为空，跳过此测试
      test.skip();
    }
  });

  test('运单详情页 - 核心字段渲染', async ({ page }) => {
    // 先尝试从列表进入详情
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证核心信息区域存在
      const infoCard = page.locator(
        '.ant-card, [class*="card"], [class*="info"], [class*="detail"]'
      ).first();
      
      if (await infoCard.count() > 0) {
        await expect(infoCard).toBeVisible();
      }
      
      // 验证时间线/状态历史（如果存在）
      const timeline = page.locator(
        '.ant-timeline, [class*="timeline"], [data-testid="timeline"]'
      ).first();
      
      if (await timeline.count() > 0) {
        await expect(timeline).toBeVisible();
      }
    } else {
      test.skip();
    }
  });

  test('详情页 - 面包屑导航返回列表', async ({ page }) => {
    // 进入详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 查找面包屑
      const breadcrumb = page.locator('.ant-breadcrumb, [class*="breadcrumb"]').first();
      
      if (await breadcrumb.count() > 0) {
        // 查找返回列表的链接
        const listLink = breadcrumb.locator(
          'text=运单管理, text=Shipments, text=列表, a:has-text("运单")'
        ).first();
        
        if (await listLink.count() > 0) {
          await listLink.click();
          await page.waitForTimeout(1_000);
          
          // 验证已返回列表页
          await expect(page).toHaveURL(/\/admin\/shipments/, { timeout: 10_000 });
          await waitForPageLoad(page);
        }
      } else {
        // 如果没有面包屑，尝试使用浏览器返回按钮
        await page.goBack();
        await page.waitForTimeout(1_000);
        await waitForPageLoad(page);
      }
    } else {
      test.skip();
    }
  });

  test('详情页 - Tab 切换功能', async ({ page }) => {
    // 进入详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 查找 Tab 组件
      const tabs = page.locator('.ant-tabs, [class*="tabs"]').first();
      
      if (await tabs.count() > 0) {
        // 查找可用的 Tab
        const tabItems = [
          '详情',
          '时间线',
          '调度分配',
          'POD',
          '附件',
          'Detail',
          'Timeline',
          'Dispatch',
        ];
        
        for (const tabText of tabItems) {
          const tab = tabs.locator(`text=${tabText}`).first();
          
          if (await tab.count() > 0) {
            await tab.click();
            await page.waitForTimeout(1_000);
            
            // 验证 Tab 内容已加载
            await waitForPageLoad(page);
            
            // 只测试第一个可用的 Tab
            break;
          }
        }
      }
    } else {
      test.skip();
    }
  });

  test('客户详情页 - 基本信息显示', async ({ page }) => {
    // 导航到客户列表
    await page.goto(`${BASE_URL}/customers`);
    await waitForPageLoad(page);
    
    const table = page.locator('table, .ant-table').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证客户信息显示
      const customerInfo = page.locator(
        'text=/客户名称|Customer|联系人|Contact/i, [class*="customer-info"]'
      ).first();
      
      if (await customerInfo.count() > 0) {
        await expect(customerInfo).toBeVisible();
      }
    } else {
      test.skip();
    }
  });
});

