import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const oldEmail = 'jerry@aponygroup.com';
        const newEmail = 'driver03@aponygroup.com';

        console.log(`Updating ${oldEmail} to ${newEmail}...`);

        const res = await client.query('UPDATE users SET email = $1 WHERE email = $2 RETURNING *', [newEmail, oldEmail]);

        if (res.rowCount && res.rowCount > 0) {
            console.log(`✅ Successfully updated user.`);
            console.log('Updated row:', res.rows[0]);
        } else {
            console.log(`❌ User ${oldEmail} not found.`);
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
};

run();
