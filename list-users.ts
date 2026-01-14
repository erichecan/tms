
import { Client } from 'pg';

const listUsers = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        const res = await client.query('SELECT * FROM users');
        if (res.rows.length > 0) {
            console.log('Columns:', Object.keys(res.rows[0]));
            // console.table(res.rows); // Clean table view
            // Print simplified view
            console.table(res.rows.map(u => ({ id: u.id, email: u.email, role: u.roleid || u.role_id, name: u.name || u.full_name || 'N/A' })));
        } else {
            console.log('No users found.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
};

listUsers();
