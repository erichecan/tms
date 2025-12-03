#!/usr/bin/env python3
"""
Google Maps 地图功能完整测试脚本
使用 webapp-testing 工具包测试生产环境的地图显示功能
创建时间: 2025-12-02T21:15:00Z
"""

from playwright.sync_api import sync_playwright
import time

# 生产环境 URL
BASE_URL = 'https://tms-frontend-v4estohola-df.a.run.app'
BACKEND_URL = 'https://tms-backend-v4estohola-df.a.run.app'

# 测试账号
TEST_EMAIL = 'agnes@aponygroup.com'
TEST_PASSWORD = '27669'

def test_google_maps_comprehensive():
    """完整的 Google Maps 功能测试"""
    print("=" * 60)
    print("🗺️  Google Maps 完整功能测试")
    print("=" * 60)
    
    console_logs = []
    errors = []
    maps_initialized = False
    maps_error = False
    address_autocomplete_working = False
    
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
                print(f"   ✅ 检测到地图初始化成功消息")
            if 'Google Maps API Key 未配置' in msg.text or 'InvalidKeyMapError' in msg.text or 'ApiNotActivatedMapError' in msg.text:
                global maps_error
                maps_error = True
                print(f"   ❌ 检测到地图错误: {msg.text}")
            if 'map' in msg.text.lower() or 'google' in msg.text.lower():
                print(f"   📝 地图相关日志: {msg.text}")
        
        def handle_page_error(error):
            errors.append(f"Page error: {error}")
            print(f"   ❌ 页面错误: {error}")
        
        page.on("console", handle_console)
        page.on("pageerror", handle_page_error)
        
        try:
            # 1. 访问登录页面
            print("\n[1/7] 访问登录页面...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
            time.sleep(2)
            print("   ✅ 登录页面加载成功")
            
            # 2. 登录
            print("\n[2/7] 执行登录...")
            email_input = page.locator('input[name="email"], input[placeholder*="邮箱"], input[type="email"]').first
            password_input = page.locator('input[name="password"], input[type="password"]').first
            submit_button = page.locator('button[type="submit"]').first
            
            email_input.wait_for(state='visible', timeout=10000)
            password_input.wait_for(state='visible', timeout=10000)
            
            email_input.fill(TEST_EMAIL)
            password_input.fill(TEST_PASSWORD)
            
            submit_button.wait_for(state='visible', timeout=10000)
            submit_button.click()
            
            # 等待登录完成
            try:
                page.wait_for_url("**/dashboard", timeout=15000)
            except:
                current_url = page.url
                if '/login' not in current_url:
                    print(f"   登录后跳转到: {current_url}")
                else:
                    raise Exception("登录失败，仍在登录页面")
            time.sleep(3)
            print("   ✅ 登录成功")
            
            # 3. 访问运单创建页面
            print("\n[3/7] 访问运单创建页面...")
            page.goto(f"{BASE_URL}/shipments/create", wait_until="networkidle", timeout=30000)
            time.sleep(5)  # 等待页面完全加载
            
            # 截图
            page.screenshot(path='/tmp/shipment_create_page.png', full_page=True)
            print("   📸 页面截图已保存: /tmp/shipment_create_page.png")
            
            # 4. 检查页面内容
            print("\n[4/7] 检查页面内容...")
            page_content = page.content()
            
            # 检查 Google Maps 脚本
            has_google_maps_script = 'maps.googleapis.com' in page_content or 'google.maps' in page_content
            has_api_key = 'AIzaSy' in page_content
            print(f"   页面包含 Google Maps 脚本: {'✅ 是' if has_google_maps_script else '❌ 否'}")
            print(f"   页面包含 API Key: {'✅ 是' if has_api_key else '❌ 否'}")
            
            # 5. 查找地址输入框
            print("\n[5/7] 查找地址输入框...")
            time.sleep(2)
            
            # 尝试多种方式查找地址输入框
            shipper_address_selectors = [
                'input[name="shipperAddress1"]',
                'input[placeholder*="街道地址"]',
                'input[placeholder*="address"]',
                'input[placeholder*="自动完成"]',
            ]
            
            receiver_address_selectors = [
                'input[name="receiverAddress1"]',
                'input[placeholder*="街道地址"]',
                'input[placeholder*="address"]',
                'input[placeholder*="自动完成"]',
            ]
            
            shipper_input = None
            receiver_input = None
            
            for selector in shipper_address_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        shipper_input = page.locator(selector).first
                        print(f"   ✅ 找到发货地址输入框: {selector}")
                        break
                except:
                    continue
            
            for selector in receiver_address_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        receiver_input = page.locator(selector).first
                        print(f"   ✅ 找到收货地址输入框: {selector}")
                        break
                except:
                    continue
            
            if not shipper_input:
                print("   ⚠️  未找到发货地址输入框，尝试查找所有输入框...")
                all_inputs = page.locator('input').all()
                print(f"   页面总共有 {len(all_inputs)} 个输入框")
                for i, inp in enumerate(all_inputs[:10]):
                    try:
                        placeholder = inp.get_attribute('placeholder') or ''
                        name = inp.get_attribute('name') or ''
                        print(f"     输入框 {i+1}: name={name}, placeholder={placeholder}")
                    except:
                        pass
            
            # 6. 测试地址自动完成
            if shipper_input:
                print("\n[6/7] 测试地址自动完成功能...")
                try:
                    shipper_input.scroll_into_view_if_needed()
                    time.sleep(1)
                    shipper_input.click()
                    time.sleep(1)
                    shipper_input.fill("Toronto")
                    time.sleep(3)  # 等待自动完成建议出现
                    
                    # 检查是否有自动完成下拉列表
                    autocomplete_selectors = [
                        '.pac-container',
                        '[class*="autocomplete"]',
                        '[class*="suggestions"]',
                        '[role="listbox"]'
                    ]
                    
                    autocomplete_found = False
                    for selector in autocomplete_selectors:
                        if page.locator(selector).count() > 0:
                            autocomplete_found = True
                            print(f"   ✅ 找到自动完成下拉列表: {selector}")
                            address_autocomplete_working = True
                            break
                    
                    if not autocomplete_found:
                        print("   ⚠️  未检测到自动完成下拉列表")
                        # 截图当前状态
                        page.screenshot(path='/tmp/address_input_test.png', full_page=True)
                        print("   📸 已保存测试截图: /tmp/address_input_test.png")
                except Exception as e:
                    print(f"   ❌ 测试地址自动完成时出错: {e}")
            else:
                print("   ⚠️  跳过地址自动完成测试（未找到输入框）")
            
            # 7. 检查控制台日志
            print("\n[7/7] 检查控制台日志...")
            time.sleep(2)
            
            maps_related_logs = [log for log in console_logs if any(keyword in log.lower() for keyword in ['map', 'google', 'geocod', 'places', 'address'])]
            if maps_related_logs:
                print(f"   找到 {len(maps_related_logs)} 条地图相关日志:")
                for log in maps_related_logs[:10]:
                    print(f"     {log}")
            else:
                print("   ⚠️  未找到地图相关日志")
            
        except Exception as e:
            print(f"\n❌ 测试过程中出现错误: {e}")
            errors.append(str(e))
            page.screenshot(path='/tmp/google_maps_test_error.png', full_page=True)
            import traceback
            traceback.print_exc()
        
        finally:
            time.sleep(2)
            browser.close()
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("📊 测试结果总结")
    print("=" * 60)
    
    print(f"\n✅ 地图初始化状态: {'成功' if maps_initialized else '未检测到'}")
    print(f"{'❌' if maps_error else '✅'} 地图错误状态: {'有错误' if maps_error else '无错误'}")
    print(f"✅ 地址自动完成: {'工作正常' if address_autocomplete_working else '未测试/未检测到'}")
    print(f"\n📝 控制台日志总数: {len(console_logs)}")
    print(f"❌ 错误总数: {len(errors)}")
    
    if errors:
        print("\n⚠️  发现的错误:")
        for i, error in enumerate(errors[:10], 1):
            print(f"   {i}. {error}")
    
    # 最终判断
    success_count = sum([
        maps_initialized,
        not maps_error,
        address_autocomplete_working
    ])
    
    if success_count >= 2:
        print("\n✅ 测试通过: Google Maps 功能基本正常")
        return True
    elif maps_error:
        print("\n❌ 测试失败: 检测到地图相关错误")
        return False
    else:
        print("\n⚠️  测试不确定: 部分功能未检测到，请手动检查")
        print("\n建议:")
        print("1. 检查浏览器控制台是否有地图初始化消息")
        print("2. 手动测试地址输入框的自动完成功能")
        print("3. 检查 API Key 是否正确配置")
        return None

if __name__ == "__main__":
    result = test_google_maps_comprehensive()
    exit(0 if result else 1)

