
import { query } from './apps/backend/src/db-postgres';

async function checkRules() {
    try {
        const result = await query('SELECT * FROM rules');
        console.log('Rules in DB:');
        console.log(JSON.stringify(result.rows, null, 2));
    } catch (e) {
        console.error('Error querying rules:', e);
    } finally {
        process.exit(0);
    }
}

checkRules();
