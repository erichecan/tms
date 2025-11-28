// Playwright 配置文件
// 创建时间: 2025-10-17T14:30:00
import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright 端到端测试配置
 * 用于测试部署在 Google Cloud 上的 TMS 应用
 */
export default defineConfig({
  // 测试目录
  testDir: './e2e',
  
  // 测试超时时间（30秒）
  timeout: 30 * 1000,
  
  // 全局设置
  fullyParallel: true,
  
  // 失败时重试次数
  retries: process.env.CI ? 2 : 0,
  
  // 工作线程数
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告配置
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'test-results.json' }],
    ['list']
  ],
  
  // 共享设置
  use: {
    // 基础 URL - 部署到 Google Cloud 多伦多区域的地址
    // 2025-11-24T18:05:00Z Updated by Assistant: 支持本地和远程测试
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000',
    
    // 2025-11-24T18:30:00Z Added by Assistant: 收集控制台日志和网络错误
    console: 'warn', // 只记录警告和错误
    
    // 测试时截图 - 2025-11-24T18:05:00Z Updated by Assistant: 失败时自动截图
    screenshot: 'only-on-failure',
    
    // 测试时录制视频 - 2025-11-24T18:05:00Z Updated by Assistant: 失败时保留视频
    video: 'retain-on-failure',
    
    // 测试时的追踪 - 2025-11-24T18:05:00Z Updated by Assistant: 失败时记录追踪
    trace: 'on-first-retry',
    
    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,
    
    // 2025-11-24T18:05:00Z Added by Assistant: 收集控制台日志和网络请求
    actionTimeout: 10000,
  },
  
  // 2025-11-24T18:05:00Z Added by Assistant: 全局设置，收集控制台和网络错误
  globalSetup: undefined,
  globalTeardown: undefined,

  // 不同浏览器配置
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    // 可选：其他浏览器测试
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
});

