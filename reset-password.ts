
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const email = 'eriche@aponygroup.com';
        const newPass = '123456';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPass, salt);

        console.log(`Resetting password for ${email}...`);

        const res = await client.query('UPDATE users SET password = $1 WHERE email = $2 RETURNING *', [hash, email]);

        if (res.rows.length > 0) {
            console.log('✅ Password successfully reset to: 123456');
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
