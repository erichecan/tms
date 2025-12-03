#!/usr/bin/env python3
"""
车辆管理功能测试脚本
使用 webapp-testing 工具包测试生产环境的车辆管理功能
创建时间: 2025-12-02T20:40:00Z
"""

from playwright.sync_api import sync_playwright
import time

# 生产环境 URL
BASE_URL = 'https://tms-frontend-v4estohola-df.a.run.app'
BACKEND_URL = 'https://tms-backend-v4estohola-df.a.run.app'

# 测试账号
TEST_EMAIL = 'agnes@aponygroup.com'
TEST_PASSWORD = '27669'

def test_vehicle_management():
    """测试车辆管理功能"""
    print("=" * 60)
    print("🚛 车辆管理功能测试")
    print("=" * 60)
    
    console_logs = []
    errors = []
    
    with sync_playwright() as p:
        # 启动浏览器（无头模式）
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        # 捕获控制台日志和错误
        def handle_console(msg):
            console_logs.append(f"[{msg.type}] {msg.text}")
            if msg.type == 'error':
                errors.append(msg.text)
        
        def handle_page_error(error):
            errors.append(f"Page error: {error}")
        
        page.on("console", handle_console)
        page.on("pageerror", handle_page_error)
        
        try:
            # 1. 访问登录页面
            print("\n[1/6] 访问登录页面...")
            page.goto(f"{BASE_URL}/login", wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(2000)
            
            # 截图登录页面
            page.screenshot(path='test-results/01-login-page.png', full_page=True)
            print("  ✅ 登录页面加载成功")
            
            # 2. 登录
            print("\n[2/6] 执行登录...")
            email_input = page.locator('input[name="email"], input[placeholder*="邮箱"]').first()
            password_input = page.locator('input[name="password"], input[type="password"]').first()
            submit_button = page.locator('button[type="submit"]').first()
            
            email_input.wait_for(state='visible', timeout=10000)
            password_input.wait_for(state='visible', timeout=10000)
            
            email_input.fill(TEST_EMAIL)
            password_input.fill(TEST_PASSWORD)
            
            submit_button.wait_for(state='visible', timeout=10000)
            submit_button.click()
            
            # 等待登录完成和重定向
            page.wait_for_url(lambda url: '/login' not in url.pathname, timeout=15000)
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(3000)
            
            print("  ✅ 登录成功")
            
            # 3. 导航到车队管理页面
            print("\n[3/6] 导航到车队管理页面...")
            page.goto(f"{BASE_URL}/admin/fleet", wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(5000)
            
            # 截图车队管理页面
            page.screenshot(path='test-results/02-fleet-management-page.png', full_page=True)
            print("  ✅ 车队管理页面加载成功")
            
            # 4. 检查车辆管理标签
            print("\n[4/6] 检查车辆管理标签页...")
            vehicle_tab = page.locator('.ant-tabs-tab:has-text("车辆管理")').first()
            
            if vehicle_tab.count() > 0:
                print("  ✅ 找到车辆管理标签")
                
                # 点击车辆管理标签
                vehicle_tab.click()
                page.wait_for_timeout(3000)
                
                # 截图车辆管理页面
                page.screenshot(path='test-results/03-vehicle-management-page.png', full_page=True)
                print("  ✅ 车辆管理标签页打开成功")
            else:
                print("  ❌ 未找到车辆管理标签")
                # 列出所有标签
                tabs = page.locator('.ant-tabs-tab').all()
                print(f"  找到 {len(tabs)} 个标签:")
                for i, tab in enumerate(tabs[:10]):  # 只显示前10个
                    text = tab.inner_text().strip()
                    print(f"    [{i+1}] {text}")
            
            # 5. 检查车辆列表
            print("\n[5/6] 检查车辆列表...")
            vehicle_table = page.locator('table').first()
            
            if vehicle_table.count() > 0:
                print("  ✅ 找到车辆列表表格")
                
                # 获取表格行数
                rows = vehicle_table.locator('tbody tr').all()
                print(f"  找到 {len(rows)} 辆车辆")
                
                # 截图表格
                vehicle_table.screenshot(path='test-results/04-vehicle-table.png')
            else:
                print("  ⚠️  未找到车辆列表表格")
            
            # 6. 检查费用按钮
            print("\n[6/6] 检查费用管理功能...")
            cost_buttons = page.locator('button:has-text("费用"), button[title*="费用"]').all()
            
            if len(cost_buttons) > 0:
                print(f"  ✅ 找到 {len(cost_buttons)} 个费用按钮")
                
                # 点击第一个费用按钮
                if cost_buttons[0].is_visible():
                    cost_buttons[0].click()
                    page.wait_for_timeout(2000)
                    
                    # 检查费用填写模态框
                    cost_modal = page.locator('.ant-modal:has-text("月度费用"), .ant-modal:has-text("费用")').first()
                    if cost_modal.count() > 0:
                        print("  ✅ 费用填写模态框打开成功")
                        
                        # 截图模态框
                        cost_modal.screenshot(path='test-results/05-cost-modal.png')
                        
                        # 检查表单字段
                        month_picker = page.locator('.ant-picker').first()
                        fuel_input = page.locator('input[placeholder*="油费"], input[name="fuel"]').first()
                        lease_input = page.locator('input[placeholder*="Lease"], input[name="lease"]').first()
                        insurance_input = page.locator('input[placeholder*="保险"], input[name="insurance"]').first()
                        maintenance_input = page.locator('input[placeholder*="维护"], input[name="maintenance"]').first()
                        
                        print(f"    月份选择器: {month_picker.count()}")
                        print(f"    油费输入框: {fuel_input.count()}")
                        print(f"    Lease输入框: {lease_input.count()}")
                        print(f"    保险输入框: {insurance_input.count()}")
                        print(f"    维护费用输入框: {maintenance_input.count()}")
                        
                        # 关闭模态框
                        cancel_button = page.locator('button:has-text("取消")').first()
                        if cancel_button.count() > 0:
                            cancel_button.click()
                            page.wait_for_timeout(1000)
                    else:
                        print("  ⚠️  费用填写模态框未打开")
                else:
                    print("  ⚠️  费用按钮不可见")
            else:
                print("  ⚠️  未找到费用按钮")
            
            # 最终截图
            page.screenshot(path='test-results/06-final-state.png', full_page=True)
            
        except Exception as e:
            print(f"\n❌ 测试过程中发生错误: {str(e)}")
            page.screenshot(path='test-results/error-screenshot.png', full_page=True)
            raise
        
        finally:
            browser.close()
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("📊 测试结果总结")
    print("=" * 60)
    
    if errors:
        print(f"\n❌ 发现 {len(errors)} 个错误:")
        for error in errors[:10]:  # 只显示前10个错误
            print(f"  - {error}")
    else:
        print("\n✅ 未发现错误")
    
    if console_logs:
        print(f"\n📝 控制台日志 ({len(console_logs)} 条):")
        error_logs = [log for log in console_logs if 'error' in log.lower()]
        if error_logs:
            for log in error_logs[:10]:
                print(f"  - {log}")
        else:
            print("  ✅ 无错误日志")
    
    print("\n📸 截图已保存到 test-results/ 目录")
    print("=" * 60)

if __name__ == '__main__':
    import os
    os.makedirs('test-results', exist_ok=True)
    test_vehicle_management()

