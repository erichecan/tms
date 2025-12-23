
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        try {
            const sqlPath = path.join(__dirname, '../apps/backend/src/database/migrations/fix_unique_constraints.sql');
            const sql = fs.readFileSync(sqlPath, 'utf8');

            console.log(`Executing migration from: ${sqlPath}`);
            console.log('----------------------------------------');
            console.log(sql);
            console.log('----------------------------------------');

            await client.query(sql);

            console.log('✅ Migration executed successfully!');
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

runMigration();
