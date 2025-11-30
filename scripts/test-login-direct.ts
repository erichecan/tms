// 2025-11-29T19:35:00 直接测试登录逻辑，绕过中间件
import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import bcrypt from 'bcryptjs';

async function testLogin() {
  const dbService = new DatabaseService();
  
  const email = 'admin@demo.tms-platform.com';
  const password = 'password';
  const emailDomain = email.split('@')[1]; // demo.tms-platform.com
  
  console.log('测试登录流程:');
  console.log('Email:', email);
  console.log('Email Domain:', emailDomain);
  
  // 1. 查找租户
  const tenant = await dbService.getTenantByDomain(emailDomain);
  console.log('租户查找结果:', tenant ? `找到租户 ID: ${tenant.id}` : '未找到租户');
  
  if (!tenant) {
    console.error('❌ 租户未找到');
    return;
  }
  
  // 2. 查找用户
  const user = await dbService.getUserByEmail(tenant.id, email);
  console.log('用户查找结果:', user ? `找到用户 ID: ${user.id}` : '未找到用户');
  
  if (!user) {
    console.error('❌ 用户未找到');
    // 尝试只按邮箱查询
    const emailOnlyResult = await dbService.query('SELECT id, email, tenant_id FROM users WHERE email = $1', [email]);
    console.log('按邮箱查询结果:', emailOnlyResult.length > 0 ? `找到 ${emailOnlyResult.length} 个用户` : '未找到');
    if (emailOnlyResult.length > 0) {
      console.log('用户信息:', emailOnlyResult[0]);
      console.log('用户 tenant_id:', emailOnlyResult[0].tenant_id);
      console.log('期望 tenant_id:', tenant.id);
      console.log('tenant_id 类型匹配:', typeof emailOnlyResult[0].tenant_id === typeof tenant.id);
      console.log('tenant_id 值匹配:', emailOnlyResult[0].tenant_id === tenant.id);
      console.log('tenant_id 字符串匹配:', String(emailOnlyResult[0].tenant_id) === String(tenant.id));
    }
    return;
  }
  
  // 3. 验证密码
  const passwordHash = user.passwordHash;
  console.log('密码哈希:', passwordHash);
  const isPasswordValid = await bcrypt.compare(password, passwordHash);
  console.log('密码验证结果:', isPasswordValid ? '✅ 密码正确' : '❌ 密码错误');
  
  if (isPasswordValid) {
    console.log('✅ 登录测试成功！');
  } else {
    console.error('❌ 密码验证失败');
  }
  
  process.exit(0);
}

testLogin().catch(console.error);

