
import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

import { fileURLToPath } from 'url';

// Load env
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../apps/backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function run() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();

        console.log('Querying shipments...');
        const res = await client.query('SELECT id, shipment_number FROM shipments ORDER BY created_at DESC LIMIT 10');

        console.log('--- SHIPMENT DATA ---');
        console.log('ID                                     | Shipment Number');
        console.log('-----------------------------------------------------------');
        res.rows.forEach(row => {
            console.log(`${row.id} | ${row.shipment_number}`);
        });
        console.log('-----------------------------------------------------------');

        client.release();
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

run();
