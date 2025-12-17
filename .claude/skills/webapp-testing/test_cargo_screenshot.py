#!/usr/bin/env python3
"""
货物规格页面截图测试 - 检查实际显示效果
"""

from playwright.sync_api import sync_playwright
import time

BASE_URL = 'https://tms-frontend-5gin6nacta-uc.a.run.app'
TEST_EMAIL = 'agnes@aponygroup.com'
TEST_PASSWORD = '27669'

def test_screenshot():
    """截图测试"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        context = browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            # 禁用缓存
            bypass_csp=True
        )
        # 禁用缓存
        context.set_extra_http_headers({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        })
        page = context.new_page()
        
        try:
            print("=" * 60)
            print("📸 货物规格页面截图测试")
            print("=" * 60)
            
            # 1. 登录
            print("\n[1/3] 登录...")
            page.goto(f"{BASE_URL}/login", wait_until="networkidle", timeout=60000)
            time.sleep(3)
            
            # 登录
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
                        break
                except:
                    continue
            
            time.sleep(5)
            print("   ✅ 登录完成")
            
            # 2. 访问创建运单页面（带缓存清除参数）
            print("\n[2/3] 访问创建运单页面（清除缓存）...")
            # 使用时间戳参数强制刷新
            page.goto(f"{BASE_URL}/shipments/create?t={int(time.time())}", wait_until="networkidle", timeout=60000)
            time.sleep(10)  # 等待页面完全加载
            
            # 截图
            page.screenshot(path='/tmp/cargo_actual_screenshot.png', full_page=True)
            print("   📸 完整页面截图: /tmp/cargo_actual_screenshot.png")
            
            # 3. 查找货物规格部分并单独截图
            print("\n[3/3] 查找货物规格部分...")
            
            # 尝试多种方式查找货物规格部分
            cargo_section = None
            selectors = [
                'text=货物规格',
                'text=货物信息',
                '[class*="cargo"]',
                '.ant-card:has-text("货物")'
            ]
            
            for selector in selectors:
                try:
                    elements = page.locator(selector).all()
                    if len(elements) > 0:
                        cargo_section = elements[0]
                        print(f"   ✅ 找到货物规格部分: {selector}")
                        break
                except:
                    continue
            
            if cargo_section:
                # 截图货物规格部分
                cargo_section.screenshot(path='/tmp/cargo_section_only.png')
                print("   📸 货物规格部分截图: /tmp/cargo_section_only.png")
            
            # 检查页面HTML内容
            page_content = page.content()
            
            # 检查是否有>>按钮
            has_expand_btn = '>>' in page_content or '<<' in page_content
            print(f"\n   页面包含>>按钮: {'✅ 是' if has_expand_btn else '❌ 否'}")
            
            # 检查是否有托盘和件数
            has_pallets = '托盘' in page_content
            has_quantity = '件数' in page_content
            print(f"   页面包含托盘: {'✅ 是' if has_pallets else '❌ 否'}")
            print(f"   页面包含件数: {'✅ 是' if has_quantity else '❌ 否'}")
            
            # 检查是否有长宽高
            has_length = '长(cm)' in page_content or '长' in page_content
            has_weight = '重(kg)' in page_content or '重' in page_content
            print(f"   页面包含长字段: {'✅ 是' if has_length else '❌ 否'}")
            print(f"   页面包含重量字段: {'✅ 是' if has_weight else '❌ 否'}")
            
            # 检查页面源码中的关键代码
            if 'cargoExpanded' in page_content:
                print("   ✅ 页面包含 cargoExpanded 状态管理")
            else:
                print("   ❌ 页面不包含 cargoExpanded 状态管理")
            
            if '>>' in page_content and 'cargoExpanded[index]' in page_content:
                print("   ✅ 页面包含展开/折叠逻辑")
            else:
                print("   ❌ 页面不包含展开/折叠逻辑")
            
            # 等待一下让用户看到
            time.sleep(3)
            
            print("\n" + "=" * 60)
            print("📊 测试完成")
            print("=" * 60)
            print("截图已保存到:")
            print("  - /tmp/cargo_actual_screenshot.png (完整页面)")
            if cargo_section:
                print("  - /tmp/cargo_section_only.png (货物规格部分)")
            
        except Exception as e:
            print(f"\n❌ 测试失败: {e}")
            import traceback
            traceback.print_exc()
            page.screenshot(path='/tmp/cargo_error_screenshot.png', full_page=True)
            print("   📸 错误截图: /tmp/cargo_error_screenshot.png")
        finally:
            time.sleep(5)
            browser.close()

if __name__ == '__main__':
    test_screenshot()







