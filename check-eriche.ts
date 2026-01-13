
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        const email = 'eriche@aponygroup.com';
        console.log(`Checking user: ${email}`);

        const userRes = await client.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userRes.rows.length === 0) {
            console.log('User not found!');
            return;
        }

        const user = userRes.rows[0];
        console.log('User Role:', user.roleid || user.role_id);
        const roleId = user.roleid || user.role_id;

        const permRes = await client.query('SELECT * FROM role_permissions WHERE role_id = $1', [roleId]);
        const rowCount = permRes.rowCount || 0;
        console.log(`Permissions count for ${roleId}:`, rowCount);

        if (rowCount > 0) {
            console.log('Sample permissions:', permRes.rows.slice(0, 3).map(r => r.permission_id));
        }

        const allPerms = await client.query('SELECT * FROM permissions');
        console.log('Total specific permissions defined in DB:', allPerms.rowCount);

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
