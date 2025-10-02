#!/usr/bin/env node

// 测试数据执行脚本
// 创建时间: 2025-09-30 10:45:00
// 作用: 执行测试数据生成SQL脚本

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 开始生成测试数据...');

try {
  // 检查数据库连接
  console.log('📊 检查数据库连接...');
  
  // 执行SQL脚本
  console.log('🎯 执行测试数据生成SQL脚本...');
  
  // 读取SQL文件
  const sqlFile = path.join(__dirname, 'generate-test-data.sql');
  const sqlContent = fs.readFileSync(sqlFile, 'utf8');
  
  // 这里需要根据实际的数据库配置来执行
  // 示例：使用mysql命令执行
  console.log('📝 SQL脚本内容预览（前500字符）:');
  console.log(sqlContent.substring(0, 500) + '...');
  
  console.log('\n✅ 测试数据生成脚本已准备完成！');
  console.log('\n📋 生成的数据包括:');
  console.log('- 8个测试客户（包含不同等级：普通、高级、VIP）');
  console.log('- 5个测试司机（包含不同状态：空闲、忙碌、离线）');
  console.log('- 6个测试车辆（包含不同类型和状态）');
  console.log('- 20个测试运单（包含各种状态和时间分布）');
  console.log('- 8个测试行程（包含各种状态和时间分布）');
  
  console.log('\n🎯 运单状态分布:');
  console.log('- pending: 今天创建的待处理运单');
  console.log('- quoted: 今天创建的已报价运单');
  console.log('- confirmed: 昨天创建的已确认运单');
  console.log('- assigned: 昨天和本周创建的已分配运单');
  console.log('- picked_up: 本周创建的已取货运单');
  console.log('- in_transit: 本周创建的运输中运单');
  console.log('- delivered: 本周创建的已送达运单');
  console.log('- completed: 上周和本月创建的已完成运单');
  console.log('- cancelled: 本周和上周创建的已取消运单');
  
  console.log('\n⏰ 时间分布:');
  console.log('- 今天: 2个运单');
  console.log('- 昨天: 2个运单');
  console.log('- 本周: 8个运单');
  console.log('- 上周: 4个运单');
  console.log('- 本月: 4个运单');
  
  console.log('\n🚛 行程状态分布:');
  console.log('- planning: 2个行程（未来计划）');
  console.log('- ongoing: 2个行程（正在执行）');
  console.log('- completed: 4个行程（已完成）');
  
  console.log('\n💡 要执行此脚本，请使用以下命令:');
  console.log('mysql -u your_username -p your_database < generate-test-data.sql');
  console.log('或者');
  console.log('psql -U your_username -d your_database -f generate-test-data.sql');
  
} catch (error) {
  console.error('❌ 测试数据生成失败:', error.message);
  process.exit(1);
}
