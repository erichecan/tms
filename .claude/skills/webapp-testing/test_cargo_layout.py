#!/usr/bin/env python3
"""
货物规格布局测试脚本
测试创建运单页面的货物规格部分布局是否正确
创建时间: 2025-12-05T13:45:00Z
"""

from playwright.sync_api import sync_playwright
import time
import os

# 生产环境 URL
BASE_URL = os.getenv('TMS_FRONTEND_URL', 'https://tms-frontend-5gin6nacta-uc.a.run.app')

# 测试账号
TEST_EMAIL = os.getenv('TMS_TEST_EMAIL', 'agnes@aponygroup.com')
TEST_PASSWORD = os.getenv('TMS_TEST_PASSWORD', '27669')

def test_cargo_layout():
    """测试货物规格布局"""
    print("=" * 60)
    print("📦 货物规格布局测试")
    print("=" * 60)
    
    with sync_playwright() as p:
        # 启动浏览器（有头模式，方便观察）
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        )
        page = context.new_page()
        
        try:
            # 1. 访问登录页面
            print("\n[1/6] 访问登录页面...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=30000)
            time.sleep(2)
            print("   ✅ 登录页面加载成功")
            
            # 2. 登录
            print("\n[2/6] 执行登录...")
            # 等待页面完全加载
            time.sleep(3)
            
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
                        print(f"   ✅ 使用选择器填写邮箱: {selector}")
                        break
                except Exception as e:
                    continue
            
            if not email_filled:
                page.screenshot(path='/tmp/login_page_debug.png', full_page=True)
                print("   ⚠️  未找到邮箱输入框，截图已保存: /tmp/login_page_debug.png")
                raise Exception("无法找到邮箱输入框")
            
            password_filled = False
            for selector in password_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.fill(selector, TEST_PASSWORD)
                        password_filled = True
                        print(f"   ✅ 使用选择器填写密码: {selector}")
                        break
                except Exception as e:
                    continue
            
            if not password_filled:
                raise Exception("无法找到密码输入框")
            
            submit_clicked = False
            for selector in submit_selectors:
                try:
                    if page.locator(selector).count() > 0:
                        page.click(selector)
                        submit_clicked = True
                        print(f"   ✅ 使用选择器点击登录: {selector}")
                        break
                except Exception as e:
                    continue
            
            if not submit_clicked:
                raise Exception("无法找到登录按钮")
            
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
            print("\n[3/6] 访问运单创建页面...")
            page.goto(f"{BASE_URL}/shipments/create", wait_until="networkidle", timeout=30000)
            time.sleep(5)  # 等待页面完全加载
            
            # 截图
            page.screenshot(path='/tmp/shipment_create_initial.png', full_page=True)
            print("   📸 页面截图已保存: /tmp/shipment_create_initial.png")
            
            # 4. 查找货物规格部分
            print("\n[4/6] 检查货物规格部分...")
            
            # 查找货物信息卡片
            cargo_section = page.locator('text=货物信息, text=货物规格').first
            if cargo_section.count() == 0:
                # 尝试其他选择器
                cargo_section = page.locator('[class*="cargo"], [id*="cargo"]').first
                if cargo_section.count() == 0:
                    raise Exception("未找到货物规格部分")
            
            print("   ✅ 找到货物规格部分")
            
            # 5. 检查托盘和件数是否在最前面
            print("\n[5/6] 检查托盘和件数位置...")
            
            # 查找托盘输入框
            pallets_input = page.locator('input[placeholder*="托盘"], input[placeholder*="托盘数"]').first
            quantity_input = page.locator('input[placeholder*="件数"]').first
            
            pallets_found = pallets_input.count() > 0
            quantity_found = quantity_input.count() > 0
            
            print(f"   托盘输入框: {'✅ 找到' if pallets_found else '❌ 未找到'}")
            print(f"   件数输入框: {'✅ 找到' if quantity_found else '❌ 未找到'}")
            
            if not pallets_found or not quantity_found:
                # 尝试查找所有输入框，看看布局
                all_inputs = page.locator('input[type="number"], .ant-input-number-input').all()
                print(f"   找到 {len(all_inputs)} 个数字输入框")
                for i, inp in enumerate(all_inputs[:5]):  # 只显示前5个
                    try:
                        placeholder = inp.get_attribute('placeholder') or '无placeholder'
                        print(f"     输入框 {i+1}: {placeholder}")
                    except:
                        pass
            
            # 6. 检查长宽高、重量、价值是否默认隐藏
            print("\n[6/6] 检查长宽高、重量、价值是否默认隐藏...")
            
            # 查找这些字段
            length_input = page.locator('input[placeholder*="长"], input[placeholder*="长度"]').first
            width_input = page.locator('input[placeholder*="宽"], input[placeholder*="宽度"]').first
            height_input = page.locator('input[placeholder*="高"], input[placeholder*="高度"]').first
            weight_input = page.locator('input[placeholder*="重"], input[placeholder*="重量"]').first
            value_input = page.locator('input[placeholder*="价值"]').first
            
            length_visible = length_input.count() > 0 and length_input.is_visible() if length_input.count() > 0 else False
            width_visible = width_input.count() > 0 and width_input.is_visible() if width_input.count() > 0 else False
            height_visible = height_input.count() > 0 and height_input.is_visible() if height_input.count() > 0 else False
            weight_visible = weight_input.count() > 0 and weight_input.is_visible() if weight_input.count() > 0 else False
            value_visible = value_input.count() > 0 and value_input.is_visible() if value_input.count() > 0 else False
            
            print(f"   长: {'❌ 可见（应该隐藏）' if length_visible else '✅ 隐藏'}")
            print(f"   宽: {'❌ 可见（应该隐藏）' if width_visible else '✅ 隐藏'}")
            print(f"   高: {'❌ 可见（应该隐藏）' if height_visible else '✅ 隐藏'}")
            print(f"   重量: {'❌ 可见（应该隐藏）' if weight_visible else '✅ 隐藏'}")
            print(f"   价值: {'❌ 可见（应该隐藏）' if value_visible else '✅ 隐藏'}")
            
            # 7. 检查>>按钮并测试展开功能
            print("\n[7/6] 检查>>展开按钮...")
            
            # 查找>>按钮
            expand_buttons = page.locator('button:has-text(">>"), button:has-text("<<")').all()
            print(f"   找到 {len(expand_buttons)} 个展开/收起按钮")
            
            if len(expand_buttons) > 0:
                expand_button = expand_buttons[0]
                button_text = expand_button.inner_text()
                print(f"   按钮文本: {button_text}")
                
                if '>>' in button_text:
                    print("   ✅ 找到>>按钮（未展开状态）")
                    
                    # 点击展开
                    print("   点击>>按钮展开...")
                    expand_button.click()
                    time.sleep(2)
                    
                    # 截图展开后的状态
                    page.screenshot(path='/tmp/shipment_create_expanded.png', full_page=True)
                    print("   📸 展开后截图已保存: /tmp/shipment_create_expanded.png")
                    
                    # 再次检查长宽高、重量、价值是否可见
                    length_visible_after = length_input.count() > 0 and length_input.is_visible() if length_input.count() > 0 else False
                    weight_visible_after = weight_input.count() > 0 and weight_input.is_visible() if weight_input.count() > 0 else False
                    
                    print(f"   展开后 - 长: {'✅ 可见' if length_visible_after else '❌ 仍隐藏'}")
                    print(f"   展开后 - 重量: {'✅ 可见' if weight_visible_after else '❌ 仍隐藏'}")
                    
                    # 检查按钮是否变为<<
                    button_text_after = expand_button.inner_text()
                    if '<<' in button_text_after:
                        print("   ✅ 按钮已变为<<（已展开状态）")
                    else:
                        print(f"   ⚠️  按钮文本仍为: {button_text_after}")
                else:
                    print(f"   ⚠️  按钮文本不是>>: {button_text}")
            else:
                print("   ❌ 未找到>>按钮")
                # 尝试查找其他可能的展开按钮
                all_buttons = page.locator('button').all()
                print(f"   页面共有 {len(all_buttons)} 个按钮")
                for i, btn in enumerate(all_buttons[:10]):  # 只显示前10个
                    try:
                        btn_text = btn.inner_text()
                        if btn_text and ('展开' in btn_text or '收起' in btn_text or '>>' in btn_text or '<<' in btn_text):
                            print(f"     按钮 {i+1}: {btn_text}")
                    except:
                        pass
            
            # 最终截图
            page.screenshot(path='/tmp/shipment_create_final.png', full_page=True)
            print("\n   📸 最终截图已保存: /tmp/shipment_create_final.png")
            
            # 总结
            print("\n" + "=" * 60)
            print("📊 测试总结")
            print("=" * 60)
            print(f"✅ 托盘和件数: {'找到' if (pallets_found and quantity_found) else '未找到'}")
            print(f"✅ 长宽高重量价值默认隐藏: {'是' if not (length_visible or weight_visible or value_visible) else '否'}")
            print(f"✅ >>展开按钮: {'找到' if len(expand_buttons) > 0 else '未找到'}")
            
            if pallets_found and quantity_found and not (length_visible or weight_visible or value_visible) and len(expand_buttons) > 0:
                print("\n🎉 所有测试通过！")
            else:
                print("\n⚠️  部分测试未通过，请检查截图")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {str(e)}")
            page.screenshot(path='/tmp/shipment_create_error.png', full_page=True)
            print("   📸 错误截图已保存: /tmp/shipment_create_error.png")
            raise
        finally:
            time.sleep(2)
            browser.close()

if __name__ == '__main__':
    test_cargo_layout()

