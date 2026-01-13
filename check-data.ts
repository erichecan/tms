
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();

    try {
        const tables = ['trips', 'waybills', 'drivers', 'vehicles', 'users', 'customers', 'roles'];
        for (const table of tables) {
            try {
                const res = await client.query(`SELECT COUNT(*) FROM ${table}`);
                console.log(`${table}: ${res.rows[0].count} rows`);
            } catch (e: any) { // Type 'e' as 'any' to avoid TS implicit-any error
                console.log(`${table}: does not exist or error (${e.message})`);
            }
        }
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
};

run();
