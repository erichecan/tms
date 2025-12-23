
import fs from 'fs';
import path from 'path';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is required');
    process.exit(1);
}

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function runMigrations() {
    const client = await pool.connect();
    try {
        console.log('🔌 Connected to database');

        const migrationsDir = path.join(__dirname, '../apps/backend/src/database/migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort(); // v0, v3, v4 order

        console.log(`📂 Found ${files.length} migrations in ${migrationsDir}`);

        for (const file of files) {
            console.log(`\n▶️  Running migration: ${file}`);
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf-8');

            try {
                await client.query('BEGIN');
                await client.query(sql);
                await client.query('COMMIT');
                console.log(`✅ ${file} completed successfully`);
            } catch (err) {
                await client.query('ROLLBACK');
                console.error(`❌ Migration ${file} failed:`, err);
                throw err;
            }
        }

        console.log('\n🎉 All migrations completed successfully!');
    } catch (err) {
        console.error('\n💥 Migration proccess failed:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

runMigrations();
