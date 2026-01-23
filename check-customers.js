
const { pool } = require('./apps/backend/dist/db-postgres'); // Adjust path as needed

async function checkCustomers() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT * FROM customers');
        console.log('Customer Count:', res.rows.length);
        console.log('Customers:', JSON.stringify(res.rows, null, 2));
        client.release();
    } catch (err) {
        console.error('Error:', err);
    } finally {
        // pool.end(); // Don't end if reused, but for script ok
        process.exit();
    }
}

checkCustomers();
