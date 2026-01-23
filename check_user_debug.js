
const { Pool } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkUser() {
    const email = 'eriche@aponygroup.com';
    console.log(`Checking for user: ${email}`);
    console.log(`DB URL: ${process.env.DATABASE_URL}`);

    try {
        const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (res.rows.length > 0) {
            console.log('User found:', res.rows[0]);
        } else {
            console.log('User NOT found.');
            // List all users to see what's there
            const allUsers = await pool.query('SELECT email FROM users LIMIT 10');
            console.log('First 10 users in DB:', allUsers.rows.map(u => u.email));
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

checkUser();
