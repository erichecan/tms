const { Pool } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: 'apps/backend/.env' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function createUser() {
    const email = 'eriche@aponygroup.com';
    const password = '123456';

    try {
        const check = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (check.rows.length > 0) {
            console.log('User already exists:', check.rows[0]);
            return;
        }

        console.log(`Creating user ${email}...`);
        const hash = await bcrypt.hash(password, 10);
        const id = `U-${Date.now()}`;

        // Added updated_at
        const res = await pool.query(
            `INSERT INTO users (id, email, password_hash, role, name, status, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, 'ACTIVE', NOW(), NOW()) 
       RETURNING *`,
            [id, email, hash, 'ADMIN', 'Eric He']
        );

        console.log('User created successfully:', res.rows[0]);
        console.log(`Password set to: ${password}`);

    } catch (err) {
        console.error('Error creating user:', err);
    } finally {
        await pool.end();
    }
}

createUser();
