
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        await client.query('SELECT count(*) FROM permissions');
        console.log('✅ Permissions table exists');
    } catch (e: any) {
        console.log('❌ Error accessing permissions table:', e.message);
    } finally {
        await client.end();
    }
};

run();
