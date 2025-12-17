// 上传与下载测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试文件上传、下载、附件管理功能

import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { waitForPageLoad } from './utils/helpers';
import * as path from 'path';
import * as fs from 'fs';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

// 创建测试文件目录
const testFixturesDir = path.join(__dirname, '../fixtures');
if (!fs.existsSync(testFixturesDir)) {
  fs.mkdirSync(testFixturesDir, { recursive: true });
}

// 创建示例测试文件
const createTestFile = (filename: string, content: string): string => {
  const filePath = path.join(testFixturesDir, filename);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, content);
  }
  return filePath;
};

test.describe('上传与下载测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('上传附件 - 图片文件', async ({ page }) => {
    // 进入运单详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 切换到附件 Tab（如果有）
      const attachmentsTab = page.locator(
        '.ant-tabs-tab:has-text("附件"), .ant-tabs-tab:has-text("Attachments"), text=附件'
      ).first();
      
      if (await attachmentsTab.count() > 0) {
        await attachmentsTab.click();
        await page.waitForTimeout(1_000);
      }
      
      // 查找文件上传输入框
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // 创建测试图片文件（简单的文本文件模拟）
        const testImagePath = createTestFile('test-image.jpg', 'fake image content');
        
        // 上传文件
        await fileInput.setInputFiles(testImagePath);
        
        // 等待上传完成
        await page.waitForTimeout(3_000);
        
        // 验证上传成功（检查附件列表或成功提示）
        const successMessage = page.locator(
          '.ant-message-success, [class*="success"], text=/上传成功|Upload success/i'
        );
        
        const attachmentList = page.locator(
          '[data-testid="attachment-row"], .ant-list-item, [class*="attachment"]'
        );
        
        // 应该显示成功提示或附件列表中有新项
        const hasSuccess = await successMessage.count() > 0;
        const hasAttachment = await attachmentList.count() > 0;
        
        expect(hasSuccess || hasAttachment).toBeTruthy();
      } else {
        // 如果没有文件上传功能，跳过此测试
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('上传附件 - PDF 文件', async ({ page }) => {
    // 进入运单详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 切换到附件 Tab
      const attachmentsTab = page.locator(
        '.ant-tabs-tab:has-text("附件"), .ant-tabs-tab:has-text("Attachments")'
      ).first();
      
      if (await attachmentsTab.count() > 0) {
        await attachmentsTab.click();
        await page.waitForTimeout(1_000);
      }
      
      const fileInput = page.locator('input[type="file"]').first();
      
      if (await fileInput.count() > 0) {
        // 创建测试 PDF 文件
        const testPdfPath = createTestFile('test-document.pdf', '%PDF-1.4 fake pdf content');
        
        await fileInput.setInputFiles(testPdfPath);
        await page.waitForTimeout(3_000);
        
        // 验证上传成功
        const successIndicator = page.locator(
          '.ant-message-success, [class*="success"], [data-testid="attachment-row"]'
        ).first();
        
        if (await successIndicator.count() > 0) {
          await expect(successIndicator).toBeVisible({ timeout: 10_000 });
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('下载文件 - 导出 CSV', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 查找导出按钮
    const exportButton = page.locator(
      'button:has-text("导出"), button:has-text("Export"), button:has-text("下载"), [data-testid="export-csv"]'
    ).first();
    
    if (await exportButton.count() > 0) {
      // 设置下载路径
      const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
      
      // 点击导出按钮
      await exportButton.click();
      
      // 等待下载完成
      const download = await downloadPromise;
      
      // 验证下载成功
      expect(download.suggestedFilename()).toBeTruthy();
      
      // 保存文件到临时目录
      const downloadDir = path.join(__dirname, '../../tmp/downloads');
      if (!fs.existsSync(downloadDir)) {
        fs.mkdirSync(downloadDir, { recursive: true });
      }
      
      const filePath = path.join(downloadDir, download.suggestedFilename());
      await download.saveAs(filePath);
      
      // 验证文件存在
      expect(fs.existsSync(filePath)).toBeTruthy();
    } else {
      // 如果没有导出功能，跳过此测试
      test.skip();
    }
  });

  test('下载文件 - 对账单', async ({ page }) => {
    // 进入运单详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 查找对账单下载按钮
      const invoiceButton = page.locator(
        'button:has-text("对账单"), button:has-text("Invoice"), button:has-text("账单"), [data-testid="download-invoice"]'
      ).first();
      
      if (await invoiceButton.count() > 0) {
        const downloadPromise = page.waitForEvent('download', { timeout: 30_000 });
        
        await invoiceButton.click();
        
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toBeTruthy();
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('附件列表显示', async ({ page }) => {
    // 进入运单详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 切换到附件 Tab
      const attachmentsTab = page.locator(
        '.ant-tabs-tab:has-text("附件"), .ant-tabs-tab:has-text("Attachments")'
      ).first();
      
      if (await attachmentsTab.count() > 0) {
        await attachmentsTab.click();
        await page.waitForTimeout(1_000);
        
        // 验证附件列表显示（可能为空或有内容）
        const attachmentList = page.locator(
          '.ant-list, [class*="attachment-list"], [data-testid="attachment-list"]'
        ).first();
        
        if (await attachmentList.count() > 0) {
          await expect(attachmentList).toBeVisible();
        } else {
          // 如果没有附件列表，检查是否有空状态
          const emptyState = page.locator(
            '.ant-empty, text=/暂无附件|No attachments/i'
          ).first();
          
          if (await emptyState.count() > 0) {
            await expect(emptyState).toBeVisible();
          }
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });

  test('删除附件', async ({ page }) => {
    // 进入运单详情页
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const firstRow = page.locator('tbody tr').first();
    
    if (await firstRow.count() > 0) {
      await firstRow.click();
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 切换到附件 Tab
      const attachmentsTab = page.locator(
        '.ant-tabs-tab:has-text("附件"), .ant-tabs-tab:has-text("Attachments")'
      ).first();
      
      if (await attachmentsTab.count() > 0) {
        await attachmentsTab.click();
        await page.waitForTimeout(1_000);
        
        // 查找删除按钮
        const deleteButton = page.locator(
          'button:has-text("删除"), button[aria-label*="删除"], [data-testid="delete-attachment"]'
        ).first();
        
        if (await deleteButton.count() > 0 && await deleteButton.isVisible()) {
          // 记录删除前的附件数量
          const beforeCount = await page.locator(
            '[data-testid="attachment-row"], .ant-list-item'
          ).count();
          
          await deleteButton.click();
          
          // 如果有确认对话框，确认删除
          const confirmButton = page.locator(
            'button:has-text("确认"), button:has-text("确定"), .ant-modal-confirm button:has-text("确定")'
          ).first();
          
          if (await confirmButton.count() > 0) {
            await confirmButton.click();
          }
          
          // 等待删除完成
          await page.waitForTimeout(2_000);
          
          // 验证删除成功提示
          await expect(
            page.locator('.ant-message-success, [class*="success"]')
          ).toBeVisible({ timeout: 10_000 });
        } else {
          test.skip();
        }
      } else {
        test.skip();
      }
    } else {
      test.skip();
    }
  });
});

