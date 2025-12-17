// 更新所有用户密码并创建新用户脚本
// 创建时间: 2025-12-12 00:10:00
// 作用: 将所有用户密码更新为 apony27669，并创建 mason@aponygroup.com 调度员账户

import bcrypt from 'bcryptjs';
import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');
dotenv.config({ path: envPath });

const NEW_PASSWORD = 'apony27669';
const NEW_USER_EMAIL = 'mason@aponygroup.com';
const NEW_USER_ROLE = 'dispatcher';

async function updateAllPasswordsAndCreateUser() {
  const dbService = new DatabaseService();
  
  try {
    console.log('开始执行用户密码更新和新用户创建...\n');

    // 1. 获取默认租户 - 2025-12-12 00:10:00 使用 getTenantByDomain 方法
    let tenant;
    try {
      tenant = await dbService.getTenantByDomain('default');
      if (!tenant) {
        // 尝试获取所有租户（如果方法存在）
        const allTenants = await (dbService as any).query('SELECT * FROM tenants LIMIT 1');
        if (allTenants && allTenants.length > 0) {
          tenant = {
            id: allTenants[0].id,
            name: allTenants[0].name,
            domain: allTenants[0].domain
          };
        } else {
          throw new Error('未找到任何租户，请先创建租户');
        }
      }
    } catch (error: any) {
      // 如果 getTenantByDomain 不存在，直接查询数据库
      const allTenants = await (dbService as any).query('SELECT * FROM tenants LIMIT 1');
      if (allTenants && allTenants.length > 0) {
        tenant = {
          id: allTenants[0].id,
          name: allTenants[0].name,
          domain: allTenants[0].domain
        };
      } else {
        throw new Error('未找到任何租户，请先创建租户');
      }
    }
    console.log(`使用租户: ${tenant.name} (${tenant.id})\n`);

    // 2. 获取所有用户
    console.log('[1/3] 获取所有用户列表...');
    const allUsers = await dbService.getUsers(tenant.id, { page: 1, limit: 1000 });
    console.log(`找到 ${allUsers.total} 个用户\n`);

    // 3. 更新所有用户密码
    console.log('[2/3] 更新所有用户密码...');
    const saltRounds = 10;
    const newPasswordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
    
    let updatedCount = 0;
    for (const user of allUsers.data) {
      try {
        await dbService.updateUser(tenant.id, user.id, {
          passwordHash: newPasswordHash
        });
        console.log(`✓ 已更新用户密码: ${user.email}`);
        updatedCount++;
      } catch (error: any) {
        console.error(`❌ 更新用户 ${user.email} 密码失败:`, error.message);
      }
    }
    console.log(`\n✅ 成功更新 ${updatedCount}/${allUsers.total} 个用户的密码\n`);

    // 4. 创建新用户 mason@aponygroup.com
    console.log('[3/3] 创建新用户...');
    try {
      // 检查用户是否已存在
      const existingUser = await dbService.getUserByEmail(tenant.id, NEW_USER_EMAIL);
      if (existingUser) {
        console.log(`⚠️  用户 ${NEW_USER_EMAIL} 已存在，更新其密码和角色...`);
        
        // 更新现有用户的密码和角色
        await dbService.updateUser(tenant.id, existingUser.id, {
          passwordHash: newPasswordHash,
          role: NEW_USER_ROLE
        });
        console.log(`✓ 已更新用户 ${NEW_USER_EMAIL} 的密码和角色为 ${NEW_USER_ROLE}`);
      } else {
        // 创建新用户
        const passwordHash = await bcrypt.hash(NEW_PASSWORD, saltRounds);
        const nameParts = NEW_USER_EMAIL.split('@')[0];
        
        const newUser = await dbService.createUser(tenant.id, {
          email: NEW_USER_EMAIL,
          passwordHash: passwordHash,
          role: NEW_USER_ROLE,
          profile: {
            firstName: 'Mason',
            lastName: '',
            name: 'Mason',
            phone: '',
            avatar: '',
            preferences: {}
          },
          status: 'active'
        });
        
        console.log(`✓ 成功创建用户: ${NEW_USER_EMAIL}`);
        console.log(`  角色: ${NEW_USER_ROLE}`);
        console.log(`  姓名: Mason`);
      }
    } catch (error: any) {
      if (error.message && (error.message.includes('duplicate key') || error.message.includes('UNIQUE constraint'))) {
        console.log(`⚠️  用户 ${NEW_USER_EMAIL} 已存在（唯一约束冲突）`);
      } else {
        console.error(`❌ 创建/更新用户 ${NEW_USER_EMAIL} 失败:`, error.message);
        throw error;
      }
    }

    console.log('\n✅ 所有操作完成！');
    console.log(`\n密码信息:`);
    console.log(`  新密码: ${NEW_PASSWORD}`);
    console.log(`  已更新用户数: ${updatedCount}`);
    console.log(`  新用户: ${NEW_USER_EMAIL} (${NEW_USER_ROLE})`);
    
  } catch (error: any) {
    console.error('\n❌ 执行失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await dbService.close();
    console.log('\n数据库连接已关闭');
  }
}

// 运行脚本
updateAllPasswordsAndCreateUser();
