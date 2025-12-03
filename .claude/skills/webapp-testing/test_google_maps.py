#!/usr/bin/env python3
"""
Google Maps 地图功能测试脚本
使用 webapp-testing 工具包测试生产环境的地图显示功能
创建时间: 2025-12-02T20:45:00Z
"""

from playwright.sync_api import sync_playwright
import time

# 生产环境 URL - 需要根据实际部署的 URL 更新
BASE_URL = 'https://tms-frontend-v4estohola-df.a.run.app'
BACKEND_URL = 'https://tms-backend-v4estohola-df.a.run.app'

# 测试账号
TEST_EMAIL = 'agnes@aponygroup.com'
TEST_PASSWORD = '27669'

def test_google_maps_display():
    """测试 Google Maps 地图显示功能"""
    print("=" * 60)
    print("🗺️  Google Maps 地图功能测试")
    print("=" * 60)
    
    console_logs = []
    errors = []
    maps_initialized = False
    maps_error = False
    
    with sync_playwright() as p:
        # 启动浏览器（有头模式，方便观察）
        browser = p.chromium.launch(headless=False)
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
            # 检查地图初始化消息
            if 'Google Maps API initialized successfully' in msg.text:
                global maps_initialized
                maps_initialized = True
            if 'Google Maps API Key 未配置' in msg.text or 'InvalidKeyMapError' in msg.text or 'ApiNotActivatedMapError' in msg.text:
                global maps_error
                maps_error = True
        
        def handle_page_error(error):
            errors.append(f"Page error: {error}")
        
        page.on("console", handle_console)
        page.on("pageerror", handle_page_error)
        
        try:
            # 1. 访问登录页面
            print("\n[1/5] 访问登录页面...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle")
            time.sleep(2)
            
            # 2. 登录
            print("[2/5] 执行登录...")
            # 尝试多种选择器
            email_selectors = ['input[type="email"]', 'input[name="email"]', '#email', 'input[placeholder*="邮箱"]', 'input[placeholder*="email"]']
            password_selectors = ['input[type="password"]', 'input[name="password"]', '#password']
            submit_selectors = ['button[type="submit"]', 'button:has-text("登录")', 'button:has-text("Login")', '.ant-btn-primary']
            
            email_filled = False
            for selector in email_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.fill(selector, TEST_EMAIL)
                        email_filled = True
                        break
                except:
                    continue
            
            if not email_filled:
                raise Exception("无法找到邮箱输入框")
            
            password_filled = False
            for selector in password_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.fill(selector, TEST_PASSWORD)
                        password_filled = True
                        break
                except:
                    continue
            
            if not password_filled:
                raise Exception("无法找到密码输入框")
            
            submit_clicked = False
            for selector in submit_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.click(selector)
                        submit_clicked = True
                        break
                except:
                    continue
            
            if not submit_clicked:
                raise Exception("无法找到登录按钮")
            
            # 等待登录完成，可能跳转到 dashboard 或首页
            try:
                page.wait_for_url("**/dashboard", timeout=15000)
            except:
                # 如果没有跳转到 dashboard，检查是否在首页
                current_url = page.url
                if '/login' not in current_url:
                    print(f"   登录后跳转到: {current_url}")
                else:
                    raise Exception("登录失败，仍在登录页面")
            time.sleep(3)
            print("✅ 登录成功")
            
            # 3. 访问运单创建页面（通常包含地址输入和地图）
            print("[3/5] 访问运单创建页面...")
            page.goto(f"{BASE_URL}/shipments/create", wait_until="networkidle")
            time.sleep(3)
            
            # 检查控制台日志，查找地图初始化消息
            print("\n[4/5] 检查地图初始化状态...")
            time.sleep(2)  # 等待地图加载
            
            # 检查是否有地图相关的元素
            map_elements = page.locator('[id*="map"], [class*="map"], canvas, iframe[src*="maps"]').count()
            print(f"   找到 {map_elements} 个可能的地图元素")
            
            # 检查页面中是否包含 Google Maps 相关的脚本
            page_content = page.content()
            has_google_maps_script = 'maps.googleapis.com' in page_content or 'google.maps' in page_content
            print(f"   页面包含 Google Maps 脚本: {'是' if has_google_maps_script else '否'}")
            
            # 检查地址输入框（用于测试地址自动完成）
            address_inputs = page.locator('input[placeholder*="地址"], input[placeholder*="address"], input[name*="address"]').count()
            print(f"   找到 {address_inputs} 个地址输入框")
            
            # 检查控制台日志
            maps_logs = [log for log in console_logs if 'map' in log.lower() or 'google' in log.lower()]
            if maps_logs:
                print(f"   地图相关日志: {len(maps_logs)} 条")
                for log in maps_logs[:5]:  # 只显示前5条
                    print(f"   {log}")
            
            # 6. 访问运单详情页面（如果有地图显示）
            print("\n[6/6] 尝试访问运单详情页面（如果存在）...")
            try:
                # 先获取一个运单列表
                page.goto(f"{BASE_URL}/shipments", wait_until="networkidle")
                time.sleep(2)
                
                # 尝试点击第一个运单（如果存在）
                first_shipment = page.locator('tbody tr').first
                if first_shipment.count() > 0:
                    first_shipment.click()
                    page.wait_for_url("**/shipments/**", timeout=10000)
                    time.sleep(3)
                    print("✅ 成功访问运单详情页")
                    
                    # 检查详情页是否有地图
                    detail_map_elements = page.locator('[id*="map"], [class*="map"], canvas').count()
                    print(f"   详情页地图元素: {detail_map_elements} 个")
                else:
                    print("   ⚠️  没有找到运单，跳过详情页测试")
            except Exception as e:
                print(f"   ⚠️  无法访问运单详情页: {e}")
            
            # 等待一下，让地图完全加载
            time.sleep(3)
            
            # 截图保存
            screenshot_path = '/tmp/google_maps_test.png'
            page.screenshot(path=screenshot_path, full_page=True)
            print(f"\n📸 截图已保存到: {screenshot_path}")
            
        except Exception as e:
            print(f"\n❌ 测试过程中出现错误: {e}")
            errors.append(str(e))
            page.screenshot(path='/tmp/google_maps_test_error.png', full_page=True)
        
        finally:
            browser.close()
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("📊 测试结果总结")
    print("=" * 60)
    
    print(f"\n✅ 地图初始化状态: {'成功' if maps_initialized else '未检测到'}")
    print(f"{'❌' if maps_error else '✅'} 地图错误状态: {'有错误' if maps_error else '无错误'}")
    print(f"\n📝 控制台日志总数: {len(console_logs)}")
    print(f"❌ 错误总数: {len(errors)}")
    
    if errors:
        print("\n⚠️  发现的错误:")
        for i, error in enumerate(errors[:10], 1):  # 只显示前10个错误
            print(f"   {i}. {error}")
    
    # 检查地图相关的关键日志
    maps_related = [log for log in console_logs if any(keyword in log.lower() for keyword in ['map', 'google', 'geocod', 'places'])]
    if maps_related:
        print("\n🗺️  地图相关日志:")
        for log in maps_related[:10]:
            print(f"   {log}")
    
    # 最终判断
    if maps_initialized and not maps_error:
        print("\n✅ 测试通过: Google Maps 地图功能正常工作")
        return True
    elif maps_error:
        print("\n❌ 测试失败: 检测到地图相关错误")
        return False
    else:
        print("\n⚠️  测试不确定: 未检测到明确的地图初始化消息，请手动检查")
        return None

if __name__ == "__main__":
    result = test_google_maps_display()
    exit(0 if result else 1)

