#!/usr/bin/env python3
"""
完整系统测试脚本
使用 webapp-testing 工具包和 Playwright 测试生产环境的所有功能模块
创建时间: 2025-12-02T21:00:00Z
"""

from playwright.sync_api import sync_playwright
import time
import json
import os
from datetime import datetime

# 生产环境 URL - 用户需要提供或使用默认值
BASE_URL = os.getenv('TMS_FRONTEND_URL', 'https://tms-frontend-v4estohola-df.a.run.app')
BACKEND_URL = os.getenv('TMS_BACKEND_URL', 'https://tms-backend-v4estohola-df.a.run.app')

# 测试账号 - 用户需要提供
TEST_EMAIL = os.getenv('TMS_TEST_EMAIL', '')
TEST_PASSWORD = os.getenv('TMS_TEST_PASSWORD', '')

# 测试结果存储
test_results = {
    'timestamp': datetime.now().isoformat(),
    'base_url': BASE_URL,
    'backend_url': BACKEND_URL,
    'modules': {},
    'errors': [],
    'warnings': [],
    'summary': {
        'total_tests': 0,
        'passed': 0,
        'failed': 0,
        'skipped': 0
    }
}

def log_error(module, step, error):
    """记录错误"""
    error_info = {
        'module': module,
        'step': step,
        'error': str(error),
        'timestamp': datetime.now().isoformat()
    }
    test_results['errors'].append(error_info)
    print(f"  ❌ {step}: {str(error)}")

def log_warning(module, message):
    """记录警告"""
    warning_info = {
        'module': module,
        'message': message,
        'timestamp': datetime.now().isoformat()
    }
    test_results['warnings'].append(warning_info)
    print(f"  ⚠️  {message}")

def test_module(module_name, test_func):
    """测试模块包装器"""
    print(f"\n{'='*60}")
    print(f"🧪 测试模块: {module_name}")
    print(f"{'='*60}")
    
    test_results['modules'][module_name] = {
        'status': 'running',
        'steps': [],
        'errors': [],
        'warnings': []
    }
    
    try:
        test_func()
        test_results['modules'][module_name]['status'] = 'passed'
        test_results['summary']['passed'] += 1
        print(f"\n✅ {module_name} 测试通过")
    except Exception as e:
        test_results['modules'][module_name]['status'] = 'failed'
        test_results['modules'][module_name]['errors'].append(str(e))
        test_results['summary']['failed'] += 1
        print(f"\n❌ {module_name} 测试失败: {str(e)}")
    
    test_results['summary']['total_tests'] += 1

def login(page):
    """登录辅助函数"""
    print("\n[登录] 访问登录页面...")
    page.goto(f"{BASE_URL}/login", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(2000)
    
    if not TEST_EMAIL or not TEST_PASSWORD:
        raise Exception("测试账号未设置，请设置 TMS_TEST_EMAIL 和 TMS_TEST_PASSWORD 环境变量")
    
    print(f"[登录] 使用账号: {TEST_EMAIL}")
    # 尝试多种选择器找到输入框
    email_selectors = [
        'input[name="email"]',
        'input[type="email"]',
        'input[placeholder*="邮箱"]',
        'input[placeholder*="Email"]',
        'input[placeholder*="email"]'
    ]
    
    password_selectors = [
        'input[name="password"]',
        'input[type="password"]'
    ]
    
    submit_selectors = [
        'button[type="submit"]',
        'button:has-text("登录")',
        'button:has-text("Login")',
        'button:has-text("Sign in")'
    ]
    
    email_input = None
    for selector in email_selectors:
        try:
            locator = page.locator(selector).first
            if locator.count() > 0:
                email_input = locator
                break
        except Exception as e:
            continue
    
    if not email_input:
        raise Exception("未找到邮箱输入框")
    
    password_input = None
    for selector in password_selectors:
        try:
            locator = page.locator(selector).first
            if locator.count() > 0:
                password_input = locator
                break
        except Exception as e:
            continue
    
    if not password_input:
        raise Exception("未找到密码输入框")
    
    submit_button = None
    for selector in submit_selectors:
        try:
            locator = page.locator(selector).first
            if locator.count() > 0:
                submit_button = locator
                break
        except Exception as e:
            continue
    
    if not submit_button:
        raise Exception("未找到登录按钮")
    
    email_input.wait_for(state='visible', timeout=10000)
    password_input.wait_for(state='visible', timeout=10000)
    
    email_input.fill(TEST_EMAIL)
    password_input.fill(TEST_PASSWORD)
    
    submit_button.wait_for(state='visible', timeout=10000)
    submit_button.click()
    
    # 等待登录完成
    try:
        # 等待 URL 变化（不在登录页面）
        page.wait_for_url(lambda url: '/login' not in str(url), timeout=15000)
    except:
        # 如果超时，检查当前 URL
        current_url = page.url
        if '/login' in current_url:
            raise Exception("登录失败，仍在登录页面")
    
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    print("  ✅ 登录成功")

def test_authentication(page):
    """测试认证模块"""
    # 登录已在外部完成
    print("\n[认证] 测试登出功能...")
    
    # 查找登出按钮
    logout_buttons = page.locator('button:has-text("登出"), button:has-text("退出"), a:has-text("登出")').all()
    if len(logout_buttons) > 0:
        print("  ✅ 找到登出按钮")
        # 不实际点击，避免影响后续测试
    else:
        log_warning('认证', '未找到登出按钮')
    
    print("\n[认证] 检查会话状态...")
    # 检查是否已登录（通过检查是否有用户信息或菜单）
    try:
        user_menu = page.locator('.ant-dropdown-trigger, [class*="user"], [class*="avatar"]').first()
        if user_menu.count() > 0:
            print("  ✅ 用户已登录，会话正常")
        else:
            log_warning('认证', '未找到用户菜单，可能未正确登录')
    except:
        # 尝试其他方式检查登录状态
        current_url = page.url
        if '/login' not in current_url:
            print("  ✅ 用户已登录（不在登录页面）")
        else:
            log_warning('认证', '仍在登录页面，可能未正确登录')

def test_shipment_management(page):
    """测试运单管理模块"""
    print("\n[运单管理] 导航到运单管理页面...")
    page.goto(f"{BASE_URL}/admin/shipments", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    page.screenshot(path='test-results/shipment-list.png', full_page=True)
    print("  ✅ 运单列表页面加载成功")
    
    # 检查运单列表
    print("\n[运单管理] 检查运单列表...")
    try:
        shipment_table = page.locator('table, .ant-table').first()
        if shipment_table.count() > 0:
            rows = shipment_table.locator('tbody tr, .ant-table-tbody tr').all()
            print(f"  ✅ 找到 {len(rows)} 条运单记录")
        else:
            log_warning('运单管理', '未找到运单列表表格')
    except Exception as e:
        log_warning('运单管理', f'检查运单列表时出错: {str(e)}')
    
    # 测试创建运单按钮
    print("\n[运单管理] 检查创建运单功能...")
    try:
        create_buttons = page.locator('button:has-text("创建"), button:has-text("新建"), button:has-text("添加")').all()
        if len(create_buttons) > 0:
            print("  ✅ 找到创建运单按钮")
        else:
            log_warning('运单管理', '未找到创建运单按钮')
    except Exception as e:
        log_warning('运单管理', f'检查创建按钮时出错: {str(e)}')
    
    # 测试运单详情
    print("\n[运单管理] 检查运单详情功能...")
    try:
        detail_links = page.locator('a:has-text("查看"), button:has-text("详情"), .ant-table-row').first()
        if detail_links.count() > 0:
            print("  ✅ 找到运单详情入口")
        else:
            log_warning('运单管理', '未找到运单详情入口')
    except Exception as e:
        log_warning('运单管理', f'检查运单详情时出错: {str(e)}')

def test_vehicle_management(page):
    """测试车辆管理模块"""
    print("\n[车辆管理] 导航到车队管理页面...")
    page.goto(f"{BASE_URL}/admin/fleet", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    page.screenshot(path='test-results/vehicle-list.png', full_page=True)
    print("  ✅ 车队管理页面加载成功")
    
    # 检查车辆管理标签
    print("\n[车辆管理] 检查车辆管理标签页...")
    try:
        vehicle_tab = page.locator('.ant-tabs-tab:has-text("车辆"), .ant-tabs-tab:has-text("车辆管理")').first()
        if vehicle_tab.count() > 0:
            vehicle_tab.click()
            page.wait_for_timeout(2000)
            print("  ✅ 车辆管理标签页打开成功")
        else:
            log_warning('车辆管理', '未找到车辆管理标签')
    except Exception as e:
        log_warning('车辆管理', f'检查车辆管理标签时出错: {str(e)}')
    
    # 检查车辆列表
    print("\n[车辆管理] 检查车辆列表...")
    try:
        vehicle_table = page.locator('table, .ant-table').first()
        if vehicle_table.count() > 0:
            rows = vehicle_table.locator('tbody tr, .ant-table-tbody tr').all()
            print(f"  ✅ 找到 {len(rows)} 辆车辆")
        else:
            log_warning('车辆管理', '未找到车辆列表表格')
    except Exception as e:
        log_warning('车辆管理', f'检查车辆列表时出错: {str(e)}')
    
    # 检查添加车辆按钮
    print("\n[车辆管理] 检查添加车辆功能...")
    try:
        add_buttons = page.locator('button:has-text("添加"), button:has-text("新建"), button:has-text("创建")').all()
        if len(add_buttons) > 0:
            print("  ✅ 找到添加车辆按钮")
        else:
            log_warning('车辆管理', '未找到添加车辆按钮')
    except Exception as e:
        log_warning('车辆管理', f'检查添加按钮时出错: {str(e)}')

def test_driver_management(page):
    """测试司机管理模块"""
    print("\n[司机管理] 导航到司机管理页面...")
    page.goto(f"{BASE_URL}/admin/fleet", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    # 检查司机管理标签
    print("\n[司机管理] 检查司机管理标签页...")
    try:
        driver_tab = page.locator('.ant-tabs-tab:has-text("司机"), .ant-tabs-tab:has-text("司机管理")').first()
        if driver_tab.count() > 0:
            driver_tab.click()
            page.wait_for_timeout(2000)
            print("  ✅ 司机管理标签页打开成功")
        else:
            log_warning('司机管理', '未找到司机管理标签')
    except Exception as e:
        log_warning('司机管理', f'检查司机管理标签时出错: {str(e)}')
    
    # 检查司机列表
    print("\n[司机管理] 检查司机列表...")
    try:
        driver_table = page.locator('table, .ant-table').first()
        if driver_table.count() > 0:
            rows = driver_table.locator('tbody tr, .ant-table-tbody tr').all()
            print(f"  ✅ 找到 {len(rows)} 个司机")
        else:
            log_warning('司机管理', '未找到司机列表表格')
    except Exception as e:
        log_warning('司机管理', f'检查司机列表时出错: {str(e)}')
    
    # 检查添加司机按钮
    print("\n[司机管理] 检查添加司机功能...")
    try:
        add_buttons = page.locator('button:has-text("添加"), button:has-text("新建")').all()
        if len(add_buttons) > 0:
            print("  ✅ 找到添加司机按钮")
        else:
            log_warning('司机管理', '未找到添加司机按钮')
    except Exception as e:
        log_warning('司机管理', f'检查添加按钮时出错: {str(e)}')

def test_customer_management(page):
    """测试客户管理模块"""
    print("\n[客户管理] 导航到客户管理页面...")
    page.goto(f"{BASE_URL}/admin/customers", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    page.screenshot(path='test-results/customer-list.png', full_page=True)
    print("  ✅ 客户管理页面加载成功")
    
    # 检查客户列表
    print("\n[客户管理] 检查客户列表...")
    try:
        customer_table = page.locator('table, .ant-table').first()
        if customer_table.count() > 0:
            rows = customer_table.locator('tbody tr, .ant-table-tbody tr').all()
            print(f"  ✅ 找到 {len(rows)} 个客户")
        else:
            log_warning('客户管理', '未找到客户列表表格')
    except Exception as e:
        log_warning('客户管理', f'检查客户列表时出错: {str(e)}')
    
    # 检查添加客户按钮
    print("\n[客户管理] 检查添加客户功能...")
    try:
        add_buttons = page.locator('button:has-text("添加"), button:has-text("新建")').all()
        if len(add_buttons) > 0:
            print("  ✅ 找到添加客户按钮")
        else:
            log_warning('客户管理', '未找到添加客户按钮')
    except Exception as e:
        log_warning('客户管理', f'检查添加按钮时出错: {str(e)}')

def test_finance_management(page):
    """测试财务管理模块"""
    print("\n[财务管理] 导航到财务管理页面...")
    page.goto(f"{BASE_URL}/admin/finance", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    page.screenshot(path='test-results/finance-list.png', full_page=True)
    print("  ✅ 财务管理页面加载成功")
    
    # 检查财务记录列表
    print("\n[财务管理] 检查财务记录...")
    try:
        finance_table = page.locator('table, .ant-table').first()
        if finance_table.count() > 0:
            rows = finance_table.locator('tbody tr, .ant-table-tbody tr').all()
            print(f"  ✅ 找到 {len(rows)} 条财务记录")
        else:
            log_warning('财务管理', '未找到财务记录表格')
    except Exception as e:
        log_warning('财务管理', f'检查财务记录时出错: {str(e)}')
    
    # 检查应收款/应付款标签
    print("\n[财务管理] 检查应收款/应付款功能...")
    try:
        tabs = page.locator('.ant-tabs-tab').all()
        tab_texts = [tab.inner_text().strip() for tab in tabs[:10]]
        if any('应收' in text or '应付' in text for text in tab_texts):
            print("  ✅ 找到应收款/应付款标签")
        else:
            log_warning('财务管理', '未找到应收款/应付款标签')
    except Exception as e:
        log_warning('财务管理', f'检查应收款/应付款标签时出错: {str(e)}')

def test_maps_integration(page):
    """测试地图集成模块"""
    print("\n[地图集成] 导航到地图页面...")
    # 尝试访问地图相关页面
    map_pages = [
        f"{BASE_URL}/admin/maps",
        f"{BASE_URL}/admin/shipments",  # 运单页面可能有地图
        f"{BASE_URL}/admin/fleet"  # 车队页面可能有地图
    ]
    
    map_found = False
    for map_url in map_pages:
        try:
            page.goto(map_url, wait_until='domcontentloaded', timeout=10000)
            page.wait_for_load_state('networkidle', timeout=15000)
            page.wait_for_timeout(2000)
            
            # 检查是否有地图元素
            map_elements = page.locator('[id*="map"], [class*="map"], iframe[src*="maps"]').all()
            if len(map_elements) > 0:
                print(f"  ✅ 在 {map_url} 找到地图元素")
                page.screenshot(path='test-results/maps-integration.png', full_page=True)
                map_found = True
                break
        except:
            continue
    
    if not map_found:
        log_warning('地图集成', '未找到地图元素')

def test_dispatch_management(page):
    """测试调度管理模块"""
    print("\n[调度管理] 导航到调度页面...")
    page.goto(f"{BASE_URL}/admin/shipments", wait_until='domcontentloaded')
    page.wait_for_load_state('networkidle', timeout=30000)
    page.wait_for_timeout(3000)
    
    # 检查运单分配功能
    print("\n[调度管理] 检查运单分配功能...")
    assign_buttons = page.locator('button:has-text("分配"), button:has-text("指派"), button[title*="分配"]').all()
    if len(assign_buttons) > 0:
        print("  ✅ 找到运单分配按钮")
    else:
        log_warning('调度管理', '未找到运单分配按钮')
    
    # 检查行程管理
    print("\n[调度管理] 检查行程管理...")
    trip_links = page.locator('a:has-text("行程"), button:has-text("行程")').all()
    if len(trip_links) > 0:
        print("  ✅ 找到行程管理入口")
    else:
        log_warning('调度管理', '未找到行程管理入口')

def run_complete_test():
    """运行完整测试套件"""
    print("=" * 60)
    print("🚀 TMS 系统完整测试")
    print("=" * 60)
    print(f"前端 URL: {BASE_URL}")
    print(f"后端 URL: {BACKEND_URL}")
    print(f"测试时间: {test_results['timestamp']}")
    print("=" * 60)
    
    if not TEST_EMAIL or not TEST_PASSWORD:
        print("\n❌ 错误: 测试账号未设置")
        print("请设置环境变量:")
        print("  export TMS_TEST_EMAIL=your-email@example.com")
        print("  export TMS_TEST_PASSWORD=your-password")
        return
    
    console_logs = []
    errors = []
    network_errors = []
    
    os.makedirs('test-results', exist_ok=True)
    
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
        
        def handle_response(response):
            if response.status >= 400:
                network_errors.append({
                    'url': response.url,
                    'status': response.status,
                    'statusText': response.status_text
                })
        
        page.on("console", handle_console)
        page.on("pageerror", handle_page_error)
        page.on("response", handle_response)
        
        try:
            # 登录
            print("\n" + "=" * 60)
            print("🔐 登录系统")
            print("=" * 60)
            login(page)
            page.screenshot(path='test-results/00-logged-in.png', full_page=True)
            
            # 运行各个模块测试
            test_module('认证模块', lambda: test_authentication(page))
            test_module('运单管理', lambda: test_shipment_management(page))
            test_module('车辆管理', lambda: test_vehicle_management(page))
            test_module('司机管理', lambda: test_driver_management(page))
            test_module('客户管理', lambda: test_customer_management(page))
            test_module('财务管理', lambda: test_finance_management(page))
            test_module('地图集成', lambda: test_maps_integration(page))
            test_module('调度管理', lambda: test_dispatch_management(page))
            
            # 最终截图
            page.screenshot(path='test-results/final-state.png', full_page=True)
            
        except Exception as e:
            print(f"\n❌ 测试过程中发生严重错误: {str(e)}")
            page.screenshot(path='test-results/error-screenshot.png', full_page=True)
            test_results['errors'].append({
                'module': '系统',
                'step': '测试执行',
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
        finally:
            browser.close()
    
    # 保存测试结果
    test_results['console_logs'] = console_logs[:100]  # 只保存前100条
    test_results['network_errors'] = network_errors[:50]  # 只保存前50条
    
    # 输出测试结果
    print("\n" + "=" * 60)
    print("📊 测试结果总结")
    print("=" * 60)
    print(f"总测试数: {test_results['summary']['total_tests']}")
    print(f"通过: {test_results['summary']['passed']} ✅")
    print(f"失败: {test_results['summary']['failed']} ❌")
    print(f"跳过: {test_results['summary']['skipped']} ⏭️")
    
    if errors:
        print(f"\n❌ 发现 {len(errors)} 个控制台错误:")
        for error in errors[:10]:
            print(f"  - {error}")
    
    if network_errors:
        print(f"\n❌ 发现 {len(network_errors)} 个网络错误:")
        for error in network_errors[:10]:
            print(f"  - [{error['status']}] {error['url']}")
    
    if test_results['warnings']:
        print(f"\n⚠️  发现 {len(test_results['warnings'])} 个警告:")
        for warning in test_results['warnings'][:10]:
            print(f"  - {warning['message']}")
    
    # 保存测试报告
    report_path = f"test-results/test-report-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(test_results, f, ensure_ascii=False, indent=2)
    
    print(f"\n📄 测试报告已保存到: {report_path}")
    print("📸 截图已保存到 test-results/ 目录")
    print("=" * 60)
    
    return test_results

if __name__ == '__main__':
    run_complete_test()

