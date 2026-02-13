import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

const run = async () => {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        const newPass = 'apony27669';
        console.log(`Hashing password: ${newPass}...`);

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPass, salt);

        console.log('Updating all users with new password...');

        const res = await client.query('UPDATE users SET password = $1', [hash]);

        console.log(`✅ Successfully updated passwords for ${res.rowCount} users.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
};

run();
