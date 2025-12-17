// Playwright 端到端健康检查配置
// 创建时间: 2025-12-05 12:00:00
// 用途: TMS 网站联调前的端到端健康检查（Smoke/E2E）

import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
  // 测试目录
  testDir: './tests/e2e',
  
  // 测试超时时间（60秒）
  timeout: 60_000,
  
  // 断言超时时间（10秒）
  expect: { 
    timeout: 10_000 
  },
  
  // 全局设置
  fullyParallel: true,
  
  // 失败时重试次数
  retries: 2,
  
  // 工作线程数（CI 环境使用 1，本地使用默认）
  workers: process.env.CI ? 1 : undefined,
  
  // 测试报告配置 - 2025-12-10 20:00:00 更新：添加生产环境报告输出
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results.json' }],
    ['junit', { outputFile: 'test-results.xml' }],
    ['list'],
    // 生产环境测试报告输出到独立目录
    process.env.CI ? ['html', { outputFolder: 'test-results/prod-report' }] : null,
  ].filter(Boolean) as any,
  
  // 共享设置
  use: {
    // 基础 URL - 从环境变量读取，默认本地开发环境
    baseURL: process.env.BASE_URL || 'http://localhost:3000',
    
    // 控制台日志级别
    console: 'warn', // 只记录警告和错误
    
    // 测试时截图 - 失败时自动截图
    screenshot: 'only-on-failure',
    
    // 测试时录制视频 - 失败时保留视频
    video: 'retain-on-failure',
    
    // 测试时的追踪 - 失败时记录追踪
    trace: 'retain-on-failure',
    
    // 忽略 HTTPS 错误
    ignoreHTTPSErrors: true,
    
    // 操作超时时间
    actionTimeout: 10_000,
    
    // 导航超时时间
    navigationTimeout: 30_000,
    
    // 区域设置
    locale: 'zh-CN',
    
    // 时区
    timezoneId: 'Asia/Shanghai',
  },
  
  // 不同浏览器配置
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // 视口大小
        viewport: { width: 1920, height: 1080 },
      },
    },
    // 生产环境测试项目 - 2025-12-10 20:00:00 添加
    {
      name: 'prod',
      testMatch: /.*prod.*\.spec\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        // 生产环境基础 URL
        baseURL: process.env.PROD_BASE_URL || process.env.BASE_URL || 'http://localhost:3000',
        // 生产环境需要更长的超时时间
        actionTimeout: 15_000,
        navigationTimeout: 45_000,
        // 生产环境始终录制视频和追踪（用于问题排查）
        video: 'on',
        trace: 'on',
        screenshot: 'on',
      },
      // 生产环境测试超时时间更长
      timeout: 120_000,
      expect: {
        timeout: 15_000,
      },
    },
    // 可选：其他浏览器测试（根据需要启用）
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],
  
  // 输出目录
  outputDir: 'test-results/',
  
  // 全局设置和清理
  globalSetup: undefined,
  globalTeardown: undefined,
});

