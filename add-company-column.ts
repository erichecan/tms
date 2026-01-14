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
        console.log('Adding company column to customers table...');

        // Check if column exists
        const checkRes = await client.query("SELECT column_name FROM information_schema.columns WHERE table_name='customers' AND column_name='company'");
        if (checkRes.rows.length === 0) {
            await client.query('ALTER TABLE customers ADD COLUMN company VARCHAR(255)');
            console.log('SUCCESS: Column "company" added.');
        } else {
            console.log('INFO: Column "company" already exists.');
        }

    } catch (err) {
        console.error('Error modifying DB:', err);
    } finally {
        await client.end();
    }
}

run();
