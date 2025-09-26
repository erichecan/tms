import { test, expect } from '@playwright/test';

test.describe('调试导航问题', () => {
  test('检查页面加载和认证状态', async ({ page }) => {
    // 访问管理后台
    await page.goto('http://localhost:3000/admin');
    
    // 等待页面完全加载
    await page.waitForLoadState('networkidle');
    
    // 截图整个页面
    await page.screenshot({ path: 'test-results/debug-admin-page.png', fullPage: true });
    
    // 检查是否有认证相关的重定向
    console.log('当前URL:', page.url());
    
    // 检查页面标题
    const title = await page.title();
    console.log('页面标题:', title);
    
    // 检查是否有错误信息
    const errorElements = await page.locator('.error, .ant-alert-error').count();
    console.log('错误元素数量:', errorElements);
    
    // 检查是否有加载状态
    const loadingElements = await page.locator('.ant-spin, .loading').count();
    console.log('加载元素数量:', loadingElements);
    
    // 检查根元素内容
    const rootContent = await page.locator('#root').textContent();
    console.log('根元素内容长度:', rootContent?.length || 0);
    
    // 检查是否有React应用渲染
    const reactRoot = await page.locator('#root > div').count();
    console.log('React根元素数量:', reactRoot);
    
    // 检查控制台错误
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.log('控制台错误:', msg.text());
      }
    });
    
    // 等待一段时间让页面完全渲染
    await page.waitForTimeout(3000);
    
    // 再次截图
    await page.screenshot({ path: 'test-results/debug-admin-page-after-wait.png', fullPage: true });
    
    // 检查侧边栏是否存在
    const sidebar = page.locator('.ant-layout-sider');
    const sidebarExists = await sidebar.count();
    console.log('侧边栏元素数量:', sidebarExists);
    
    if (sidebarExists > 0) {
      const sidebarVisible = await sidebar.isVisible();
      console.log('侧边栏是否可见:', sidebarVisible);
      
      if (sidebarVisible) {
        // 检查菜单项
        const menuItems = page.locator('.ant-menu-item');
        const menuCount = await menuItems.count();
        console.log('菜单项数量:', menuCount);
        
        for (let i = 0; i < menuCount; i++) {
          const menuText = await menuItems.nth(i).textContent();
          console.log(`菜单项 ${i + 1}: ${menuText}`);
        }
      }
    }
  });
});
