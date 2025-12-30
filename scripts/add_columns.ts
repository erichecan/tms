
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_lZq2bWeJT8tO@ep-round-math-ahvyvkcx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require',
});

async function addColumns() {
    const client = await pool.connect();
    try {
        console.log('Connected to DB, adding columns...');

        await client.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS driver_fee DECIMAL(10,2)");
        console.log('Added driver_fee to shipments');

        await client.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS trip_id UUID");
        console.log('Added trip_id to shipments');

        await client.query("ALTER TABLE shipments ADD COLUMN IF NOT EXISTS vehicle_id UUID");
        console.log('Added vehicle_id to shipments');

        await client.query("ALTER TABLE trips ADD COLUMN IF NOT EXISTS trip_fee DECIMAL(10,2)");
        console.log('Added trip_fee to trips');

        console.log('Columns added successfully.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

addColumns();
