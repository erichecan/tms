
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        console.log('Adding username column...');
        await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(100)`);

        // Optional: Backfill username from email if needed, or leave null.
        // For login via email, username being null is fine as long as the column exists.

        console.log('Username Column Added Successfully');
    } catch (e) {
        console.error('Fix failed', e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
