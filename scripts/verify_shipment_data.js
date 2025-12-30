
const { Pool } = require('pg');

// Hardcode DB URL from .env for simplicity in this script context
// DATABASE_URL=postgresql://neondb_owner:npg_6sYaZ9fOJzIm@ep-restless-glade-a5g8t02x-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
const connectionString = 'postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const pool = new Pool({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();

        console.log('Querying shipments (Limit 20)...');
        // Fetch ID, ShipmentNumber, and ShipmentNo (if that column existed, but it doesnt).
        // Fetch created_at to see recent ones.
        const res = await client.query('SELECT id, shipment_number, created_at FROM shipments ORDER BY created_at DESC LIMIT 20');

        console.table(res.rows.map(r => ({
            id: r.id,
            shipment_number: r.shipment_number,
            created: r.created_at
        })));

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
