
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const res = await client.query("SELECT password FROM users WHERE email = 'eriche@aponygroup.com'");
        if (res.rows.length > 0) {
            console.log('Current Password in DB:', res.rows[0].password);
        } else {
            console.log('User not found');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
};

run();
