// 执行数据库迁移 018：添加 pallets 字段
// 创建时间: 2025-12-12 00:15:00

import { DatabaseService } from '../apps/backend/src/services/DatabaseService';
import dotenv from 'dotenv';
import path from 'path';

// 加载环境变量
const projectRoot = path.resolve(__dirname, '..');
const envPath = path.resolve(projectRoot, '.env');
dotenv.config({ path: envPath });

const dbService = new DatabaseService();

async function runMigration() {
  try {
    console.log('开始执行数据库迁移：添加 pallets 字段到 quote_requests 表...\n');
    
    // 先检查表是否存在
    const checkTableSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'quote_requests'
      );
    `;
    const tableExistsResult = await dbService.query(checkTableSQL, []);
    const tableExists = tableExistsResult && tableExistsResult.length > 0 && tableExistsResult[0]?.exists;
    
    if (!tableExists) {
      console.log('⚠️  quote_requests 表不存在，跳过迁移');
      console.log('   请先执行 database_migrations/017_create_quote_requests_tables.sql 创建表');
      return;
    }
    
    // 检查字段是否已存在
    const checkColumnSQL = `
      SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'quote_requests'
        AND column_name = 'pallets'
      );
    `;
    const columnExistsResult = await dbService.query(checkColumnSQL, []);
    const columnExists = columnExistsResult && columnExistsResult.length > 0 && columnExistsResult[0]?.exists;
    
    if (columnExists) {
      console.log('✅ pallets 字段已存在，无需迁移');
      return;
    }
    
    // 执行 ALTER TABLE（使用 IF NOT EXISTS 避免重复添加）
    const alterTableSQL = 'ALTER TABLE public.quote_requests ADD COLUMN IF NOT EXISTS pallets integer;';
    await dbService.query(alterTableSQL, []);
    
    // 添加注释
    try {
      const commentSQL = "COMMENT ON COLUMN public.quote_requests.pallets IS '托盘数量（可选）';";
      await dbService.query(commentSQL, []);
    } catch (e) {
      // 注释添加失败不影响主功能
      console.log('⚠️  添加字段注释失败（不影响功能）');
    }
    
    console.log('✅ 数据库迁移成功：已添加 pallets 字段到 quote_requests 表');
  } catch (error: any) {
    console.error('❌ 数据库迁移失败:', error.message);
    console.error('错误详情:', error);
    process.exit(1);
  } finally {
    await dbService.close();
    console.log('\n数据库连接已关闭');
  }
}

runMigration();
