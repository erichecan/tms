// 测试登录逻辑脚本
// 2025-11-29T18:30:00 创建用于调试登录问题

import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

async function testLogin() {
  const dbService = new DatabaseService();
  
  try {
    const email = 'admin@demo.tms-platform.com';
    const password = 'password';
    
    console.log('开始测试登录流程...\n');
    
    // 步骤1: 从邮箱域名推断租户
    const emailDomain = email.split('@')[1];
    console.log(`1. 邮箱域名: ${emailDomain}`);
    
    const tenant = await dbService.getTenantByDomain(emailDomain);
    if (!tenant) {
      console.error('❌ 租户未找到');
      return;
    }
    console.log(`✅ 租户找到: ${tenant.id} - ${tenant.name}`);
    
    // 步骤2: 获取用户
    const user = await dbService.getUserByEmail(tenant.id, email);
    if (!user) {
      console.error('❌ 用户未找到');
      return;
    }
    console.log(`✅ 用户找到: ${user.id} - ${user.email}`);
    console.log(`   状态: ${user.status}`);
    console.log(`   角色: ${user.role}`);
    
    // 步骤3: 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`\n密码验证: ${isPasswordValid ? '✅ 正确' : '❌ 错误'}`);
    
    if (isPasswordValid && user.status === 'active') {
      console.log('\n✅ 登录验证成功！');
    } else {
      console.log('\n❌ 登录验证失败');
      if (!isPasswordValid) console.log('   原因: 密码错误');
      if (user.status !== 'active') console.log(`   原因: 用户状态为 ${user.status}`);
    }
    
  } catch (error: any) {
    console.error('测试失败:', error.message);
    console.error(error.stack);
  } finally {
    await dbService.close();
  }
}

testLogin();

