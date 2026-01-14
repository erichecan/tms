import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

const envPath = path.join(process.cwd(), 'apps/backend/.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    dotenv.config();
}

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log('Adding username column to users table...');

        // Check if column exists
        const checkRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='username'");
        if (checkRes.rows.length === 0) {
            await client.query('ALTER TABLE users ADD COLUMN username VARCHAR(255)');
            console.log('SUCCESS: Column "username" added.');
        } else {
            console.log('INFO: Column "username" already exists.');
        }

    } catch (err) {
        console.error('Error modifying DB:', err);
    } finally {
        await client.end();
    }
}

run();
