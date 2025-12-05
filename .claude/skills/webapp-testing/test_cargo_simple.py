#!/usr/bin/env python3
"""
简化的货物规格布局测试 - 直接访问页面检查
"""

from playwright.sync_api import sync_playwright
import time

BASE_URL = 'https://tms-frontend-5gin6nacta-uc.a.run.app'

def test_cargo_simple():
    """简化测试 - 直接检查页面元素"""
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=False)
        page = browser.new_page()
        
        try:
            print("访问创建运单页面...")
            page.goto(f"{BASE_URL}/shipments/create", wait_until="domcontentloaded", timeout=60000)
            time.sleep(10)  # 等待页面完全加载
            
            # 截图
            page.screenshot(path='/tmp/cargo_test.png', full_page=True)
            print("截图已保存: /tmp/cargo_test.png")
            
            # 检查页面内容
            page_content = page.content()
            
            # 检查是否有>>按钮
            has_expand_button = '>>' in page_content or '<<' in page_content
            print(f">>按钮: {'✅ 找到' if has_expand_button else '❌ 未找到'}")
            
            # 检查是否有托盘和件数
            has_pallets = '托盘' in page_content or 'pallets' in page_content.lower()
            has_quantity = '件数' in page_content or 'quantity' in page_content.lower()
            print(f"托盘: {'✅ 找到' if has_pallets else '❌ 未找到'}")
            print(f"件数: {'✅ 找到' if has_quantity else '❌ 未找到'}")
            
            # 查找>>按钮并点击
            expand_buttons = page.locator('button:has-text(">>"), button:has-text("<<")').all()
            print(f"找到 {len(expand_buttons)} 个展开按钮")
            
            if len(expand_buttons) > 0:
                btn = expand_buttons[0]
                btn_text = btn.inner_text()
                print(f"按钮文本: {btn_text}")
                
                if '>>' in btn_text:
                    print("点击>>按钮...")
                    btn.click()
                    time.sleep(2)
                    page.screenshot(path='/tmp/cargo_expanded.png', full_page=True)
                    print("展开后截图: /tmp/cargo_expanded.png")
            
            # 检查长宽高字段
            length_inputs = page.locator('input[placeholder*="长"], input[placeholder*="长度"]').all()
            weight_inputs = page.locator('input[placeholder*="重"], input[placeholder*="重量"]').all()
            
            print(f"长字段: {len(length_inputs)} 个")
            print(f"重量字段: {len(weight_inputs)} 个")
            
            time.sleep(5)
            
        except Exception as e:
            print(f"错误: {e}")
            page.screenshot(path='/tmp/cargo_error.png', full_page=True)
        finally:
            time.sleep(3)
            browser.close()

if __name__ == '__main__':
    test_cargo_simple()

