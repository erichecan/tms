import { test, expect } from '@playwright/test';

test.describe('检查导航菜单', () => {
  test('检查管理后台导航菜单', async ({ page }) => {
    // 访问管理后台
    await page.goto('http://localhost:3000/admin');
    
    // 等待页面加载
    await page.waitForLoadState('networkidle');
    
    // 截图整个页面
    await page.screenshot({ path: 'test-results/admin-navigation.png', fullPage: true });
    
    // 检查侧边栏菜单
    const sidebar = page.locator('.ant-layout-sider');
    await expect(sidebar).toBeVisible();
    
    // 检查菜单项
    const menuItems = page.locator('.ant-menu-item');
    const menuCount = await menuItems.count();
    console.log(`找到 ${menuCount} 个菜单项`);
    
    // 获取所有菜单项的文本
    for (let i = 0; i < menuCount; i++) {
      const menuText = await menuItems.nth(i).textContent();
      console.log(`菜单项 ${i + 1}: ${menuText}`);
    }
    
    // 尝试点击每个菜单项
    const menuTexts = ['客户管理', '司机管理', '车辆管理', '运单管理'];
    
    for (const menuText of menuTexts) {
      try {
        console.log(`尝试点击: ${menuText}`);
        await page.click(`text=${menuText}`);
        await page.waitForTimeout(1000);
        await page.screenshot({ path: `test-results/${menuText.replace('管理', '-management')}.png`, fullPage: true });
        console.log(`✅ 成功访问: ${menuText}`);
      } catch (error) {
        console.log(`❌ 无法访问: ${menuText} - ${error.message}`);
      }
    }
  });
});
