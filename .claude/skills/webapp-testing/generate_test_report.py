#!/usr/bin/env python3
"""
测试报告生成脚本
从测试结果 JSON 文件生成可读的测试报告
创建时间: 2025-12-02T21:30:00Z
"""

import json
import os
import glob
from datetime import datetime

def generate_report_from_json(json_path):
    """从 JSON 文件生成测试报告"""
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    report_lines = []
    report_lines.append("=" * 80)
    report_lines.append("TMS 系统完整测试报告")
    report_lines.append("=" * 80)
    report_lines.append(f"测试时间: {data.get('timestamp', 'N/A')}")
    report_lines.append(f"前端 URL: {data.get('base_url', 'N/A')}")
    report_lines.append(f"后端 URL: {data.get('backend_url', 'N/A')}")
    report_lines.append("")
    
    # 测试摘要
    summary = data.get('summary', {})
    report_lines.append("📊 测试摘要")
    report_lines.append("-" * 80)
    report_lines.append(f"总测试数: {summary.get('total_tests', 0)}")
    report_lines.append(f"通过: {summary.get('passed', 0)} ✅")
    report_lines.append(f"失败: {summary.get('failed', 0)} ❌")
    report_lines.append(f"跳过: {summary.get('skipped', 0)} ⏭️")
    report_lines.append("")
    
    # 模块测试结果
    modules = data.get('modules', {})
    if modules:
        report_lines.append("🧪 模块测试结果")
        report_lines.append("-" * 80)
        for module_name, module_data in modules.items():
            status = module_data.get('status', 'unknown')
            status_icon = '✅' if status == 'passed' else '❌' if status == 'failed' else '⏭️'
            report_lines.append(f"{status_icon} {module_name}: {status}")
            
            errors = module_data.get('errors', [])
            if errors:
                report_lines.append(f"   错误:")
                for error in errors[:5]:  # 只显示前5个错误
                    report_lines.append(f"     - {error}")
        report_lines.append("")
    
    # 错误列表
    errors = data.get('errors', [])
    if errors:
        report_lines.append("❌ 错误列表")
        report_lines.append("-" * 80)
        for i, error in enumerate(errors[:20], 1):  # 只显示前20个错误
            module = error.get('module', 'Unknown')
            step = error.get('step', 'Unknown')
            error_msg = error.get('error', 'Unknown error')
            report_lines.append(f"{i}. [{module}] {step}: {error_msg}")
        report_lines.append("")
    
    # 警告列表
    warnings = data.get('warnings', [])
    if warnings:
        report_lines.append("⚠️  警告列表")
        report_lines.append("-" * 80)
        for i, warning in enumerate(warnings[:20], 1):  # 只显示前20个警告
            module = warning.get('module', 'Unknown')
            message = warning.get('message', 'Unknown warning')
            report_lines.append(f"{i}. [{module}] {message}")
        report_lines.append("")
    
    # 网络错误
    network_errors = data.get('network_errors', [])
    if network_errors:
        report_lines.append("🌐 网络错误")
        report_lines.append("-" * 80)
        for i, error in enumerate(network_errors[:20], 1):  # 只显示前20个网络错误
            url = error.get('url', 'Unknown URL')
            status = error.get('status', 'Unknown')
            report_lines.append(f"{i}. [{status}] {url}")
        report_lines.append("")
    
    # 修复建议
    report_lines.append("🔧 修复建议")
    report_lines.append("-" * 80)
    if summary.get('failed', 0) > 0:
        report_lines.append("1. 检查失败的测试模块，查看具体错误信息")
        report_lines.append("2. 验证相关功能是否正常工作")
        report_lines.append("3. 检查网络连接和 API 响应")
    if network_errors:
        report_lines.append("4. 检查后端 API 服务是否正常运行")
        report_lines.append("5. 验证 API 端点的正确性")
    if errors:
        report_lines.append("6. 检查浏览器控制台错误，修复前端问题")
    if summary.get('failed', 0) == 0:
        report_lines.append("✅ 所有测试通过，系统运行正常！")
    report_lines.append("")
    
    report_lines.append("=" * 80)
    report_lines.append(f"报告生成时间: {datetime.now().isoformat()}")
    report_lines.append("=" * 80)
    
    return "\n".join(report_lines)

def main():
    """主函数"""
    # 查找最新的测试报告 JSON 文件
    json_files = glob.glob('test-results/test-report-*.json')
    if not json_files:
        print("❌ 未找到测试报告 JSON 文件")
        print("请先运行测试脚本: python3 test_complete_system.py")
        return
    
    # 使用最新的文件
    latest_json = max(json_files, key=os.path.getctime)
    print(f"📄 读取测试报告: {latest_json}")
    
    # 生成报告
    report = generate_report_from_json(latest_json)
    
    # 保存报告
    report_path = latest_json.replace('.json', '.txt')
    with open(report_path, 'w', encoding='utf-8') as f:
        f.write(report)
    
    print(f"✅ 测试报告已生成: {report_path}")
    print("\n" + "=" * 80)
    print(report)
    print("=" * 80)

if __name__ == '__main__':
    main()

