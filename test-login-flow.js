const { chromium } = require('playwright');
const fs = require('fs');

async function testLoginFlow() {
  console.log('🚀 开始自动化测试登录流程...');
  
  const browser = await chromium.launch({ 
    headless: false, // 显示浏览器窗口
    slowMo: 1000 // 减慢操作速度以便观察
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  // 监听网络请求
  const networkRequests = [];
  page.on('request', request => {
    networkRequests.push({
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      postData: request.postData()
    });
  });
  
  // 监听网络响应
  const networkResponses = [];
  page.on('response', response => {
    networkResponses.push({
      url: response.url(),
      status: response.status(),
      statusText: response.statusText(),
      headers: response.headers()
    });
  });
  
  // 监听控制台消息
  const consoleMessages = [];
  page.on('console', msg => {
    consoleMessages.push({
      type: msg.type(),
      text: msg.text(),
      timestamp: new Date().toISOString()
    });
  });
  
  // 监听页面错误
  const pageErrors = [];
  page.on('pageerror', error => {
    pageErrors.push({
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });
  
  try {
    console.log('📱 访问前端页面...');
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // 截图当前页面
    await page.screenshot({ path: 'test-results/01-initial-page.png', fullPage: true });
    console.log('📸 截图: 初始页面');
    
    // 检查是否在登录页面
    const isLoginPage = await page.locator('form').isVisible();
    console.log('🔍 是否在登录页面:', isLoginPage);
    
    if (isLoginPage) {
      console.log('📝 填写登录表单...');
      
      // 等待页面完全加载
      await page.waitForTimeout(2000);
      
      // 查找所有输入框
      const inputs = await page.locator('input').all();
      console.log('🔍 找到的输入框数量:', inputs.length);
      
      // 打印所有输入框的属性
      for (let i = 0; i < inputs.length; i++) {
        const type = await inputs[i].getAttribute('type');
        const name = await inputs[i].getAttribute('name');
        const placeholder = await inputs[i].getAttribute('placeholder');
        console.log(`输入框 ${i + 1}: type="${type}", name="${name}", placeholder="${placeholder}"`);
      }
      
      // 尝试多种方式填写邮箱
      try {
        await page.fill('input[type="email"]', 'admin@demo.tms-platform.com');
        console.log('✅ 通过type="email"填写邮箱成功');
      } catch (e) {
        try {
          await page.fill('input[name="email"]', 'admin@demo.tms-platform.com');
          console.log('✅ 通过name="email"填写邮箱成功');
        } catch (e) {
          try {
            await page.fill('input[placeholder*="邮箱"], input[placeholder*="email"]', 'admin@demo.tms-platform.com');
            console.log('✅ 通过placeholder填写邮箱成功');
          } catch (e) {
            // 使用第一个输入框
            await page.fill('input:first-of-type', 'admin@demo.tms-platform.com');
            console.log('✅ 使用第一个输入框填写邮箱');
          }
        }
      }
      
      // 尝试多种方式填写密码
      try {
        await page.fill('input[type="password"]', 'password');
        console.log('✅ 通过type="password"填写密码成功');
      } catch (e) {
        try {
          await page.fill('input[name="password"]', 'password');
          console.log('✅ 通过name="password"填写密码成功');
        } catch (e) {
          try {
            await page.fill('input[placeholder*="密码"], input[placeholder*="password"]', 'password');
            console.log('✅ 通过placeholder填写密码成功');
          } catch (e) {
            // 使用第二个输入框
            await page.fill('input:nth-of-type(2)', 'password');
            console.log('✅ 使用第二个输入框填写密码');
          }
        }
      }
      
      // 截图填写表单后
      await page.screenshot({ path: 'test-results/02-form-filled.png', fullPage: true });
      console.log('📸 截图: 表单填写完成');
      
      console.log('🔐 点击登录按钮...');
      
      // 点击登录按钮
      await page.click('button[type="submit"], button:has-text("登录"), button:has-text("Login")');
      
      // 等待页面响应
      await page.waitForTimeout(3000);
      
      // 截图登录后
      await page.screenshot({ path: 'test-results/03-after-login.png', fullPage: true });
      console.log('📸 截图: 登录后页面');
      
      // 检查当前URL
      const currentUrl = page.url();
      console.log('🌐 当前URL:', currentUrl);
      
      // 检查页面内容
      const pageTitle = await page.title();
      console.log('📄 页面标题:', pageTitle);
      
      // 检查是否有错误消息
      const errorMessages = await page.locator('.error, .alert-danger, [role="alert"]').allTextContents();
      console.log('❌ 错误消息:', errorMessages);
      
      // 检查是否有成功消息
      const successMessages = await page.locator('.success, .alert-success').allTextContents();
      console.log('✅ 成功消息:', successMessages);
      
      // 检查是否显示用户信息
      const userInfo = await page.locator('[data-testid="user-info"], .user-info, .user-name').allTextContents();
      console.log('👤 用户信息:', userInfo);
      
      // 检查是否在仪表板页面
      const isDashboard = await page.locator('h1, h2').allTextContents();
      console.log('📊 页面标题内容:', isDashboard);
      
      // 等待更长时间看是否有跳转
      console.log('⏳ 等待5秒观察页面变化...');
      await page.waitForTimeout(5000);
      
      const finalUrl = page.url();
      console.log('🏁 最终URL:', finalUrl);
      
      // 最终截图
      await page.screenshot({ path: 'test-results/04-final-state.png', fullPage: true });
      console.log('📸 截图: 最终状态');
      
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
      
      // 检查sessionStorage
      const sessionStorage = await page.evaluate(() => {
        const items = {};
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const key = window.sessionStorage.key(i);
          items[key] = window.sessionStorage.getItem(key);
        }
        return items;
      });
      console.log('🗂️ SessionStorage内容:', sessionStorage);
      
    } else {
      console.log('⚠️ 不在登录页面，可能已经登录或页面结构不同');
    }
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    await page.screenshot({ path: 'test-results/error-screenshot.png', fullPage: true });
  }
  
  // 保存测试结果
  const testResults = {
    timestamp: new Date().toISOString(),
    networkRequests,
    networkResponses,
    consoleMessages,
    pageErrors,
    localStorage: await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        items[key] = window.localStorage.getItem(key);
      }
      return items;
    }),
    sessionStorage: await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < window.sessionStorage.length; i++) {
        const key = window.sessionStorage.key(i);
        items[key] = window.sessionStorage.getItem(key);
      }
      return items;
    })
  };
  
  // 确保测试结果目录存在
  if (!fs.existsSync('test-results')) {
    fs.mkdirSync('test-results');
  }
  
  fs.writeFileSync('test-results/test-results.json', JSON.stringify(testResults, null, 2));
  console.log('💾 测试结果已保存到 test-results/test-results.json');
  
  await browser.close();
  console.log('🏁 测试完成');
}

// 运行测试
testLoginFlow().catch(console.error);
