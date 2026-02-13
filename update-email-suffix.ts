import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: "postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require",
        ssl: { rejectUnauthorized: false }
    });

    await client.connect();

    try {
        console.log('Fetching users to update...');
        const res = await client.query('SELECT id, email FROM users');
        const users = res.rows;

        let updateCount = 0;

        for (const user of users) {
            const email = user.email;

            // Check if user is the exception
            if (email === 'info@aponyinc.com') {
                console.log(`Skipping protected user: ${email}`);
                continue;
            }

            // Check if already has the correct suffix
            if (email.endsWith('@aponygroup.com')) {
                // console.log(`Skipping already correct user: ${email}`);
                continue;
            }

            // Construct new email
            const namePart = email.split('@')[0];
            const newEmail = `${namePart}@aponygroup.com`;

            console.log(`Updating ${email} -> ${newEmail}`);

            try {
                await client.query('UPDATE users SET email = $1 WHERE id = $2', [newEmail, user.id]);
                updateCount++;
            } catch (err) {
                console.error(`Failed to update ${email}:`, err);
            }
        }

        console.log(`\nUpdate complete. ${updateCount} users updated.`);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await client.end();
    }
};

run();
