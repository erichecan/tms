
import pg from 'pg';
const { Client } = pg;

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function checkSchema() {
    try {
        await client.connect();

        // Check shipments id type
        const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'shipments' 
      AND column_name = 'id';
    `);

        console.log('Shipments ID type:', res.rows[0]);

        // Check customers columns (to see if v0 worked)
        const res2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'customers';
    `);
        console.log('Customers columns:', res2.rows.map(r => r.column_name));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkSchema();
