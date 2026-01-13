
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
    });
    await client.connect();

    try {
        const res = await client.query(`
            SELECT table_name, column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name IN ('trips', 'messages');
        `);
        console.table(res.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
};

run();
