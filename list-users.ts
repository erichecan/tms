
import { Client } from 'pg';

const listUsers = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        const res = await client.query('SELECT id, name, email, password_hash, roleId FROM users');
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
};

listUsers();
