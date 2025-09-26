import { test, expect } from '@playwright/test';

test.describe('检查新页面和行间距', () => {
  test('检查运单创建页面行间距', async ({ page }) => {
    // 访问运单创建页面
    await page.goto('http://localhost:3000/create-shipment');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 截图运单创建页面的基础信息部分
    const basicInfoCard = page.locator('.ant-card').first();
    await basicInfoCard.screenshot({ path: 'test-results/shipment-create-basic-info.png' });
    
    // 检查行间距
    const formItems = page.locator('.ant-form-item');
    const firstItem = formItems.first();
    const secondItem = formItems.nth(1);
    
    const firstItemRect = await firstItem.boundingBox();
    const secondItemRect = await secondItem.boundingBox();
    
    if (firstItemRect && secondItemRect) {
      const spacing = secondItemRect.y - (firstItemRect.y + firstItemRect.height);
      console.log(`行间距: ${spacing}px`);
    }
  });

  test('检查新增的管理页面', async ({ page }) => {
    // 访问管理后台
    await page.goto('http://localhost:3000/admin');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 截图整个管理页面
    await page.screenshot({ path: 'test-results/admin-dashboard.png', fullPage: true });
    
    // 检查导航菜单
    const menuItems = page.locator('.ant-menu-item');
    const menuTexts = await menuItems.allTextContents();
    console.log('导航菜单项:', menuTexts);
    
    // 检查客户管理页面
    await page.click('text=客户管理');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/customer-management.png', fullPage: true });
    
    // 检查司机管理页面
    await page.click('text=司机管理');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/driver-management.png', fullPage: true });
    
    // 检查车辆管理页面
    await page.click('text=车辆管理');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/vehicle-management.png', fullPage: true });
    
    // 检查运单管理页面
    await page.click('text=运单管理');
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: 'test-results/shipment-management.png', fullPage: true });
  });
});
