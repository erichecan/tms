#!/usr/bin/env python3
"""
UI 元素权限验证脚本
验证未找到的 UI 元素是否需要特定权限
创建时间: 2025-12-03T19:10:00Z
"""

from playwright.sync_api import sync_playwright
import os
import time

BASE_URL = os.getenv('TMS_FRONTEND_URL', 'https://tms-frontend-v4estohola-df.a.run.app')
TEST_EMAIL = os.getenv('TMS_TEST_EMAIL', 'eriche@aponygroup.com')
TEST_PASSWORD = os.getenv('TMS_TEST_PASSWORD', '27669')

def verify_ui_elements():
    """验证 UI 元素和权限"""
    print("=" * 60)
    print("🔍 UI 元素权限验证")
    print("=" * 60)
    
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080}
        )
        page = context.new_page()
        
        try:
            # 登录
            print("\n[1/5] 登录系统...")
            page.goto(f"{BASE_URL}/login", wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(2000)
            
            # 尝试多种选择器
            email_input = None
            for selector in ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="邮箱"]']:
                try:
                    locator = page.locator(selector).first
                    if locator.count() > 0:
                        email_input = locator
                        break
                except:
                    continue
            
            if not email_input:
                raise Exception("未找到邮箱输入框")
            
            password_input = None
            for selector in ['input[type="password"]', 'input[name="password"]']:
                try:
                    locator = page.locator(selector).first
                    if locator.count() > 0:
                        password_input = locator
                        break
                except:
                    continue
            
            if not password_input:
                raise Exception("未找到密码输入框")
            
            submit_button = None
            for selector in ['button[type="submit"]', 'button:has-text("登录")']:
                try:
                    locator = page.locator(selector).first
                    if locator.count() > 0:
                        submit_button = locator
                        break
                except:
                    continue
            
            if not submit_button:
                raise Exception("未找到登录按钮")
            
            email_input.fill(TEST_EMAIL)
            password_input.fill(TEST_PASSWORD)
            submit_button.click()
            
            page.wait_for_url(lambda url: '/login' not in str(url), timeout=15000)
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(3000)
            print("  ✅ 登录成功")
            
            # 检查用户角色和权限
            print("\n[2/5] 检查用户角色和权限...")
            try:
                # 尝试从 localStorage 或页面元素获取用户信息
                user_info = page.evaluate("""
                    () => {
                        const userStr = localStorage.getItem('user') || localStorage.getItem('auth') || '{}';
                        try {
                            return JSON.parse(userStr);
                        } catch {
                            return {};
                        }
                    }
                """)
                if user_info:
                    print(f"  用户信息: {user_info}")
                    role = user_info.get('role', 'unknown')
                    print(f"  用户角色: {role}")
                else:
                    print("  ⚠️  无法获取用户信息")
            except Exception as e:
                print(f"  ⚠️  检查用户信息时出错: {str(e)}")
            
            # 验证登出按钮
            print("\n[3/5] 验证登出按钮...")
            page.screenshot(path='test-results/ui-check-01-dashboard.png', full_page=True)
            
            logout_selectors = [
                'button:has-text("登出")',
                'button:has-text("退出")',
                'button:has-text("Logout")',
                'a:has-text("登出")',
                '[class*="logout"]',
                '[class*="sign-out"]'
            ]
            
            logout_found = False
            for selector in logout_selectors:
                try:
                    elements = page.locator(selector).all()
                    if len(elements) > 0:
                        print(f"  ✅ 找到登出按钮: {selector}")
                        logout_found = True
                        break
                except:
                    continue
            
            if not logout_found:
                print("  ⚠️  未找到登出按钮，可能位置在用户菜单中")
                # 检查用户菜单
                try:
                    user_menu = page.locator('[class*="user"], [class*="avatar"], [class*="profile"]').first()
                    if user_menu.count() > 0:
                        print("  ℹ️  找到用户菜单，登出按钮可能在菜单中")
                        user_menu.click()
                        page.wait_for_timeout(2000)
                        page.screenshot(path='test-results/ui-check-02-user-menu.png', full_page=True)
                except:
                    pass
            
            # 验证添加客户按钮
            print("\n[4/5] 验证添加客户按钮...")
            page.goto(f"{BASE_URL}/admin/customers", wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(3000)
            page.screenshot(path='test-results/ui-check-03-customers.png', full_page=True)
            
            add_selectors = [
                'button:has-text("添加")',
                'button:has-text("新建")',
                'button:has-text("创建")',
                'button:has-text("Add")',
                'button:has-text("New")',
                'button:has-text("Create")',
                '[class*="add"]',
                '[class*="create"]'
            ]
            
            add_found = False
            for selector in add_selectors:
                try:
                    elements = page.locator(selector).all()
                    if len(elements) > 0:
                        # 检查是否可见
                        visible_elements = [e for e in elements if e.is_visible()]
                        if len(visible_elements) > 0:
                            print(f"  ✅ 找到添加按钮: {selector}")
                            add_found = True
                            break
                except:
                    continue
            
            if not add_found:
                print("  ⚠️  未找到添加客户按钮")
                print("  ℹ️  可能原因:")
                print("     - 需要特定权限（如 admin 或 manager）")
                print("     - 按钮在页面其他位置")
                print("     - 功能尚未实现")
            
            # 验证运单分配和行程管理
            print("\n[5/5] 验证运单分配和行程管理...")
            page.goto(f"{BASE_URL}/admin/shipments", wait_until='domcontentloaded')
            page.wait_for_load_state('networkidle', timeout=30000)
            page.wait_for_timeout(3000)
            page.screenshot(path='test-results/ui-check-04-shipments.png', full_page=True)
            
            # 检查运单分配按钮
            assign_selectors = [
                'button:has-text("分配")',
                'button:has-text("指派")',
                'button:has-text("Assign")',
                '[title*="分配"]',
                '[title*="指派"]'
            ]
            
            assign_found = False
            for selector in assign_selectors:
                try:
                    elements = page.locator(selector).all()
                    if len(elements) > 0:
                        visible_elements = [e for e in elements if e.is_visible()]
                        if len(visible_elements) > 0:
                            print(f"  ✅ 找到运单分配按钮: {selector}")
                            assign_found = True
                            break
                except:
                    continue
            
            if not assign_found:
                print("  ⚠️  未找到运单分配按钮")
                print("  ℹ️  可能原因:")
                print("     - 需要 dispatcher 或 admin 权限")
                print("     - 按钮在运单详情页面")
                print("     - 功能尚未实现")
            
            # 检查行程管理
            trip_selectors = [
                'a:has-text("行程")',
                'button:has-text("行程")',
                '[href*="trip"]',
                '[href*="行程"]'
            ]
            
            trip_found = False
            for selector in trip_selectors:
                try:
                    elements = page.locator(selector).all()
                    if len(elements) > 0:
                        visible_elements = [e for e in elements if e.is_visible()]
                        if len(visible_elements) > 0:
                            print(f"  ✅ 找到行程管理入口: {selector}")
                            trip_found = True
                            break
                except:
                    continue
            
            if not trip_found:
                print("  ⚠️  未找到行程管理入口")
                print("  ℹ️  可能原因:")
                print("     - 需要特定权限")
                print("     - 在导航菜单的其他位置")
                print("     - 功能尚未实现")
            
            print("\n" + "=" * 60)
            print("📊 验证结果总结")
            print("=" * 60)
            print(f"登出按钮: {'✅ 找到' if logout_found else '⚠️  未找到（可能在用户菜单中）'}")
            print(f"添加客户按钮: {'✅ 找到' if add_found else '⚠️  未找到（可能需要特定权限）'}")
            print(f"运单分配按钮: {'✅ 找到' if assign_found else '⚠️  未找到（可能需要 dispatcher 权限）'}")
            print(f"行程管理入口: {'✅ 找到' if trip_found else '⚠️  未找到（可能需要特定权限）'}")
            print("\n💡 建议:")
            print("  - 检查用户角色和权限设置")
            print("  - 确认这些功能是否需要特定权限")
            print("  - 查看导航菜单和页面布局")
            print("=" * 60)
            
        except Exception as e:
            print(f"\n❌ 验证过程中发生错误: {str(e)}")
            page.screenshot(path='test-results/ui-check-error.png', full_page=True)
        finally:
            browser.close()

if __name__ == '__main__':
    os.makedirs('test-results', exist_ok=True)
    verify_ui_elements()

