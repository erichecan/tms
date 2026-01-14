
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const email = 'eriche@aponygroup.com';
        const newPass = 'apony27669'; // Restore to user provided password (Plain Text)

        console.log(`Restoring password for ${email} to ${newPass}...`);

        const res = await client.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING *', [newPass, email]);

        if (res.rows.length > 0) {
            console.log('✅ Password successfully restored.');
            console.log('Current stored value:', res.rows[0].password);
        } else {
            console.log('❌ User not found');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
};

run();
