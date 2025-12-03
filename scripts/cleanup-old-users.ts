// 清理旧邮箱用户脚本
// 创建时间: 2025-12-02T17:10:00Z
// 删除所有使用旧邮箱的用户

import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');
dotenv.config({ path: envPath });

// 要保留的新邮箱后缀
const NEW_EMAIL_SUFFIX = '@aponygroup.com';

async function cleanupOldUsers() {
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

    // 删除所有不是新邮箱后缀的用户
    console.log(`删除所有不是 ${NEW_EMAIL_SUFFIX} 的用户...\n`);
    
    const allUsers = await dbService.query(
      'SELECT id, email, role FROM users WHERE tenant_id = $1',
      [tenant.id]
    );
    
    let deletedCount = 0;
    let keptCount = 0;
    
    for (const user of allUsers) {
      const email = user.email;
      
      // 只保留 aponygroup.com 后缀的用户
      if (email.endsWith(NEW_EMAIL_SUFFIX)) {
        console.log(`✓ 保留用户: ${email} (${user.role})`);
        keptCount++;
        continue;
      }
      
      // 删除所有其他用户
      try {
        await dbService.query(
          'DELETE FROM users WHERE id = $1 AND tenant_id = $2',
          [user.id, tenant.id]
        );
        console.log(`✗ 已删除用户: ${email} (${user.role})`);
        deletedCount++;
      } catch (error: any) {
        console.error(`❌ 删除用户 ${email} 失败:`, error.message);
      }
    }

    console.log(`\n已删除 ${deletedCount} 个旧邮箱用户`);
    
    // 显示当前剩余用户
    console.log('\n当前数据库中的用户：');
    const remainingUsers = await dbService.query(
      'SELECT email, role, status FROM users WHERE tenant_id = $1 ORDER BY email',
      [tenant.id]
    );
    remainingUsers.forEach((user: any) => {
      console.log(`  - ${user.email} (${user.role}, ${user.status})`);
    });
    
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
cleanupOldUsers();

