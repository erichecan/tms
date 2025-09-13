const { chromium } = require('playwright');

async function testSimpleLogin() {
  console.log('🔍 开始简单登录测试...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 2000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 监听所有控制台消息
  page.on('console', msg => {
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  try {
    console.log('📱 访问登录页面...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 等待页面完全加载
    await page.waitForTimeout(3000);
    
    // 填写登录表单
    console.log('📝 填写登录表单...');
    await page.fill('input[placeholder="邮箱"]', 'admin@demo.tms-platform.com');
    await page.fill('input[placeholder="密码"]', 'password');
    
    // 点击登录按钮
    console.log('🔐 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 等待更长时间
    console.log('⏳ 等待10秒...');
    await page.waitForTimeout(10000);
    
    // 检查localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('💾 localStorage:', localStorage);
    
    // 检查当前URL
    const currentUrl = page.url();
    console.log('🌐 当前URL:', currentUrl);
    
    // 检查页面内容
    const pageTitle = await page.title();
    console.log('📄 页面标题:', pageTitle);
    
    // 检查是否有错误消息
    const errorMessages = await page.locator('.ant-message-error').allTextContents();
    console.log('❌ 错误消息:', errorMessages);
    
    // 检查是否有成功消息
    const successMessages = await page.locator('.ant-message-success').allTextContents();
    console.log('✅ 成功消息:', successMessages);
    
    // 截图
    await page.screenshot({ path: 'test-results/simple-login-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    await page.screenshot({ path: 'test-results/error-simple-login.png', fullPage: true });
  }
  
  await browser.close();
  console.log('🏁 简单登录测试完成');
}

testSimpleLogin().catch(console.error);
