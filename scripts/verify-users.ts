// 验证数据库中用户是否存在的脚本
// 创建时间: 2025-12-02T16:50:00Z

import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import dotenv from 'dotenv';
import path from 'path';
import bcrypt from 'bcryptjs';

// 加载环境变量
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');
dotenv.config({ path: envPath });

// 要验证的用户列表
const usersToVerify = [
  {
    email: 'agnes@aponygroup.com',
    password: '27669',
    role: 'dispatcher',
    name: 'Agnes'
  },
  {
    email: 'george@aponygroup.com',
    password: '27669',
    role: 'finance',
    name: 'George'
  },
  {
    email: 'mark@aponygroup.com',
    password: '27669',
    role: 'admin',
    name: 'Mark'
  },
  {
    email: 'eriche@aponygroup.com',
    password: '27669',
    role: 'admin',
    name: 'Eriche'
  }
];

async function verifyUsers() {
  const dbService = new DatabaseService();
  
  try {
    console.log('正在连接数据库...\n');

    // 获取默认租户
    let tenant = await dbService.getTenantByDomain('demo.tms-platform.com');
    if (!tenant) {
      tenant = await dbService.getTenantByDomain('default');
    }
    
    if (!tenant) {
      const tenants = await dbService.query('SELECT * FROM tenants LIMIT 1');
      if (tenants && tenants.length > 0) {
        tenant = await dbService.getTenant(tenants[0].id);
      }
    }

    if (!tenant) {
      throw new Error('未找到默认租户');
    }

    console.log(`使用租户: ${tenant.name} (${tenant.domain})\n`);

    let allUsersExist = true;
    let allPasswordsCorrect = true;

    // 验证每个用户
    for (const userData of usersToVerify) {
      try {
        const user = await dbService.getUserByEmail(tenant.id, userData.email);
        
        if (!user) {
          console.log(`❌ 用户不存在: ${userData.email}`);
          allUsersExist = false;
          continue;
        }

        // 验证密码
        const isPasswordValid = await bcrypt.compare(userData.password, user.passwordHash);
        
        if (!isPasswordValid) {
          console.log(`❌ 密码不匹配: ${userData.email}`);
          allPasswordsCorrect = false;
          continue;
        }

        // 验证角色
        if (user.role !== userData.role) {
          console.log(`⚠️  角色不匹配: ${userData.email} (期望: ${userData.role}, 实际: ${user.role})`);
        }

        console.log(`✓ 用户验证成功: ${userData.email}`);
        console.log(`  角色: ${user.role}`);
        console.log(`  状态: ${user.status}`);
        console.log(`  密码: 正确\n`);
      } catch (error: any) {
        console.error(`❌ 验证用户 ${userData.email} 失败:`, error.message);
        allUsersExist = false;
      }
    }

    console.log('\n═══════════════════════════════════════════════════');
    if (allUsersExist && allPasswordsCorrect) {
      console.log('✅ 所有用户验证通过！');
      console.log('✅ 所有密码验证通过！');
    } else {
      if (!allUsersExist) {
        console.log('❌ 部分用户不存在，请运行创建用户脚本');
      }
      if (!allPasswordsCorrect) {
        console.log('❌ 部分密码不正确，请检查');
      }
    }
    console.log('═══════════════════════════════════════════════════\n');
  } catch (error: any) {
    console.error('❌ 执行失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await dbService.close();
    console.log('数据库连接已关闭');
  }
}

// 运行脚本
verifyUsers();

