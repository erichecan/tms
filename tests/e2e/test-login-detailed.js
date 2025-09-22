const { chromium } = require('playwright');
const fs = require('fs');

async function testLoginDetailed() {
  console.log('🔍 开始详细测试登录流程...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 500
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 监听网络响应
  const responses = [];
  page.on('response', async response => {
    if (response.url().includes('/auth/login')) {
      try {
        const body = await response.text();
        responses.push({
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: body
        });
        console.log('🔍 登录API响应:', {
          status: response.status(),
          body: body
        });
      } catch (e) {
        console.error('读取响应体失败:', e);
      }
    }
  });
  
  // 监听控制台错误
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.error('❌ 控制台错误:', msg.text());
    }
  });
  
  try {
    console.log('📱 访问登录页面...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 填写登录表单
    console.log('📝 填写登录表单...');
    await page.fill('input[placeholder="邮箱"]', 'admin@demo.tms-platform.com');
    await page.fill('input[placeholder="密码"]', 'password');
    
    // 点击登录按钮
    console.log('🔐 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 等待API响应
    await page.waitForTimeout(3000);
    
    // 检查localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    
    console.log('💾 LocalStorage内容:', localStorage);
    
    // 检查当前URL
    const currentUrl = page.url();
    console.log('🌐 当前URL:', currentUrl);
    
    // 检查是否有错误消息
    const errorMessages = await page.locator('.ant-message-error').allTextContents();
    console.log('❌ 错误消息:', errorMessages);
    
    // 检查是否有成功消息
    const successMessages = await page.locator('.ant-message-success').allTextContents();
    console.log('✅ 成功消息:', successMessages);
    
    // 截图
    await page.screenshot({ path: 'test-results/detailed-test.png', fullPage: true });
    
    // 保存详细结果
    const detailedResults = {
      timestamp: new Date().toISOString(),
      responses,
      localStorage,
      currentUrl,
      errorMessages,
      successMessages
    };
    
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }
    
    fs.writeFileSync('test-results/detailed-test-results.json', JSON.stringify(detailedResults, null, 2));
    console.log('💾 详细测试结果已保存');
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    await page.screenshot({ path: 'test-results/error-detailed.png', fullPage: true });
  }
  
  await browser.close();
  console.log('🏁 详细测试完成');
}

testLoginDetailed().catch(console.error);
