
import { Pool } from 'pg';

const reset = async () => {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Order matters for FK constraints: drop children first or use CASCADE
        const tables = [
            'financial_records', 'statements', 'trip_events', 'messages', 'rules', 'roles',
            'expenses', 'waybills', 'trips', 'vehicles', 'customers', 'users', 'drivers'
        ];

        for (const table of tables) {
            console.log(`Dropping table ${table}...`);
            await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        }

        await client.query('COMMIT');
        console.log('Database reset successful');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('Reset failed', e);
    } finally {
        client.release();
        pool.end();
        process.exit(0);
    }
};

reset();
