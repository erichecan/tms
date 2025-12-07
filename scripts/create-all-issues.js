#!/usr/bin/env node

/**
 * TMS 项目 GitHub Issues 批量创建脚本
 * 使用方法: node scripts/create-all-issues.js
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const REPO = 'erichecan/tms';
const PROJECT_NUMBER = 2;

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// 创建 Issue 函数
function createIssue(title, body, labels, priority) {
  try {
    log('yellow', `创建 Issue: ${title}`);
    
    const command = `gh issue create --repo "${REPO}" --title "${title.replace(/"/g, '\\"')}" --body "${body.replace(/"/g, '\\"')}" --label "${labels}" --json number --jq '.number'`;
    
    const output = execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    const issueNumber = parseInt(output.trim());
    
    if (issueNumber) {
      log('green', `✅ Issue #${issueNumber} 创建成功: ${title}`);
      return issueNumber;
    }
  } catch (error) {
    log('red', `❌ Issue 创建失败: ${title}`);
    log('red', `   错误: ${error.message}`);
    return null;
  }
}

// 将 Issue 添加到 Project
function addToProject(issueNumber) {
  try {
    const command = `gh project item-add ${PROJECT_NUMBER} --owner erichecan --url "https://github.com/${REPO}/issues/${issueNumber}"`;
    execSync(command, { encoding: 'utf-8', stdio: 'pipe' });
    log('blue', `   📌 已添加到 Project: #${issueNumber}`);
    return true;
  } catch (error) {
    log('yellow', `   ⚠️  添加到 Project 失败: #${issueNumber} (可能需要手动添加)`);
    return false;
  }
}

// Issues 数据
const issues = [
  // P0 - Critical
  {
    title: '[BUG] Google Maps API 计费未启用导致功能受限',
    body: `## 问题描述

地理编码、地址自动完成、距离计算等功能无法使用，影响核心功能。

## 影响

- 地图显示正常 ✅
- 地理编码功能 ❌ 需要计费
- 地址自动完成 ❌ 需要计费
- 距离计算 ❌ 需要计费

## 解决方案

1. 访问 Google Cloud Console
2. 为项目启用计费
3. 启用以下 API:
   - Maps JavaScript API
   - Geocoding API
   - Places API

## 相关文件

- \`apps/frontend/src/services/mapsService.ts\`

## 优先级

P0 - Critical`,
    labels: 'bug,critical,google-maps,p0,frontend',
    priority: 'P0',
  },
  {
    title: '[BUG] Neon 数据库权限不足，location_tracking 表无法创建',
    body: `## 问题描述

location_tracking 表无法创建，影响位置历史和轨迹回放功能。

## 影响

无法查看位置历史和轨迹回放

## 解决方案

授予数据库创建表权限，或使用 postgres 超级用户执行迁移

## 相关文件

- \`apps/backend/src/database/\`

## 优先级

P0 - Critical`,
    labels: 'bug,critical,database,p0,backend',
    priority: 'P0',
  },
  {
    title: '[BUG] 多租户数据隔离安全性检查缺失',
    body: `## 问题描述

需要验证所有 API 都有 tenant_id 隔离，防止数据泄露。

## 影响

数据安全风险

## 解决方案

全面审查所有 API，确保 tenant_id 隔离

## 相关文件

- \`apps/backend/src/routes/\`
- \`apps/backend/src/services/\`

## 优先级

P0 - Critical`,
    labels: 'bug,critical,security,p0,backend',
    priority: 'P0',
  },
  {
    title: '[BUG] 财务记录生成可能重复，需要验证幂等性',
    body: `## 问题描述

财务记录生成可能重复，导致数据不一致。

## 影响

可能重复生成财务记录

## 解决方案

确保财务记录生成是幂等的，使用唯一约束

## 相关文件

- \`apps/backend/src/services/FinanceService.ts\`

## 优先级

P0 - Critical`,
    labels: 'bug,critical,finance,p0,backend',
    priority: 'P0',
  },
  {
    title: '[BUG] 规则引擎权限检查在开发环境被绕过，存在安全隐患',
    body: `## 问题描述

开发环境中权限检查被绕过，可能导致安全问题。

## 影响

安全隐患

## 解决方案

修复开发环境权限检查逻辑，确保安全性

## 相关文件

- \`apps/backend/src/routes/ruleRoutes.ts\`

## 优先级

P0 - Critical`,
    labels: 'bug,critical,security,rules,p0,backend',
    priority: 'P0',
  },
  
  // P1 - High Priority
  {
    title: '[BUG] 客户管理页面和运单创建页面的客户创建表单不一致',
    body: `## 问题描述

两个页面的表单字段、验证规则不一致，影响用户体验和数据统一性。

## 影响

- 用户体验不一致
- 数据格式不统一
- 维护需要同时修改两处代码

## 解决方案

创建统一的 \`CustomerForm\` 组件

## 相关文件

- \`apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx\`
- \`apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx\`

## 优先级

P1 - High`,
    labels: 'bug,frontend,customer,p1,ux',
    priority: 'P1',
  },
  {
    title: '[BUG] 司机创建表单在多个位置不一致，可能导致数据不完整',
    body: `## 问题描述

车队管理页面和运单详情页面的司机创建表单不一致，可能缺少驾照号等字段。

## 影响

- 司机数据可能不完整（缺少驾照号）
- 验证规则不一致
- 用户体验不一致

## 解决方案

创建统一的 \`DriverForm\` 组件

## 相关文件

- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`
- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High`,
    labels: 'bug,frontend,driver,p1',
    priority: 'P1',
  },
  {
    title: '[REFACTOR] 车辆创建功能存在重复代码',
    body: `## 问题描述

车辆创建功能在两个地方有重复实现，维护困难。

## 影响

- 维护困难
- 可能产生不一致

## 解决方案

创建统一的 \`VehicleForm\` 组件

## 相关文件

- \`apps/frontend/src/pages/FleetManagement/FleetManagement.tsx\`
- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High`,
    labels: 'refactor,frontend,vehicle,p1',
    priority: 'P1',
  },
  {
    title: '[BUG] 不同页面使用不同的地址格式，导致数据不统一',
    body: `## 问题描述

不同页面使用不同的地址格式（加拿大 vs 中国），地址数据格式不统一。

## 影响

- 地址数据格式不统一
- 验证规则不一致
- 用户体验不一致

## 解决方案

统一地址格式，创建地址工具函数

## 相关文件

多个文件

## 优先级

P1 - High`,
    labels: 'bug,frontend,address,p1',
    priority: 'P1',
  },
  {
    title: '[BUG] 不同页面使用不同的手机号验证规则',
    body: `## 问题描述

不同页面使用不同的手机号验证规则，数据质量不一致。

## 影响

数据质量不一致

## 解决方案

创建统一的验证规则工具

## 相关文件

多个文件

## 优先级

P1 - High`,
    labels: 'bug,frontend,validation,p1',
    priority: 'P1',
  },
  {
    title: '[BUG] 邮箱验证规则在不同页面不一致',
    body: `## 问题描述

客户管理页面邮箱可选，运单创建页面邮箱必填。

## 影响

数据完整性不一致

## 相关文件

- \`apps/frontend/src/pages/CustomerManagement/CustomerManagement.tsx\`
- \`apps/frontend/src/pages/ShipmentCreate/ShipmentCreate.tsx\`

## 优先级

P1 - High`,
    labels: 'bug,frontend,validation,p1',
    priority: 'P1',
  },
  {
    title: '[BUG] 运单详情页面货物信息显示不正确',
    body: `## 问题描述

只显示 \`shipment.description\`，但实际数据在 \`cargoInfo\` 中。

## 影响

货物信息无法正确显示

## 解决方案

修复货物信息显示逻辑，正确读取 cargoInfo

## 相关文件

- \`apps/frontend/src/components/ShipmentDetails/ShipmentDetails.tsx\`

## 优先级

P1 - High`,
    labels: 'bug,frontend,shipment,p1',
    priority: 'P1',
  },
  {
    title: '[BUG] 运单时间线 API 在表不存在时返回 500 错误',
    body: `## 问题描述

timeline_events 表不存在时返回 500 错误，页面无法加载。

## 影响

页面无法加载

## 解决方案

完善错误处理，返回空数组而不是 500 错误

## 相关文件

- \`apps/backend/src/controllers/MvpShipmentController.ts\`

## 状态

已部分修复，需要完善

## 优先级

P1 - High`,
    labels: 'bug,backend,api,p1',
    priority: 'P1',
  },
  
  // P2 - Medium Priority (重要的一些)
  {
    title: '[REFACTOR] 清理 243 个 ESLint 警告',
    body: `## 问题描述

主要是未使用的变量和导入，影响代码质量。

## 影响

代码质量下降

## 解决方案

移除未使用的导入和变量，或使用 \`_\` 前缀标记

## 优先级

P2 - Medium`,
    labels: 'refactor,code-quality,p2',
    priority: 'P2',
  },
  {
    title: '[REFACTOR] 表格列定义在多处重复，需要统一',
    body: `## 问题描述

运单状态、客户等级等表格列定义在多处重复。

## 影响

状态显示可能不一致

## 解决方案

创建 \`utils/tableColumns.tsx\` 统一管理

## 优先级

P2 - Medium`,
    labels: 'refactor,frontend,table,p2',
    priority: 'P2',
  },
  {
    title: '[FEATURE] 实现所有 TODO 功能',
    body: `## 问题描述

多个 TODO 功能未实现。

## TODO 列表

- 客户搜索功能
- 客户状态筛选
- 客户排序
- 生成结算单功能
- 行程挂载逻辑
- 手动添加工资记录
- 离线操作同步

## 优先级

P2 - Medium`,
    labels: 'feature,todo,p2',
    priority: 'P2',
  },
];

// 主函数
async function main() {
  log('blue', '🚀 开始创建 GitHub Issues...\n');
  
  const createdIssues = [];
  const failedIssues = [];
  
  for (let i = 0; i < issues.length; i++) {
    const issue = issues[i];
    log('yellow', `[${i + 1}/${issues.length}] 处理: ${issue.title}`);
    
    const issueNumber = createIssue(issue.title, issue.body, issue.labels, issue.priority);
    
    if (issueNumber) {
      createdIssues.push({ number: issueNumber, title: issue.title, priority: issue.priority });
      
      // 尝试添加到 Project
      addToProject(issueNumber);
      
      // 避免 API 速率限制
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      failedIssues.push(issue.title);
    }
    
    console.log('');
  }
  
  // 总结
  log('green', '\n✅ Issues 创建完成！\n');
  log('blue', `📊 统计:`);
  log('green', `   ✅ 成功: ${createdIssues.length} 个`);
  log('red', `   ❌ 失败: ${failedIssues.length} 个`);
  
  if (createdIssues.length > 0) {
    log('blue', '\n📋 创建的 Issues:');
    createdIssues.forEach(({ number, title, priority }) => {
      log('green', `   - Issue #${number} [${priority}]: ${title}`);
    });
  }
  
  if (failedIssues.length > 0) {
    log('red', '\n❌ 失败的 Issues:');
    failedIssues.forEach(title => {
      log('red', `   - ${title}`);
    });
  }
  
  // 保存到文件
  const outputFile = path.join(__dirname, '..', 'created-issues.json');
  fs.writeFileSync(outputFile, JSON.stringify({ created: createdIssues, failed: failedIssues }, null, 2));
  log('blue', `\n💾 结果已保存到: ${outputFile}`);
}

main().catch(console.error);

