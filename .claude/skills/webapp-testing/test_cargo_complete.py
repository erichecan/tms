#!/usr/bin/env python3
"""
完整的货物规格布局测试 - 包含登录和详细验证
"""

from playwright.sync_api import sync_playwright
import time

BASE_URL = 'https://tms-frontend-5gin6nacta-uc.a.run.app'
TEST_EMAIL = 'agnes@aponygroup.com'
TEST_PASSWORD = '27669'

def test_cargo_complete():
    """完整测试货物规格布局"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(viewport={'width': 1920, 'height': 1080})
        page = context.new_page()
        
        try:
            # 1. 登录
            print("=" * 60)
            print("📦 货物规格布局完整测试")
            print("=" * 60)
            print("\n[1/5] 登录...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=60000)
            time.sleep(5)
            
            # 尝试多种登录方式
            logged_in = False
            for email_sel in ['input[type="email"]', 'input[name="email"]', 'input[placeholder*="邮箱"]']:
                try:
                    if page.locator(email_sel).count() > 0:
                        page.fill(email_sel, TEST_EMAIL)
                        break
                except:
                    continue
            
            for pwd_sel in ['input[type="password"]', 'input[name="password"]']:
                try:
                    if page.locator(pwd_sel).count() > 0:
                        page.fill(pwd_sel, TEST_PASSWORD)
                        break
                except:
                    continue
            
            for btn_sel in ['button[type="submit"]', 'button:has-text("登录")', '.ant-btn-primary']:
                try:
                    if page.locator(btn_sel).count() > 0:
                        page.click(btn_sel)
                        logged_in = True
                        break
                except:
                    continue
            
            if not logged_in:
                # 尝试按Enter
                page.keyboard.press('Enter')
            
            time.sleep(5)
            print("   ✅ 登录完成")
            
            # 2. 访问创建运单页面
            print("\n[2/5] 访问创建运单页面...")
            page.goto(f"{BASE_URL}/shipments/create", wait_until="networkidle", timeout=60000)
            time.sleep(10)  # 等待页面完全加载
            
            page.screenshot(path='/tmp/cargo_initial.png', full_page=True)
            print("   📸 初始截图: /tmp/cargo_initial.png")
            
            # 3. 检查货物规格部分
            print("\n[3/5] 检查货物规格部分...")
            
            # 查找货物信息卡片
            cargo_cards = page.locator('.ant-card, [class*="card"]').filter(has_text='货物').all()
            print(f"   找到 {len(cargo_cards)} 个货物相关卡片")
            
            # 4. 检查托盘和件数
            print("\n[4/5] 检查托盘和件数位置...")
            
            # 查找所有输入框
            all_inputs = page.locator('input, .ant-input-number-input').all()
            print(f"   页面共有 {len(all_inputs)} 个输入框")
            
            # 查找托盘和件数输入框
            pallets_found = False
            quantity_found = False
            
            for inp in all_inputs[:20]:  # 检查前20个
                try:
                    placeholder = inp.get_attribute('placeholder') or ''
                    if '托盘' in placeholder:
                        pallets_found = True
                        print(f"   ✅ 找到托盘输入框: {placeholder}")
                    if '件数' in placeholder:
                        quantity_found = True
                        print(f"   ✅ 找到件数输入框: {placeholder}")
                except:
                    pass
            
            if not pallets_found:
                print("   ❌ 未找到托盘输入框")
            if not quantity_found:
                print("   ❌ 未找到件数输入框")
            
            # 5. 检查>>按钮和展开功能
            print("\n[5/5] 检查>>展开按钮...")
            
            # 查找所有按钮
            all_buttons = page.locator('button').all()
            print(f"   页面共有 {len(all_buttons)} 个按钮")
            
            expand_button_found = False
            for btn in all_buttons:
                try:
                    btn_text = btn.inner_text().strip()
                    if btn_text == '>>' or btn_text == '<<':
                        expand_button_found = True
                        print(f"   ✅ 找到展开按钮: '{btn_text}'")
                        
                        # 检查长宽高是否隐藏
                        length_inputs = page.locator('input[placeholder*="长"]').all()
                        weight_inputs = page.locator('input[placeholder*="重"]').all()
                        
                        length_visible = any(inp.is_visible() for inp in length_inputs) if length_inputs else False
                        weight_visible = any(inp.is_visible() for inp in weight_inputs) if weight_inputs else False
                        
                        print(f"   展开前 - 长字段可见: {length_visible} (应该为False)")
                        print(f"   展开前 - 重量字段可见: {weight_visible} (应该为False)")
                        
                        # 点击展开
                        if btn_text == '>>':
                            print("   点击>>按钮展开...")
                            btn.click()
                            time.sleep(3)
                            
                            page.screenshot(path='/tmp/cargo_expanded.png', full_page=True)
                            print("   📸 展开后截图: /tmp/cargo_expanded.png")
                            
                            # 再次检查
                            length_inputs_after = page.locator('input[placeholder*="长"]').all()
                            weight_inputs_after = page.locator('input[placeholder*="重"]').all()
                            
                            length_visible_after = any(inp.is_visible() for inp in length_inputs_after) if length_inputs_after else False
                            weight_visible_after = any(inp.is_visible() for inp in weight_inputs_after) if weight_inputs_after else False
                            
                            print(f"   展开后 - 长字段可见: {length_visible_after} (应该为True)")
                            print(f"   展开后 - 重量字段可见: {weight_visible_after} (应该为True)")
                            
                            # 检查按钮是否变为<<
                            btn_text_after = btn.inner_text().strip()
                            print(f"   按钮文本变为: '{btn_text_after}' (应该为'<<')")
                            
                        break
                except Exception as e:
                    continue
            
            if not expand_button_found:
                print("   ❌ 未找到>>按钮")
                # 打印所有按钮文本
                print("   所有按钮文本:")
                for i, btn in enumerate(all_buttons[:15]):
                    try:
                        btn_text = btn.inner_text().strip()
                        if btn_text:
                            print(f"     按钮 {i+1}: '{btn_text}'")
                    except:
                        pass
            
            # 最终截图
            page.screenshot(path='/tmp/cargo_final.png', full_page=True)
            print("\n   📸 最终截图: /tmp/cargo_final.png")
            
            # 总结
            print("\n" + "=" * 60)
            print("📊 测试总结")
            print("=" * 60)
            print(f"托盘输入框: {'✅' if pallets_found else '❌'}")
            print(f"件数输入框: {'✅' if quantity_found else '❌'}")
            print(f">>展开按钮: {'✅' if expand_button_found else '❌'}")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='/tmp/cargo_error.png', full_page=True)
            print("   📸 错误截图: /tmp/cargo_error.png")
        finally:
            time.sleep(5)
            browser.close()

if __name__ == '__main__':
    test_cargo_complete()

