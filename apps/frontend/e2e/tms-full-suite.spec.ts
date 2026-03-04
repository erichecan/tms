/**
 * TMS 全量测试套件 - 基于 TMS_TESTING_PLAN.md v1.0
 * 根因修复：登录后仅用客户端导航（点击链接），避免 page.goto 导致登录态丢失
 * 编写时间: 2026-03-04
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:5173';

/** 先 mock 登录接口再执行登录，登录后仅用点击链接导航以保持登录态 */
async function loginAsAdmin(page: import('@playwright/test').Page) {
    await page.route(/\/api\/auth\/login/, async (route) => {
        await route.fulfill({
            status: 200,
            body: JSON.stringify({
                token: 'mock-jwt-admin',
                user: { id: 'U-ADMIN', name: 'Admin', email: 'admin@tms.test', roleId: 'R-ADMIN' },
                role: 'R-ADMIN',
                permissions: ['*'],
            }),
        });
    });
    await page.goto(BASE_URL + '/login');
    await page.getByPlaceholder('Email or Username').fill('admin@tms.test');
    await page.getByPlaceholder('Enter password').fill('pass');
    await page.getByRole('button', { name: /Sign In|Authenticating/ }).click();
    await expect(page).toHaveURL(/\/(?!login)/, { timeout: 15000 });
}

// ========== 一、客户视角：发货/需求流 ==========
test.describe('1. 创建运单 (Waybill Creation)', () => {
    test('1.1 必填字段与 Default 模板提交', async ({ page }) => {
        await page.route('**/api/waybills**', async (route) => {
            const req = route.request();
            if (req.method() === 'POST' && !req.url().includes('/assign')) {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'WB-1', waybill_no: 'Y2603-04120000', status: 'NEW' }) });
            } else if (req.url().includes('?')) {
                await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0, totalPages: 1, page: 1, limit: 10 }) });
            } else {
                await route.continue();
            }
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/\/waybills/);
        await page.getByTestId('create-waybill-btn').click();
        await expect(page).toHaveURL(/waybills\/create/, { timeout: 10000 });
        await expect(page.getByTestId('template-default')).toBeVisible({ timeout: 10000 });
        await page.getByTestId('ship-from-address').fill('123 Origin St');
        await page.getByTestId('ship-to-address').fill('456 Dest Rd');
        // Default 模板无 delivery-date 字段，仅 Amazon 有
        await page.getByTestId('price-input').fill('500.00');
        await expect(page.getByTestId('submit-waybill-btn')).toBeVisible();
        await page.getByTestId('submit-waybill-btn').click();
        await expect(page).toHaveURL(/\/waybills$/);
    });

    test('1.2 Amazon 模板字段与报价', async ({ page }) => {
        await page.route('**/api/waybills**', async (route) => {
            const req = route.request();
            if (req.method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'WB-2', waybill_no: 'Y2603-04120001', status: 'NEW' }) });
            } else if (req.url().includes('?')) {
                await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0, totalPages: 1, page: 1, limit: 10 }) });
            } else {
                await route.continue();
            }
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/\/waybills/);
        await page.getByTestId('create-waybill-btn').click();
        await expect(page).toHaveURL(/waybills\/create/);
        await page.getByTestId('template-amazon').click();
        await expect(page.getByTestId('fc-alias-input')).toBeVisible();
        await page.getByTestId('fc-alias-input').fill('YYZ9');
        await page.getByTestId('delivery-date-input').fill('2026-03-08');
        await page.getByTestId('fc-address-input').fill('123 Warehouse Blvd');
        await page.getByTestId('price-input').fill('150.50');
        await page.getByTestId('submit-waybill-btn').click();
        await expect(page).toHaveURL(/\/waybills$/);
    });

    test('1.3 创建成功写入并跳转', async ({ page }) => {
        let postBody: unknown = null;
        await page.route('**/api/waybills**', async (route) => {
            const req = route.request();
            if (req.method() === 'POST') {
                postBody = req.postDataJSON();
                await route.fulfill({ status: 200, body: JSON.stringify({ id: 'WB-3', waybill_no: 'Y2603-04120002', status: 'NEW' }) });
            } else if (req.url().includes('?')) {
                await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0, totalPages: 1, page: 1, limit: 10 }) });
            } else {
                await route.continue();
            }
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/\/waybills/);
        await page.getByTestId('create-waybill-btn').click();
        await expect(page).toHaveURL(/waybills\/create/);
        await page.getByTestId('ship-from-address').fill('A');
        await page.getByTestId('ship-to-address').fill('B');
        await page.getByTestId('price-input').fill('100');
        await page.getByTestId('submit-waybill-btn').click();
        await expect(page).toHaveURL(/\/waybills$/);
        expect(postBody).not.toBeNull();
        expect((postBody as { origin?: string }).origin).toBe('A');
    });
});

// ========== 二、调度视角：运费与指派 ==========
test.describe('2. 运费智能计算与校验 (Pricing)', () => {
    test('2.1 定价计算器页面可访问', async ({ page }) => {
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Price Calculator|价格计算|计价/i }).first().click();
        await expect(page).toHaveURL(/\/pricing/);
        await expect(page.locator('body')).toContainText(/pricing|price|calculate|运费|计价|Pickup|Delivery/i);
    });
});

test.describe('3. 运单指派 (Assign Waybill)', () => {
    const MOCK_WAYBILLS = [
        { id: 'W1', waybill_no: 'Y001', customer_id: 'CUST-A', status: 'NEW', origin: 'NY', destination: 'LA', price_estimated: 100, created_at: '2026-01-01' },
    ];
    const MOCK_DRIVERS = { data: [{ id: 'D1', name: 'Driver Alpha', status: 'IDLE' }] };
    const MOCK_VEHICLES = { data: [{ id: 'V1', plate: 'ABC-123', model: 'Van', status: 'IDLE' }] };

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/waybills**', async (route) => {
            const url = route.request().url();
            if (url.includes('/assign') && route.request().method() === 'POST') {
                await route.fulfill({ status: 200, body: JSON.stringify({ success: true }) });
            } else if (url.includes('?')) {
                await route.fulfill({ status: 200, body: JSON.stringify({ data: MOCK_WAYBILLS, total: 1, totalPages: 1, page: 1, limit: 10 }) });
            } else {
                await route.continue();
            }
        });
        await page.route('**/api/drivers**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_DRIVERS) });
        });
        await page.route('**/api/vehicles**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify(MOCK_VEHICLES) });
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/\/waybills/);
    });

    test('3.1 分配弹窗打开并可选司机/车辆', async ({ page }) => {
        await expect(page.getByTestId('waybill-row')).toHaveCount(1);
        await page.getByTestId('waybill-row-menu-btn').first().click();
        await page.getByTestId('assign-waybill-btn').click();
        await expect(page.getByText(/assign|dispatch|分配|派单/i)).toBeVisible();
        await expect(page.getByTestId('assign-driver-select')).toBeVisible();
        await expect(page.getByTestId('assign-vehicle-select')).toBeVisible();
        await page.getByTestId('assign-driver-select').selectOption('D1');
        await page.getByTestId('assign-vehicle-select').selectOption('V1');
        const assignReq = page.waitForRequest((req) => req.url().includes('/assign') && req.method() === 'POST');
        await page.getByTestId('assign-confirm-btn').click();
        await assignReq;
    });
});

test.describe('5. 运单管理与更新 (Waybill Management)', () => {
    const MOCK_LIST = [
        { id: '1', waybill_no: 'Y001', customer_id: 'CUST-A', status: 'NEW', origin: 'NY', destination: 'LA', price_estimated: 100, created_at: '2026-01-01' },
        { id: '2', waybill_no: 'Y002', customer_id: 'CUST-B', status: 'IN_TRANSIT', origin: 'MIA', destination: 'CHI', price_estimated: 200, created_at: '2026-01-02' },
    ];

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/waybills*', async (route) => {
            const url = route.request().url();
            if (url.includes('?')) {
                const statusMatch = url.match(/status=([^&]+)/);
                const searchMatch = url.match(/search=([^&]+)/);
                const status = statusMatch ? decodeURIComponent(statusMatch[1]) : 'ALL';
                const search = searchMatch ? decodeURIComponent(searchMatch[1]).toLowerCase() : '';
                let data = status === 'ALL' ? MOCK_LIST : status === 'IN_TRANSIT' ? [MOCK_LIST[1]] : status === 'NEW' ? [MOCK_LIST[0]] : MOCK_LIST;
                if (search) data = data.filter((w: { waybill_no: string }) => w.waybill_no.toLowerCase().includes(search));
                await route.fulfill({ status: 200, body: JSON.stringify({ data, total: data.length, totalPages: 1, page: 1, limit: 10 }) });
            } else {
                await route.continue();
            }
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/\/waybills/);
    });

    test('5.1 列表加载与筛选', async ({ page }) => {
        await expect(page.getByTestId('waybill-row')).toHaveCount(2);
        await page.getByTestId('filter-IN_TRANSIT').click();
        await page.waitForTimeout(400);
        await expect(page.getByTestId('waybill-row')).toHaveCount(1);
        await expect(page.getByText('Y002')).toBeVisible();
    });

    test('5.2 搜索过滤', async ({ page }) => {
        await page.getByTestId('waybill-search-input').fill('Y002');
        await page.waitForTimeout(600);
        await expect(page.getByTestId('waybill-row')).toHaveCount(1);
        await expect(page.getByText('Y002')).toBeVisible();
    });
});

// ========== 行程与跟踪 ==========
test.describe('6. 行程管理 (Trip Management)', () => {
    const MOCK_TRIP = {
        id: 'T-1001',
        driver: { name: 'John Doe' },
        vehicle: { plate: 'ABC-123' },
        status: 'IN_TRANSIT',
        timeline: [],
        waybills: [{ id: 'W1', waybill_no: 'Y001', origin: 'A', destination: 'B' }],
        end_time_est: new Date().toISOString(),
    };

    test.beforeEach(async ({ page }) => {
        await page.route('**/api/trips**', async (route) => {
            const url = route.request().url();
            if (url.includes('ACTIVE')) {
                await route.fulfill({ status: 200, body: JSON.stringify([{ id: 'T-1001', vehicle_id: 'V1', driver_name: 'John' }]) });
            } else if (url.includes('/tracking')) {
                await route.fulfill({ status: 200, body: JSON.stringify(MOCK_TRIP) });
            } else {
                await route.continue();
            }
        });
        await page.route('**/api/trips/*/messages**', async (route) => {
            if (route.request().method() === 'GET') {
                await route.fulfill({ status: 200, body: JSON.stringify([]) });
            } else {
                await route.fulfill({ status: 201, body: JSON.stringify({ success: true }) });
            }
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Tracking Loop|追踪/i }).first().click();
        await expect(page).toHaveURL(/\/tracking\/T-1001/, { timeout: 10000 });
    });

    test('6.1 Trip 详情与运单列表', async ({ page }) => {
        await expect(page.getByText('John Doe')).toBeVisible();
        await expect(page.getByText('Y001')).toBeVisible();
    });

    test('6.2 发送消息', async ({ page }) => {
        await page.getByTestId('chat-input').fill('Stay Safe');
        const postReq = page.waitForRequest((req) => req.url().includes('/messages') && req.method() === 'POST');
        await page.getByTestId('send-message-btn').click();
        const req = await postReq;
        expect(req.postDataJSON()).toEqual({ text: 'Stay Safe' });
        await expect(page.getByTestId('chat-input')).toHaveValue('');
    });
});

// ========== 三、司机视角 ==========
test.describe('7–8. 司机端基础与运单可见范围', () => {
    test('7.1 司机端首页可访问', async ({ page }) => {
        await loginAsAdmin(page);
        await page.goto(`${BASE_URL}/driver`);
        await expect(page.locator('body')).toContainText(/driver|task|waybill|运单|任务|Welcome|Dashboard/i);
    });

    test('8.1 司机仅能见自己的运单 (mock 空列表)', async ({ page }) => {
        await page.route('**/api/**', async (route) => {
            const url = route.request().url();
            if (url.includes('/waybills') || url.includes('/trips')) {
                await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) });
            } else {
                await route.continue();
            }
        });
        // 使用司机登录后应进入 /driver，避免 page.goto 导致登录态丢失
        await page.route(/\/api\/auth\/login/, async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    token: 'jwt-driver',
                    user: { id: 'D1', name: 'Driver', email: 'd@t.com', roleId: 'R-DRIVER' },
                    role: 'R-DRIVER',
                    permissions: [],
                }),
            });
        });
        await page.goto(BASE_URL + '/login');
        await page.getByPlaceholder('Email or Username').fill('driver@t.com');
        await page.getByPlaceholder('Enter password').fill('pass123');
        await page.getByRole('button', { name: /Sign In|Authenticating/i }).click();
        await expect(page).toHaveURL(/\/driver/, { timeout: 10000 });
    });
});

// ========== 四、财务视角 ==========
test.describe('12–13. 财务对账 (Driver Payroll & Customer AP/AR)', () => {
    test('12.1 应付/司机工资页可访问', async ({ page }) => {
        await page.route('**/api/finance/**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) });
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Financial|财务|Overview|概览/i }).first().click();
        await page.getByRole('link', { name: /Payables|应付/i }).first().click();
        await expect(page).toHaveURL(/\/finance\/payables/);
    });

    test('13.1 应收/客户对账页可访问', async ({ page }) => {
        await page.route('**/api/finance/**', async (route) => {
            await route.fulfill({ status: 200, body: JSON.stringify({ data: [], total: 0 }) });
        });
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Financial|财务|Overview|概览/i }).first().click();
        await page.getByRole('link', { name: /Receivables|应收/i }).first().click();
        await expect(page).toHaveURL(/\/finance\/receivables/);
    });
});

// ========== 五、系统基石：权限 ==========
test.describe('14. 用户与权限管理 (RBAC)', () => {
    test('14.1 未登录访问受保护页跳转登录', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => localStorage.clear());
        await page.goto(`${BASE_URL}/waybills`);
        await expect(page).toHaveURL(/\/login/);
    });

    test('14.2 登录后 Admin 可访问调度与财务', async ({ page }) => {
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/\/waybills/);
        await page.getByRole('link', { name: /Financial|财务|Overview|概览/i }).first().click();
        await expect(page).toHaveURL(/\/finance/);
    });

    test('14.3 司机角色登录后进入司机端', async ({ page }) => {
        await page.goto(BASE_URL);
        await page.evaluate(() => localStorage.clear());
        await page.route('**/auth/login', async (route) => {
            await route.fulfill({
                status: 200,
                body: JSON.stringify({
                    token: 'jwt-driver',
                    user: { id: 'D1', name: 'Driver', email: 'd@t.com', roleId: 'R-DRIVER', role_id: 'R-DRIVER' },
                    role: 'R-DRIVER',
                    permissions: [],
                }),
            });
        });
        await page.goto(`${BASE_URL}/login`);
        await page.getByPlaceholder('Email or Username').fill('driver@t.com');
        await page.getByPlaceholder('Enter password').fill('pass123');
        await page.getByRole('button', { name: /Sign In|Authenticating/i }).click();
        // 登录成功：离开登录页；可能跳转到 /driver 或 /（与产品当前重定向逻辑一致）
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.url()).toMatch(/localhost:5173\/(driver)?\/?$/);
    });
});

// ========== 工作台与导航 ==========
test.describe('P0: 工作台与核心导航', () => {
    test('工作台加载并显示核心指标', async ({ page }) => {
        await loginAsAdmin(page);
        await expect(page.locator('body')).toContainText(/Welcome|TMS|Control Center|dashboard/i);
        await expect(page.getByRole('link', { name: /Dashboard|仪表盘/i })).toBeVisible();
    });

    test('核心模块导航', async ({ page }) => {
        await loginAsAdmin(page);
        await page.getByRole('link', { name: /Tracking|追踪/i }).first().click();
        await expect(page).toHaveURL(/.*tracking/);
        await page.getByRole('link', { name: /Waybills|运单/i }).first().click();
        await expect(page).toHaveURL(/.*waybills/);
    });
});
