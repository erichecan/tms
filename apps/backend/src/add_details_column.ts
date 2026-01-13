
import { query, pool } from './db-postgres';

async function migrate() {
    try {
        console.log('Adding details column to waybills...');
        await query('ALTER TABLE waybills ADD COLUMN IF NOT EXISTS details JSONB;');
        console.log('Migration successful.');
    } catch (e) {
        console.error('Migration failed:', e);
    } finally {
        await pool.end();
    }
}

migrate();
