#!/usr/bin/env node

// 测试数据生成脚本
// 创建时间: 2025-09-30 10:45:00
// 作用: 生成完整的测试数据

const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 开始生成测试数据...');

try {
  // 编译TypeScript文件
  console.log('📦 编译TypeScript文件...');
  execSync('npx tsc src/database/generateTestData.ts --outDir dist --target es2020 --module commonjs --esModuleInterop', {
    cwd: path.join(__dirname),
    stdio: 'inherit'
  });

  // 运行生成脚本
  console.log('🎯 运行测试数据生成脚本...');
  execSync('node dist/database/generateTestData.js', {
    cwd: path.join(__dirname),
    stdio: 'inherit'
  });

  console.log('✅ 测试数据生成完成！');
} catch (error) {
  console.error('❌ 测试数据生成失败:', error.message);
  process.exit(1);
}
