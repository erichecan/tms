
const { pool } = require('./apps/backend/dist/db-postgres');

async function dumpUsers() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT * FROM users');
        console.log('User Count:', res.rows.length);
        console.log('Users:', JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        process.exit();
    }
}

dumpUsers();
