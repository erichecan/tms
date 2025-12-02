// 创建用户账号脚本
// 创建时间: 2025-11-30T22:50:00Z

import bcrypt from 'bcryptjs';
import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 加载环境变量
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');
dotenv.config({ path: envPath });

// 定义要创建的用户
const usersToCreate = [
  {
    email: 'agnes@aponygroup.com',
    password: '27669',
    role: 'dispatcher', // 调度员
    profile: {
      firstName: 'Agnes',
      lastName: '',
      name: 'Agnes',
    }
  },
  {
    email: 'george@aponygroup.com',
    password: '27669',
    role: 'finance', // 财务
    profile: {
      firstName: 'George',
      lastName: '',
      name: 'George',
    }
  },
  {
    email: 'mark@aponygroup.com',
    password: '27669',
    role: 'admin', // CEO/admin
    profile: {
      firstName: 'Mark',
      lastName: '',
      name: 'Mark',
    }
  },
  {
    email: 'eriche@aponygroup.com',
    password: '27669',
    role: 'admin', // admin
    profile: {
      firstName: 'Eriche',
      lastName: '',
      name: 'Eriche',
    }
  }
];

async function createUsers() {
  const dbService = new DatabaseService();
  
  try {
    console.log('正在连接数据库...\n');

    // 获取或创建默认租户
    let tenant = await dbService.getTenantByDomain('demo.tms-platform.com');
    if (!tenant) {
      // 尝试其他可能的默认租户域名
      tenant = await dbService.getTenantByDomain('default');
      if (!tenant) {
        // 获取所有租户中的第一个
        const allTenants = await dbService.getTenantByDomain('demo.tms-platform.com') || 
                          await dbService.getTenantByDomain('default');
        if (!allTenants) {
          // 尝试通过直接查询获取
          const tenants = await (dbService as any).query('SELECT * FROM tenants LIMIT 1');
          if (tenants && tenants.length > 0) {
            tenant = await dbService.getTenant(tenants[0].id);
          }
        } else {
          tenant = allTenants;
        }
      }
    }

    if (!tenant) {
      throw new Error('未找到默认租户，请先创建租户');
    }

    console.log(`使用租户: ${tenant.name} (${tenant.domain})\n`);

    // 创建用户
    for (const userData of usersToCreate) {
      try {
        // 检查用户是否已存在
        const existingUser = await dbService.getUserByEmail(tenant.id, userData.email);
        if (existingUser) {
          console.log(`⚠️  用户 ${userData.email} 已存在，跳过创建`);
          continue;
        }

        // 加密密码
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(userData.password, saltRounds);

        // 创建用户
        const user = await dbService.createUser(tenant.id, {
          email: userData.email,
          passwordHash: passwordHash,
          role: userData.role as any,
          profile: userData.profile,
          status: 'active'
        });

        console.log(`✓ 成功创建用户: ${userData.email}`);
        console.log(`  角色: ${userData.role}`);
        console.log(`  姓名: ${userData.profile.name}\n`);
      } catch (error: any) {
        if (error.message && error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint')) {
          console.log(`⚠️  用户 ${userData.email} 已存在（唯一约束冲突），跳过创建\n`);
        } else {
          console.error(`❌ 创建用户 ${userData.email} 失败:`, error.message);
          console.error(`  错误详情:`, error);
          console.log();
        }
      }
    }

    console.log('所有用户创建完成！');
  } catch (error: any) {
    console.error('❌ 执行失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await dbService.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行脚本
createUsers();

