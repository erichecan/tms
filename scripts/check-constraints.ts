
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkConstraints() {
    try {
        await client.connect();
        console.log('Connected to database');

        // Check indexes on customers table
        const res = await client.query(`
      SELECT schemaname, tablename, indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'customers';
    `);

        console.log('Indexes on customers table:');
        res.rows.forEach(row => {
            console.log(`- ${row.indexname}: ${row.indexdef}`);
        });

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkConstraints();
