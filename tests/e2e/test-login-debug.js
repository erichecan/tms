const { chromium } = require('playwright');
const fs = require('fs');

async function testLoginDebug() {
  console.log('🔍 开始调试登录流程...');
  
  const browser = await chromium.launch({ 
    headless: false,
    slowMo: 1000
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 监听所有控制台消息
  const allConsoleMessages = [];
  page.on('console', msg => {
    allConsoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
    console.log(`[${msg.type().toUpperCase()}] ${msg.text()}`);
  });
  
  // 监听页面错误
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    console.error('❌ 页面错误:', error.message);
  });
  
  // 监听网络请求和响应
  const networkData = [];
  page.on('request', request => {
    if (request.url().includes('/auth/login')) {
      networkData.push({
        type: 'request',
        url: request.url(),
        method: request.method(),
        postData: request.postData(),
        headers: request.headers()
      });
    }
  });
  
  page.on('response', async response => {
    if (response.url().includes('/auth/login')) {
      try {
        const body = await response.text();
        networkData.push({
          type: 'response',
          url: response.url(),
          status: response.status(),
          headers: response.headers(),
          body: body
        });
      } catch (e) {
        console.error('读取响应体失败:', e);
      }
    }
  });
  
  try {
    console.log('📱 访问登录页面...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 等待页面完全加载
    await page.waitForTimeout(2000);
    
    // 填写登录表单
    console.log('📝 填写登录表单...');
    await page.fill('input[placeholder="邮箱"]', 'admin@demo.tms-platform.com');
    await page.fill('input[placeholder="密码"]', 'password');
    
    // 点击登录按钮前，检查localStorage
    const localStorageBefore = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('💾 登录前localStorage:', localStorageBefore);
    
    // 点击登录按钮
    console.log('🔐 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 等待登录处理
    await page.waitForTimeout(3000);
    
    // 检查登录后的localStorage
    const localStorageAfter = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    });
    console.log('💾 登录后localStorage:', localStorageAfter);
    
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
    await page.screenshot({ path: 'test-results/debug-test.png', fullPage: true });
    
    // 保存调试结果
    const debugResults = {
      timestamp: new Date().toISOString(),
      allConsoleMessages,
      pageErrors,
      networkData,
      localStorageBefore,
      localStorageAfter,
      currentUrl,
      errorMessages,
      successMessages
    };
    
    if (!fs.existsSync('test-results')) {
      fs.mkdirSync('test-results');
    }
    
    fs.writeFileSync('test-results/debug-test-results.json', JSON.stringify(debugResults, null, 2));
    console.log('💾 调试结果已保存');
    
  } catch (error) {
    console.error('❌ 调试过程中出现错误:', error);
    await page.screenshot({ path: 'test-results/error-debug.png', fullPage: true });
  }
  
  await browser.close();
  console.log('🏁 调试测试完成');
}

testLoginDebug().catch(console.error);
