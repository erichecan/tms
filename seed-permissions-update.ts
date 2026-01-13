
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        console.log('Adding P-CUSTOMER-VIEW...');

        await client.query(`
            INSERT INTO permissions (id, name, module)
            VALUES ('P-CUSTOMER-VIEW', 'View Customers', 'Customers')
            ON CONFLICT (id) DO NOTHING
        `);

        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ('R-ADMIN', 'P-CUSTOMER-VIEW'), ('R-DISPATCHER', 'P-CUSTOMER-VIEW')
            ON CONFLICT DO NOTHING
        `);

        console.log('Update Complete');

    } catch (e) {
        console.error('Update failed', e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
