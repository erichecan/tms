import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import * as dotenv from 'dotenv';

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Found' : 'Not Found');

if (!process.env.DATABASE_URL) {
    console.error('❌ 错误: DATABASE_URL 环境变量未设置！');
    process.exit(1);
}

let connectionString = process.env.DATABASE_URL;
if (connectionString.includes('neon.tech')) {
    connectionString = connectionString.replace(/[&?]channel_binding=[^&]*/, '').replace(/\?\?/, '?').replace(/&&/, '&').replace(/[&?]$/, '');
}

const pool = new Pool({
    connectionString: connectionString,
    ssl: connectionString.includes('neon.tech') ? { rejectUnauthorized: false } : undefined
});

async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('开始应用数据库更新 (v4, v5)...');

        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = ['v4_fix_unique_constraints.sql', 'v5_add_missing_customer_fields.sql'];

        for (const file of migrationFiles) {
            const migrationPath = path.join(migrationsDir, file);
            if (fs.existsSync(migrationPath)) {
                console.log(`正在执行迁移: ${file}`);
                const sql = fs.readFileSync(migrationPath, 'utf8');
                await client.query(sql);
                console.log(`✅ ${file} 应用成功`);
            } else {
                console.warn(`⚠️ 跳过不存在的迁移文件: ${file}`);
            }
        }

        console.log('验证 Customers 表结构...');
        const customerColumns = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers' 
      AND column_name IN ('level', 'billing_info', 'email')
    `);

        console.log('Customers 表当前字段:', customerColumns.rows);
        console.log('🎉 数据库更新完成');

    } catch (error) {
        console.error('❌ 更新失败:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations().catch(err => {
    console.error('脚本运行出错:', err);
    process.exit(1);
});
