
import { Client } from 'pg';

const run = async () => {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    await client.connect();

    try {
        console.log('Seeding permissions...');

        // 1. Define Standard Permissions
        const permissions = [
            // User Module
            { id: 'P-USER-VIEW', name: 'View Users', module: 'Users' },
            { id: 'P-USER-EDIT', name: 'Edit Users', module: 'Users' },
            // Waybill Module
            { id: 'P-WAYBILL-VIEW', name: 'View Waybills', module: 'Waybills' },
            { id: 'P-WAYBILL-CREATE', name: 'Create Waybills', module: 'Waybills' },
            { id: 'P-WAYBILL-EDIT', name: 'Edit Waybills', module: 'Waybills' },
            { id: 'P-WAYBILL-DELETE', name: 'Delete Waybills', module: 'Waybills' },
            // Fleet Module
            { id: 'P-FLEET-VIEW', name: 'View Fleet', module: 'Fleet' },
            // Finance Module
            { id: 'P-FINANCE-VIEW', name: 'View Finance', module: 'Finance' },
        ];

        for (const p of permissions) {
            await client.query(`
                INSERT INTO permissions (id, name, module)
                VALUES ($1, $2, $3)
                ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, module = EXCLUDED.module
            `, [p.id, p.name, p.module]);
        }

        // 2. Assign to R-ADMIN (All) and R-DISPATCHER (Selected)
        // R-ADMIN gets everything
        for (const p of permissions) {
            await client.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ('R-ADMIN', $1)
                ON CONFLICT DO NOTHING
            `, [p.id]);
        }

        // R-DISPATCHER gets Operational permissions
        const dispatcherPerms = ['P-WAYBILL-VIEW', 'P-WAYBILL-CREATE', 'P-WAYBILL-EDIT', 'P-FLEET-VIEW', 'P-USER-VIEW'];
        for (const pid of dispatcherPerms) {
            await client.query(`
                INSERT INTO role_permissions (role_id, permission_id)
                VALUES ('R-DISPATCHER', $1)
                ON CONFLICT DO NOTHING
            `, [pid]);
        }

        // R-DRIVER gets View Waybills (example)
        await client.query(`
            INSERT INTO role_permissions (role_id, permission_id)
            VALUES ('R-DRIVER', 'P-WAYBILL-VIEW')
            ON CONFLICT DO NOTHING
        `);

        console.log('Permissions Seeded Successfully');

    } catch (e) {
        console.error('Seeding failed', e);
    } finally {
        await client.end();
        process.exit(0);
    }
};

run();
