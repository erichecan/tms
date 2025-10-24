#!/usr/bin/env python3
"""
批量修复TypeScript/TSX文件中的代码质量问题
"""

import os
import re
import sys

def fix_unused_imports(content):
    """修复未使用的导入"""
    lines = content.split('\n')
    new_lines = []
    
    # 跟踪导入语句和未使用的导入
    import_lines = []
    unused_imports = set()
    
    # 常见的未使用导入模式
    unused_patterns = [
        r'import\s+{\s*([^}]+)\s*}\s+from\s+[\'"][^\'"]+[\'"]',
        r'import\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+from\s+[\'"][^\'"]+[\'"]',
    ]
    
    # 这里只是示例，实际需要更复杂的AST分析
    return content

def fix_any_types(content):
    """修复any类型问题"""
    # 替换一些常见的any类型
    replacements = [
        (r':\s*any\b', ': unknown'),
        (r'Array<any>', 'Array<unknown>'),
        (r'Record<string,\s*any>', 'Record<string, unknown>'),
    ]
    
    for pattern, replacement in replacements:
        content = re.sub(pattern, replacement, content)
    
    return content

def fix_empty_blocks(content):
    """修复空代码块"""
    # 替换空的catch块
    content = re.sub(r'catch\s*\(\s*[^)]*\s*\)\s*{\s*}', 'catch (error) {\n    console.error(error);\n  }', content)
    
    return content

def process_file(file_path):
    """处理单个文件"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        original_content = content
        
        # 应用修复
        content = fix_any_types(content)
        content = fix_empty_blocks(content)
        
        # 如果内容有变化，写回文件
        if content != original_content:
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print(f"✅ 已修复: {file_path}")
            return True
        else:
            print(f"⏭️  无变化: {file_path}")
            return False
            
    except Exception as e:
        print(f"❌ 错误处理 {file_path}: {e}")
        return False

def main():
    """主函数"""
    # 处理所有TypeScript/TSX文件
    ts_files = []
    
    # 查找所有.ts和.tsx文件
    for root, dirs, files in os.walk('apps/frontend/src'):
        for file in files:
            if file.endswith(('.ts', '.tsx')):
                ts_files.append(os.path.join(root, file))
    
    print(f"找到 {len(ts_files)} 个TypeScript/TSX文件")
    
    processed_count = 0
    for file_path in ts_files:
        if process_file(file_path):
            processed_count += 1
    
    print(f"\n📊 处理完成: {processed_count}/{len(ts_files)} 个文件被修改")

if __name__ == "__main__":
    main()
