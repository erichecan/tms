
const { pool } = require('./apps/backend/dist/db-postgres');

async function fixUserStatus() {
    try {
        const client = await pool.connect();
        console.log('Adding status column...');

        await client.query(`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
        `);

        await client.query(`
            UPDATE users SET status = 'ACTIVE' WHERE status IS NULL;
        `);

        console.log('Status column added and backfilled.');
        client.release();
    } catch (err) {
        console.error('Error fixing status:', err);
    } finally {
        process.exit();
    }
}

fixUserStatus();
