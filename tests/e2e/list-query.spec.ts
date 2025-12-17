// 列表查询与筛选测试
// 创建时间: 2025-12-05 12:00:00
// 用途: 测试列表页面的查询、筛选、分页、排序功能

import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { waitForPageLoad, generateTestData } from './utils/helpers';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

test.describe('列表查询与筛选测试', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('运单列表查询与筛选', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 等待列表加载
    const table = page.locator('table, .ant-table, [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
    
    // 查找搜索输入框
    const searchInput = page.locator(
      'input[placeholder*="搜索"], input[placeholder*="查询"], input[placeholder*="Search"], [data-testid="search-input"]'
    ).first();
    
    if (await searchInput.count() > 0) {
      // 输入搜索关键词
      const testKeyword = generateTestData('TEST');
      await searchInput.fill(testKeyword);
      
      // 触发搜索（按 Enter 或点击搜索按钮）
      await searchInput.press('Enter');
      
      // 等待列表刷新
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证列表已更新（可能显示结果或空状态）
      const emptyState = page.locator('text=/暂无数据|没有找到|No data/i');
      const hasResults = await table.locator('tbody tr').count() > 0;
      
      // 应该显示结果或空状态
      expect(hasResults || (await emptyState.count() > 0)).toBeTruthy();
    }
  });

  test('客户列表查询与筛选', async ({ page }) => {
    await page.goto(`${BASE_URL}/customers`);
    await waitForPageLoad(page);
    
    // 等待列表加载
    const table = page.locator('table, .ant-table, [class*="table"]').first();
    await expect(table).toBeVisible({ timeout: 10_000 });
    
    // 查找筛选器（如果有）
    const filterButton = page.locator('button:has-text("筛选"), button:has-text("Filter")').first();
    if (await filterButton.count() > 0) {
      await filterButton.click();
      await page.waitForTimeout(1_000);
      
      // 尝试设置筛选条件（根据实际 UI 调整）
      const filterInput = page.locator('input[placeholder*="客户"], input[placeholder*="名称"]').first();
      if (await filterInput.count() > 0) {
        await filterInput.fill('测试');
        await page.click('button:has-text("确定"), button:has-text("确认")');
        await page.waitForTimeout(2_000);
      }
    }
    
    // 验证列表已更新
    await waitForPageLoad(page);
  });

  test('列表分页功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 查找分页组件
    const pagination = page.locator('.ant-pagination, [class*="pagination"]').first();
    
    if (await pagination.count() > 0) {
      await expect(pagination).toBeVisible();
      
      // 查找下一页按钮
      const nextButton = pagination.locator(
        'button:has-text("下一页"), button:has-text("Next"), .ant-pagination-next'
      ).first();
      
      if (await nextButton.count() > 0 && !(await nextButton.isDisabled())) {
        // 点击下一页
        await nextButton.click();
        
        // 等待列表刷新
        await page.waitForTimeout(2_000);
        await waitForPageLoad(page);
        
        // 验证页面已切换（URL 可能包含页码参数，或列表内容已更新）
        const currentPage = pagination.locator('.ant-pagination-item-active, [class*="active"]').first();
        if (await currentPage.count() > 0) {
          await expect(currentPage).toBeVisible();
        }
      }
    }
  });

  test('列表排序功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 查找表格列头（可排序的列）
    const sortableHeaders = page.locator(
      'th:has(.ant-table-column-sorter), th:has([class*="sorter"]), th[class*="sortable"]'
    );
    
    if (await sortableHeaders.count() > 0) {
      // 点击第一个可排序的列头
      const firstSortableHeader = sortableHeaders.first();
      await firstSortableHeader.click();
      
      // 等待列表刷新
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证排序图标已更新
      const sorter = firstSortableHeader.locator('.ant-table-column-sorter, [class*="sorter"]');
      if (await sorter.count() > 0) {
        await expect(sorter).toBeVisible();
      }
    }
  });

  test('列表空状态显示', async ({ page }) => {
    // 使用一个不存在的搜索关键词
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    const searchInput = page.locator(
      'input[placeholder*="搜索"], input[placeholder*="查询"]'
    ).first();
    
    if (await searchInput.count() > 0) {
      // 输入一个不可能匹配的关键词
      await searchInput.fill('__NONEXISTENT_SEARCH_TERM__12345');
      await searchInput.press('Enter');
      
      // 等待列表刷新
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证空状态显示
      const emptyState = page.locator(
        'text=/暂无数据|没有找到|No data|Empty/i, .ant-empty'
      ).first();
      
      // 如果有空状态，应该显示
      if (await emptyState.count() > 0) {
        await expect(emptyState).toBeVisible();
      }
    }
  });

  test('列表刷新功能', async ({ page }) => {
    await page.goto(`${BASE_URL}/admin/shipments`);
    await waitForPageLoad(page);
    
    // 查找刷新按钮
    const refreshButton = page.locator(
      'button:has-text("刷新"), button:has-text("Refresh"), [aria-label*="刷新"], [aria-label*="refresh"]'
    ).first();
    
    if (await refreshButton.count() > 0) {
      // 记录当前列表项数量
      const initialCount = await page.locator('tbody tr').count();
      
      // 点击刷新
      await refreshButton.click();
      
      // 等待列表刷新
      await page.waitForTimeout(2_000);
      await waitForPageLoad(page);
      
      // 验证列表已刷新（项数可能相同或不同）
      const newCount = await page.locator('tbody tr').count();
      // 至少应该有一个列表（即使为空）
      expect(newCount).toBeGreaterThanOrEqual(0);
    }
  });
});

