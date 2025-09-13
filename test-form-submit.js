const { chromium } = require('playwright');

async function testFormSubmit() {
  console.log('🔍 开始测试表单提交...');
  
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
  
  // 监听网络请求
  page.on('request', request => {
    console.log(`🌐 请求: ${request.method()} ${request.url()}`);
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
    
    // 检查表单状态
    const formValues = await page.evaluate(() => {
      const emailInput = document.querySelector('input[placeholder="邮箱"]');
      const passwordInput = document.querySelector('input[placeholder="密码"]');
      return {
        email: emailInput?.value,
        password: passwordInput?.value
      };
    });
    console.log('📝 表单值:', formValues);
    
    // 检查登录按钮状态
    const buttonState = await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]');
      return {
        disabled: button?.disabled,
        text: button?.textContent,
        visible: button ? true : false
      };
    });
    console.log('🔘 按钮状态:', buttonState);
    
    // 点击登录按钮
    console.log('🔐 点击登录按钮...');
    await page.click('button[type="submit"]');
    
    // 等待
    console.log('⏳ 等待5秒...');
    await page.waitForTimeout(5000);
    
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
    
    // 截图
    await page.screenshot({ path: 'test-results/form-submit-test.png', fullPage: true });
    
  } catch (error) {
    console.error('❌ 测试过程中出现错误:', error);
    await page.screenshot({ path: 'test-results/error-form-submit.png', fullPage: true });
  }
  
  await browser.close();
  console.log('🏁 表单提交测试完成');
}

testFormSubmit().catch(console.error);
