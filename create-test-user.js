
const { pool } = require('./apps/backend/dist/db-postgres');
const bcrypt = require('bcrypt');

async function createTestUser() {
    try {
        const client = await pool.connect();
        const email = 'admin@apony.com';
        const password = 'password123';
        const hashedPassword = await bcrypt.hash(password, 10);

        console.log(`Creating/Updating user: ${email}`);

        // Upsert user
        const now = new Date().toISOString();
        await client.query(`
            INSERT INTO users (id, name, email, password_hash, role, status, email_verified, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, 'ACTIVE', true, $6, $6)
            ON CONFLICT (email) 
            DO UPDATE SET password_hash = $4, role = $5, status = 'ACTIVE', updated_at = $6
        `, ['U-TEST-001', 'Admin Test', email, hashedPassword, 'ADMIN', now]);

        console.log('Test user created successfully.');
        client.release();
    } catch (err) {
        console.error('Error creating test user:', err);
    } finally {
        process.exit();
    }
}

createTestUser();
