// 更新用户邮箱后缀脚本
// 创建时间: 2025-12-02T16:45:00Z
// 将 aponigroup.com 改为 aponygroup.com (修正拼写错误)

import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');
dotenv.config({ path: envPath });

// 要更新的用户邮箱映射 - 从 aponigroup.com 改为 aponygroup.com
const emailMappings: { oldEmail: string; newEmail: string; name: string }[] = [
  {
    oldEmail: 'agnes@aponigroup.com',
    newEmail: 'agnes@aponygroup.com',
    name: 'Agnes'
  },
  {
    oldEmail: 'george@aponigroup.com',
    newEmail: 'george@aponygroup.com',
    name: 'George'
  },
  {
    oldEmail: 'mark@aponigroup.com',
    newEmail: 'mark@aponygroup.com',
    name: 'Mark'
  },
  {
    oldEmail: 'eriche@aponigroup.com',
    newEmail: 'eriche@aponygroup.com',
    name: 'Eriche'
  }
];

async function updateUserEmails() {
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

    // 更新每个用户的邮箱
    for (const mapping of emailMappings) {
      try {
        // 查找旧邮箱的用户
        const oldUser = await dbService.getUserByEmail(tenant.id, mapping.oldEmail);
        
        if (!oldUser) {
          console.log(`⚠️  未找到用户 ${mapping.oldEmail}，跳过更新`);
          continue;
        }

        // 检查新邮箱是否已存在
        const existingUser = await dbService.getUserByEmail(tenant.id, mapping.newEmail);
        if (existingUser) {
          console.log(`⚠️  新邮箱 ${mapping.newEmail} 已存在，跳过更新`);
          continue;
        }

        // 更新邮箱地址
        await dbService.query(
          'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
          [mapping.newEmail, oldUser.id, tenant.id]
        );

        console.log(`✓ 成功更新用户邮箱:`);
        console.log(`  旧邮箱: ${mapping.oldEmail}`);
        console.log(`  新邮箱: ${mapping.newEmail}`);
        console.log(`  姓名: ${mapping.name}\n`);
      } catch (error: any) {
        console.error(`❌ 更新用户 ${mapping.oldEmail} 失败:`, error.message);
        console.error(`  错误详情:`, error);
        console.log();
      }
    }

    console.log('所有用户邮箱更新完成！');
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
updateUserEmails();

