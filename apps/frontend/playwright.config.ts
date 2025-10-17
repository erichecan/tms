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
    baseURL: 'https://tms-frontend-1038443972557.northamerica-northeast2.run.app',
    
    // 测试时截图
    screenshot: 'only-on-failure',
    
    // 测试时录制视频
    video: 'retain-on-failure',
    
    // 测试时的追踪
    trace: 'on-first-retry',
    
    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,
  },

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

