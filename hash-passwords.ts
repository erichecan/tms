
import { Client } from 'pg';
import * as bcrypt from 'bcrypt';

// Hardcoded updates to fix the seeded users
const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        const users = [
            { email: 'tom@tms.com', password: 'dispatcher123' },
            { email: 'jerry@tms.com', password: 'driver123' }
        ];

        for (const u of users) {
            const hash = await bcrypt.hash(u.password, 10);
            await client.query('UPDATE users SET password = $1 WHERE email = $2', [hash, u.email]);
            console.log(`Updated password for ${u.email}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
