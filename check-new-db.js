
const { Pool } = require('pg');

const connectionString = 'postgresql://neondb_owner:npg_a0t9YKjwEkWP@ep-spring-lake-ahagh2w6-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false } // Simplifies connection for check
});

async function checkNewDb() {
    try {
        const client = await pool.connect();
        console.log('Connected to NEW DB.');

        // Check columns
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log('User Columns:', cols.rows.map(r => r.column_name).join(', '));

        // Check columns presence
        const hasStatus = cols.rows.some(r => r.column_name === 'status');
        const hasLastLogin = cols.rows.some(r => r.column_name === 'lastlogin');
        const hasRole = cols.rows.some(r => r.column_name === 'role');
        const hasRoleId = cols.rows.some(r => r.column_name === 'roleid' || r.column_name === 'role_id');

        console.log('Has status:', hasStatus);
        console.log('Has lastlogin:', hasLastLogin);
        console.log('Has role:', hasRole);
        console.log('Has role_id/roleid:', hasRoleId);

        // List Users
        const users = await client.query('SELECT id, email, name FROM users LIMIT 5');
        console.log('Users sample:', JSON.stringify(users.rows, null, 2));

        client.release();
    } catch (err) {
        console.error('Error connecting to new DB:', err);
    } finally {
        process.exit();
    }
}

checkNewDb();
