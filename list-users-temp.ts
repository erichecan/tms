import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        console.log('Fetching users...');
        const res = await client.query('SELECT id, email, username, roleid FROM users ORDER BY id');
        console.table(res.rows);
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
};

run();
