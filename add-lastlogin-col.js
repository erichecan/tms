
const { pool } = require('./apps/backend/dist/db-postgres');

async function fixLastLogin() {
    try {
        const client = await pool.connect();
        console.log('Adding lastlogin column...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS lastlogin TIMESTAMP;
        `);

        console.log('lastlogin column added successfully.');
        client.release();
    } catch (err) {
        console.error('Error adding lastlogin column:', err);
    } finally {
        process.exit();
    }
}

fixLastLogin();
